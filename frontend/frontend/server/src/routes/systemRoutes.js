const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getMetrics } = require('../middleware/observabilityMiddleware');

const AIDigitalTwin = require('../services/aiDigitalTwin');

// @desc    Get Digital Twin simulation report
// @route   GET /ai/simulation/report
// @access  Public (Simulated Internal)
router.get('/simulation/report', async (req, res) => {
    try {
        const report = await AIDigitalTwin.runSimulation(30); // Default batch of 30
        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Trigger Digital Twin simulation
// @route   POST /ai/simulation/run
// @access  Public (Simulated Internal)
router.post('/simulation/run', async (req, res) => {
    try {
        const { batchSize } = req.body;
        const report = await AIDigitalTwin.runSimulation(batchSize || 20);
        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Update Governance Configuration
// @route   PATCH /ai/governance/config
// @access  Dev Only
router.patch('/governance/config', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: 'Forbidden in production' });
    }

    try {
        const { policies, chaosMode, digitalTwinMode } = req.body;

        if (policies) AIPolicyEngine.updatePolicies(policies);

        // Handle mode toggles via environment variable simulation for runtime
        if (chaosMode !== undefined) process.env.CHAOS_MODE = String(chaosMode);
        if (digitalTwinMode !== undefined) process.env.DIGITAL_TWIN_MODE = String(digitalTwinMode);

        res.status(200).json({
            success: true,
            message: 'Governance configuration updated',
            currentModes: {
                chaosMode: process.env.CHAOS_MODE,
                digitalTwinMode: process.env.DIGITAL_TWIN_MODE
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// @desc    Health check
// @route   GET /health
// @access  Public
router.get('/', (req, res) => {
    res.status(200).json({ status: 'UP', success: true });
});

// @desc    Readiness check (heavier)
// @route   GET /ready
// @access  Public
router.get('/ready', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';

    // Redis check
    const redis = require('../config/redis');
    const redisStatus = redis.status === 'ready' ? 'UP' : 'DOWN';

    // Queue check (BullMQ)
    const { aiInsightsQueue } = require('../queue/queue');
    let queueStatus = 'UP';
    try {
        await aiInsightsQueue.client.ping();
    } catch (err) {
        queueStatus = 'DOWN';
    }

    const memoryUsage = process.memoryUsage();
    const healthData = {
        success: true,
        status: (dbStatus === 'UP' && redisStatus === 'UP' && queueStatus === 'UP') ? 'UP' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        services: {
            database: { status: dbStatus },
            redis: { status: redisStatus },
            queue: { status: queueStatus },
            server: {
                status: 'UP',
                memoryUsage: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`
                }
            }
        }
    };

    const statusCode = healthData.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(healthData);
});

// @desc    Performance metrics
// @route   GET /health/metrics
// @access  Public
const { getAIMetrics } = require('../middleware/aiCostTracker');
const AIOptimizer = require('../services/aiOptimizer');
const AIPolicyEngine = require('../services/aiPolicyEngine');

router.get('/metrics', (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            ...getMetrics(),
            aiCostControl: getAIMetrics(),
            aiOptimizer: AIOptimizer.getMetrics(),
            aiGovernance: AIPolicyEngine.getMetrics()
        }
    });
});

module.exports = router;
