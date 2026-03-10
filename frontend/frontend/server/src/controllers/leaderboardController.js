const supabase = require("../config/supabaseClient");

const getProjectLeaderboard = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Fetch data concurrently
        const [
            { data: tasks, error: taskError },
            { data: messages, error: msgError }
        ] = await Promise.all([
            supabase.from('tasks').select('*').eq('project_id', projectId),
            supabase.from('chat_messages').select('*, sender:users(id, email)').eq('project_id', projectId)
        ]);

        if (taskError || msgError) throw (taskError || msgError);

        const scores = {};

        const getOrCreateEntry = (email) => {
            if (!scores[email]) {
                scores[email] = {
                    email,
                    completedTasks: 0,
                    highPriorityTasks: 0,
                    messages: 0,
                    score: 0
                };
            }
            return scores[email];
        };

        // Task scoring
        tasks?.forEach(task => {
            if (!task.assignee_email) return;
            const entry = getOrCreateEntry(task.assignee_email);

            if (task.status === "done") entry.completedTasks += 1;
            if (task.priority === "high" || task.priority === "urgent") entry.highPriorityTasks += 1;
        });

        // Chat scoring
        messages?.forEach(msg => {
            const email = msg.sender?.email || msg.sender_name; // Fallback
            if (!email) return;
            const entry = getOrCreateEntry(email);
            entry.messages += 1;
        });

        // Calculate final score
        Object.values(scores).forEach(user => {
            user.score =
                user.completedTasks * 5 +
                user.highPriorityTasks * 3 +
                user.messages * 1;
        });

        const leaderboard = Object.values(scores).sort((a, b) => b.score - a.score);

        res.json({ success: true, leaderboard });

    } catch (error) {
        console.error("Leaderboard error:", error.message);
        res.status(500).json({ error: "Failed to generate leaderboard" });
    }
};

module.exports = { getProjectLeaderboard };
