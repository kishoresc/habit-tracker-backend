const mongoose = require('mongoose');

const smtpSettingsSchema = new mongoose.Schema({
  host: {
    type: String,
    required: true,
    default: 'smtp.gmail.com',
  },
  port: {
    type: Number,
    required: true,
    default: 587,
  },
  secure: {
    type: Boolean,
    default: false,
  },
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  fromEmail: {
    type: String,
    required: true,
  },
  fromName: {
    type: String,
    required: true,
    default: 'Habit Tracker',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Only allow one SMTP settings document
smtpSettingsSchema.statics.getSetting = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings
    settings = await this.create({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromEmail: '',
      fromName: 'Habit Tracker',
    });
  }
  return settings;
};

module.exports = mongoose.model('SmtpSettings', smtpSettingsSchema);
