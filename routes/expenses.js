const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const authMiddleware=require('../middleware/auth')

// Simple auth middleware for now
// const authMiddleware = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
//     if (!token) {
//       return res.status(401).json({ message: 'No token provided' });
//     }
//     req.userId = 'temp-user-id'; // Replace with actual user ID from token
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// Get all expenses for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.userId })
      .populate('category')
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error while fetching expenses' });
  }
});

// Add expense
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { amount, description, date, category } = req.body;
    
    const expense = await Expense.create({
      amount,
      description: description || '',
      date: date || new Date(),
      category,
      user: req.userId
    });

    // Check budget status
    const expenseDate = new Date(date || new Date());
    const month = expenseDate.toISOString().slice(0, 7);
    
    const budget = await Budget.findOne({
      user: req.userId,
      category,
      month
    });

    const monthlyExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.userId,
          category: expense.category,
          date: {
            $gte: new Date(expenseDate.getFullYear(), expenseDate.getMonth(), 1),
            $lt: new Date(expenseDate.getFullYear(), expenseDate.getMonth() + 1, 1)
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = monthlyExpenses[0]?.total || 0;
    const isOverBudget = budget && totalSpent > budget.amount;

    const populatedExpense = await Expense.findById(expense._id).populate('category');

    res.status(201).json({
      expense: populatedExpense,
      budgetStatus: {
        isOverBudget,
        totalSpent,
        budgetAmount: budget?.amount || 0,
        remaining: budget ? budget.amount - totalSpent : null
      }
    });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ message: 'Server error while adding expense' });
  }
});

// Get expenses by month
router.get('/month/:month', authMiddleware, async (req, res) => {
  try {
    const { month } = req.params;
    const startDate = new Date(month + '-01');
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    const expenses = await Expense.find({
      user: req.userId,
      date: { $gte: startDate, $lt: endDate }
    }).populate('category');
  console.log(expenses,'expenses')
    res.json(expenses);
  } catch (error) {
    console.error('Get monthly expenses error:', error);
    res.status(500).json({ message: 'Server error while fetching monthly expenses' });
  }
});

module.exports = router;