const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const TeamMember = require('../models/TeamMember');
const Invite = require('../models/Invite');
const { sendInvitationEmail } = require('../utils/mailer');

// @desc    Get all team members
// @route   GET /api/team
// @access  Public
const getTeamMembers = asyncHandler(async (req, res) => {
    const { orderBy, limit, ...filters } = req.query;

    let query = TeamMember.find(filters);

    if (orderBy) {
        // Convert entity orderBy (e.g. '-created_date') to Mongoose sort (e.g. '-createdAt')
        const sortField = orderBy.replace('created_date', 'createdAt');
        query = query.sort(sortField);
    }

    if (limit) {
        query = query.limit(parseInt(limit));
    }

    const members = await query.exec();
    res.status(200).json({ success: true, data: members });
});

// @desc    Create new team member profile
// @route   POST /api/team
// @access  Public
const createTeamMember = asyncHandler(async (req, res) => {
    console.log("🟢 Create Member API HIT", req.body);

    // Support both the Invite flow and the Profile flow
    // If it's a full profile submission
    if (req.body.display_name || req.body.job_title) {
        const { user_email, display_name, job_title, department, role, skills, domains, availability, max_concurrent_tasks } = req.body;

        const memberExists = await TeamMember.findOne({ user_email });

        if (memberExists) {
            res.status(400);
            throw new Error('Team member already exists');
        }

        const member = await TeamMember.create({
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
        });

        return res.status(201).json({
            success: true,
            message: 'Team member profile created successfully',
            data: member
        });
    }

    // Original Invite Code
    const { user_email, role, organization_id } = req.body;
    console.log("📧 Email received for invite:", user_email);
    console.log("👤 Role received for invite:", role);

    const memberExists = await TeamMember.findOne({ user_email });

    if (memberExists) {
        res.status(400);
        throw new Error('Team member already exists');
    }

    // Generate unique invite token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 24);

    // Store invite in database
    const invite = await Invite.create({
        inviteToken,
        email: user_email,
        role: role || 'member',
        workspaceId: organization_id || 'default',
        expiryTime,
    });

    if (invite) {
        // Send professional HTML invitation email
        try {
            console.log("📧 Attempting to send invite to:", user_email);
            await sendInvitationEmail(user_email, role || 'member', inviteToken);
            console.log("✅ Invitation email sent");
        } catch (emailError) {
            console.error('Email failed but invite stored:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: 'Invitation sent successfully',
            data: { email: user_email, role: role || 'member' }
        });
    } else {
        res.status(400);
        throw new Error('Failed to generate invitation');
    }
});

// @desc    Update team member profile
// @route   PUT /api/team/:id
// @access  Public
const updateTeamMember = asyncHandler(async (req, res) => {
    const member = await TeamMember.findById(req.params.id);

    if (!member) {
        res.status(404);
        throw new Error('Team member not found');
    }

    const updatedMember = await TeamMember.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedMember });
});

// @desc    Delete team member
// @route   DELETE /api/team/:id
// @access  Public
const deleteTeamMember = asyncHandler(async (req, res) => {
    const member = await TeamMember.findById(req.params.id);

    if (!member) {
        res.status(404);
        throw new Error('Team member not found');
    }

    await member.deleteOne();

    res.status(200).json({ success: true, data: { id: req.params.id } });
});

module.exports = {
    getTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember
};
