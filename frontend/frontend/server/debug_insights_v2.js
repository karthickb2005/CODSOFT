const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function debugInsights() {
    try {
        const secret = process.env.JWT_SECRET;
        const userEmail = 'sammarimuthu7@gmail.com';
        const userId = '65b2a0c4f1a23a4b9c8d7e6f'; // Placeholder valid ID

        const token = jwt.sign({ id: userId, email: userEmail, name: 'DebugUser' }, secret, { expiresIn: '1h' });
        console.log("Token signed locally.");

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
