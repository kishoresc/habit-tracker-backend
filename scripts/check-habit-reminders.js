// Check which habits should receive reminders right now
// Run with: node scripts/check-habit-reminders.js

require('dotenv').config();
const mongoose = require('mongoose');
const Habit = require('../models/Habit');
const User = require('../models/User');

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

async function checkHabitReminders() {
  try {
    console.log('========================================');
    console.log('Checking Habit Reminders');
    console.log('========================================');
    console.log('');
    
    // Connect to database
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) {
      console.log('❌ MONGODB_URI not found in .env file!');
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('');
    
    // Get current time
    const now = new Date();
    console.log('Current Server Time:');
    console.log('  Full:', now.toString());
    console.log('  Hour:', now.getHours());
    console.log('  Minute:', now.getMinutes());
    console.log('  Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    console.log('');
    
    // Get all active habits with email reminders enabled
    const habits = await Habit.find({
      isActive: true,
      emailReminderEnabled: true,
      emailReminderTime: { $ne: null },
    }).populate('userId');
    
    console.log(`Found ${habits.length} active habits with email reminders enabled`);
    console.log('');
    
    if (habits.length === 0) {
      console.log('❌ No habits found with email reminders enabled!');
      console.log('========================================');
      await mongoose.connection.close();
      process.exit(0);
    }
    
    let shouldSendCount = 0;
    
    for (const habit of habits) {
      const isCompleted = habit.isCompletedToday();
      const shouldSend = isTimeToSendReminder(habit.emailReminderTime);
      
      console.log('---');
      console.log('Habit:', habit.name);
      console.log('  User:', habit.userId ? habit.userId.email : 'User not found');
      console.log('  Reminder Time:', habit.emailReminderTime);
      console.log('  Completed Today:', isCompleted ? 'Yes' : 'No');
      console.log('  Time Matches:', shouldSend ? 'YES ✅' : 'No');
      console.log('  Should Send:', (!isCompleted && shouldSend) ? 'YES ✅' : 'No');
      
      if (!isCompleted && shouldSend) {
        shouldSendCount++;
        
        if (habit.userId) {
          console.log('  User Notifications:', habit.userId.notificationEnabled !== false ? 'Enabled' : 'Disabled');
        }
      }
    }
    
    console.log('---');
    console.log('');
    console.log('Summary:');
    console.log('  Total habits with reminders:', habits.length);
    console.log('  Should send reminders now:', shouldSendCount);
    console.log('');
    
    if (shouldSendCount === 0) {
      console.log('ℹ️  No reminders to send at this time.');
      console.log('');
      console.log('Possible reasons:');
      console.log('1. Current time does not match any reminder times');
      console.log('2. All habits are already completed today');
      console.log('3. Reminder times are in different timezone');
    } else {
      console.log(`✅ ${shouldSendCount} reminder(s) should be sent now!`);
      console.log('');
      console.log('If emails are not being sent, check:');
      console.log('1. SMTP settings are configured (run: node scripts/check-smtp-settings.js)');
      console.log('2. Cron job is running (check cron-job.org)');
      console.log('3. Server logs for errors');
    }
    
    console.log('========================================');
    
    await mongoose.connection.close();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Full error:', error);
    console.log('========================================');
    
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

checkHabitReminders();
