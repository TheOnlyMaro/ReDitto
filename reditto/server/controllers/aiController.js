const { GoogleGenerativeAI } = require('@google/generative-ai');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Initialize Gemini client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
};

/**
 * Recursively builds a nested comment tree from flat comment list
 * @param {Array} comments - Flat array of all comments
 * @param {String|null} parentId - Parent comment ID to filter by
 * @returns {Array} Nested comment tree
 */
const buildCommentTree = (comments, parentId = null) => {
  return comments
    .filter(c => {
      const cParent = c.parentComment ? c.parentComment.toString() : null;
      const pId = parentId ? parentId.toString() : null;
      return cParent === pId;
    })
    .map(comment => ({
      id: comment._id.toString(),
      author: comment.author?.username || '[deleted]',
      content: comment.flags?.isDeleted ? '[deleted]' : comment.content,
      voteCount: comment.voteCount || 0,
      createdAt: comment.createdAt,
      replies: buildCommentTree(comments, comment._id),
    }));
};

/**
 * Fetches a post with ALL comments (no pagination) and builds nested tree
 * @param {String} postId - MongoDB ObjectId of the post
 * @returns {Object} Post with nested comments
 */
const getPostWithAllComments = async (postId) => {
  // Fetch the post
  const post = await Post.findById(postId)
    .populate('author', 'username displayName')
    .populate('community', 'name');

  if (!post) {
    return null;
  }

  // Fetch ALL comments for this post (no pagination)
  const comments = await Comment.find({ post: postId })
    .populate('author', 'username')
    .sort({ createdAt: 1 }); // oldest first for context

  // Build nested comment tree
  const commentTree = buildCommentTree(comments, null);

  return {
    post: {
      id: post._id.toString(),
      title: post.title,
      content: post.content || '',
      author: post.author?.username || '[deleted]',
      community: post.community?.name || 'unknown',
      type: post.type,
      voteCount: post.voteCount || 0,
      commentCount: post.commentCount || 0,
      createdAt: post.createdAt,
      isDeleted: post.flags?.isDeleted || false,
    },
    comments: commentTree,
  };
};

/**
 * Formats the post and comments into a structured text for the AI
 * @param {Object} data - Post data with nested comments
 * @returns {String} Formatted text for AI processing
 */
const formatPostForAI = (data) => {
  const { post, comments } = data;

  let text = `=== REDDIT-STYLE POST ===\n`;
  text += `Community: r/${post.community}\n`;
  text += `Title: ${post.title}\n`;
  text += `Author: u/${post.author}\n`;
  // Guard against missing `votes` structure on older posts — fall back to `voteCount` if available
  const upvotesCount = post.votes?.upvotes?.length ?? post.voteCount ?? 0;
  const downvotesCount = post.votes?.downvotes?.length ?? 0;
  text += `Votes: upvotes: ${upvotesCount}, downvotes: ${downvotesCount} | | Comments count: ${post.commentCount}\n`;
  text += `Posted: ${new Date(post.createdAt).toISOString()}\n\n`;

  if (post.content) {
    text += `--- POST CONTENT ---\n${post.content}\n\n`;
  }

  text += `=== COMMENTS SECTION ===\n`;
  text += `(Comments are nested - replies are indented under their parent comment)\n\n`;

  const formatComments = (commentList, depth = 0) => {
    let result = '';
    const indent = '  '.repeat(depth);
    const prefix = depth === 0 ? '📝' : '↳';

    for (const comment of commentList) {
      result += `${indent}${prefix} [u/${comment.author}] (${comment.voteCount} votes):\n`;
      result += `${indent}   ${comment.content}\n\n`;

      if (comment.replies && comment.replies.length > 0) {
        result += formatComments(comment.replies, depth + 1);
      }
    }
    return result;
  };

  if (comments.length === 0) {
    text += '(No comments yet)\n';
  } else {
    text += formatComments(comments);
  }

  return text;
};

/**
 * Generate AI summary for a post
 * POST /api/ai/summary/:postId
 */
const generatePostSummary = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Fetch post with all comments
    const postData = await getPostWithAllComments(postId);

    if (!postData) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Format for AI
    const formattedContent = formatPostForAI(postData);

    // Log the formatted content being sent to the LLM
    console.log('\n========================================');
    console.log('📤 MESSAGE BEING SENT TO GEMINI LLM:');
    console.log('========================================');
    console.log(formattedContent);
    console.log('========================================\n');

    // Initialize Gemini
    let genAI;
    try {
      genAI = getGeminiClient();
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // System prompt for summarization
    const systemPrompt = `You are asked to summarize for Reddit-style discussions. 

Task:
Analyze the provided post and comments to generate a concise, high-impact summary. 

Guidelines:
1. Dynamic Structure: Do not use hardcoded headers. Create your own relevant headers based on the specific content of the thread.
2. Content Focus: Briefly capture the main topic, the dominant sentiments/debates, and any unique insights or takeaways. 
3. Brevity is Key: Avoid fluff. Keep the summary short and scannable. Summary should NEVER be longer than the original content (compare size only to Title, Content, Comments. not the formatting ascii). for short posts with few comments, a single paragraph may suffice, or even a sentence if too short. for longer discussions, use short sections with headers. even with longer posts, keep the summary concise.
4. Signature: You MUST end the final response with 3 linebreaks then exactly: "ReDitto, your favourite social media app - by TheMaro"

Summarize the following text:`;

    // Generate summary
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            { text: `\n\nPlease summarize the following Reddit-style post and its comment discussion:\n\n${formattedContent}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const response = result.response;
    const summary = response.text();

    res.status(200).json({
      success: true,
      postId: postData.post.id,
      postTitle: postData.post.title,
      commentCount: postData.post.commentCount,
      summary,
      // Include metadata for debugging/transparency
      meta: {
        model: 'gemini-2.5-flash',
        generatedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({
      error: 'Failed to generate summary',
      details: error.message
    });
  }
};

module.exports = {
  generatePostSummary,
  getPostWithAllComments, // Export for potential reuse
  buildCommentTree,
};
