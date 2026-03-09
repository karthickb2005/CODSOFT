const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const cache = require('../middleware/cacheMiddleware');
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectChat,
} = require('../controllers/projectController');

router.route('/').get(protect, cache(60), getProjects).post(protect, createProject);
router.route('/:id').get(protect, cache(120), getProject).put(protect, updateProject).delete(protect, deleteProject);
router.route('/:id/chat').get(protect, getProjectChat);

module.exports = router;
