const mongoose = require('mongoose');
const logger = require('../utils/logger');

let _memServer = null;

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        logger.error('✖ CRITICAL ERROR: MONGO_URI is not defined in environment variables.');
        process.exit(1);
    }

    // First, try the configured MONGO_URI
    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 3000
        });
        logger.info(`✔ MongoDB Connected: ${conn.connection.host}`);
        return;
    } catch (error) {
        logger.warn(`⚠ Could not connect to ${uri}: ${error.message}`);
        logger.warn('⚠ Falling back to in-memory MongoDB (mongodb-memory-server)...');
    }

    // Fallback: use mongodb-memory-server for development
    try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        _memServer = await MongoMemoryServer.create();
        const memUri = _memServer.getUri();
        const conn = await mongoose.connect(memUri);
        logger.info(`✔ MongoDB Connected (in-memory): ${conn.connection.host} [DEV FALLBACK]`);
    } catch (memError) {
        logger.error(`✖ In-memory MongoDB also failed: ${memError.message}`);
        process.exit(1);
    }
};

const closeDB = async () => {
    await mongoose.connection.close();
    logger.info('--- MongoDB Connection Closed ---');
};

module.exports = { connectDB, closeDB };
