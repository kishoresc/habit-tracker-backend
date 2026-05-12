const express = require('express');
const router = express.Router();
const cronAuth = require('../middleware/cronAuth');
const {
  processCustomReminders,
  processEndOfDayWarnings,
  cronHealthCheck,
} = require('../controllers/cronController');

// Public health check endpoint
router.get('/health', cronHealthCheck);

// Protected cron endpoints (require CRON_SECRET_KEY in x-cron-secret header)
// For Render free tier: Set up cron-job.org to call /custom-reminders every 1 minute
// This keeps the server warm and processes reminders simultaneously
router.post('/custom-reminders', cronAuth, processCustomReminders);
router.post('/end-of-day-warnings', cronAuth, processEndOfDayWarnings);

module.exports = router;
