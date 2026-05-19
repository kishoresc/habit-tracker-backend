const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');
const SmtpSettings = require('../models/SmtpSettings');

// Create email transporter
const createTransporter = async () => {
  try {
    // Try to get SMTP settings from database (master admin configuration)
    const smtpSettings = await SmtpSettings.findOne();
    
    if (smtpSettings && smtpSettings.username && smtpSettings.password) {
      // Use master admin configured SMTP settings
      console.log('Using SMTP settings from database');
      
      // Render free tier blocks port 587, use port 465 with SSL instead
      const usePort465 = smtpSettings.port === 587;
      const finalPort = usePort465 ? 465 : smtpSettings.port;
      const finalSecure = usePort465 ? true : smtpSettings.secure;
      
      console.log(`📧 SMTP Config: ${smtpSettings.host}:${finalPort} (secure: ${finalSecure})`);
      
      return nodemailer.createTransport({
        host: smtpSettings.host,
        port: finalPort,
        secure: finalSecure,
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.password,
        },
        // Force IPv4 to avoid IPv6 connection issues
        dnsOptions: {
          family: 4
        },
        // Increased timeouts for Render environment
        pool: false, // Disable connection pooling
        maxConnections: 1,
        socketTimeout: 60000, // 60 seconds
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 60000, // 60 seconds
        // Add TLS options
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        }
      });
    }
  } catch (error) {
    console.log('Error fetching SMTP settings from database:', error.message);
  }
  
  // Fallback to environment variables if no database settings
  console.log('Using SMTP settings from environment variables');
  
  // Render free tier blocks port 587, use port 465 with SSL instead
  const envPort = parseInt(process.env.SMTP_PORT) || 587;
  const usePort465 = envPort === 587;
  const finalPort = usePort465 ? 465 : envPort;
  const finalSecure = usePort465 ? true : (process.env.SMTP_SECURE === 'true');
  
  console.log(`📧 SMTP Config: ${process.env.SMTP_HOST || 'smtp.gmail.com'}:${finalPort} (secure: ${finalSecure})`);
  
  // Always use explicit host instead of 'service: gmail' to ensure IPv4 works
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: finalPort,
    secure: finalSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Force IPv4 to avoid IPv6 connection issues
    dnsOptions: {
      family: 4
    },
    // Increased timeouts for Render environment
    pool: false,
    maxConnections: 1,
    socketTimeout: 60000,
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  });
};

// Load email template and replace variables
const loadTemplate = async (templateName, variables) => {
  try {
    const templatePath = path.join(__dirname, '..', 'email-templates', `${templateName}.html`);
    let template = await fs.readFile(templatePath, 'utf-8');
    
    // Replace all variables in template
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      template = template.replace(regex, variables[key]);
    });
    
    return template;
  } catch (error) {
    console.error('Error loading email template:', error.message);
    throw new Error(`Failed to load email template: ${templateName}`);
  }
};

// Send email function
const sendEmail = async ({ to, subject, html, text, template, variables }) => {
  // Check if SendGrid API key is available (preferred method for Render)
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  
  console.log('🔍 Email Service Check:');
  console.log(`   - SENDGRID_API_KEY exists: ${sendgridApiKey ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   - Will use: ${sendgridApiKey ? 'SendGrid (HTTP API)' : 'SMTP (Port 465)'}`);
  
  if (sendgridApiKey) {
    console.log('📧 Using SendGrid for email delivery (recommended for Render)');
    return sendEmailViaSendGrid({ to, subject, html, text, template, variables });
  } else {
    console.log('⚠️ WARNING: SENDGRID_API_KEY not found, falling back to SMTP');
    console.log('⚠️ SMTP will fail on Render free tier due to port restrictions');
    console.log('⚠️ Please add SENDGRID_API_KEY to Render environment variables');
    return sendEmailViaSMTP({ to, subject, html, text, template, variables });
  }
};

// Send email via SendGrid (HTTP API - works on Render free tier)
const sendEmailViaSendGrid = async ({ to, subject, html, text, template, variables }) => {
  try {
    console.log(`📧 Sending email via SendGrid to ${to}`);
    
    // Initialize SendGrid
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    // Get sender email and name
    let fromEmail = process.env.EMAIL_USER || 'habittracker03@gmail.com';
    let fromName = 'Habit Tracker';
    
    try {
      const smtpSettings = await SmtpSettings.findOne();
      if (smtpSettings && smtpSettings.fromEmail) {
        fromEmail = smtpSettings.fromEmail;
        fromName = smtpSettings.fromName || 'Habit Tracker';
      }
    } catch (error) {
      console.log('Using default email settings from environment');
    }

    // If template is provided, load and process it
    let emailHtml = html;
    if (template && variables) {
      emailHtml = await loadTemplate(template, variables);
    }

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      html: emailHtml,
      text: text || '',
    };

    const response = await sgMail.send(msg);
    console.log('✅ Email sent successfully via SendGrid:', response[0].statusCode);
    return { success: true, messageId: response[0].headers['x-message-id'] };
    
  } catch (error) {
    console.error('❌ SendGrid email failed:', error.message);
    if (error.response) {
      console.error('SendGrid error details:', error.response.body);
    }
    throw error;
  }
};

