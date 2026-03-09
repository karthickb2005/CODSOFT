const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Invite = require('../models/Invite');
const TeamMember = require('../models/TeamMember');
const { sendInvitationEmail } = require('../utils/mailer');

// @desc    Get invite details by token
// @route   GET /api/invite/:token
// @access  Public
const getInviteData = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const invite = await Invite.findOne({ inviteToken: token });

    if (!invite) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    if (invite.used) {
        res.status(400);
        throw new Error('This invitation has already been used');
    }

    if (invite.expiryTime < new Date()) {
        res.status(400);
        throw new Error('This invitation has expired');
    }

    res.status(200).json({
        success: true,
        data: {
            email: invite.email,
            role: invite.role,
            workspaceId: invite.workspaceId,
        },
    });
});

// @desc    Accept invitation
// @route   POST /api/invite/accept
// @access  Public
const acceptInvite = asyncHandler(async (req, res) => {
    const { token } = req.body;

    const invite = await Invite.findOne({ inviteToken: token });

    if (!invite) {
        res.status(404);
        throw new Error('Invitation not found');
    }

    if (invite.used) {
        res.status(400);
        throw new Error('This invitation has already been used');
    }

    if (invite.expiryTime < new Date()) {
        res.status(400);
        throw new Error('This invitation has expired');
    }

    // Check if user already a member
    const memberExists = await TeamMember.findOne({ user_email: invite.email, organization_id: invite.workspaceId });

    if (memberExists) {
        invite.used = true;
        await invite.save();
        res.status(400);
        throw new Error('You are already a member of this workspace');
    }

    // Create team member
    const member = await TeamMember.create({
        user_email: invite.email,
        role: invite.role,
        organization_id: invite.workspaceId,
        display_name: invite.email.split('@')[0], // Default display name
        is_active: true,
    });

    if (member) {
        invite.used = true;
        await invite.save();
        res.status(201).json({
            success: true,
            message: 'Invitation accepted successfully',
            data: member,
        });
    } else {
        res.status(400);
        throw new Error('Failed to accept invitation');
    }
});

module.exports = {
    getInviteData,
    acceptInvite,
};
