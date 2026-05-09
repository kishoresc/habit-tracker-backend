const Habit = require('../models/Habit');
const User = require('../models/User');

// @desc    Get all habits for user
// @route   GET /api/habits
// @access  Private
const getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Update streaks for all habits
    for (let habit of habits) {
      habit.updateStreak();
      await habit.save();
    }

    res.json(habits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new habit
// @route   POST /api/habits
// @access  Private
const createHabit = async (req, res) => {
  try {
    const { name, description, category, dailyTarget, emailReminderEnabled, emailReminderTime } = req.body;

    const habit = await Habit.create({
      userId: req.user._id,
      name,
      description: description || '',
      category,
      dailyTarget: dailyTarget || 1,
      emailReminderEnabled: emailReminderEnabled || false,
      emailReminderTime: emailReminderTime || null,
    });

    res.status(201).json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update habit completion status
// @route   PUT /api/habits/:id/complete
// @access  Private
const updateHabitCompletion = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already completed today
    const existingEntry = habit.completionHistory.find(entry => {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });

    if (existingEntry) {
      // Prevent unchecking if already completed
      if (existingEntry.completed) {
        return res.status(400).json({ message: 'Cannot unmark a completed habit' });
      }
      existingEntry.completed = true;
    } else {
      habit.completionHistory.push({
        date: today,
        completed: true,
      });
    }

    // Update streak
    habit.updateStreak();

    await habit.save();

    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete habit
// @route   DELETE /api/habits/:id
// @access  Private
const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await habit.deleteOne();

    res.json({ message: 'Habit removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle habit active/inactive status
// @route   PUT /api/habits/:id/status
// @access  Private
const toggleHabitStatus = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    habit.isActive = req.body.isActive;
    await habit.save();

    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update habit reminder settings
// @route   PUT /api/habits/:id/reminder
// @access  Private
const updateHabitReminder = async (req, res) => {
  try {
    const habit = await Habit.findById(req.params.id);

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Check if habit belongs to user
    if (habit.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { emailReminderEnabled, emailReminderTime } = req.body;

    habit.emailReminderEnabled = emailReminderEnabled;
    habit.emailReminderTime = emailReminderTime || null;

    await habit.save();

    res.json(habit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get habit statistics
// @route   GET /api/habits/stats
// @access  Private
const getHabitStats = async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.user._id });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalHabits = habits.length;
    let completedToday = 0;
    let totalStreak = 0;

    habits.forEach(habit => {
      habit.updateStreak();
      if (habit.isCompletedToday()) {
        completedToday++;
      }
      totalStreak += habit.currentStreak;
    });

    // Calculate weekly completion percentage
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    let weeklyCompletions = 0;
    let weeklyPossible = habits.length * 7;

    habits.forEach(habit => {
      const weekCompletions = habit.completionHistory.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekAgo && entry.completed;
      });
      weeklyCompletions += weekCompletions.length;
    });

    const weeklyPercentage = weeklyPossible > 0 
      ? Math.round((weeklyCompletions / weeklyPossible) * 100) 
      : 0;

    res.json({
      totalHabits,
      completedToday,
      averageStreak: totalHabits > 0 ? Math.round(totalStreak / totalHabits) : 0,
      weeklyPercentage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getHabits,
  createHabit,
  updateHabitCompletion,
  deleteHabit,
  toggleHabitStatus,
  updateHabitReminder,
  getHabitStats,
};
