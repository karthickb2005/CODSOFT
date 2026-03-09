const validateInvite = (req, res, next) => {
    const { user_email, role } = req.body;

    if (!user_email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const allowedRoles = ['admin', 'team_leader', 'member'];
    if (!role || !allowedRoles.includes(role)) {
        return res.status(400).json({ success: false, message: `Invalid or missing role. Must be one of: ${allowedRoles.join(', ')}` });
    }

    next();
};

module.exports = { validateInvite };
