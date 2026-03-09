const AIGateway = require('./src/services/aiGateway');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function testFailover() {
    const requestId = `test-${Date.now()}`;
    console.log(`Starting Failover Test [${requestId}]`);

    try {
        // Force failover by using an invalid URL
        const data = { messages: "Test prompt" };
        const result = await AIGateway.invoke('https://invalid.url', data, {}, requestId);

        if (result.aiProvider === 'fallback' || result.aiProvider === 'openai') {
            fs.writeFileSync(path.join(__dirname, 'test_success.flag'), `SUCCESS: ${result.aiProvider} used`);
            console.log('Verification Success: ' + result.aiProvider);
        } else {
            console.log('Verification Failed: Expected failover');
        }
    } catch (err) {
        console.error('Test error:', err.message);
    }
}

testFailover();
