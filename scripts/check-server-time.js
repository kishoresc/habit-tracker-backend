// Quick script to check server time and timezone
// Run with: node scripts/check-server-time.js

const now = new Date();

console.log('========================================');
console.log('Server Time Information');
console.log('========================================');
console.log('Current Date/Time:', now.toString());
console.log('ISO Format:', now.toISOString());
console.log('Local String:', now.toLocaleString());
console.log('');
console.log('Time Components:');
console.log('  Hour (24h):', now.getHours());
console.log('  Minute:', now.getMinutes());
console.log('  Second:', now.getSeconds());
console.log('');
console.log('Timezone:');
console.log('  Offset (minutes):', now.getTimezoneOffset());
console.log('  Offset (hours):', now.getTimezoneOffset() / 60);
console.log('  Timezone String:', Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log('========================================');

// Test the time matching function
const testReminderTime = '09:31';
const timeMatch = testReminderTime.match(/(\d{1,2}):(\d{2})/);
if (timeMatch) {
  const reminderHour = parseInt(timeMatch[1]);
  const reminderMinute = parseInt(timeMatch[2]);
  
  console.log('');
  console.log('Testing Reminder Time:', testReminderTime);
  console.log('  Parsed Hour:', reminderHour);
  console.log('  Parsed Minute:', reminderMinute);
  console.log('  Current Hour:', now.getHours());
  console.log('  Current Minute:', now.getMinutes());
  console.log('  Match?', now.getHours() === reminderHour && now.getMinutes() === reminderMinute);
  console.log('========================================');
}
