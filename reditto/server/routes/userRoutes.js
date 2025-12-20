const express = require('express');
const router = express.Router();
const {
  updateUser,
  getUserById,
  getUserByUsername,
  deleteUser,
  followUser,
  unfollowUser
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

// Follow/unfollow user (protected)
router.post('/:userId/follow', authenticateToken, validateObjectId('userId'), followUser);
router.post('/:userId/unfollow', authenticateToken, validateObjectId('userId'), unfollowUser);

// Delete user (protected)
router.delete('/:userId', authenticateToken, validateObjectId('userId'), deleteUser);

module.exports = router;
