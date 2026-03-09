const Task = require('../models/Task');
const { getIO } = require('../socket');
const { logAction } = require('../utils/auditLogger');
const { invalidateByPrefix } = require('../utils/cache');

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Public
const getTasks = async (req, res) => {
    try {
        const { orderBy, limit, ...filters } = req.query;

        let query = Task.find(filters).lean();

        if (orderBy) {
            // Convert entity orderBy (e.g. '-created_date') to Mongoose sort (e.g. '-createdAt')
            const sortField = orderBy.replace('created_date', 'createdAt');
            query = query.sort(sortField);
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const tasks = await query.exec();
        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Public
const getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).lean();

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        res.status(200).json({ success: true, data: task });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Public
const createTask = async (req, res) => {
    try {
        console.log("Incoming body:", req.body);
        console.log("Authenticated user:", req.user);

        if (!req.body.title || (!req.body.projectId && !req.body.project_id)) {
            return res.status(400).json({ success: false, message: 'Please add title and projectId' });
        }

        const task = await Task.create({
            title: req.body.title,
            description: req.body.description,
            status: req.body.status,
            priority: req.body.priority,
            difficulty: req.body.difficulty,
            domain: req.body.domain,
            project_id: req.body.project_id || req.body.projectId,
            assignee_email: req.body.assignee_email || req.body.assignedTo,
            reviewer_email: req.body.reviewer_email,
            start_date: req.body.start_date,
            due_date: req.body.due_date || req.body.dueDate,
            estimated_hours: req.body.estimated_hours,
            required_skills: req.body.required_skills,
            tags: req.body.tags,
            userId: req.user.id || req.user._id,
        });

        // Audit Log
        await logAction({
            userId: req.user.id || req.user._id,
            userEmail: req.user.email,
            action: 'TASK_CREATED',
            entityType: 'Task',
            entityId: task._id,
            metadata: { after: task },
            ipAddress: req.ip
        });

        // Emit socket event for real-time list update
        getIO().emit('taskCreated', task);

        // Emit notification event if assigned
        if (task.assignee_email) {
            getIO().emit('taskAssigned', {
                taskId: task._id,
                taskTitle: task.title,
                triggeringUser: req.user.name,
                affectedUser: task.assignee_email,
                timestamp: new Date(),
                eventType: 'taskAssigned'
            });
        }

        // Invalidate Cache
        invalidateByPrefix(`ai_dashboard_${task.assignee_email}`);
        invalidateByPrefix(`analytics_`);

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error("CREATE TASK ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
            stack: error.stack
        });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Public
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id); // This is the 'prevTask'

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        // Ensure userId is not changed by client
        const updatedData = { ...req.body };
        delete updatedData.userId;

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
        });

        // Audit Log
        await logAction({
            userId: req.user.id || req.user._id,
            userEmail: req.user.email,
            action: 'TASK_UPDATED',
            entityType: 'Task',
            entityId: updatedTask._id,
            metadata: { before: task, after: updatedTask },
            ipAddress: req.ip
        });

        // Emit socket event for real-time list update
        getIO().emit('taskUpdated', updatedTask);

        // Check for status change notification
        if (req.body.status && req.body.status !== task.status) {
            getIO().emit('taskStatusChanged', {
                taskId: updatedTask._id,
                taskTitle: updatedTask.title,
                triggeringUser: req.user.name,
                affectedUser: updatedTask.assignee_email,
                timestamp: new Date(),
                eventType: 'taskStatusChanged',
                oldStatus: task.status,
                newStatus: updatedTask.status
            });
        }

        // Check for assignment change
        if (req.body.assignee_email && req.body.assignee_email !== task.assignee_email) {
            getIO().emit('taskAssigned', {
                taskId: updatedTask._id,
                taskTitle: updatedTask.title,
                triggeringUser: req.user.name,
                affectedUser: updatedTask.assignee_email,
                timestamp: new Date(),
                eventType: 'taskAssigned'
            });
        }

        // Invalidate Cache
        invalidateByPrefix(`ai_dashboard_${updatedTask.assignee_email}`);
        invalidateByPrefix(`ai_dashboard_${task.assignee_email}`); // Old assignee too
        invalidateByPrefix(`analytics_`);

        res.status(200).json({ success: true, data: updatedTask });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Public
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id); // This is the 'prevTask'

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        await task.deleteOne();

        // Audit Log
        await logAction({
            userId: req.user.id || req.user._id,
            userEmail: req.user.email,
            action: 'TASK_DELETED',
            entityType: 'Task',
            entityId: task._id,
            metadata: { before: task },
            ipAddress: req.ip
        });

        // Emit socket event
        getIO().emit('taskDeleted', { id: req.params.id });

        // Invalidate Cache
        invalidateByPrefix(`ai_dashboard_${task.assignee_email}`);
        invalidateByPrefix(`analytics_`);

        res.status(200).json({ success: true, data: { id: req.params.id } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const simulateOverdue = async (req, res) => {
    try {
        const overdueTasks = await Task.find({
            status: { $ne: 'done' },
            due_date: { $lt: new Date() }
        });

        overdueTasks.forEach(task => {
            getIO().emit('taskOverdue', {
                taskId: task._id,
                taskTitle: task.title,
                triggeringUser: 'System',
                affectedUser: task.assignee_email,
                timestamp: new Date(),
                eventType: 'taskOverdue'
            });
        });

        res.status(200).json({ success: true, message: `Simulated overdue notifications for ${overdueTasks.length} tasks` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    simulateOverdue,
};
