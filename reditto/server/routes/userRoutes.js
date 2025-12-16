const express = require('express');
const router = express.Router();
const {
  createUser,
  updateUser,
  getUserById,
  getUserByUsername,
  deleteUser
} = require('../controllers/userController');

// Create a new user
router.post('/', createUser);

// Get user by username
router.get('/username/:username', getUserByUsername);

// Get user by ID
router.get('/:userId', getUserById);

// Update user
router.put('/:userId', updateUser);

// Delete user
router.delete('/:userId', deleteUser);

module.exports = router;
