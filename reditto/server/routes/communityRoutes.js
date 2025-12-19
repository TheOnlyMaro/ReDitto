const express = require('express');
const router = express.Router();
const {
  createCommunity,
  getCommunityByName,
  getCommunities,
  updateCommunity,
  deleteCommunity,
  addModerator,
  removeModerator,
  addRule,
  addFlair
} = require('../controllers/communityController');
const { getPosts } = require('../controllers/postController');
const { authenticateToken } = require('../middleware/validation');

// Public routes
router.get('/', getCommunities);
router.get('/:name', getCommunityByName);
router.get('/:name/posts', getPosts); // Get posts for a specific community

// Protected routes
router.post('/', authenticateToken, createCommunity);
router.put('/:name', authenticateToken, updateCommunity);
router.delete('/:name', authenticateToken, deleteCommunity);

// Moderator management
router.post('/:name/moderators', authenticateToken, addModerator);
router.delete('/:name/moderators', authenticateToken, removeModerator);

// Rules and flairs
router.post('/:name/rules', authenticateToken, addRule);
router.post('/:name/flairs', authenticateToken, addFlair);

module.exports = router;
