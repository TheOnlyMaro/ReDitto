const express = require('express');
const router = express.Router();
const { generatePostSummary } = require('../controllers/aiController');

// POST /api/ai/summary/:postId - Generate AI summary for a post
router.post('/summary/:postId', generatePostSummary);

// Also allow GET for convenience (no body needed)
router.get('/summary/:postId', generatePostSummary);

module.exports = router;
