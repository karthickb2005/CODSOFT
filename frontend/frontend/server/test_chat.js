const axios = require('axios');

async function testChat() {
    try {
        const response = await axios.post('http://localhost:5001/api/ai/chat', { message: "Hello" });
        console.log("SUCCESS:", response.data);
    } catch (error) {
        console.log("ERROR:", error.response?.status);
        console.log("DATA:", error.response?.data);
    }
}

testChat();
