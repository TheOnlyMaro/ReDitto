const express = require('express');
const router = express.Router();
const {
  createUser,
  updateUser,
  getUserById,
  getUserByUsername,
  deleteUser
} = require('../controllers/userController');
const {
  validateUserRegistration,
  validateUserUpdate,
  hashPassword,
  validateObjectId
} = require('../middleware/validation');

// Create a new user
router.post('/', validateUserRegistration, hashPassword, createUser);

// Get user by username
router.get('/username/:username', getUserByUsername);

// Get user by ID
router.get('/:userId', validateObjectId('userId'), getUserById);

// Update user
router.put('/:userId', validateObjectId('userId'), validateUserUpdate, updateUser);

// Delete user
router.delete('/:userId', validateObjectId('userId'), deleteUser);

module.exports = router;
