const Task = require("../models/Task");
const ChatMessage = require("../models/ChatMessage");
const User = require("../models/User");

const getProjectLeaderboard = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Fetch tasks
        const tasks = await Task.find({ project_id: projectId });

        // Fetch messages
        const messages = await ChatMessage.find({ projectId }).populate("sender");

        const scores = {};

        // Task scoring
        tasks.forEach(task => {
            if (!task.assignee_email) return;

            if (!scores[task.assignee_email]) {
                scores[task.assignee_email] = {
                    email: task.assignee_email,
                    completedTasks: 0,
                    highPriorityTasks: 0,
                    messages: 0,
                    score: 0
                };
            }

            if (task.status === "done") {
                scores[task.assignee_email].completedTasks += 1;
            }

            if (task.priority === "high" || task.priority === "urgent") {
                scores[task.assignee_email].highPriorityTasks += 1;
            }
        });

        // Chat scoring
        messages.forEach(msg => {
            const email = msg.sender?.email;
            if (!email) return;

            if (!scores[email]) {
                scores[email] = {
                    email,
                    completedTasks: 0,
                    highPriorityTasks: 0,
                    messages: 0,
                    score: 0
                };
            }
            scores[email].messages += 1;
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
        console.error("Leaderboard error:", error);
        res.status(500).json({ error: "Failed to generate leaderboard" });
    }
};

module.exports = { getProjectLeaderboard };
