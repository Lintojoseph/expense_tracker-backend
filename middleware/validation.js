const { validationResult } = require('express-validator');

// Validation error handler middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// Common validation rules
const commonValidations = {
  email: {
    isEmail: true,
    normalizeEmail: true,
    errorMessage: 'Please provide a valid email address'
  },
  
  password: {
    isLength: {
      options: { min: 6 },
      errorMessage: 'Password must be at least 6 characters long'
    }
  },
  
  name: {
    notEmpty: true,
    trim: true,
    isLength: {
      options: { max: 100 },
      errorMessage: 'Name must not exceed 100 characters'
    },
    errorMessage: 'Name is required'
  },
  
  amount: {
    isFloat: {
      options: { min: 0.01 },
      errorMessage: 'Amount must be a positive number'
    },
    toFloat: true
  },
  
  date: {
    isISO8601: true,
    toDate: true,
    errorMessage: 'Please provide a valid date'
  },
  
  color: {
    optional: true,
    matches: {
      options: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/],
      errorMessage: 'Color must be a valid hex color code'
    }
  },
  
  month: {
    matches: {
      options: [/^\d{4}-\d{2}$/],
      errorMessage: 'Month must be in YYYY-MM format'
    }
  }
};

module.exports = {
  handleValidationErrors,
  commonValidations
};