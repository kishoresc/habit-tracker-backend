const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const createMasterAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if master admin already exists
    const existingMasterAdmin = await User.findOne({ role: 'masterAdmin' });
    
    if (existingMasterAdmin) {
      console.log('Master Admin already exists:', existingMasterAdmin.email);
      process.exit(0);
    }

    // Check if user with this email exists
    const existingUser = await User.findOne({ email: 'kishoreravi0201@gmail.com' });
    
    if (existingUser) {
      // Update existing user to master admin
      existingUser.role = 'masterAdmin';
      existingUser.name = 'Kishore';
      await existingUser.save();
      console.log('✅ Existing user updated to Master Admin');
    } else {
      // Create new master admin
      // Note: Password will be hashed by the pre-save hook
      const masterAdmin = await User.create({
        name: 'Kishore',
        email: 'kishoreravi0201@gmail.com',
        password: 'Welcome@123',
        role: 'masterAdmin',
      });
      console.log('✅ Master Admin created successfully');
      console.log('Email:', masterAdmin.email);
      console.log('Password: Welcome@123');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error creating master admin:', error);
    process.exit(1);
  }
};

createMasterAdmin();
