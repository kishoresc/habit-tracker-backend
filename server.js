const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { checkInactiveUsers } = require('./cron/notificationCron');
const { startHabitEmailReminderCron } = require('./cron/habitEmailReminderCron');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/habits', require('./routes/habitRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/smtp', require('./routes/smtpRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));
app.use('/api/cron', require('./routes/cronRoutes')); // External cron endpoints (keeps Render free tier warm)

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Habit Tracker API is running',
    uptime: `${Math.floor(process.uptime() / 60)} minutes`,
    timestamp: new Date().toISOString()
  });
});

// Internal cron jobs disabled - using external cron service (cron-job.org) instead
// This keeps the server warm on Render free tier
// checkInactiveUsers.start();
// console.log('Notification cron job started');

// startHabitEmailReminderCron();
// console.log('Habit email reminder cron job started');

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
