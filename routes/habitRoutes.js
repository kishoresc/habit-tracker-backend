const express = require('express');
const router = express.Router();
const {
  getHabits,
  createHabit,
  updateHabitCompletion,
  deleteHabit,
  toggleHabitStatus,
  updateHabitReminder,
  getHabitStats,
} = require('../controllers/habitController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getHabits).post(protect, createHabit);
router.get('/stats', protect, getHabitStats);
router.put('/:id/complete', protect, updateHabitCompletion);
router.put('/:id/status', protect, toggleHabitStatus);
router.put('/:id/reminder', protect, updateHabitReminder);
router.delete('/:id', protect, deleteHabit);

module.exports = router;
