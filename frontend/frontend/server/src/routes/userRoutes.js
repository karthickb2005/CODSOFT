const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    refresh,
    logoutUser,
    getMe,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/signup', registerUser);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refresh);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

module.exports = router;
