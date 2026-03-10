const express = require('express');
const router = express.Router();
const axios = require('axios');
const supabase = require('../config/supabaseClient');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCcDwoHB4MPlkkw1TXU7UqCNEMEdSuaBkw";

async function askGemini(promptText, maxOutputTokens = 150) {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { maxOutputTokens: maxOutputTokens }
            }
        );
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API error:", error.response?.data || error.message);
        throw error;
    }
}

router.post('/chat', async (req, res) => {
    const { message: userMessage, projectId } = req.body;
    if (!userMessage) return res.status(400).json({ success: false, message: 'Message is required' });

    try {
        const msg = userMessage.toLowerCase();

        // 1. Project Summary
        if (msg.includes("summarize project") && projectId) {
            const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
            const { data: tasks } = await supabase.from('tasks').select('*').eq('project_id', projectId);

            // Note: In Supabase we use member_emails. Let's find those users.
            const { data: members } = await supabase.from('users').select('name').in('email', project.member_emails || []);

            const context = `
Project Name: ${project.name}
Tasks:
${tasks?.map(t => `• ${t.title} (${t.status})`).join("\n")}
Team Members:
${members?.map(m => m.name).join(", ")}
`;
            const prompt = `Summarize this project in 4 bullet points:\n\n${context}`;
            const aiReply = await askGemini(prompt, 150);
            return res.json({ reply: aiReply });
        }

        // 2. Create Task via AI
        if (msg.includes("create task") && projectId) {
            const prompt = `Extract task info from: "${userMessage}". Return JSON: {title, priority, description}`;
            const aiReply = await askGemini(prompt, 150);

            const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const aiData = JSON.parse(jsonMatch[0]);
                const { data: newTask, error } = await supabase
                    .from('tasks')
                    .insert([{
                        title: aiData.title,
                        description: aiData.description,
                        priority: aiData.priority || 'medium',
                        project_id: projectId,
                        status: "todo"
                    }])
                    .select()
                    .single();

                if (error) throw error;
                return res.json({ reply: `Task created successfully: ${aiData.title}` });
            }
            return res.json({ reply: "I couldn't extract task details." });
        }

        // 3. Chat Summary
        if (msg.includes("summarize chat") && projectId) {
            const { data: messages } = await supabase
                .from('chat_messages')
                .select('sender_name, message')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false })
                .limit(20);

            const chatText = messages
                ?.reverse()
                .map(m => `${m.sender_name || 'User'}: ${m.message}`)
                .join("\n");

            const prompt = `Summarize this team discussion in 4 bullet points:\n\nChat Messages:\n${chatText}`;
            const aiReply = await askGemini(prompt, 150);
            return res.json({ reply: aiReply });
        }

        // 4. General Q&A
        const prompt = `You are TaskPilot AI. Respond briefly in bullet points (max 4). User: ${userMessage}`;
        const aiReply = await askGemini(prompt, 150);
        res.json({ reply: aiReply });

    } catch (error) {
        console.error("AI Route Error:", error.message);
        res.status(500).json({ error: "AI processing failed" });
    }
});

module.exports = router;
