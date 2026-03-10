const express = require("express");
const { getProjectLeaderboard } = require("../controllers/leaderboardController");

const router = express.Router();

router.get("/:projectId", getProjectLeaderboard);

module.exports = router;
