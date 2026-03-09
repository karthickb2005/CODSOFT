const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const logger = require('./utils/logger');

let io;

const initIO = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, "http://localhost:5173", "http://localhost:5000"] : ["http://localhost:5173", "http://localhost:5000"],
            credentials: true,
        },
    });

    // Socket.IO Authentication Middleware
    io.use(async (socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }

            socket.user = user;
            next();
        } catch (error) {
            logger.error(`Socket Auth Error: ${error.message}`);
            return next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        logger.info(`⚡ Socket connected: ${socket.id} (User: ${socket.user.email})`);

        // Join AI Ops room for real-time monitoring
        socket.on('join-ai-ops', () => {
            socket.join('ai-ops');
            logger.info(`🧭 User ${socket.user.email} joined AI-OPS live stream`);
        });

        // Join Project Chat Room
        socket.on('joinProject', async ({ projectId }) => {
            try {
                const Project = require('./models/Project');
                const project = await Project.findById(projectId);

                if (!project) {
                    logger.warn(`⚠ JoinProject failed: Project ${projectId} not found`);
                    return;
                }

                // Check if user is owner or member
                const isOwner = project.owner_email === socket.user.email;
                const isMember = project.member_emails.includes(socket.user.email);

                if (isOwner || isMember) {
                    socket.join(projectId);
                    logger.info(`💬 User ${socket.user.email} joined project room: ${projectId}`);
                } else {
                    logger.warn(`🚫 User ${socket.user.email} unauthorized for project room: ${projectId}`);
                }
            } catch (error) {
                logger.error(`✖ Socket joinProject Error: ${error.message}`);
            }
        });

        // Send Message
        socket.on('sendMessage', async (data) => {
            try {
                const { projectId, message } = data;
                const ChatMessage = require('./models/ChatMessage');

                const newMessage = await ChatMessage.create({
                    projectId,
                    sender: socket.user._id,
                    message,
                });

                // Populate sender info for the frontend
                const populatedMessage = await ChatMessage.findById(newMessage._id)
                    .populate('sender', 'name email avatar');

                io.to(projectId).emit('receiveMessage', populatedMessage);
                logger.info(`📤 Message from ${socket.user.email} in ${projectId}: ${message}`);
            } catch (error) {
                logger.error(`✖ Socket sendMessage Error: ${error.message}`);
            }
        });

        socket.on('disconnect', () => {
            logger.info(`🔥 Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

module.exports = { initIO, getIO };
