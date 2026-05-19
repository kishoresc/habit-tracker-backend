const Habit = require('../models/Habit');
const User = require('../models/User');
const { sendHabitReminderEmail, sendStreakWarningEmail } = require('../utils/emailService');
const moment = require('moment-timezone');

// Helper function to check if current time matches reminder time in user's timezone
const isTimeToSendReminder = (reminderTime, userTimezone = 'UTC') => {
  // Get current time in user's timezone using moment-timezone
  const now = moment().tz(userTimezone);
  const currentHour = now.hour();
  const currentMinute = now.minute();
  
  // Parse reminder time (format: "09:00" or "9:00 AM")
  const timeMatch = reminderTime.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) {
    console.log(`⚠️ [CRON] Invalid reminder time format: ${reminderTime}`);
    return false;
  }
  
  let reminderHour = parseInt(timeMatch[1]);
  const reminderMinute = parseInt(timeMatch[2]);
  
  // Handle AM/PM format
  if (reminderTime.toLowerCase().includes('pm') && reminderHour !== 12) {
    reminderHour += 12;
  } else if (reminderTime.toLowerCase().includes('am') && reminderHour === 12) {
    reminderHour = 0;
  }
  
  const matches = currentHour === reminderHour && currentMinute === reminderMinute;
  console.log(`⏰ [CRON] Time check (${userTimezone}): Current ${currentHour}:${currentMinute} vs Reminder ${reminderHour}:${reminderMinute} = ${matches}`);
  
  return matches;
};

// @desc    Process custom alert time reminders (Also keeps server warm on Render free tier)
// @route   POST /api/cron/custom-reminders
// @access  Protected (Cron Secret Key)
const processCustomReminders = async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('⏰ [CRON] Processing custom reminders...');
    
    // Get all active habits with email reminders enabled
    const habits = await Habit.find({
      isActive: true,
      emailReminderEnabled: true,
      emailReminderTime: { $ne: null },
    });
    
    console.log(`⏰ [CRON] Found ${habits.length} habits with email reminders enabled`);
    
    let emailsSent = 0;
    let errors = 0;
    let habitsChecked = 0;
    
    for (const habit of habits) {
      habitsChecked++;
      
      try {
        // Get user info first to access timezone
        const user = await User.findById(habit.userId);
        
        if (!user) {
          console.log(`⚠️ [CRON] User not found for habit: "${habit.name}"`);
          continue;
        }
        
        const userTimezone = user.timezone || 'UTC';
        console.log(`⏰ [CRON] Checking habit: "${habit.name}" (Reminder: ${habit.emailReminderTime}, Timezone: ${userTimezone})`);
        
        // Check if habit is already completed today
        if (habit.isCompletedToday()) {
          console.log(`⏰ [CRON] Habit "${habit.name}" already completed today, skipping`);
          continue; // Skip if already completed
        }
        
        // Check if current time matches reminder time in user's timezone
        if (isTimeToSendReminder(habit.emailReminderTime, userTimezone)) {
          if (user.notificationEnabled !== false) {
            await sendHabitReminderEmail(
              user.email,
              user.name,
              habit.name,
              habit.description || '',
              habit.currentStreak
            );
            emailsSent++;
            console.log(`✅ Reminder sent to ${user.email} for habit: ${habit.name}`);
          }
        }
      } catch (error) {
        errors++;
        console.error(`❌ Failed to send reminder for habit ${habit.name}:`, error.message);
      }
    }
    
    const processingTime = Date.now() - startTime;
    
    console.log(`⏰ [CRON] Custom reminders completed. Emails sent: ${emailsSent}, Errors: ${errors}, Processing time: ${processingTime}ms`);
    
    res.json({
      success: true,
      message: 'Custom reminders processed',
      emailsSent,
      errors,
      habitsChecked,
      processingTime: `${processingTime}ms`,
      serverStatus: 'warm',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in custom alert cron:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process custom reminders',
      error: error.message,
    });
  }
};

// @desc    Process end of day warnings (3 hours before midnight)
// @route   POST /api/cron/end-of-day-warnings
// @access  Protected (Cron Secret Key)
const processEndOfDayWarnings = async (req, res) => {
  try {
    const startTime = Date.now();
    console.log('⚠️ Processing end of day warnings...');
    
    // Get all active habits
    const habits = await Habit.find({
      isActive: true,
    });
    
    let emailsSent = 0;
    let errors = 0;
    let habitsChecked = 0;
    
    for (const habit of habits) {
      habitsChecked++;
      
      // Check if habit is NOT completed today
      if (!habit.isCompletedToday()) {
        try {
          // Get user info
          const user = await User.findById(habit.userId);
          
          if (user && user.notificationEnabled !== false) {
            // Send warning email (different from regular reminder)
            await sendStreakWarningEmail(
              user.email,
              user.name,
              habit.name,
              habit.currentStreak
            );
            emailsSent++;
            console.log(`⚠️ Warning sent to ${user.email} for habit: ${habit.name}`);
          }
        } catch (error) {
          errors++;
          console.error(`❌ Failed to send warning for habit ${habit.name}:`, error.message);
        }
      }
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ End of day warnings completed. ${emailsSent} emails sent in ${processingTime}ms`);
    
    res.json({
      success: true,
      message: 'End of day warnings processed',
      emailsSent,
      errors,
      habitsChecked,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Error in end of day warning cron:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process end of day warnings',
      error: error.message,
    });
  }
};

// @desc    Health check for cron jobs (Optimized for Render free tier keep-alive)
// @route   GET /api/cron/health
// @access  Public
const cronHealthCheck = async (req, res) => {
  try {
    const habitCount = await Habit.countDocuments({ isActive: true });
    const userCount = await User.countDocuments();
    const uptime = process.uptime();
    
    res.json({
      success: true,
      message: 'Cron service is healthy',
      stats: {
        activeHabits: habitCount,
        totalUsers: userCount,
        serverUptime: `${Math.floor(uptime / 60)} minutes`,
      },
      serverStatus: uptime < 900 ? 'recently started' : 'warm',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
    });
  }
};

module.exports = {
  processCustomReminders,
  processEndOfDayWarnings,
  cronHealthCheck,
};
