const express = require('express');
const router = express.Router();
const { getAuthUrl, getTokens, createMeetingEvent } = require('../services/googleService');

router.get('/auth', (req, res) => {
    const url = getAuthUrl();
    console.log("Redirecting to Google Auth:", url);
    res.redirect(url);
});

router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({ error: "Authorization code missing" });
    }

    try {
        const tokens = await getTokens(code);
        const event = await createMeetingEvent(tokens);

        // Redirect back to frontend with the meeting link as a query param
        res.redirect(`http://localhost:5173/tasks?meetLink=${event.hangoutLink}`);
    } catch (error) {
        console.error("Google API Error:", error);
        res.status(500).json({
            success: false,
            message: "Error connecting to Google API",
            error: error.message
        });
    }
});

module.exports = router;
