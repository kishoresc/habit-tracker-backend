const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendWelcomeEmail } = require('../utils/emailService');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, timezone } = req.body;

    console.log('Registration attempt:', { name, email, timezone });

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (role defaults to 'user' in model)
    const user = await User.create({
      name,
      email,
      password,
      timezone: timezone || 'UTC', // Default to UTC if not provided
    });

    if (user) {
      // Send welcome email (don't wait for it, don't fail registration if it fails)
      sendWelcomeEmail(user.email, user.name).catch(error => {
        console.error('Failed to send welcome email:', error.message);
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.comparePassword(password))) {
      // Update last active
      user.lastActive = Date.now();
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        notificationEnabled: user.notificationEnabled,
        timezone: user.timezone,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastActive: user.lastActive,
      notificationEnabled: user.notificationEnabled,
      timezone: user.timezone,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update notification preference
// @route   PUT /api/auth/notification
// @access  Private
const updateNotificationPreference = async (req, res) => {
  try {
    const { notificationEnabled } = req.body;

    const user = await User.findById(req.user._id);

    if (user) {
      user.notificationEnabled = notificationEnabled;
      await user.save();

      res.json({
        message: 'Notification preference updated',
        notificationEnabled: user.notificationEnabled,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, timezone } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Update fields if provided
    if (name) user.name = name;
    if (timezone) user.timezone = timezone;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
        notificationEnabled: user.notificationEnabled,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateNotificationPreference,
  updateProfile,
};
