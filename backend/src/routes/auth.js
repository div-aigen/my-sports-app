const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/signup
router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').notEmpty().withMessage('Full name is required'),
    body('phone_number').optional().isMobilePhone(),
  ],
  authController.signup
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  authController.login
);

// GET /api/auth/me
router.get('/me', authenticateToken, authController.getMe);

// PUT /api/auth/profile
router.put(
  '/profile',
  authenticateToken,
  [
    body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('phone_number').optional().isMobilePhone(),
  ],
  authController.updateProfile
);

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticateToken,
  [
    body('old_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  authController.changePassword
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  authController.forgotPassword
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('token').trim().notEmpty().withMessage('Reset code is required'),
    body('new_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  authController.resetPassword
);

module.exports = router;
