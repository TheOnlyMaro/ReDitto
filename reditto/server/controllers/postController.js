const Post = require('../models/Post');
const Community = require('../models/Community');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new post
const createPost = async (req, res) => {
  try {
    const { title, content, community, type, url, imageUrl, flair } = req.body;
    const authorId = req.user.userId;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ 
        error: 'Post title is required' 
      });
    }

    if (!community) {
      return res.status(400).json({ 
        error: 'Community is required' 
      });
    }

    // Verify community exists
    const communityDoc = await Community.findOne({ name: community.toLowerCase() });
    if (!communityDoc) {
      return res.status(404).json({ 
        error: 'Community not found' 
      });
    }

    // Validate post type specific requirements
    if (type === 'link' && !url) {
      return res.status(400).json({ 
        error: 'Link posts require a URL' 
      });
    }

    if (type === 'image' && !imageUrl) {
      return res.status(400).json({ 
        error: 'Image posts require an image URL' 
      });
    }

    // Create post
    const post = new Post({
      title,
      content: content || '',
      author: authorId,
      community: communityDoc._id,
      type: type || 'text',
      url,
      imageUrl,
      flair
    });

    await post.save();

    // Populate references
    await post.populate('author', 'username displayName avatar');
    await post.populate('community', 'name');

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ 
      error: 'Failed to create post',
      details: error.message 
    });
  }
};

// Get post by ID
const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        error: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId)
      .populate('author', 'username displayName avatar karma')
      .populate('community', 'name description memberCount');

    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    // Don't return deleted posts unless user is author or moderator
    if (post.flags.isDeleted) {
      const userId = req.user?.userId;
      const isAuthor = post.isAuthor(userId);
      const community = await Community.findById(post.community);
      const isModerator = community && community.isModerator(userId);

      if (!isAuthor && !isModerator) {
        return res.status(404).json({ 
          error: 'Post not found' 
        });
      }
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ 
      error: 'Failed to fetch post',
      details: error.message 
    });
  }
};

// Get posts with filtering and pagination
const getPosts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 25,
      community,
      author,
      sort = '-createdAt',
      type
    } = req.query;

    const query = { 'flags.isDeleted': false };

    // Filter by community
    if (community) {
      const communityDoc = await Community.findOne({ name: community.toLowerCase() });
      if (communityDoc) {
        query.community = communityDoc._id;
      } else {
        return res.status(404).json({ 
          error: 'Community not found' 
        });
      }
    }

    // Filter by author
    if (author) {
      const authorDoc = await User.findOne({ username: author });
      if (authorDoc) {
        query.author = authorDoc._id;
      } else {
        return res.status(404).json({ 
          error: 'Author not found' 
        });
      }
    }

    // Filter by type
    if (type && ['text', 'link', 'image'].includes(type)) {
      query.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('author', 'username displayName avatar karma')
      .populate('community', 'name');

    const total = await Post.countDocuments(query);

    res.status(200).json({
      posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch posts',
      details: error.message 
    });
  }
};

// Update post
const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;
    const { title, content, flair } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        error: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    // Only author can update post
    if (!post.isAuthor(userId)) {
      return res.status(403).json({ 
        error: 'Only the author can update this post' 
      });
    }

    // Check if post is deleted
    if (post.flags.isDeleted) {
      return res.status(400).json({ 
        error: 'Cannot update a deleted post' 
      });
    }

    // Update fields
    if (title !== undefined) post.title = title;
    if (content !== undefined) {
      post.content = content;
      post.editedAt = Date.now();
    }
    if (flair !== undefined) post.flair = flair;

    await post.save();
    await post.populate('author', 'username displayName avatar');
    await post.populate('community', 'name');

    res.status(200).json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ 
      error: 'Failed to update post',
      details: error.message 
    });
  }
};

// Delete post
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        error: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId).populate('community');
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    // Check if user is author or moderator
    const isAuthor = post.isAuthor(userId);
    const isModerator = post.community.isModerator(userId);

    if (!isAuthor && !isModerator) {
      return res.status(403).json({ 
        error: 'Only the author or moderators can delete this post' 
      });
    }

    // Soft delete
    post.flags.isDeleted = true;
    await post.save();

    res.status(200).json({
      message: 'Post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ 
      error: 'Failed to delete post',
      details: error.message 
    });
  }
};

// Upvote post
const upvotePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        error: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    if (post.flags.isDeleted) {
      return res.status(400).json({ 
        error: 'Cannot vote on deleted post' 
      });
    }

    post.upvote(userId);
    await post.save();

    res.status(200).json({
      message: 'Post upvoted successfully',
      voteCount: post.voteCount,
      votes: {
        upvotes: post.votes.upvotes.length,
        downvotes: post.votes.downvotes.length
      }
    });
  } catch (error) {
    console.error('Error upvoting post:', error);
    res.status(500).json({ 
      error: 'Failed to upvote post',
      details: error.message 
    });
  }
};

// Downvote post
const downvotePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        error: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    if (post.flags.isDeleted) {
      return res.status(400).json({ 
        error: 'Cannot vote on deleted post' 
      });
    }

    post.downvote(userId);
    await post.save();

    res.status(200).json({
      message: 'Post downvoted successfully',
      voteCount: post.voteCount,
      votes: {
        upvotes: post.votes.upvotes.length,
        downvotes: post.votes.downvotes.length
      }
    });
  } catch (error) {
    console.error('Error downvoting post:', error);
    res.status(500).json({ 
      error: 'Failed to downvote post',
      details: error.message 
    });
  }
};

// Remove vote from post
const removeVote = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ 
        error: 'Invalid post ID' 
      });
    }

    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ 
        error: 'Post not found' 
      });
    }

    post.removeVote(userId);
    await post.save();

    res.status(200).json({
      message: 'Vote removed successfully',
      voteCount: post.voteCount,
      votes: {
        upvotes: post.votes.upvotes.length,
        downvotes: post.votes.downvotes.length
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
  createPost,
  getPostById,
  getPosts,
  updatePost,
  deletePost,
  upvotePost,
  downvotePost,
  removeVote
};
