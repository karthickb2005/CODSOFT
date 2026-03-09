const express = require('express');
const router = express.Router();
const {
    getInsights,
    createInsight,
    invokeLLM,
    updateInsight,
    getDashboardInsights,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(getInsights)
    .post(createInsight);

router.route('/invoke')
    .post(invokeLLM);

router.get('/dashboard', protect, getDashboardInsights);

router.route('/:id')
    .put(updateInsight);

module.exports = router;
