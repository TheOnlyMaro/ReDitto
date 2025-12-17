const express = require('express');
const router = express.Router();
const {
  createPost,
  getPostById,
  getPosts,
  updatePost,
  deletePost,
  upvotePost,
  downvotePost,
  removeVote
} = require('../controllers/postController');
const { authenticateToken } = require('../middleware/validation');

// Public routes
router.get('/', getPosts);
router.get('/:postId', getPostById);

// Protected routes
router.post('/', authenticateToken, createPost);
router.put('/:postId', authenticateToken, updatePost);
router.delete('/:postId', authenticateToken, deletePost);

// Voting routes
router.post('/:postId/upvote', authenticateToken, upvotePost);
router.post('/:postId/downvote', authenticateToken, downvotePost);
router.delete('/:postId/vote', authenticateToken, removeVote);

module.exports = router;
