const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  validate
];

const memberValidation = [
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('email').optional().isEmail().normalizeEmail(),
  validate
];

const paymentValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  body('currency').optional().isIn(['EUR']).withMessage('Only EUR supported'),
  validate
];

const contentValidation = [
  body('title').notEmpty().withMessage('Title required'),
  body('slug').trim().notEmpty().withMessage('Slug required'),
  validate
];

const uuidParam = [
  param('id').isUUID(4).withMessage('Valid UUID required'),
  validate
];

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
];

module.exports = {
  validate,
  loginValidation,
  registerValidation,
  memberValidation,
  paymentValidation,
  contentValidation,
  uuidParam,
  paginationQuery
};
