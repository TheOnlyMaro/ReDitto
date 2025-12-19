const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');

// Global search across communities, users, and posts
const globalSearch = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    const query = q.trim();
    const limitNum = parseInt(limit);

    // Create case-insensitive regex for search
    const searchRegex = new RegExp(query, 'i');

    // Search communities by name and description
    const communities = await Community.find({
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    })
      .select('name description icon memberCount category')
      .limit(limitNum)
      .sort('-memberCount')
      .lean();

    // Search users by username and displayName (exclude deleted users)
    const users = await User.find({
      $and: [
        {
          $or: [
            { username: searchRegex },
            { displayName: searchRegex }
          ]
        },
        { 'flags.isDeleted': { $ne: true } }
      ]
    })
      .select('username displayName avatar karma')
      .limit(limitNum)
      .sort('-karma')
      .lean();

    // Search posts by title and content (exclude deleted posts)
    const posts = await Post.find({
      $and: [
        {
          $or: [
            { title: searchRegex },
            { content: searchRegex }
          ]
        },
        { 'flags.isDeleted': { $ne: true } }
      ]
    })
      .populate('author', 'username displayName avatar')
      .populate('community', 'name icon')
      .select('title content type imageUrl url voteCount commentCount createdAt')
      .limit(limitNum)
      .sort('-voteCount')
      .lean();

    // Format the response
    const results = {
      communities: communities.map(community => ({
        id: community._id,
        name: community.name,
        description: community.description,
        icon: community.icon || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png',
        memberCount: community.memberCount,
        category: community.category
      })),
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar || 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png',
        karma: user.karma
      })),
      posts: posts.map(post => ({
        id: post._id,
        title: post.title,
        content: post.content,
        type: post.type,
        imageUrl: post.imageUrl,
        url: post.url,
        voteCount: post.voteCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt,
        author: post.author ? {
          username: post.author.username,
          displayName: post.author.displayName,
          avatar: post.author.avatar
        } : null,
        community: post.community ? {
          id: post.community._id,
          name: post.community.name,
          icon: post.community.icon
        } : null
      })),
      query: query,
      totalResults: communities.length + users.length + posts.length
    };

    res.status(200).json(results);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ 
      error: 'Failed to perform search',
      details: error.message 
    });
  }
};

module.exports = {
  globalSearch
};
