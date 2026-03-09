const axios = require('axios');

async function debugInsights() {
    try {
        // 1. Login to get token
        console.log("Logging in...");
        const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'sammarimuthu7@gmail.com',
            password: 'password123' // assuming default from seed
        });
        const token = loginRes.data.token;
        console.log("Token obtained.");

        // 2. Call Insights Dashboard
        console.log("Calling Insights Dashboard...");
        const res = await axios.get('http://localhost:5001/api/ai-insights/dashboard', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("SUCCESS:", JSON.stringify(res.data, null, 2));
    } catch (error) {
        console.error("ERROR:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}
debugInsights();
