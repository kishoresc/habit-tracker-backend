const express = require('express');
const router = express.Router();
const {
  getSmtpSettings,
  updateSmtpSettings,
  testSmtpConnection,
} = require('../controllers/smtpController');
const { protect } = require('../middleware/auth');
const { isMasterAdmin } = require('../middleware/isMasterAdmin');

// All routes require authentication and master admin role
router.use(protect);
router.use(isMasterAdmin);

// @route   GET /api/smtp
// @desc    Get SMTP settings (without password)
// @access  Private/MasterAdmin
router.get('/', getSmtpSettings);

// @route   PUT /api/smtp
// @desc    Update SMTP settings
// @access  Private/MasterAdmin
router.put('/', updateSmtpSettings);

// @route   POST /api/smtp/test
// @desc    Test SMTP connection
// @access  Private/MasterAdmin
router.post('/test', testSmtpConnection);

module.exports = router;
