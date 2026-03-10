const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabaseClient');
const { logAction } = require('../utils/auditLogger');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = asyncHandler(async (req, res) => {
    const { orderBy, limit, ...filters } = req.query;

    let query = supabase.from('projects').select('*');

    // Apply filters
    Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
    });

    if (orderBy) {
        const isDescending = orderBy.startsWith('-');
        const field = isDescending ? orderBy.substring(1) : orderBy;
        // Mapping Mongoose sort styles
        const sortField = field === 'created_date' ? 'created_at' : field;
        query = query.order(sortField, { ascending: !isDescending });
    } else {
        query = query.order('created_at', { ascending: false });
    }

    if (limit) {
        query = query.limit(parseInt(limit));
    }

    const { data: projects, error } = await query;

    if (error) {
        res.status(500);
        throw new Error(`Supabase Error: ${error.message}`);
    }

    res.status(200).json({ success: true, data: projects });
});

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProject = asyncHandler(async (req, res) => {
    const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (error || !project) {
        res.status(404);
        throw new Error('Project not found');
    }

    res.status(200).json({ success: true, data: project });
});

// @desc    Create new project
// @route   POST /api/projects
// @access  Public
const createProject = asyncHandler(async (req, res) => {
    try {
        if (!req.body.name) {
            res.status(400);
            throw new Error('Please add a name field');
        }

        const projectData = {
            name: req.body.name,
            description: req.body.description,
            status: req.body.status || 'planning',
            health_status: req.body.health_status || 'good',
            progress: req.body.progress || 0,
            target_end_date: req.body.target_end_date,
            member_emails: req.body.member_emails || [],
            owner_email: req.user?.email,
            is_archived: false,
        };

        const { data: project, error } = await supabase
            .from('projects')
            .insert([projectData])
            .select()
            .single();

        if (error) {
            console.error("Supabase Create Error:", error.message);
            res.status(500);
            throw new Error(`Failed to create project: ${error.message}`);
        }

        // Audit Log (Optimistic)
        logAction({
            userId: req.user?.id,
            userEmail: req.user?.email,
            action: 'PROJECT_CREATED',
            entityType: 'Project',
            entityId: project.id,
            metadata: { after: project },
            ipAddress: req.ip
        }).catch(err => console.error("Audit log failed:", err.message));

        res.status(201).json({ success: true, data: project });
    } catch (error) {
        console.error("CREATE PROJECT ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Public
const updateProject = asyncHandler(async (req, res) => {
    const { data: existingProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (!existingProject) {
        res.status(404);
        throw new Error('Project not found');
    }

    const { data: updatedProject, error } = await supabase
        .from('projects')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error) {
        res.status(500);
        throw new Error(`Failed to update project: ${error.message}`);
    }

    // Audit Log (Optimistic)
    logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'PROJECT_UPDATED',
        entityType: 'Project',
        entityId: updatedProject.id,
        metadata: { before: existingProject, after: updatedProject },
        ipAddress: req.ip
    }).catch(err => console.error("Audit log failed:", err.message));

    res.status(200).json({ success: true, data: updatedProject });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Public
const deleteProject = asyncHandler(async (req, res) => {
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', req.params.id)
        .single();

    if (!project) {
        res.status(404);
        throw new Error('Project not found');
    }

    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        res.status(500);
        throw new Error(`Failed to delete project: ${error.message}`);
    }

    // Audit Log (Optimistic)
    logAction({
        userId: req.user?.id,
        userEmail: req.user?.email,
        action: 'PROJECT_DELETED',
        entityType: 'Project',
        entityId: project.id,
        metadata: { before: project },
        ipAddress: req.ip
    }).catch(err => console.error("Audit log failed:", err.message));

    res.status(200).json({ success: true, data: { id: req.params.id } });
});

// @desc    Get project chat messages
// @route   GET /api/projects/:id/chat
// @access  Private
const getProjectChat = asyncHandler(async (req, res) => {
    const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*, sender:users(id, name, email)')
        .eq('project_id', req.params.id)
        .order('created_at', { ascending: true });

    if (error) {
        res.status(500);
        throw new Error(`Failed to fetch chat: ${error.message}`);
    }

    res.status(200).json({ success: true, data: messages });
});

module.exports = {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectChat,
};
