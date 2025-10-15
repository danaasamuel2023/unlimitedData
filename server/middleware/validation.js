const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Custom validation functions
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

const isValidPhoneNumber = (value) => {
  const phoneRegex = /^(\+233|0)[0-9]{9}$/;
  return phoneRegex.test(value);
};

const isValidEmail = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

const isValidNetwork = (value) => {
  const validNetworks = ['YELLO', 'TELECEL', 'AT_PREMIUM', 'airteltigo', 'at'];
  return validNetworks.includes(value);
};

const isValidCapacity = (value) => {
  const validCapacities = ['1', '2', '3', '4', '5', '6', '8', '10', '12', '15', '20', '25', '30', '40', '50', '100'];
  return validCapacities.includes(value.toString());
};

// Validation middleware wrapper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('phoneNumber')
    .custom(isValidPhoneNumber)
    .withMessage('Please provide a valid Ghana phone number'),
  
  body('referredBy')
    .optional()
    .isLength({ min: 6, max: 6 })
    .withMessage('Referral code must be 6 characters long'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Data purchase validation
const validateDataPurchase = [
  body('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  body('phoneNumber')
    .custom(isValidPhoneNumber)
    .withMessage('Please provide a valid Ghana phone number'),
  
  body('network')
    .custom(isValidNetwork)
    .withMessage('Invalid network selected'),
  
  body('capacity')
    .custom(isValidCapacity)
    .withMessage('Invalid data capacity selected'),
  
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  
  handleValidationErrors
];

// Deposit validation
const validateDeposit = [
  body('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  body('amount')
    .isFloat({ min: 1, max: 50000 })
    .withMessage('Amount must be between 1 and 50,000 GHS'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

// Password reset validation
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

// OTP verification validation
const validateOtpVerification = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

// User ID parameter validation
const validateUserId = [
  param('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  handleValidationErrors
];

// Order ID parameter validation
const validateOrderId = [
  param('orderId')
    .custom(isValidObjectId)
    .withMessage('Invalid order ID format'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  handleValidationErrors
];

// SMS validation
const validateSms = [
  body('phoneNumbers')
    .isArray({ min: 1 })
    .withMessage('Phone numbers must be an array with at least one number'),
  
  body('phoneNumbers.*')
    .custom(isValidPhoneNumber)
    .withMessage('Each phone number must be a valid Ghana phone number'),
  
  body('message')
    .trim()
    .isLength({ min: 1, max: 160 })
    .withMessage('Message must be between 1 and 160 characters'),
  
  body('senderId')
    .optional()
    .isLength({ min: 1, max: 11 })
    .withMessage('Sender ID must be between 1 and 11 characters'),
  
  handleValidationErrors
];

// Phone verification validation
const validatePhoneVerification = [
  body('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  body('serviceName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),
  
  body('capability')
    .optional()
    .isIn(['sms', 'voice'])
    .withMessage('Capability must be either sms or voice'),
  
  handleValidationErrors
];

// Admin operations validation
const validateAdminOperation = [
  body('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must be less than 500 characters'),
  
  handleValidationErrors
];

// Bulk operations validation
const validateBulkOperation = [
  body('userId')
    .custom(isValidObjectId)
    .withMessage('Invalid user ID format'),
  
  body('orders')
    .isArray({ min: 1, max: 50 })
    .withMessage('Orders must be an array with 1-50 items'),
  
  body('orders.*.phoneNumber')
    .custom(isValidPhoneNumber)
    .withMessage('Each phone number must be a valid Ghana phone number'),
  
  body('orders.*.network')
    .custom(isValidNetwork)
    .withMessage('Each network must be valid'),
  
  body('orders.*.capacity')
    .custom(isValidCapacity)
    .withMessage('Each capacity must be valid'),
  
  body('orders.*.price')
    .isFloat({ min: 0.01 })
    .withMessage('Each price must be a positive number'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateDataPurchase,
  validateDeposit,
  validatePasswordReset,
  validateOtpVerification,
  validateUserId,
  validateOrderId,
  validatePagination,
  validateDateRange,
  validateSms,
  validatePhoneVerification,
  validateAdminOperation,
  validateBulkOperation,
  handleValidationErrors,
  isValidObjectId,
  isValidPhoneNumber,
  isValidEmail,
  isValidNetwork,
  isValidCapacity
};
