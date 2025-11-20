const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const authMiddleware = require('../middleware/auth'); // Import proper auth middleware

// Get all categories for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.userId }).sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// Create new category
router.post('/', [
  authMiddleware,
  body('name').notEmpty().trim(),
  body('color').optional().isHexColor()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color = '#3B82F6' } = req.body;

    // Check if category with same name already exists for user
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      user: req.userId 
    });

    if (existingCategory) {
      return res.status(400).json({ 
        message: 'Category with this name already exists' 
      });
    }

    const category = await Category.create({
      name,
      color,
      user: req.userId // Use actual user ID from auth middleware
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error while creating category' });
  }
});

// Update category
router.put('/:id', [
  authMiddleware,
  body('name').optional().trim(),
  body('color').optional().isHexColor()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, color } = req.body;

    const category = await Category.findOne({ _id: id, user: req.userId });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check for duplicate name if name is being updated
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') }, 
        user: req.userId,
        _id: { $ne: id }
      });

      if (existingCategory) {
        return res.status(400).json({ 
          message: 'Category with this name already exists' 
        });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (color) category.color = color;

    await category.save();

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    res.status(500).json({ message: 'Server error while updating category' });
  }
});

// Delete category
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findOne({ _id: id, user: req.userId });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Category.findByIdAndDelete(id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    res.status(500).json({ message: 'Server error while deleting category' });
  }
});

module.exports = router;