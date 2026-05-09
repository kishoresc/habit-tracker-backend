const express = require('express');
const router = express.Router();
const {
  sendTestEmail,
  sendWelcome,
  sendReminder,
  sendCustomEmail,
} = require('../controllers/emailController');
const { protect } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// @route   POST /api/email/test
// @desc    Send a test email
// @access  Private
router.post('/test', sendTestEmail);

// @route   POST /api/email/welcome
// @desc    Send welcome email
// @access  Private
router.post('/welcome', sendWelcome);

// @route   POST /api/email/reminder
// @desc    Send habit reminder email
// @access  Private
router.post('/reminder', sendReminder);

// @route   POST /api/email/custom
// @desc    Send custom email
// @access  Private
router.post('/custom', sendCustomEmail);

module.exports = router;
