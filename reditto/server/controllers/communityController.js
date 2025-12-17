const Community = require('../models/Community');
const User = require('../models/User');
const mongoose = require('mongoose');

// Create a new community
const createCommunity = async (req, res) => {
  try {
    const { name, description, category, settings, appearance } = req.body;
    const creatorId = req.user.userId;

    // Validate name
    if (!name || name.length < 3 || name.length > 21) {
      return res.status(400).json({ 
        error: 'Community name must be between 3 and 21 characters' 
      });
    }

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ name: name.toLowerCase() });
    if (existingCommunity) {
      return res.status(409).json({ 
        error: 'Community with this name already exists' 
      });
    }

    // Create community
    const community = new Community({
      name: name.toLowerCase(),
      description: description || '',
      creator: creatorId,
      category: category || 'General',
      settings: settings || {},
      appearance: appearance || {}
    });

    await community.save();

    // Populate creator details
    await community.populate('creator', 'username displayName avatar');

    res.status(201).json({
      message: 'Community created successfully',
      community
    });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ 
      error: 'Failed to create community',
      details: error.message 
    });
  }
};

// Get community by name
const getCommunityByName = async (req, res) => {
  try {
    const { name } = req.params;

    const community = await Community.findOne({ name: name.toLowerCase() })
      .populate('creator', 'username displayName avatar')
      .populate('moderators', 'username displayName avatar');

    if (!community) {
      return res.status(404).json({ 
        error: 'Community not found' 
      });
    }

    res.status(200).json({ community });
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ 
      error: 'Failed to fetch community',
      details: error.message 
    });
  }
};

// Get all communities with pagination and filtering
const getCommunities = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      sort = '-memberCount' 
    } = req.query;

    const query = {};
    if (category && category !== 'All') {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const communities = await Community.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip)
      .populate('creator', 'username displayName avatar')
      .select('-rules -flairs');

    const total = await Community.countDocuments(query);

    res.status(200).json({
      communities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch communities',
      details: error.message 
    });
  }
};

// Update community
const updateCommunity = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.user.userId;
    const updates = req.body;

    // Find community
    const community = await Community.findOne({ name: name.toLowerCase() });
    
    if (!community) {
      return res.status(404).json({ 
        error: 'Community not found' 
      });
    }

    // Check if user is creator or moderator
    const isModerator = community.isModerator(userId);
    const isCreator = community.isCreator(userId);

    if (!isModerator && !isCreator) {
      return res.status(403).json({ 
        error: 'Only moderators can update community settings' 
      });
    }

    // Only creator can update certain fields
    const creatorOnlyFields = ['name', 'creator', 'moderators'];
    const hasCreatorOnlyUpdates = creatorOnlyFields.some(field => updates[field] !== undefined);

    if (hasCreatorOnlyUpdates && !isCreator) {
      return res.status(403).json({ 
        error: 'Only the creator can update these fields' 
      });
    }

    // Update allowed fields
    const allowedUpdates = ['description', 'settings', 'appearance', 'category'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        community[field] = updates[field];
      }
    });

    await community.save();
    await community.populate('creator', 'username displayName avatar');
    await community.populate('moderators', 'username displayName avatar');

    res.status(200).json({
      message: 'Community updated successfully',
      community
    });
  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({ 
      error: 'Failed to update community',
      details: error.message 
    });
  }
};

// Delete community
const deleteCommunity = async (req, res) => {
  try {
    const { name } = req.params;
    const userId = req.user.userId;

    const community = await Community.findOne({ name: name.toLowerCase() });
    
    if (!community) {
      return res.status(404).json({ 
        error: 'Community not found' 
      });
    }

    // Only creator can delete community
    if (!community.isCreator(userId)) {
      return res.status(403).json({ 
        error: 'Only the creator can delete this community' 
      });
    }

    await Community.deleteOne({ _id: community._id });

    res.status(200).json({
      message: 'Community deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ 
      error: 'Failed to delete community',
      details: error.message 
    });
  }
};

