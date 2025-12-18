const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new comment
const createComment = async (req, res) => {
  try {
    const { content, post, parentComment } = req.body;
    const authorId = req.user.userId;

    // Verify post exists and is not deleted
    const postDoc = await Post.findById(post);
    if (!postDoc) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (postDoc.flags.isDeleted) {
      return res.status(400).json({ error: 'Cannot comment on deleted post' });
    }

    // If parent comment is provided, verify it exists and belongs to the same post
    if (parentComment) {
      const parentCommentDoc = await Comment.findById(parentComment);
      if (!parentCommentDoc) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }

      if (parentCommentDoc.post.toString() !== post) {
        return res.status(400).json({ error: 'Parent comment does not belong to this post' });
      }

      if (parentCommentDoc.flags.isDeleted) {
        return res.status(400).json({ error: 'Cannot reply to deleted comment' });
      }

      // Increment reply count on parent comment
      parentCommentDoc.replyCount += 1;
      await parentCommentDoc.save();
    }

    // Create comment
    const comment = new Comment({
      content,
      author: authorId,
      post,
      parentComment: parentComment || null
    });

    await comment.save();

    // Increment comment count on post
    postDoc.commentCount += 1;
    await postDoc.save();

    // Populate references
    await comment.populate('author', 'username displayName avatar');
    await comment.populate('post', 'title');
    if (parentComment) {
      await comment.populate('parentComment', 'content author');
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ 
      error: 'Failed to create comment',
      details: error.message 
    });
  }
};

// Get comments for a post
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Verify post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'createdAt'; // 'createdAt', 'voteCount'
    const parentCommentId = req.query.parentComment;

    // Build query
    const query = {
      post: postId,
      'flags.isDeleted': false
    };

    // Filter by parent comment (for replies) or top-level comments
    if (parentCommentId) {
      query.parentComment = parentCommentId;
    } else {
      query.parentComment = null;
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'voteCount') {
      sortOptions.voteCount = -1;
      sortOptions.createdAt = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Get comments with pagination
    const comments = await Comment.find(query)
      .populate('author', 'username displayName avatar karma')
      .populate('parentComment', 'content author')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit);

    // Get total count
    const totalComments = await Comment.countDocuments(query);

    res.status(200).json({
      comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalComments / limit),
        totalComments,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      details: error.message 
    });
  }
};

// Get comment by ID
const getCommentById = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId)
      .populate('author', 'username displayName avatar karma')
      .populate('post', 'title')
      .populate('parentComment', 'content author');

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Don't return deleted comments unless requester is the author
    if (comment.flags.isDeleted) {
      const requesterId = req.user?.userId;
      if (!requesterId || comment.author._id.toString() !== requesterId) {
        return res.status(404).json({ error: 'Comment not found' });
      }
    }

    res.status(200).json({ comment });
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comment',
      details: error.message 
    });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    if (comment.flags.isDeleted) {
      return res.status(400).json({ error: 'Cannot edit deleted comment' });
    }

    // Update comment
    comment.content = content;
    comment.flags.isEdited = true;
    comment.editedAt = Date.now();
    await comment.save();

    await comment.populate('author', 'username displayName avatar');
    await comment.populate('post', 'title');

    res.status(200).json({
      message: 'Comment updated successfully',
      comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ 
      error: 'Failed to update comment',
      details: error.message 
    });
  }
};

// Delete comment (soft delete)
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId).populate('post');

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the author or post author or community moderator
    const post = await Post.findById(comment.post._id).populate('community');
    const community = post.community;

    const isAuthor = comment.author.toString() === userId;
    const isPostAuthor = post.author.toString() === userId;
    const isModerator = community.moderators.some(mod => mod.toString() === userId);

    if (!isAuthor && !isPostAuthor && !isModerator) {
      return res.status(403).json({ 
        error: 'You can only delete your own comments or comments on your posts, or if you are a moderator' 
      });
    }

    // Soft delete
    comment.flags.isDeleted = true;
    comment.content = '[deleted]';
    await comment.save();

    // Decrement comment count on post
    post.commentCount = Math.max(0, post.commentCount - 1);
    await post.save();

    // Decrement reply count on parent comment if exists
    if (comment.parentComment) {
      const parentComment = await Comment.findById(comment.parentComment);
      if (parentComment) {
        parentComment.replyCount = Math.max(0, parentComment.replyCount - 1);
        await parentComment.save();
      }
    }

    res.status(200).json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ 
      error: 'Failed to delete comment',
      details: error.message 
    });
  }
};

// Upvote comment
const upvoteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.flags.isDeleted) {
      return res.status(400).json({ error: 'Cannot vote on deleted comment' });
    }

    // Upvote the comment
    comment.upvote(userId);
    await comment.save();

    res.status(200).json({
      message: 'Comment upvoted successfully',
      voteCount: comment.voteCount,
      votes: {
        upvotes: comment.votes.upvotes.length,
        downvotes: comment.votes.downvotes.length
      }
    });
  } catch (error) {
    console.error('Error upvoting comment:', error);
    res.status(500).json({ 
      error: 'Failed to upvote comment',
      details: error.message 
    });
  }
};

// Downvote comment
const downvoteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.flags.isDeleted) {
      return res.status(400).json({ error: 'Cannot vote on deleted comment' });
    }

    // Downvote the comment
    comment.downvote(userId);
    await comment.save();

    res.status(200).json({
      message: 'Comment downvoted successfully',
      voteCount: comment.voteCount,
      votes: {
        upvotes: comment.votes.upvotes.length,
        downvotes: comment.votes.downvotes.length
      }
    });
  } catch (error) {
    console.error('Error downvoting comment:', error);
    res.status(500).json({ 
      error: 'Failed to downvote comment',
      details: error.message 
    });
  }
};

// Remove vote from comment
const removeVote = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Remove vote
    comment.removeVote(userId);
    await comment.save();

    res.status(200).json({
      message: 'Vote removed successfully',
      voteCount: comment.voteCount,
      votes: {
        upvotes: comment.votes.upvotes.length,
        downvotes: comment.votes.downvotes.length
      }
    });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ 
      error: 'Failed to remove vote',
      details: error.message 
    });
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
  getCommentById,
  updateComment,
  deleteComment,
  upvoteComment,
  downvoteComment,
  removeVote
};
