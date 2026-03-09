import express from "express"
import { getProjectLeaderboard } from "../controllers/leaderboardController.js"

const router = express.Router()

router.get("/:projectId", getProjectLeaderboard)

export default router
