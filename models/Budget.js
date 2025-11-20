const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  month: {
    type: String, // Format: YYYY-MM
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

budgetSchema.index({ month: 1, category: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);