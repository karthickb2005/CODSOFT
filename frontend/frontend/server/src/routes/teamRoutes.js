const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getTeamMembers,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember
} = require('../controllers/teamController');

const { validateInvite } = require('../middleware/validationMiddleware');

router.route('/')
    .get(protect, getTeamMembers)
    .post(protect, validateInvite, createTeamMember);

router.route('/:id')
    .put(protect, updateTeamMember)
    .delete(protect, deleteTeamMember);

module.exports = router;
