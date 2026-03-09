const http = require('http');

const triggerInvite = () => {
    const data = JSON.stringify({
        user_email: `test_ethereal_${Date.now()}@example.com`,
        role: 'member',
        name: 'Ethereal Test User'
    });

    const options = {
        hostname: '127.0.0.1',
        port: 5001,
        path: '/api/team',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: body
                });
            });
        });

        req.on('error', (err) => reject(err));
        req.write(data);
        req.end();
    });
};

async function run() {
    console.log('Sending invitation via API to trigger Ethereal flow...');
    try {
        const result = await triggerInvite();
        console.log('Response Status:', result.statusCode);
        console.log('Response Body:', result.body);

        if (result.statusCode === 201) {
            console.log('\nSUCCESS: Team member created.');
            console.log('Check backend logs for Ethereal Preview URL.');
        } else {
            console.log('\nFAILED: Could not create team member.');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
