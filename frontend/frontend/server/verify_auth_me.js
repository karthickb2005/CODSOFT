const http = require('http');

const testAuthMe = (token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: '127.0.0.1',
            port: 5001,
            path: '/api/users/me',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data
                });
            });
        });

        req.on('error', (err) => reject(err));
        req.end();
    });
};

async function runTest() {
    console.log('--- Testing /api/users/me ---');

    // 1. Get a token first (Login)
    const loginData = JSON.stringify({
        email: 'samraaj@example.com',
        password: 'password123'
    });

    const loginOptions = {
        hostname: '127.0.0.1',
        port: 5001,
        path: '/api/users/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };

    let loginRes = await new Promise((resolve, reject) => {
        const req = http.request(loginOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.write(loginData);
        req.end();
    });

    if (loginRes.statusCode !== 200) {
        console.log('Login failed, attempting to register...');
        const registerData = JSON.stringify({
            name: 'Samraaj M M',
            email: 'samraaj@example.com',
            password: 'password123',
            role: 'admin'
        });

        const registerOptions = {
            hostname: '127.0.0.1',
            port: 5001,
            path: '/api/users',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': registerData.length
            }
        };

        loginRes = await new Promise((resolve, reject) => {
            const req = http.request(registerOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
            });
            req.on('error', reject);
            req.write(registerData);
            req.end();
        });

        if (loginRes.statusCode !== 201) {
            if (loginRes.statusCode === 400) {
                console.log('User already exists, retrying login...');
                loginRes = await new Promise((resolve, reject) => {
                    const req = http.request(loginOptions, (res) => {
                        let data = '';
                        res.on('data', (chunk) => data += chunk);
                        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
                    });
                    req.on('error', reject);
                    req.write(loginData);
                    req.end();
                });
                if (loginRes.statusCode !== 200) {
                    console.error('Login failed after registration conflict:', loginRes.body);
                    process.exit(1);
                }
            } else {
                console.error('Registration failed:', loginRes.body);
                process.exit(1);
            }
        } else {
            console.log('Registration successful.');
        }
    } else {
        console.log('Login successful.');
    }

    const { token } = JSON.parse(loginRes.body);
    console.log('Token obtained.');

    // 2. Test /me
    try {
        const res = await testAuthMe(token);
        console.log('Auth Me Status:', res.statusCode);
        console.log('Auth Me Body:', res.body);

        if (res.statusCode === 200) {
            const user = JSON.parse(res.body);
            if (user.email === 'samraaj@example.com') {
                console.log('Verification SUCCESS: User profile correctly returned.');
            } else {
                console.log('Verification FAILED: User profile mismatch.');
            }
        } else {
            console.log('Verification FAILED: Expected 200 OK.');
        }
    } catch (err) {
        console.error('Verification ERROR:', err.message);
    }
}

runTest();
