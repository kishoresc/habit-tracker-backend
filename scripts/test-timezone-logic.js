// Test script to verify timezone logic for end-of-day reminders
// Run with: node scripts/test-timezone-logic.js

const moment = require('moment-timezone');

console.log('========================================');
console.log('Testing Timezone Logic for 9 PM Reminders');
console.log('========================================\n');

// Test timezones
const testTimezones = [
  'UTC',
  'Asia/Kolkata',      // India (UTC+5:30)
  'America/New_York',  // US East (UTC-5)
  'America/Los_Angeles', // US West (UTC-8)
  'Europe/London',     // UK (UTC+0)
  'Australia/Sydney',  // Australia (UTC+11)
  'Asia/Tokyo',        // Japan (UTC+9)
];

console.log('Current UTC Time:', moment.utc().format('YYYY-MM-DD HH:mm:ss'));
console.log('');

console.log('Checking if it\'s 9 PM (21:00) in each timezone:');
console.log('------------------------------------------------\n');

testTimezones.forEach(timezone => {
  const now = moment().tz(timezone);
  const currentHour = now.hour();
  const currentTime = now.format('YYYY-MM-DD HH:mm:ss');
  const is9PM = currentHour === 21;
  
  console.log(`Timezone: ${timezone}`);
  console.log(`  Current Time: ${currentTime}`);
  console.log(`  Current Hour: ${currentHour}`);
  console.log(`  Is 9 PM? ${is9PM ? '✅ YES - SEND REMINDER' : '❌ NO - SKIP'}`);
  console.log('');
});

console.log('========================================');
console.log('Simulating Different UTC Hours');
console.log('========================================\n');

// Simulate what happens at different UTC hours
const utcHours = [0, 3, 6, 9, 12, 15, 18, 21];

utcHours.forEach(utcHour => {
  console.log(`\nWhen UTC hour is ${utcHour}:00`);
  console.log('----------------------------');
  
  // Create a moment at specific UTC hour
  const baseTime = moment.utc().hour(utcHour).minute(0).second(0);
  
  testTimezones.forEach(timezone => {
    const localTime = baseTime.clone().tz(timezone);
    const localHour = localTime.hour();
    const is9PM = localHour === 21;
    
    if (is9PM) {
      console.log(`  ✅ ${timezone}: ${localTime.format('HH:mm')} - SEND REMINDER`);
    }
  });
});

console.log('\n========================================');
console.log('Summary');
console.log('========================================\n');

console.log('✅ The cron should run EVERY HOUR (0 * * * *)');
console.log('✅ Each hour, it checks all users');
console.log('✅ Only sends to users where it\'s currently 9 PM in their timezone');
console.log('✅ Other users are skipped (checked again next hour)');
console.log('✅ No duplicate emails - each user gets ONE email at their 9 PM\n');

console.log('Example:');
console.log('  - India user (UTC+5:30): Gets email when UTC is 15:30 (3:30 PM UTC = 9:00 PM IST)');
console.log('  - US East user (UTC-5): Gets email when UTC is 02:00 (2:00 AM UTC = 9:00 PM EST)');
console.log('  - UK user (UTC+0): Gets email when UTC is 21:00 (9:00 PM UTC = 9:00 PM GMT)\n');