// Send email via SMTP (fallback method)
const sendEmailViaSMTP = async ({ to, subject, html, text, template, variables }) => {
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      console.log(`📧 Attempting to send email via SMTP to ${to} (${4 - retries}/3 attempts)`);
      const transporter = await createTransporter();
      
      // Get sender email and name from SMTP settings or env
      let fromEmail = process.env.EMAIL_USER;
      let fromName = 'Habit Tracker';
      
      try {
        const smtpSettings = await SmtpSettings.findOne();
        if (smtpSettings && smtpSettings.fromEmail) {
          fromEmail = smtpSettings.fromEmail;
          fromName = smtpSettings.fromName || 'Habit Tracker';
        }
      } catch (error) {
        // Use default from env
        console.log('Using default email settings from environment');
      }

      // If template is provided, load and process it
      let emailHtml = html;
      if (template && variables) {
        emailHtml = await loadTemplate(template, variables);
      }

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html: emailHtml,
        text: text || '', // Plain text version (optional)
      };

      const info = await transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via SMTP:', info.messageId);
      return { success: true, messageId: info.messageId };
      
    } catch (error) {
      lastError = error;
      retries--;
      console.error(`❌ Email send attempt failed (${3 - retries}/3):`, error.message);
      
      if (retries > 0) {
        console.log(`⏳ Retrying in 2 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // All retries failed
  console.error('❌ All email send attempts failed:', lastError.message);
  throw lastError;
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  // Create login URL with pre-filled email
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?email=${encodeURIComponent(userEmail)}`;
  
  return sendEmail({
    to: userEmail,
    subject: 'Welcome to Habit Tracker! 🎉',
    template: 'welcome-email',
    variables: {
      userName,
      userEmail, // Pass email to template
      dashboardUrl: loginUrl, // Use login URL instead of dashboard
    },
  });
};

// Send streak milestone email
const sendStreakMilestoneEmail = async (userEmail, userName, habitName, streakDays) => {
  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000/dashboard';
  
  return sendEmail({
    to: userEmail,
    subject: `🎉 ${streakDays} Day Streak Achieved!`,
    template: 'streak-milestone',
    variables: {
      userName,
      habitName,
      streakDays,
      dashboardUrl,
    },
  });
};

// Send habit reminder email
const sendHabitReminderEmail = async (userEmail, userName, habitName, habitDescription, currentStreak) => {
  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000/dashboard';
  
  // Handle Handlebars conditional for description
  let template = await loadTemplate('habit-reminder', {
    userName,
    habitName,
    currentStreak,
    dashboardUrl,
  });
  
  // Manually handle the conditional for habitDescription
  if (habitDescription && habitDescription.trim()) {
    template = template.replace(
      /{{#if habitDescription}}[\s\S]*?{{\/if}}/g,
      `<p style="font-size: 14px; color: #666; margin-bottom: 15px; line-height: 1.6;">${habitDescription}</p>`
    );
  } else {
    template = template.replace(/{{#if habitDescription}}[\s\S]*?{{\/if}}/g, '');
  }
  
  return sendEmail({
    to: userEmail,
    subject: '⏰ Habit Reminder - Don\'t Break Your Streak!',
    html: template,
  });
};

// Send streak warning email (end of day)
const sendStreakWarningEmail = async (userEmail, userName, habitName, currentStreak) => {
  const dashboardUrl = process.env.FRONTEND_URL || 'http://localhost:3000/dashboard';
  
  return sendEmail({
    to: userEmail,
    subject: '⚠️ Don\'t Break Your Streak! Only 3 Hours Left!',
    template: 'streak-warning',
    variables: {
      userName,
      habitName,
      currentStreak,
      dashboardUrl,
    },
  });
};

module.exports = { 
  sendEmail,
  sendWelcomeEmail,
  sendStreakMilestoneEmail,
  sendHabitReminderEmail,
  sendStreakWarningEmail,
};
