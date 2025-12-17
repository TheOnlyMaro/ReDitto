const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getCurrentUser,
  refreshToken
} = require('../controllers/authController');
const {
  validateUserRegistration,
  hashPassword,
  authenticateToken
} = require('../middleware/validation');

// Register new user
router.post('/register', validateUserRegistration, hashPassword, register);

// Login user
router.post('/login', login);

// Get current user (protected)
router.get('/me', authenticateToken, getCurrentUser);

// Refresh token (protected)
router.post('/refresh', authenticateToken, refreshToken);

module.exports = router;
