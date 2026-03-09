const axios = require('axios');
require('dotenv').config();

const apiKey = process.env.HUGGING_FACE_API_KEY;
const model = "meta-llama/Llama-3.1-8B-Instruct";

async function run() {
    console.log(`Model: ${model}`);
    const fullPrompt = `You are an AI insights engine used in a production backend service.

Your task is to analyze the provided input data and generate clear, actionable insights.

STRICT RULES:
- Return ONLY valid JSON.
- Do NOT include explanations, markdown, or extra text.
- Follow the schema exactly.
- Use concise, professional language.

JSON SCHEMA:
{
  "summary": "High-level overview in 1–2 sentences",
  "key_findings": [
    "Observation 1",
    "Observation 2",
    "Observation 3"
  ],
  "risks": [
    "Identified risk 1",
    "Identified risk 2"
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

INPUT DATA:
Project "Website Redesign" is 20% complete. 3 tasks overdue. Resource Alice is overloaded.`;

    try {
        const res = await axios.post(
            'https://router.huggingface.co/v1/chat/completions',
            {
                model: model,
                messages: [{ role: "user", content: fullPrompt }],
                max_tokens: 500,
                stream: false
            },
            { headers: { Authorization: `Bearer ${apiKey}` } }
        );
        const text = res.data.choices[0].message.content;
        console.log("Response Content:", text);

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const json = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        console.log("Parsed JSON:", JSON.stringify(json, null, 2));
    } catch (e) {
        console.log("Error Status:", e.response?.status);
        console.log("Error Data:", JSON.stringify(e.response?.data, null, 2));
    }
}
run();
