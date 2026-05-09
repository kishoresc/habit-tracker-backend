const User = require('../models/User');
const Habit = require('../models/Habit');

// @desc    Get all users (Master Admin only)
// @route   GET /api/admin/users
// @access  Private/MasterAdmin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Get habit counts for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const habitCount = await Habit.countDocuments({ userId: user._id });
        const habits = await Habit.find({ userId: user._id });
        
        // Calculate total completions
        let totalCompletions = 0;
        habits.forEach(habit => {
          totalCompletions += habit.completionHistory.filter(h => h.completed).length;
        });

        // Calculate active streaks
        const activeStreaks = habits.filter(h => h.currentStreak > 0).length;

        return {
          ...user.toObject(),
          stats: {
            totalHabits: habitCount,
            totalCompletions,
            activeStreaks,
          },
        };
      })
    );

    res.json({
      users: usersWithStats,
      totalUsers: usersWithStats.length,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user analytics (Master Admin only)
// @route   GET /api/admin/analytics
// @access  Private/MasterAdmin
const getUserAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalHabits = await Habit.countDocuments();
    
    // Get all habits to calculate completions
    const allHabits = await Habit.find();
    let totalCompletions = 0;
    allHabits.forEach(habit => {
      totalCompletions += habit.completionHistory.filter(h => h.completed).length;
    });

    // Get users registered in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.countDocuments({
      role: 'user',
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get active users (logged in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await User.countDocuments({
      role: 'user',
      lastActive: { $gte: sevenDaysAgo },
    });

    // Get habits by category
    const habitsByCategory = await Habit.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalUsers,
      totalHabits,
      totalCompletions,
      newUsersLast30Days,
      activeUsers,
      habitsByCategory,
      averageHabitsPerUser: totalUsers > 0 ? (totalHabits / totalUsers).toFixed(2) : 0,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user (Master Admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/MasterAdmin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'masterAdmin') {
      return res.status(403).json({ message: 'Cannot delete master admin' });
    }

    // Delete user's habits
    await Habit.deleteMany({ userId: user._id });

    // Delete user
    await user.deleteOne();

    res.json({ message: 'User and associated habits deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's habits (Master Admin only)
// @route   GET /api/admin/users/:id/habits
// @access  Private/MasterAdmin
const getUserHabits = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const habits = await Habit.find({ userId: user._id }).sort({ createdAt: -1 });

    res.json(habits);
  } catch (error) {
    console.error('Get user habits error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  getUserAnalytics,
  deleteUser,
  getUserHabits,
};
