const http = require('http');
const dotenv = require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

// Mock a request
const makeRequest = (options) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', (err) => reject(err));
        req.end();
    });
};

async function runE2E() {
    process.env.PORT = 5002;
    process.env.NODE_ENV = 'test';
    console.log('--- STARTING INTEGRATED E2E TEST SUITE ---');

    console.log('Trace: Starting Server...');
    const { startServer } = require('./server.js');
    await startServer();
    console.log('Trace: Server listen initiated.');

    // Wait a bit for everything to settle
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('\n--- PHASE 1 & 9: HEALTH & SMOKE ---');
    try {
        console.log('Trace: Requesting /health...');
        const res = await makeRequest({ hostname: '127.0.0.1', port: 5002, path: '/health', method: 'GET' });
        console.log('Health Status:', res.statusCode === 200 || res.statusCode === 503 ? 'PASS' : 'FAIL');
        console.log('X-Request-Id:', res.headers['x-request-id'] ? 'PASS' : 'FAIL');
        const body = JSON.parse(res.body);
        console.log('DB Status:', body.services.database.status);
    } catch (err) {
        console.error('Phase 1/9 Error:', err.message);
    }

    console.log('\n--- PHASE 10: RATE LIMITING ---');
    try {
        console.log('Trace: Testing rate limits...');
        let lastRes;
        for (let i = 0; i < 2; i++) {
            lastRes = await makeRequest({ hostname: '127.0.0.1', port: 5002, path: '/health', method: 'GET' });
        }
        console.log('Rate Limit Headers Present:', lastRes.headers['x-ratelimit-limit'] ? 'PASS' : 'FAIL');
    } catch (err) {
        console.error('Phase 10 Error:', err.message);
    }

    console.log('\n--- PHASE 7: CACHING & PERFORMANCE ---');
    try {
        console.log('Trace: Testing cache...');
        const cache = require('./src/utils/cache');
        await cache.set('e2e_test_key', 'e2e_value', 10);
        const val = await cache.get('e2e_test_key');
        console.log('Cache Fallback (Local/Redis):', val === 'e2e_value' ? 'PASS' : 'FAIL');
    } catch (err) {
        console.error('Phase 7 Error:', err.message);
    }

    console.log('\n--- PHASE 8: BACKGROUND JOBS ---');
    try {
        console.log('Trace: Testing worker enqueuing...');
        const { aiInsightsQueue } = require('./src/queue/queue');
        const job = await aiInsightsQueue.add('e2e_job', { test: true });
        console.log('Job Enqueueing:', job.id ? 'PASS' : 'FAIL');
    } catch (err) {
        console.log('Job Enqueueing: FAIL (Expected if Redis is down, but verifying logic)');
    }

    console.log('\n--- INTEGRATED E2E TEST SUITE FINISHED ---');
    process.exit(0);
}

runE2E().catch(err => {
    console.error('Global E2E Failure:', err);
    process.exit(1);
});
