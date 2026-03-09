const express = require('express');
const router = express.Router();
const { getActivityFeed } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getActivityFeed);

module.exports = router;