// Add moderator
const addModerator = async (req, res) => {
  try {
    const { name } = req.params;
    const { username } = req.body;
    const userId = req.user.userId;

    const community = await Community.findOne({ name: name.toLowerCase() });
    
    if (!community) {
      return res.status(404).json({ 
        error: 'Community not found' 
      });
    }

    // Only creator can add moderators
    if (!community.isCreator(userId)) {
      return res.status(403).json({ 
        error: 'Only the creator can add moderators' 
      });
    }

    // Find user to add as moderator
    const userToAdd = await User.findOne({ username });
    if (!userToAdd) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Check if already a moderator
    if (community.moderators.includes(userToAdd._id)) {
      return res.status(400).json({ 
        error: 'User is already a moderator' 
      });
    }

    community.moderators.push(userToAdd._id);
    await community.save();
    await community.populate('moderators', 'username displayName avatar');

    res.status(200).json({
      message: 'Moderator added successfully',
      moderators: community.moderators
    });
  } catch (error) {
    console.error('Error adding moderator:', error);
    res.status(500).json({ 
      error: 'Failed to add moderator',
      details: error.message 
    });
  }
};

// Remove moderator
const removeModerator = async (req, res) => {
  try {
    const { name } = req.params;
    const { username } = req.body;
    const userId = req.user.userId;

    const community = await Community.findOne({ name: name.toLowerCase() });
    
    if (!community) {
      return res.status(404).json({ 
        error: 'Community not found' 
      });
    }

    // Only creator can remove moderators
    if (!community.isCreator(userId)) {
      return res.status(403).json({ 
        error: 'Only the creator can remove moderators' 
      });
    }

    // Find user to remove
    const userToRemove = await User.findOne({ username });
    if (!userToRemove) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Can't remove creator
    if (userToRemove._id.equals(community.creator)) {
      return res.status(400).json({ 
        error: 'Cannot remove the creator as moderator' 
      });
    }

    community.moderators = community.moderators.filter(
      mod => !mod.equals(userToRemove._id)
    );

    await community.save();
    await community.populate('moderators', 'username displayName avatar');

    res.status(200).json({
      message: 'Moderator removed successfully',
      moderators: community.moderators
    });
  } catch (error) {
    console.error('Error removing moderator:', error);
    res.status(500).json({ 
      error: 'Failed to remove moderator',
      details: error.message 
    });
  }
};

// Add rule
const addRule = async (req, res) => {
  try {
    const { name } = req.params;
    const { title, description } = req.body;
    const userId = req.user.userId;

    const community = await Community.findOne({ name: name.toLowerCase() });
    
    if (!community) {
      return res.status(404).json({ 
        error: 'Community not found' 
      });
    }

    // Only moderators can add rules
    if (!community.isModerator(userId) && !community.isCreator(userId)) {
      return res.status(403).json({ 
        error: 'Only moderators can add rules' 
      });
    }

    community.rules.push({ title, description });
    await community.save();

    res.status(200).json({
      message: 'Rule added successfully',
      rules: community.rules
    });
  } catch (error) {
    console.error('Error adding rule:', error);
    res.status(500).json({ 
      error: 'Failed to add rule',
      details: error.message 
    });
  }
};

// Add flair
const addFlair = async (req, res) => {
  try {
    const { name } = req.params;
    const { text, backgroundColor, textColor } = req.body;
    const userId = req.user.userId;

    const community = await Community.findOne({ name: name.toLowerCase() });
    
    if (!community) {
      return res.status(404).json({ 
        error: 'Community not found' 
      });
    }

    // Only moderators can add flairs
    if (!community.isModerator(userId) && !community.isCreator(userId)) {
      return res.status(403).json({ 
        error: 'Only moderators can add flairs' 
      });
    }

    community.flairs.push({ text, backgroundColor, textColor });
    await community.save();

    res.status(200).json({
      message: 'Flair added successfully',
      flairs: community.flairs
    });
  } catch (error) {
    console.error('Error adding flair:', error);
    res.status(500).json({ 
      error: 'Failed to add flair',
      details: error.message 
    });
  }
};

module.exports = {
  createCommunity,
  getCommunityByName,
  getCommunities,
  updateCommunity,
  deleteCommunity,
  addModerator,
  removeModerator,
  addRule,
  addFlair
};
