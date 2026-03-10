const mongoose = require('mongoose');
const logger = require('../utils/logger');

let _memServer = null;
let _isConnected = false;

const connectDB = async () => {
    // Avoid reconnecting on every serverless function call
    if (_isConnected) return;

    const uri = process.env.MONGO_URI;

    if (!uri) {
        logger.error('✖ CRITICAL ERROR: MONGO_URI is not defined in environment variables.');
        // On Vercel, don't call process.exit — just throw so the caller can handle it
        throw new Error('MONGO_URI is not defined');
    }

    // Try the configured MONGO_URI
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000
        });
        _isConnected = true;
        logger.info(`✔ MongoDB Connected: ${conn.connection.host}`);
        return;
    } catch (error) {
        logger.warn(`⚠ Could not connect to ${uri}: ${error.message}`);

        // Only try in-memory fallback in non-production (not on Vercel)
        if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
            logger.warn('⚠ Falling back to in-memory MongoDB...');
            try {
                const { MongoMemoryServer } = require('mongodb-memory-server');
                _memServer = await MongoMemoryServer.create();
                const memUri = _memServer.getUri();
                const conn = await mongoose.connect(memUri);
                _isConnected = true;
                logger.info(`✔ MongoDB Connected (in-memory): ${conn.connection.host} [DEV FALLBACK]`);
                return;
            } catch (memError) {
                logger.error(`✖ In-memory MongoDB also failed: ${memError.message}`);
            }
        }

        // Re-throw so routes return 503 rather than crashing the process
        throw error;
    }
};

const closeDB = async () => {
    await mongoose.connection.close();
    _isConnected = false;
    logger.info('--- MongoDB Connection Closed ---');
};

module.exports = { connectDB, closeDB };
