const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserAnalytics,
  deleteUser,
  getUserHabits,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isMasterAdmin } = require('../middleware/isMasterAdmin');

// All routes require authentication and master admin role
router.use(protect);
router.use(isMasterAdmin);

// @route   GET /api/admin/users
// @desc    Get all users with their stats
// @access  Private/MasterAdmin
router.get('/users', getAllUsers);

// @route   GET /api/admin/analytics
// @desc    Get platform-wide analytics
// @access  Private/MasterAdmin
router.get('/analytics', getUserAnalytics);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and their habits
// @access  Private/MasterAdmin
router.delete('/users/:id', deleteUser);

// @route   GET /api/admin/users/:id/habits
// @desc    Get all habits for a specific user
// @access  Private/MasterAdmin
router.get('/users/:id/habits', getUserHabits);

module.exports = router;
