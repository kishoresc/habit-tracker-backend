const cron = require('node-cron');
const User = require('../models/User');

// Check for inactive users every hour
// NOTE: scheduled: false prevents auto-start (we use external cron service instead)
const checkInactiveUsers = cron.schedule('0 * * * *', async () => {
  try {
    const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000);

    // Find users who haven't been active in 10 hours and have notifications enabled
    const inactiveUsers = await User.find({
      lastActive: { $lt: tenHoursAgo },
      notificationEnabled: true,
    });

    if (inactiveUsers.length > 0) {
      console.log(`Found ${inactiveUsers.length} inactive users`);
      
      // In a real application, you would send notifications here
      // This could be done via:
      // 1. Web Push API
      // 2. Email notifications
      // 3. SMS notifications
      // 4. Third-party services like Firebase Cloud Messaging
      
      inactiveUsers.forEach(user => {
        console.log(`User ${user.email} has been inactive for 10+ hours`);
        // Send notification logic here
      });
    }
  } catch (error) {
    console.error('Error checking inactive users:', error);
  }
}, {
  scheduled: false  // Don't auto-start - we use external cron service
});

module.exports = { checkInactiveUsers };
