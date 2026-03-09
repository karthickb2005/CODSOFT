const express = require("express");
const { createZoomMeeting } = require("../services/zoomService");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/create", protect, async (req, res) => {
    try {
        const { topic } = req.body;
        const meeting = await createZoomMeeting(topic);

        res.status(201).json({
            success: true,
            meetingUrl: meeting.join_url,
            meetingId: meeting.id
        });
    } catch (error) {
        console.error("Zoom Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Zoom meeting creation failed" });
    }
});

module.exports = router;
