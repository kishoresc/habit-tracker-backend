const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas\n');

    const users = await User.find().select('-password');
    
    console.log('=== ALL USERS IN DATABASE ===\n');
    
    if (users.length === 0) {
      console.log('No users found in database');
    } else {
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Role: ${user.role}`);
        console.log(`  Created: ${user.createdAt}`);
        console.log(`  Last Active: ${user.lastActive}`);
        console.log(`  Notifications: ${user.notificationEnabled}`);
        console.log('---');
      });
      
      console.log(`\nTotal Users: ${users.length}`);
      
      const masterAdmins = users.filter(u => u.role === 'masterAdmin');
      const regularUsers = users.filter(u => u.role === 'user');
      
      console.log(`Master Admins: ${masterAdmins.length}`);
      console.log(`Regular Users: ${regularUsers.length}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkData();
