const axios = require('axios');
const dotenv = require('dotenv').config();

const API_URL = 'http://localhost:5001/api';

const runVerification = async () => {
    console.log('--- Auto-Doctor Verification Started ---');

    // 1. Check Backend Health
    try {
        const healthUrl = 'http://localhost:5001/health';
        const response = await axios.get(healthUrl);
        console.log('✔ Backend Health: OK (All services UP)');
    } catch (error) {
        if (error.response?.status === 503) {
            console.log('⚠ Backend Health: DEGRADED (Expected if Redis/Workers are down)');
            console.log('  Services:', JSON.stringify(error.response.data.services, null, 2));
        } else {
            console.error('✘ Backend Health: FAILED', error.message);
        }
    }

    // 2. Simulate Create Team Member (with likely Ethereal fallback)
    try {
        console.log('Simulating team invitation...');
        // We'll use a random email to avoid collision
        const testEmail = `doctor_test_${Date.now()}@example.com`;
        const response = await axios.post(`${API_URL}/team`, {
            user_email: testEmail,
            role: 'member',
            display_name: 'Doctor Test User'
        });

        if (response.status === 201) {
            console.log('✔ Team Member Creation: OK');
            console.log('✔ Email Hook Triggered (Review backend logs for SMTP/Ethereal status)');
        }
    } catch (error) {
        console.error('✘ Team Member Creation: FAILED', error.response?.data?.message || error.message);
    }

    // 3. Simulate Invalid Login
    try {
        console.log('Simulating invalid login for error handling check...');
        await axios.post(`${API_URL}/users/login`, {
            email: 'nonexistent@example.com',
            password: 'wrong'
        });
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✔ Error Handling (401): OK');
            console.log('✔ Response Structure:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('✘ Error Handling: UNEXPECTED RESPONSE', error.response?.status);
        }
    }

    console.log('--- Auto-Doctor Verification Completed ---');
};

runVerification();
