const { 
  sendEmail, 
  sendWelcomeEmail, 
  sendHabitReminderEmail 
} = require('../utils/emailService');

// @desc    Send test email
// @route   POST /api/email/test
// @access  Private
const sendTestEmail = async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ 
        message: 'Please provide to, subject, and message' 
      });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Test Email</h2>
        <p>${message}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is a test email sent from Habit Tracker
        </p>
      </div>
    `;

    await sendEmail({
      to,
      subject,
      html,
    });

    res.json({ 
      success: true,
      message: 'Test email sent successfully!' 
    });
  } catch (error) {
    console.error('Send test email error:', error);
    res.status(500).json({ 
      message: 'Failed to send email',
      error: error.message 
    });
  }
};

// @desc    Send welcome email to user
// @route   POST /api/email/welcome
// @access  Private
const sendWelcome = async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({ 
        message: 'Please provide email and name' 
      });
    }

    await sendWelcomeEmail(email, name);

    res.json({ 
      success: true,
      message: 'Welcome email sent successfully!' 
    });
  } catch (error) {
    console.error('Send welcome email error:', error);
    res.status(500).json({ 
      message: 'Failed to send welcome email',
      error: error.message 
    });
  }
};

// @desc    Send habit reminder email
// @route   POST /api/email/reminder
// @access  Private
const sendReminder = async (req, res) => {
  try {
    const { email, name, habitName, currentStreak } = req.body;

    if (!email || !name || !habitName) {
      return res.status(400).json({ 
        message: 'Please provide email, name, and habitName' 
      });
    }

    await sendHabitReminderEmail(email, name, habitName, currentStreak || 0);

    res.json({ 
      success: true,
      message: 'Habit reminder email sent successfully!' 
    });
  } catch (error) {
    console.error('Send reminder email error:', error);
    res.status(500).json({ 
      message: 'Failed to send reminder email',
      error: error.message 
    });
  }
};

// @desc    Send custom email with template
// @route   POST /api/email/custom
// @access  Private
const sendCustomEmail = async (req, res) => {
  try {
    const { to, subject, html, text } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        message: 'Please provide to, subject, and html' 
      });
    }

    await sendEmail({
      to,
      subject,
      html,
      text,
    });

    res.json({ 
      success: true,
      message: 'Custom email sent successfully!' 
    });
  } catch (error) {
    console.error('Send custom email error:', error);
    res.status(500).json({ 
      message: 'Failed to send custom email',
      error: error.message 
    });
  }
};

module.exports = {
  sendTestEmail,
  sendWelcome,
  sendReminder,
  sendCustomEmail,
};
