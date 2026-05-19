const nodemailer = require('nodemailer');
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
      return nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        auth: {
          user: smtpSettings.username,
          pass: smtpSettings.password,
        },
        // Force IPv4 to avoid IPv6 connection issues
        dnsOptions: {
          family: 4
        },
        // Additional connection options
        pool: false, // Disable connection pooling
        maxConnections: 1,
        socketTimeout: 30000, // 30 seconds
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 30000, // 30 seconds
      });
    }
  } catch (error) {
    console.log('Error fetching SMTP settings from database:', error.message);
  }
  
  // Fallback to environment variables if no database settings
  console.log('Using SMTP settings from environment variables');
  
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
      },
      // Force IPv4 to avoid IPv6 connection issues
      dnsOptions: {
        family: 4
      },
      // Additional connection options
      pool: false,
      maxConnections: 1,
      socketTimeout: 30000,
      connectionTimeout: 30000,
      greetingTimeout: 30000,
    });
  }
  
  // Default: Use SMTP configuration from env
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Force IPv4 to avoid IPv6 connection issues
    dnsOptions: {
      family: 4
    },
    // Additional connection options
    pool: false,
    maxConnections: 1,
    socketTimeout: 30000,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
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
  try {
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
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
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
