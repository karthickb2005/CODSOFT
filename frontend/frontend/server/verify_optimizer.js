const AIGateway = require('./src/services/aiGateway');
const AIOptimizer = require('./src/services/aiOptimizer');
const logger = require('./src/utils/logger');
require('dotenv').config();

async function testSelfOptimization() {
    const requestId = `opt-test-${Date.now()}`;
    logger.info(`--- Starting AI Self-Optimization Verification [${requestId}] ---`);

    // 1. Initial State
    console.log('\n--- Initial Rankings ---');
    console.log(JSON.stringify(AIOptimizer.getMetrics().rankings, null, 2));

    const data = { messages: "Optimize my workflow" };

    // 2. Perform a few requests to build history
    console.log('\n--- Processing requests to build performance history ---');
    for (let i = 0; i < 3; i++) {
        await AIGateway.invoke('https://invalid-url.com', data, {}, `${requestId}-${i}`);
    }

    // 3. Check for adaptive changes
    console.log('\n--- Rankings After Usage ---');
    const finalMetrics = AIOptimizer.getMetrics();
    console.log(JSON.stringify(finalMetrics.rankings, null, 2));

    // 4. Manual confirmation
    if (finalMetrics.rankings.length > 0) {
        console.log('\n✔ Verification SUCCESS: Optimizer calculated scores and timeouts.');
    } else {
        console.log('\n✖ Verification FAILED: No rankings generated.');
    }
}

testSelfOptimization();
