const axios = require('axios');

async function test(key, model) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
            {
                contents: [{ parts: [{ text: "hello" }] }],
                generationConfig: { maxOutputTokens: 10 }
            }
        );
        console.log(`SUCCESS [${model}] with key ending in ${key.slice(-4)}`);
    } catch (error) {
        console.error(`ERROR [${model}] with key ending in ${key.slice(-4)}:`, error.response?.data?.error?.message || error.message);
    }
}

const key1 = "AIzaSyCcDwoHB4MPlkkw1TXU7UqCNEMEdSuaBkw"; // Hardcoded
const key2 = "AIzaSyAcAHgAdbqk87_CW0XOYXkgDtF7zGX2qkM"; // .env

async function run() {
    await test(key1, "gemini-1.5-flash");
    await test(key2, "gemini-1.5-flash");
    await test(key1, "gemini-2.5-flash");
    await test(key2, "gemini-2.5-flash");
}
run();
