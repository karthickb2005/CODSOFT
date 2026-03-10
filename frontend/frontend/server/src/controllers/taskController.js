const supabase = require('../config/supabaseClient');
const { getIO } = require('../socket'); // Socket.io will be limited on Vercel
const { logAction } = require('../utils/auditLogger');
const { invalidateByPrefix } = require('../utils/cache');

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Public
const getTasks = async (req, res) => {
    try {
        const { orderBy, limit, ...filters } = req.query;

        let query = supabase.from('tasks').select('*');

        // Apply filters
        Object.keys(filters).forEach(key => {
            // Map common filter renames if any
            const filterKey = key === 'projectId' ? 'project_id' : key;
            query = query.eq(filterKey, filters[key]);
        });

        if (orderBy) {
            const isDescending = orderBy.startsWith('-');
            const field = isDescending ? orderBy.substring(1) : orderBy;
            const sortField = field === 'created_date' ? 'created_at' : field;
            query = query.order(sortField, { ascending: !isDescending });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        if (limit) {
            query = query.limit(parseInt(limit));
        }

        const { data: tasks, error } = await query;

        if (error) throw error;

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
        const { data: task, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !task) {
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
        if (!req.body.title || (!req.body.projectId && !req.body.project_id)) {
            return res.status(400).json({ success: false, message: 'Please add title and projectId' });
        }

        const taskData = {
            title: req.body.title,
            description: req.body.description,
            status: req.body.status || 'todo',
            priority: req.body.priority || 'medium',
            project_id: req.body.project_id || req.body.projectId,
            assignee_email: req.body.assignee_email || req.body.assignedTo,
            due_date: req.body.due_date || req.body.dueDate,
            category: req.body.category || req.body.domain,
            labels: req.body.tags || req.body.required_skills || [],
        };

        const { data: task, error } = await supabase
            .from('tasks')
            .insert([taskData])
            .select()
            .single();

        if (error) throw error;

        // Audit Log (Optimistic)
        logAction({
            userId: req.user?.id,
            userEmail: req.user?.email,
            action: 'TASK_CREATED',
            entityType: 'Task',
            entityId: task.id,
            metadata: { after: task },
            ipAddress: req.ip
        }).catch(err => console.error("Audit log failed:", err.message));

        // Socket Events (Best effort on Vercel)
        const io = getIO();
        if (io) {
            io.emit('taskCreated', task);
            if (task.assignee_email) {
                io.emit('taskAssigned', {
                    taskId: task.id,
                    taskTitle: task.title,
                    triggeringUser: req.user?.name || 'System',
                    affectedUser: task.assignee_email,
                    timestamp: new Date(),
                    eventType: 'taskAssigned'
                });
            }
        }

        // Invalidate Cache
        invalidateByPrefix(`ai_dashboard_${task.assignee_email}`);
        invalidateByPrefix(`analytics_`);

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error("CREATE TASK ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Public
const updateTask = async (req, res) => {
    try {
        const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const updatedData = { ...req.body };
        // Field normalization for Supabase
        if (updatedData.projectId) updatedData.project_id = updatedData.projectId;
        if (updatedData.dueDate) updatedData.due_date = updatedData.dueDate;
        if (updatedData.assignedTo) updatedData.assignee_email = updatedData.assignedTo;

        const { data: updatedTask, error } = await supabase
            .from('tasks')
            .update(updatedData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;

        // Audit Log
        logAction({
            userId: req.user?.id,
            userEmail: req.user?.email,
            action: 'TASK_UPDATED',
            entityType: 'Task',
            entityId: updatedTask.id,
            metadata: { before: task, after: updatedTask },
            ipAddress: req.ip
        }).catch(err => console.error("Audit log failed:", err.message));

        // Socket Events
        const io = getIO();
        if (io) {
            io.emit('taskUpdated', updatedTask);
            if (req.body.status && req.body.status !== task.status) {
                io.emit('taskStatusChanged', {
                    taskId: updatedTask.id,
                    taskTitle: updatedTask.title,
                    triggeringUser: req.user?.name,
                    affectedUser: updatedTask.assignee_email,
                    timestamp: new Date(),
                    eventType: 'taskStatusChanged',
                    oldStatus: task.status,
                    newStatus: updatedTask.status
                });
            }
        }

        // Invalidate Cache
        invalidateByPrefix(`ai_dashboard_${updatedTask.assignee_email}`);
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
        const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        // Audit Log
        logAction({
            userId: req.user?.id,
            userEmail: req.user?.email,
            action: 'TASK_DELETED',
            entityType: 'Task',
            entityId: task.id,
            metadata: { before: task },
            ipAddress: req.ip
        }).catch(err => console.error("Audit log failed:", err.message));

        // Socket Events
        const io = getIO();
        if (io) io.emit('taskDeleted', { id: req.params.id });

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
        const { data: overdueTasks } = await supabase
            .from('tasks')
            .select('*')
            .neq('status', 'done')
            .lt('due_date', new Date().toISOString());

        const io = getIO();
        if (io && overdueTasks) {
            overdueTasks.forEach(task => {
                io.emit('taskOverdue', {
                    taskId: task.id,
                    taskTitle: task.title,
                    triggeringUser: 'System',
                    affectedUser: task.assignee_email,
                    timestamp: new Date(),
                    eventType: 'taskOverdue'
                });
            });
        }

        res.status(200).json({ success: true, message: `Simulated overdue notifications for ${overdueTasks?.length || 0} tasks` });
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
