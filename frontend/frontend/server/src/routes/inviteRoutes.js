const express = require('express');
const router = express.Router();
const { getInviteData, acceptInvite } = require('../controllers/inviteController');

router.get('/:token', getInviteData);
router.post('/accept', acceptInvite);

module.exports = router;
