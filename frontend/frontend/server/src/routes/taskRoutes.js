const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    simulateOverdue,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const cache = require('../middleware/cacheMiddleware');

router.use(protect);

router.post('/simulate/overdue', simulateOverdue);

router.route('/').get(cache(30), getTasks).post(createTask);
router.route('/:id').get(cache(60), getTask).put(updateTask).delete(deleteTask);

module.exports = router;
