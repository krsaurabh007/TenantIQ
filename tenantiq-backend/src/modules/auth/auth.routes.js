const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMe } = require('./auth.controller');
const { authenticate } = require('../../middleware/auth');
const { body } = require('express-validator');

const registerValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('name').trim().notEmpty().withMessage('Your name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;