// Check SMTP settings from database
// Run with: node scripts/check-smtp-settings.js

require('dotenv').config();
const mongoose = require('mongoose');
const SmtpSettings = require('../models/SmtpSettings');

async function checkSmtpSettings() {
  try {
    console.log('========================================');
    console.log('Checking SMTP Settings from Database');
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
    
    // Get SMTP settings
    const settings = await SmtpSettings.findOne();
    
    if (!settings) {
      console.log('❌ No SMTP settings found in database!');
      console.log('');
      console.log('Action Required:');
      console.log('1. Login as Master Admin');
      console.log('2. Go to SMTP Settings page');
      console.log('3. Configure email settings:');
      console.log('   - Host: smtp.gmail.com');
      console.log('   - Port: 587');
      console.log('   - Username: your-email@gmail.com');
      console.log('   - Password: your-app-password');
      console.log('   - From Email: your-email@gmail.com');
      console.log('   - From Name: Habit Tracker');
      console.log('========================================');
      process.exit(1);
    }
    
    console.log('SMTP Settings Found:');
    console.log('  Host:', settings.host);
    console.log('  Port:', settings.port);
    console.log('  Secure:', settings.secure);
    console.log('  Username:', settings.username);
    console.log('  Password:', settings.password ? '***' + settings.password.slice(-4) : '(empty)');
    console.log('  From Email:', settings.fromEmail);
    console.log('  From Name:', settings.fromName);
    console.log('  Updated At:', settings.updatedAt);
    console.log('');
    
    // Check if credentials are set
    if (!settings.username || !settings.password) {
      console.log('❌ SMTP credentials are not configured!');
      console.log('');
      console.log('Action Required:');
      console.log('1. Login as Master Admin');
      console.log('2. Configure SMTP settings with valid credentials');
      console.log('========================================');
      process.exit(1);
    }
    
    console.log('✅ SMTP settings are configured');
    console.log('');
    
    // Test connection
    console.log('Testing SMTP connection...');
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.username,
        pass: settings.password,
      },
      // Force IPv4 to avoid IPv6 connection issues
      dnsOptions: {
        family: 4
      }
    });
    
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    console.log('');
    console.log('========================================');
    console.log('All checks passed! Email system is ready.');
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

checkSmtpSettings();
