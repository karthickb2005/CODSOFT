const axios = require('axios');
const GEMINI_API_KEY = "AIzaSyAcAHgAdbqk87_CW0XOYXkgDtF7zGX2qkM";

async function test() {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: "hello" }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 150
                }
            }
        );
        console.log("SUCCESS:", response.data);
    } catch (error) {
        console.error("ERROR:");
        console.error(error.response?.data || error.message);
    }
}
test();
