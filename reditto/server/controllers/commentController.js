const Comment = require('../models/Comment');
const Post = require('../models/Post');
const mongoose = require('mongoose');

// Helper function to update parent comment's replies array and recursively update reply counts
const updateParentReplies = async (parentCommentId, childCommentId, action = 'add') => {
  try {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) return;

    if (action === 'add') {
      // Add child to parent's replies array
      if (!parentComment.replies.includes(childCommentId)) {
        parentComment.replies.push(childCommentId);
      }
      // Increment reply count
      parentComment.replyCount += 1;
    } else if (action === 'remove') {
      // Remove child from parent's replies array
      parentComment.replies = parentComment.replies.filter(
        id => id.toString() !== childCommentId.toString()
      );
      // Decrement reply count
      parentComment.replyCount = Math.max(0, parentComment.replyCount - 1);
    }

    await parentComment.save();

    // Recursively update ancestor reply counts
    if (parentComment.parentComment) {
      await updateAncestorReplyCounts(parentComment.parentComment, action === 'add' ? 1 : -1);
    }
  } catch (error) {
    console.error('Error updating parent replies:', error);
  }
};

// Helper function to recursively update reply counts for all ancestors
const updateAncestorReplyCounts = async (commentId, delta) => {
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return;

    comment.replyCount = Math.max(0, comment.replyCount + delta);
    await comment.save();

    // Continue up the chain
    if (comment.parentComment) {
      await updateAncestorReplyCounts(comment.parentComment, delta);
    }
  } catch (error) {
    console.error('Error updating ancestor reply counts:', error);
  }
};

// Helper function to get all reply IDs recursively (for deep deletion)
const getAllReplyIds = async (commentId) => {
  const comment = await Comment.findById(commentId);
  if (!comment || comment.replies.length === 0) {
    return [];
  }

  let allReplyIds = [...comment.replies];
  
  // Recursively get replies of replies
  for (const replyId of comment.replies) {
    const nestedReplyIds = await getAllReplyIds(replyId);
    allReplyIds = allReplyIds.concat(nestedReplyIds);
  }

  return allReplyIds;
};

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
    }

    // Create comment
    const comment = new Comment({
      content,
      author: authorId,
      post,
      parentComment: parentComment || null
    });

    await comment.save();

    // If parent comment exists, add this comment to parent's replies array and update reply counts
    if (parentComment) {
      await updateParentReplies(parentComment, comment._id, 'add');
    }

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
    const includeReplies = req.query.includeReplies === 'true';

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    let comment = await Comment.findById(commentId)
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

    // Optionally include populated replies (direct children only)
    if (includeReplies && comment.replies && comment.replies.length > 0) {
      comment = await comment.populate({
        path: 'replies',
        match: { 'flags.isDeleted': false },
        populate: {
          path: 'author',
          select: 'username displayName avatar karma'
        },
        options: { sort: { createdAt: -1 } }
      });
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

// Get direct replies for a comment (paginated)
const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Validate comment ID
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sortBy = req.query.sortBy || 'createdAt';

    // Sort options
    const sortOptions = {};
    if (sortBy === 'voteCount') {
      sortOptions.voteCount = -1;
      sortOptions.createdAt = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Fetch replies from the replies array
    const totalReplies = comment.replies.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const replyIds = comment.replies.slice(startIndex, endIndex);
    
    const replies = await Comment.find({
      _id: { $in: replyIds },
      'flags.isDeleted': false
    })
      .populate('author', 'username displayName avatar karma')
      .sort(sortOptions);

    res.status(200).json({
      replies,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReplies / limit),
        totalReplies,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching comment replies:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comment replies',
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

    // Soft delete - keep in thread structure to maintain reply chains
    comment.flags.isDeleted = true;
    comment.content = '[deleted]';
    await comment.save();

    // Decrement comment count on post
    post.commentCount = Math.max(0, post.commentCount - 1);
    await post.save();

    // Don't remove from parent's replies array or update reply counts
    // This preserves the thread structure and allows replies to remain visible

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
  getCommentReplies,
  updateComment,
  deleteComment,
  upvoteComment,
  downvoteComment,
  removeVote
};
