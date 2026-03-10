const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabaseClient');

// @desc    Get invite details by token
// @route   GET /api/invite/:token
// @access  Public
const getInviteData = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const { data: invite, error } = await supabase
        .from('invites')
        .select('*')
        .eq('invite_token', token)
        .single();

    if (error || !invite) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    if (invite.used) {
        res.status(400);
        throw new Error('This invitation has already been used');
    }

    if (new Date(invite.expiry_time) < new Date()) {
        res.status(400);
        throw new Error('This invitation has expired');
    }

    res.status(200).json({
        success: true,
        data: {
            email: invite.email,
            role: invite.role,
            workspaceId: invite.workspace_id,
        },
    });
});

// @desc    Accept invitation
// @route   POST /api/invite/accept
// @access  Public
const acceptInvite = asyncHandler(async (req, res) => {
    const { token } = req.body;

    const { data: invite, error } = await supabase
        .from('invites')
        .select('*')
        .eq('invite_token', token)
        .single();

    if (error || !invite) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    if (invite.used) {
        res.status(400);
        throw new Error('This invitation has already been used');
    }

    if (new Date(invite.expiry_time) < new Date()) {
        res.status(400);
        throw new Error('This invitation has expired');
    }

    // Check if user already a member
    const { data: memberExists } = await supabase
        .from('team_members')
        .select('id')
        .eq('user_email', invite.email)
        .eq('organization_id', invite.workspace_id)
        .single();

    if (memberExists) {
        await supabase.from('invites').update({ used: true }).eq('id', invite.id);
        res.status(400);
        throw new Error('You are already a member of this workspace');
    }

    // Create team member
    const { data: member, error: createError } = await supabase
        .from('team_members')
        .insert([{
            user_email: invite.email,
            role: invite.role,
            organization_id: invite.workspace_id,
            display_name: invite.email.split('@')[0],
            is_active: true,
        }])
        .select()
        .single();

    if (createError) {
        res.status(400);
        throw new Error(`Failed to accept invitation: ${createError.message}`);
    }

    await supabase.from('invites').update({ used: true }).eq('id', invite.id);

    res.status(201).json({
        success: true,
        message: 'Invitation accepted successfully',
        data: member,
    });
});

module.exports = {
    getInviteData,
    acceptInvite,
};
