const SmtpSettings = require('../models/SmtpSettings');

// @desc    Get SMTP settings (Master Admin only)
// @route   GET /api/smtp
// @access  Private/MasterAdmin
const getSmtpSettings = async (req, res) => {
  try {
    const settings = await SmtpSettings.getSetting();
    
    // Don't send password to frontend
    const settingsObj = settings.toObject();
    delete settingsObj.password;

    res.json(settingsObj);
  } catch (error) {
    console.error('Get SMTP settings error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update SMTP settings (Master Admin only)
// @route   PUT /api/smtp
// @access  Private/MasterAdmin
const updateSmtpSettings = async (req, res) => {
  try {
    const { host, port, secure, username, password, fromEmail, fromName } = req.body;

    let settings = await SmtpSettings.findOne();

    if (!settings) {
      // Create new settings
      settings = await SmtpSettings.create({
        host,
        port,
        secure,
        username,
        password: password ? password.replace(/\s/g, '') : password, // Remove all spaces
        fromEmail,
        fromName,
        updatedBy: req.user._id,
      });
    } else {
      // Update existing settings
      settings.host = host || settings.host;
      settings.port = port || settings.port;
      settings.secure = secure !== undefined ? secure : settings.secure;
      settings.username = username || settings.username;
      
      // Only update password if provided
      if (password) {
        // Trim spaces and remove all whitespace from password
        settings.password = password.replace(/\s/g, '');
      }
      
      settings.fromEmail = fromEmail || settings.fromEmail;
      settings.fromName = fromName || settings.fromName;
      settings.updatedBy = req.user._id;
      settings.updatedAt = Date.now();

      await settings.save();
    }

    // Don't send password back
    const settingsObj = settings.toObject();
    delete settingsObj.password;

    res.json({
      message: 'SMTP settings updated successfully',
      settings: settingsObj,
    });
  } catch (error) {
    console.error('Update SMTP settings error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Test SMTP connection (Master Admin only)
// @route   POST /api/smtp/test
// @access  Private/MasterAdmin
const testSmtpConnection = async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const settings = await SmtpSettings.getSetting();

    if (!settings.username || !settings.password) {
      return res.status(400).json({ message: 'SMTP credentials not configured' });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.username,
        pass: settings.password,
      },
    });

    // Verify connection
    await transporter.verify();

    res.json({ message: 'SMTP connection successful!' });
  } catch (error) {
    console.error('SMTP test error:', error);
    res.status(500).json({ 
      message: 'SMTP connection failed', 
      error: error.message 
    });
  }
};

module.exports = {
  getSmtpSettings,
  updateSmtpSettings,
  testSmtpConnection,
};
