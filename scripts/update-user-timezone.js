// Update existing user's timezone
// Run with: node scripts/update-user-timezone.js <email> <timezone>
// Example: node scripts/update-user-timezone.js tarunraaj2003@gmail.com Asia/Kolkata

require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const User = require('../models/User');

async function updateUserTimezone() {
  try {
    const email = process.argv[2];
    const timezone = process.argv[3] || 'Asia/Kolkata';
    
    if (!email) {
      console.log('Usage: node scripts/update-user-timezone.js <email> <timezone>');
      console.log('Example: node scripts/update-user-timezone.js tarunraaj2003@gmail.com Asia/Kolkata');
      console.log('');
      console.log('Common timezones:');
      console.log('  Asia/Kolkata (India)');
      console.log('  America/New_York (US Eastern)');
      console.log('  America/Los_Angeles (US Pacific)');
      console.log('  Europe/London (UK)');
      console.log('  UTC (Universal Time)');
      process.exit(1);
    }
    
    console.log('========================================');
    console.log('Updating User Timezone');
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
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      console.log('');
      console.log('Available users:');
      const users = await User.find({}, 'email name timezone');
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.name}) - Current timezone: ${u.timezone || 'UTC'}`);
      });
      await mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('User found:');
    console.log(`  Name: ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Current timezone: ${user.timezone || 'UTC'}`);
    console.log('');
    
    // Update timezone
    user.timezone = timezone;
    await user.save();
    
    console.log(`✅ Timezone updated to: ${timezone}`);
    console.log('');
    
    // Test the timezone
    const now = moment().tz(timezone);
    const localTime = now.format('YYYY-MM-DD HH:mm:ss z');
    
    console.log('Current time in user timezone:');
    console.log(`  ${localTime}`);
    console.log('');
    console.log('========================================');
    console.log('Update completed successfully!');
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

updateUserTimezone();
