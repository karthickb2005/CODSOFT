const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const supabase = require('./config/supabaseClient');
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

            const { data: user, error } = await supabase
                .from('users')
                .select('id, name, email, role')
                .eq('id', decoded.id)
                .single();

            if (error || !user) {
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

        socket.on('join-ai-ops', () => {
            socket.join('ai-ops');
            logger.info(`🧭 User ${socket.user.email} joined AI-OPS live stream`);
        });

        // Join Project Chat Room
        socket.on('joinProject', async ({ projectId }) => {
            try {
                const { data: project, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (error || !project) {
                    logger.warn(`⚠ JoinProject failed: Project ${projectId} not found`);
                    return;
                }

                const isOwner = project.owner_email === socket.user.email;
                const isMember = project.member_emails?.includes(socket.user.email);

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

                const { data: newMessage, error } = await supabase
                    .from('chat_messages')
                    .insert([{
                        project_id: projectId,
                        sender_id: socket.user.id,
                        sender_name: socket.user.name,
                        message,
                    }])
                    .select('*, sender:users(id, name, email)')
                    .single();

                if (error) throw error;

                io.to(projectId).emit('receiveMessage', newMessage);
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
