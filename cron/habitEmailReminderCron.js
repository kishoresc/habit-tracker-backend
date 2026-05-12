const cron = require('node-cron');
const Habit = require('../models/Habit');
const User = require('../models/User');
const { sendHabitReminderEmail, sendStreakWarningEmail } = require('../utils/emailService');

// Helper function to check if current time matches reminder time
const isTimeToSendReminder = (reminderTime) => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Parse reminder time (format: "09:00" or "9:00 AM")
  const timeMatch = reminderTime.match(/(\d{1,2}):(\d{2})/);
  if (!timeMatch) return false;
  
  let reminderHour = parseInt(timeMatch[1]);
  const reminderMinute = parseInt(timeMatch[2]);
  
  // Handle AM/PM format
  if (reminderTime.toLowerCase().includes('pm') && reminderHour !== 12) {
    reminderHour += 12;
  } else if (reminderTime.toLowerCase().includes('am') && reminderHour === 12) {
    reminderHour = 0;
  }
  
  return currentHour === reminderHour && currentMinute === reminderMinute;
};

// Cron job 1: Custom Alert Time Reminders
// Runs every minute to check for custom reminder times
// NOTE: scheduled: false prevents auto-start (we use external cron service instead)
const customAlertCron = cron.schedule('* * * * *', async () => {
  try {
    console.log('Checking for custom alert time reminders...');
    
    // Get all active habits with email reminders enabled
    const habits = await Habit.find({
      isActive: true,
      emailReminderEnabled: true,
      emailReminderTime: { $ne: null },
    });
    
    for (const habit of habits) {
      // Check if habit is already completed today
      if (habit.isCompletedToday()) {
        continue; // Skip if already completed
      }
      
      // Check if current time matches reminder time
      if (isTimeToSendReminder(habit.emailReminderTime)) {
        try {
          // Get user info
          const user = await User.findById(habit.userId);
          
          if (user && user.notificationEnabled !== false) {
            await sendHabitReminderEmail(
              user.email,
              user.name,
              habit.name,
              habit.description || '',
              habit.currentStreak
            );
            console.log(`✅ Custom reminder sent to ${user.email} for habit: ${habit.name}`);
          }
        } catch (error) {
          console.error(`Failed to send custom reminder for habit ${habit.name}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Error in custom alert cron:', error.message);
  }
}, {
  scheduled: false  // Don't auto-start - we use external cron service
});

// Cron job 2: End of Day Warning (3 hours before midnight)
// Runs at 9:00 PM every day (21:00)
// NOTE: scheduled: false prevents auto-start (we use external cron service instead)
const endOfDayWarningCron = cron.schedule('0 21 * * *', async () => {
  try {
    console.log('Sending end of day warnings for incomplete habits...');
    
    // Get all active habits
    const habits = await Habit.find({
      isActive: true,
    });
    
    let emailsSent = 0;
    
    for (const habit of habits) {
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
            console.log(`⚠️ End of day warning sent to ${user.email} for habit: ${habit.name}`);
          }
        } catch (error) {
          console.error(`Failed to send end of day warning for habit ${habit.name}:`, error.message);
        }
      }
    }
    
    console.log(`✅ End of day warnings completed. ${emailsSent} emails sent.`);
  } catch (error) {
    console.error('Error in end of day warning cron:', error.message);
  }
}, {
  scheduled: false  // Don't auto-start - we use external cron service
});

// Start both cron jobs
const startHabitEmailReminderCron = () => {
  customAlertCron.start();
  console.log('✅ Custom alert time reminder cron started (runs every minute)');
  
  endOfDayWarningCron.start();
  console.log('✅ End of day warning cron started (runs at 9:00 PM daily)');
};

// Stop both cron jobs
const stopHabitEmailReminderCron = () => {
  customAlertCron.stop();
  endOfDayWarningCron.stop();
  console.log('❌ Habit email reminder crons stopped');
};

module.exports = {
  startHabitEmailReminderCron,
  stopHabitEmailReminderCron,
  customAlertCron,
  endOfDayWarningCron,
};
