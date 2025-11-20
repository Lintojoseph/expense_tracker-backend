const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
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

// Get budgets for specific month
router.get('/month/:month', authMiddleware, async (req, res) => {
  try {
    const { month } = req.params;

    const budgets = await Budget.find({ 
      user: req.userId, 
      month 
    }).populate('category');

    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error while fetching budgets' });
  }
});

// Set/update budget
router.post('/', [
  authMiddleware,
  body('month').matches(/^\d{4}-\d{2}$/),
  body('amount').isFloat({ min: 0 }),
  body('category').isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { month, amount, category } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { 
        user: req.userId, 
        category, 
        month 
      },
      { 
        amount,
        user: req.userId,
        category,
        month
      },
      { 
        new: true, 
        upsert: true
      }
    ).populate('category');

    res.json(budget);
  } catch (error) {
    console.error('Set budget error:', error);
    res.status(500).json({ message: 'Server error while setting budget' });
  }
});

module.exports = router;