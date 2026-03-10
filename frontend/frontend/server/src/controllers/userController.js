const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const supabase = require('../config/supabaseClient'); // Added Supabase client
const { logAction } = require('../utils/auditLogger');

const generateAccessToken = (id, email, name) => {
    return jwt.sign({ id, email, name }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateRefreshToken = (id, email) => {
    return jwt.sign({ id, email }, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists in Supabase
    const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

    if (existingUser) {
        res.status(400);
        throw new Error('User already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in Supabase
    const { data: user, error: insertError } = await supabase
        .from('users')
        .insert([
            { name, email, password_hash: hashedPassword, role: role || 'user' }
        ])
        .select()
        .single();

    if (insertError) {
        console.error("Supabase Insert Error:", insertError.message);
        res.status(500);
        throw new Error('Failed to create user in Supabase');
    }

    if (user) {
        const accessToken = generateAccessToken(user.id, user.email, user.name);
        const refreshToken = generateRefreshToken(user.id, user.email);

        // Update refresh token in Supabase
        await supabase
            .from('users')
            .update({ refresh_token: refreshToken })
            .eq('id', user.id);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            accessToken: accessToken,
            user: { _id: user.id, name: user.name, email: user.email, role: user.role }
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    console.log("[LOGIN_REQUEST] Login attempt for:", email);

    try {
        // Find user in Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user || error) {
            console.log("[LOGIN_ERROR] User not found or Supabase error:", email);
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        console.log("[USER_FOUND] User found:", email);

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log("[LOGIN_ERROR] Password mismatch for:", email);
            return res.status(401).json({
                success: false,
                message: "Invalid credentials"
            });
        }

        const accessToken = generateAccessToken(user.id, user.email, user.name);
        const refreshToken = generateRefreshToken(user.id, user.email);

        // Update refresh token in Supabase
        await supabase
            .from('users')
            .update({ refresh_token: refreshToken })
            .eq('id', user.id);

        console.log("[TOKEN_CREATED] Tokens generated for:", email);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Audit Log (Optimistic)
        logAction({
            userId: user.id,
            userEmail: user.email,
            action: 'USER_LOGIN',
            entityType: 'User',
            entityId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        }).catch(err => console.error("Audit log failed:", err.message));

        return res.status(200).json({
            success: true,
            accessToken: accessToken,
            user: { _id: user.id, name: user.name, email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("[LOGIN_ERROR] Unexpected server error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

const refresh = asyncHandler(async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) return res.sendStatus(401);
    const refreshToken = cookies.refreshToken;

    // Find user by refresh token in Supabase
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('refresh_token', refreshToken)
        .single();

    if (!user || error) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET, (err, decoded) => {
        if (err || user.id !== decoded.id) return res.sendStatus(403);
        const accessToken = generateAccessToken(user.id, user.email, user.name);
        res.json({
            success: true,
            accessToken: accessToken
        });
    });
});

const logoutUser = asyncHandler(async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) return res.sendStatus(204);
    const refreshToken = cookies.refreshToken;

    const { data: user } = await supabase
        .from('users')
        .select('id, email')
        .eq('refresh_token', refreshToken)
        .single();

    if (user) {
        // Audit Log
        logAction({
            userId: user.id,
            userEmail: user.email,
            action: 'USER_LOGOUT',
            entityType: 'User',
            entityId: user.id,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        }).catch(err => console.error("Audit log failed:", err.message));

        // Clear refresh token in Supabase
        await supabase
            .from('users')
            .update({ refresh_token: null })
            .eq('id', user.id);
    }

    res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    res.sendStatus(204);
});

const getMe = async (req, res) => {
    try {
        console.log('[AUTH_ME_REQUEST]');

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
                data: null
            });
        }

        // Find user by id in Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', req.user.id)
            .single();

        if (!user || error) {
            return res.status(401).json({
                success: false,
                message: "User not found",
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile retrieved",
            data: user
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: `Server error: ${err.message}`,
            data: null
        });
    }
};

module.exports = { registerUser, loginUser, refresh, logoutUser, getMe };
