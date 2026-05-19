// Test email connection with IPv4 fix
// Run with: node scripts/test-email-connection.js

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConnection() {
  console.log('========================================');
  console.log('Testing Email Connection (IPv4 Fix)');
  console.log('========================================');
  console.log('');
  
  try {
    // Create transporter with IPv4 fix
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Force IPv4 to avoid IPv6 connection issues
      dnsOptions: {
        family: 4
      }
    });
    
    console.log('Configuration:');
    console.log('  Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('  Port:', process.env.SMTP_PORT || 587);
    console.log('  User:', process.env.EMAIL_USER);
    console.log('  DNS Family: IPv4 (forced)');
    console.log('');
    
    console.log('Testing connection...');
    await transporter.verify();
    console.log('✅ Connection successful!');
    console.log('');
    
    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Habit Tracker Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Test Email - IPv4 Fix Verification',
      html: `
        <h2>Email Connection Test Successful!</h2>
        <p>This email confirms that the IPv4 fix is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Server Time:</strong> ${new Date().toString()}</p>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('  Message ID:', info.messageId);
    console.log('  Check your inbox:', process.env.EMAIL_USER);
    console.log('');
    console.log('========================================');
    console.log('All tests passed! Email system is working.');
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('1. Wrong email/password in .env file');
    console.error('2. Not using Gmail App Password (required for Gmail)');
    console.error('3. SMTP settings incorrect');
    console.error('4. Firewall blocking outbound connections');
    console.error('');
    console.error('Full error:', error);
    console.log('========================================');
    process.exit(1);
  }
}

testEmailConnection();
