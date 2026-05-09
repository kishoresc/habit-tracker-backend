const mongoose = require('mongoose');

const completionHistorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
});

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please provide a habit name'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Health', 'Fitness', 'Learning', 'Productivity', 'Mindfulness', 'Other'],
    default: 'Other',
  },
  dailyTarget: {
    type: Number,
    default: 1,
    min: 1,
  },
  currentStreak: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  completionHistory: [completionHistorySchema],
  isActive: {
    type: Boolean,
    default: true,
  },
  emailReminderEnabled: {
    type: Boolean,
    default: false,
  },
  emailReminderTime: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Method to check if habit is completed today
habitSchema.methods.isCompletedToday = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCompletion = this.completionHistory.find(entry => {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  });
  
  return todayCompletion ? todayCompletion.completed : false;
};

// Method to update streak
habitSchema.methods.updateStreak = function () {
  if (this.completionHistory.length === 0) {
    this.currentStreak = 0;
    return;
  }

  // Sort by date descending
  const sortedHistory = this.completionHistory
    .filter(entry => entry.completed)
    .sort((a, b) => b.date - a.date);

  if (sortedHistory.length === 0) {
    this.currentStreak = 0;
    return;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedHistory.length; i++) {
    const entryDate = new Date(sortedHistory[i].date);
    entryDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  this.currentStreak = streak;
  
  if (streak > this.longestStreak) {
    this.longestStreak = streak;
  }
};

module.exports = mongoose.model('Habit', habitSchema);
