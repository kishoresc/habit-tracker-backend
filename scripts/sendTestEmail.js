const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { sendEmail } = require('../utils/emailService');
const connectDB = require('../config/db');

const sendTestEmail = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database\n');

    // Get recipient email from command line or use default
    const recipientEmail = process.argv[2] || 'habittracker03@gmail.com';

    console.log('='.repeat(60));
    console.log('SENDING TEST EMAIL');
    console.log('='.repeat(60));
    console.log(`\nRecipient: ${recipientEmail}\n`);

    console.log('🔄 Sending email...');

    await sendEmail({
      to: recipientEmail,
      subject: 'Test Email from Habit Tracker',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #6366f1;">✅ SMTP is Working!</h1>
          <p>This is a test email from your Habit Tracker application.</p>
          <p>If you're reading this, your SMTP configuration is correct! 🎉</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toLocaleString()}
          </p>
        </div>
      `,
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`\nCheck your inbox: ${recipientEmail}`);
    console.log('(Also check spam folder if not in inbox)\n');

    process.exit(0);
  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ EMAIL SENDING FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);
    process.exit(1);
  }
};

// Run the test
sendTestEmail();
