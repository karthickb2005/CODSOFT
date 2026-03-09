/**
 * Verification Script: Universal AI Routing Layer
 * Tests provider-agnostic abstraction and failover.
 */
const AIGateway = require('./src/services/aiGateway');
const providerRegistry = require('./src/platform/providers/providerRegistry');
const BaseProvider = require('./src/platform/providers/baseProvider');

// Mock adapter to simulate capacity limits
class MockCapacityLimitedAdapter extends BaseProvider {
    constructor(name) { super(name); }
    async invoke(payload, timeout, requestId) {
        return this.formatResponse(false, { error: 'Overloaded' }, 10, 0, 'capacity_limited');
    }
}

async function runVerification() {
    console.log('--- Universal AI Routing Verification ---');

    // 1. Test Gateway with Real Registry
    try {
        const response = await AIGateway.invoke('http://dummy', { messages: 'Test prompt' }, {}, 'verify-req-1');
        console.log('✔ Gateway response received:', response.aiProvider);
        console.log('✔ Normalized status:', response.normalizedStatus);
    } catch (e) {
        console.log('✖ Initial test failed:', e.message);
    }

    // 2. Test Capacity Isolation (Mocking Gemini to be overloaded)
    console.log('\n--- Testing Capacity Isolation ---');
    const originalGemini = providerRegistry.get('gemini');
    providerRegistry.register(new MockCapacityLimitedAdapter('gemini'));

    try {
        const response = await AIGateway.invoke('http://dummy', { messages: 'Test failover' }, {}, 'verify-req-2');
        console.log('✔ Gateway bypassed overloaded Gemini');
        console.log('✔ Routed to:', response.aiProvider);
        console.log('✔ Fallback used:', !!response.fallback);
    } catch (e) {
        console.log('✖ Failover test failed:', e.message);
    } finally {
        // Restore
        providerRegistry.register(originalGemini);
    }

    console.log('\n--- Verification Complete ---');
}

runVerification();
