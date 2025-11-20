const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Category = require('../models/Category');
const authMiddleware=require('../middleware/auth')

// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     if (!token) {
//       return res.status(401).json({ message: 'No token provided' });
//     }
//     req.userId = 'temp-user-id';
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// Get monthly report
router.get('/monthly/:month', authMiddleware, async (req, res) => {
  try {
    const { month } = req.params;
    
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: 'Month must be in YYYY-MM format' });
    }

    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    const categories = await Category.find({ user: req.userId });
    const budgets = await Budget.find({ user: req.userId, month }).populate('category');
    const expenses = await Expense.find({ user: req.userId, date: { $gte: startDate, $lt: endDate } }).populate('category');

    const categorySpending = await Expense.aggregate([
      {
        $match: {
          user: req.userId,
          date: { $gte: startDate, $lt: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' }
        }
      }
    ]);

    const reportData = categories.map(category => {
      const budget = budgets.find(b => b.category._id.toString() === category._id.toString());
      const spending = categorySpending.find(s => s._id.toString() === category._id.toString());
      
      const spent = spending ? spending.totalSpent : 0;
      const budgetAmount = budget ? budget.amount : 0;
      const remaining = budgetAmount - spent;

      return {
        category: {
          _id: category._id,
          name: category.name,
          color: category.color
        },
        spent: parseFloat(spent.toFixed(2)),
        budget: parseFloat(budgetAmount.toFixed(2)),
        remaining: parseFloat(remaining.toFixed(2)),
        isOverBudget: remaining < 0
      };
    });

    const totalSpent = reportData.reduce((sum, item) => sum + item.spent, 0);
    const totalBudget = reportData.reduce((sum, item) => sum + item.budget, 0);
    const totalRemaining = reportData.reduce((sum, item) => sum + item.remaining, 0);

    res.json({
      month,
      reportData,
      summary: {
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        totalBudget: parseFloat(totalBudget.toFixed(2)),
        totalRemaining: parseFloat(totalRemaining.toFixed(2)),
        isOverallOverBudget: totalRemaining < 0
      },
      expenses
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ message: 'Server error while generating report' });
  }
});

module.exports = router;