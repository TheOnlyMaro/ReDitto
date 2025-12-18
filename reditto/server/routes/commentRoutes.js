const express = require('express');
const router = express.Router();
const {
  createComment,
  getCommentsByPost,
  getCommentById,
  updateComment,
  deleteComment,
  upvoteComment,
  downvoteComment,
  removeVote
} = require('../controllers/commentController');
const { 
  authenticateToken, 
  validateCommentCreation,
  validateCommentUpdate 
} = require('../middleware/validation');

// Public routes
router.get('/post/:postId', getCommentsByPost); // Get all comments for a post
router.get('/:commentId', getCommentById);      // Get specific comment

// Protected routes
router.post('/', authenticateToken, validateCommentCreation, createComment);
router.put('/:commentId', authenticateToken, validateCommentUpdate, updateComment);
router.delete('/:commentId', authenticateToken, deleteComment);

// Voting routes
router.post('/:commentId/upvote', authenticateToken, upvoteComment);
router.post('/:commentId/downvote', authenticateToken, downvoteComment);
router.delete('/:commentId/vote', authenticateToken, removeVote);

module.exports = router;
