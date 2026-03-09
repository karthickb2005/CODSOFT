const AIGateway = require('./src/services/aiGateway');
const AIPolicyEngine = require('./src/services/aiPolicyEngine');
const logger = require('./src/utils/logger');
require('dotenv').config();

async function testAutonomousGovernance() {
    const requestId = `gov-test-${Date.now()}`;
    logger.info(`--- Starting AI Autonomous Governance Verification [${requestId}] ---`);

    // 1. Priority User Test
    console.log('\n--- Scenario 1: Priority User Request ---');
    const vipResult = await AIGateway.invoke('https://invalid.url', { messages: "VIP task" }, {}, `${requestId}-vip`, {
        userId: 'vip_user_1'
    });
    console.log(`Traffic Class: ${vipResult.governance.class}, Timeout: ${vipResult.governance.timeout}ms`);

    // 2. Standard User Test
    console.log('\n--- Scenario 2: Standard User Request ---');
    const stdResult = await AIGateway.invoke('https://invalid.url', { messages: "Standard task" }, {}, `${requestId}-std`, {
        userId: 'regular_joe'
    });
    console.log(`Traffic Class: ${stdResult.governance?.class || 'default'}, Timeout: ${stdResult.governance?.timeout || 8000}ms`);

    // 3. Blacklist Test (Simulate 5 failures)
    console.log('\n--- Scenario 3: Autonomous Blacklisting ---');
    for (let i = 0; i < 5; i++) {
        try {
            await AIGateway.invoke('https://invalid.url', { messages: "Fail me" }, {}, `${requestId}-fail-${i}`);
        } catch (e) { }
    }

    const metrics = AIPolicyEngine.getMetrics();
    console.log('Blacklisted Providers:', metrics.providerBlacklist);

    if (metrics.providerBlacklist.includes('gemini')) {
        console.log('\n✔ Verification SUCCESS: Gemini was automatically blacklisted after 5 failures.');
    } else {
        console.log('\n✖ Verification FAILED: Blacklisting logic did not trigger.');
    }
}

testAutonomousGovernance();
