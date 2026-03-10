const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const supabase = require('../config/supabaseClient');
const { sendInvitationEmail } = require('../utils/mailer');

// @desc    Get all team members
// @route   GET /api/team
// @access  Public
const getTeamMembers = asyncHandler(async (req, res) => {
    const { orderBy, limit, ...filters } = req.query;

    let query = supabase.from('team_members').select('*');

    // Apply filters
    Object.keys(filters).forEach(key => {
        query = query.eq(key, filters[key]);
    });

    if (orderBy) {
        const isDescending = orderBy.startsWith('-');
        const field = isDescending ? orderBy.substring(1) : orderBy;
        const sortField = field === 'created_date' ? 'created_at' : field;
        query = query.order(sortField, { ascending: !isDescending });
    }

    if (limit) {
        query = query.limit(parseInt(limit));
    }

    const { data: members, error } = await query;

    if (error) {
        res.status(500);
        throw new Error(`Supabase Error: ${error.message}`);
    }

    res.status(200).json({ success: true, data: members });
});

// @desc    Create new team member profile or invitation
// @route   POST /api/team
// @access  Public
const createTeamMember = asyncHandler(async (req, res) => {
    // 1. Full Profile flow
    if (req.body.display_name || req.body.job_title) {
        const { user_email, display_name, job_title, department, role, skills, domains, availability, max_concurrent_tasks } = req.body;

        const { data: memberExists } = await supabase
            .from('team_members')
            .select('id')
            .eq('user_email', user_email)
            .single();

        if (memberExists) {
            res.status(400);
            throw new Error('Team member already exists');
        }

        const { data: member, error } = await supabase
            .from('team_members')
            .insert([{
                user_email,
                display_name,
                job_title,
                department,
                role: role || 'member',
                skills: skills || [],
                domains: domains || [],
                availability: availability || { hours_per_week: 40 },
                max_concurrent_tasks: max_concurrent_tasks || 5,
                organization_id: 'default',
                is_active: true,
                current_workload: 0,
                burnout_risk: 'low'
            }])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({
            success: true,
            message: 'Team member profile created successfully',
            data: member
        });
    }

    // 2. Invitation flow
    const { user_email, role, organization_id } = req.body;

    const { data: memberExists } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_email', user_email)
        .single();

    if (memberExists) {
        res.status(400);
        throw new Error('Team member already exists');
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);

    const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .insert([{
            invite_token: inviteToken,
            email: user_email,
            role: role || 'member',
            workspace_id: organization_id || 'default',
            expiry_time: expiryTime.toISOString(),
        }])
        .select()
        .single();

    if (inviteError) throw inviteError;

    // Send email
    try {
        await sendInvitationEmail(user_email, role || 'member', inviteToken);
    } catch (emailError) {
        console.error('Email failed but invite stored:', emailError.message);
    }

    res.status(201).json({
        success: true,
        message: 'Invitation sent successfully',
        data: { email: user_email, role: role || 'member' }
    });
});

// @desc    Update team member profile
// @route   PUT /api/team/:id
// @access  Public
const updateTeamMember = asyncHandler(async (req, res) => {
    const { data: member, error } = await supabase
        .from('team_members')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

    if (error || !member) {
        res.status(404);
        throw new Error('Team member not found');
    }

    res.status(200).json({ success: true, data: member });
});

// @desc    Delete team member
// @route   DELETE /api/team/:id
// @access  Public
const deleteTeamMember = asyncHandler(async (req, res) => {
    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', req.params.id);

    if (error) {
        res.status(404);
        throw new Error('Team member not found or deletion failed');
    }

    res.status(200).json({ success: true, data: { id: req.params.id } });
});

module.exports = {
    getTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember
};
