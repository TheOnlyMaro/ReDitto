const User = require('../models/User');

// Update user profile (only editable fields)
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, avatar, communities } = req.body;

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update only allowed fields
    if (displayName !== undefined) {
      user.displayName = displayName;
    }
    if (avatar !== undefined) {
      user.avatar = avatar;
    }
    if (communities !== undefined) {
      // Initialize communities object if it doesn't exist
      if (!user.communities) {
        user.communities = { joined: [], created: [], moderated: [] };
      }
      
      // Allow updating joined communities array
      if (communities.joined !== undefined) {
        user.communities.joined = communities.joined;
      }
    }

    // Update last active
    user.settings.lastActive = Date.now();

    await user.save();

    // Return updated user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ 
      message: 'User updated successfully',
      user: userResponse 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: error.message 
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: error.message 
    });
  }
};

// Get user by username
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Populate community references so frontend can render names/icons
    const user = await User.findOne({ username })
      .select('-password')
      .populate('communities.created', 'name icon memberCount createdAt')
      .populate('communities.joined', 'name icon memberCount createdAt')
      .populate('communities.moderated', 'name icon memberCount createdAt');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      details: error.message 
    });
  }
};

// Follow a user
const followUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const target = await User.findById(targetUserId);
    const current = await User.findById(currentUserId);

    if (!target || !current) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add follower if not present
    if (!target.followers) target.followers = [];
    if (!current.following) current.following = [];

    const alreadyFollower = target.followers.some(id => id.toString() === currentUserId.toString());
    if (!alreadyFollower) {
      target.followers.push(currentUserId);
    }

    const alreadyFollowing = current.following.some(id => id.toString() === targetUserId.toString());
    if (!alreadyFollowing) {
      current.following.push(targetUserId);
    }

    await target.save();
    await current.save();

    const targetResp = target.toObject();
    delete targetResp.password;

    res.status(200).json({ message: 'Followed user', user: targetResp, currentUser: { _id: current._id, following: current.following } });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user', details: error.message });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot unfollow yourself' });
    }

    const target = await User.findById(targetUserId);
    const current = await User.findById(currentUserId);

    if (!target || !current) {
      return res.status(404).json({ error: 'User not found' });
    }

    target.followers = (target.followers || []).filter(id => id.toString() !== currentUserId.toString());
    current.following = (current.following || []).filter(id => id.toString() !== targetUserId.toString());

    await target.save();
    await current.save();

    const targetResp = target.toObject();
    delete targetResp.password;

    res.status(200).json({ message: 'Unfollowed user', user: targetResp, currentUser: { _id: current._id, following: current.following } });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user', details: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Failed to delete user',
      details: error.message 
    });
  }
};

module.exports = {
  updateUser,
  getUserById,
  getUserByUsername,
  deleteUser,
  followUser,
  unfollowUser
};
