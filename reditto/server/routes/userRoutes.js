const express = require('express');
const router = express.Router();
const {
  updateUser,
  getUserById,
  getUserByUsername,
  deleteUser
} = require('../controllers/userController');
const {
  validateUserUpdate,
  validateObjectId,
  authenticateToken
} = require('../middleware/validation');

// Get user by username
router.get('/username/:username', getUserByUsername);

// Get user by ID
router.get('/:userId', validateObjectId('userId'), getUserById);

// Update user (protected)
router.put('/:userId', authenticateToken, validateObjectId('userId'), validateUserUpdate, updateUser);

// Delete user (protected)
router.delete('/:userId', authenticateToken, validateObjectId('userId'), deleteUser);

module.exports = router;
