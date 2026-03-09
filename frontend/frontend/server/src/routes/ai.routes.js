const express = require('express');
const router = express.Router();
const axios = require('axios');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const ChatMessage = require('../models/ChatMessage');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCcDwoHB4MPlkkw1TXU7UqCNEMEdSuaBkw";

async function askGemini(promptText, maxOutputTokens = 150) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [
                            { text: promptText }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: maxOutputTokens
                }
            }
        );

        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API error:", error.response?.data || error.message);
        throw error;
    }
}

router.post('/chat', async (req, res) => {
    console.log("Gemini key loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");
    const { message: userMessage, projectId } = req.body;

    if (!userMessage) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    try {
        const msg = userMessage.toLowerCase();

        if (msg.includes("summarize project") && projectId) {
            const project = await Project.findById(projectId);
            const tasks = await Task.find({ project: projectId });
            const members = await User.find({ _id: { $in: project.members } });

            const context = `
Project Name: ${project.name}

Tasks:
${tasks.map(t => `• ${t.title} (${t.status})`).join("\n")}

Team Members:
${members.map(m => m.name).join(", ")}
`;
            const prompt = `
You are an AI assistant for a project management platform called TaskPilot.

Summarize this project in 4 bullet points.

${context}
`;
            const aiReply = await askGemini(prompt, 150);
            return res.json({ reply: aiReply });
        }

        if (msg.includes("create task") && projectId) {
            const prompt = `
Extract task information from the following message.

Return JSON only with:
title
priority
description

Message:
${userMessage}
`;
            const aiReply = await askGemini(prompt, 150);

            const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiData = JSON.parse(jsonMatch[0]);
                const newTask = new Task({
                    title: aiData.title,
                    description: aiData.description,
                    priority: aiData.priority || 'medium',
                    project: projectId,
                    status: "todo"
                });
                await newTask.save();
                return res.json({ reply: `Task created successfully: ${aiData.title}` });
            } else {
                return res.json({ reply: "I couldn't extract task details. Please provide title, description, and priority." });
            }
        }

        if (msg.includes("summarize chat") && projectId) {
            const messages = await ChatMessage
                .find({ projectId })
                .sort({ createdAt: -1 })
                .limit(20);

            const chatText = messages
                .reverse()
                .map(m => `${m.senderName || 'User'}: ${m.message}`)
                .join("\n");

            const prompt = `
Summarize the following team discussion in 4 bullet points.

Chat Messages:
${chatText}
`;
            const aiReply = await askGemini(prompt, 150);
            return res.json({ reply: aiReply });
        }

        const prompt = `
You are TaskPilot AI Assistant.

Respond briefly in bullet points (max 4 points).

User Question:
${userMessage}
`;
        const aiReply = await askGemini(prompt, 150);
        res.json({ reply: aiReply });
    } catch (error) {
        console.error("Gemini error:", error.response?.data || error.message);
        res.status(500).json({ error: "AI processing failed" });
    }
});

module.exports = router;
