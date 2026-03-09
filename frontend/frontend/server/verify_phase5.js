const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

async function verify() {
    console.log('--- Phase 5 Resilient Verification ---');

    // 1. Database Check
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskpilot', {
            serverSelectionTimeoutMS: 5000
        });
        const Task = require('./src/models/Task');
        const AuditLog = require('./src/models/AuditLog');

        const taskIndexes = await Task.collection.getIndexes();
        console.log('[DB] Task Indexes:', Object.keys(taskIndexes));
        const hasUserIdIndex = Object.keys(taskIndexes).includes('userId_1');
        console.log(`[DB] userId index: ${hasUserIdIndex ? 'PASSED' : 'FAILED'}`);

        const auditIndexes = await AuditLog.collection.getIndexes();
        console.log(`[DB] AuditLog actor index: ${Object.keys(auditIndexes).includes('actor_1_createdAt_-1') ? 'PASSED' : 'FAILED'}`);
        await mongoose.disconnect();
    } catch (err) {
        console.log(`[DB] Connection failed: ${err.message}`);
    }

    // 2. Cache Check (Fallback)
    try {
        const cache = require('./src/utils/cache');
        await cache.set('test_key', { hello: 'world' }, 10);
        const cachedVal = await cache.get('test_key');
        console.log(`[Cache] Set/Get Test (Local/Redis): ${cachedVal?.hello === 'world' ? 'PASSED' : 'FAILED'}`);
        console.log(`[Cache] Redis Status: ${require('./src/config/redis').status}`);
    } catch (err) {
        console.log(`[Cache] Test failed: ${err.message}`);
    }

    // 3. Queue Check
    try {
        const { aiInsightsQueue } = require('./src/queue/queue');
        console.log(`[Queue] AI Queue Initialized: ${aiInsightsQueue ? 'PASSED' : 'FAILED'}`);
    } catch (err) {
        console.log(`[Queue] Initialization check: FAILED (${err.message})`);
    }

    console.log('--- Verification Finished ---');
    process.exit(0);
}

verify();
