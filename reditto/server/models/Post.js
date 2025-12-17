const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Post title is required'],
    trim: true,
    minlength: [1, 'Title must be at least 1 character'],
    maxlength: [300, 'Title cannot exceed 300 characters']
  },
  content: {
    type: String,
    maxlength: [40000, 'Content cannot exceed 40000 characters'],
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'link', 'image'],
    default: 'text',
    required: true
  },
  url: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type === 'link' && !v) return false;
        if (v && !/^https?:\/\/.+/.test(v)) return false;
        return true;
      },
      message: 'Invalid URL format'
    }
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function(v) {
        if (this.type === 'image' && !v) return false;
        if (v && !/^https?:\/\/.+/.test(v)) return false;
        return true;
      },
      message: 'Invalid image URL format'
    }
  },
  votes: {
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  voteCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0,
    min: 0
  },
  flair: {
    text: {
      type: String,
      maxlength: 64
    },
    backgroundColor: {
      type: String,
      default: '#0079D3'
    },
    textColor: {
      type: String,
      default: '#FFFFFF'
    }
  },
  flags: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  editedAt: {
    type: Date
  }
});

// Indexes for faster queries
postSchema.index({ author: 1 });
postSchema.index({ community: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ voteCount: -1 });
postSchema.index({ 'flags.isDeleted': 1 });
postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ community: 1, voteCount: -1 });

// Update timestamps
postSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Calculate vote count before saving
postSchema.pre('save', function() {
  this.voteCount = this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for vote score display
postSchema.virtual('score').get(function() {
  return this.voteCount;
});

// Method to check if user has upvoted
postSchema.methods.hasUpvoted = function(userId) {
  return this.votes.upvotes.some(vote => vote.toString() === userId.toString());
};

// Method to check if user has downvoted
postSchema.methods.hasDownvoted = function(userId) {
  return this.votes.downvotes.some(vote => vote.toString() === userId.toString());
};

// Method to upvote
postSchema.methods.upvote = function(userId) {
  const userIdStr = userId.toString();
  
  // Remove from downvotes if exists
  this.votes.downvotes = this.votes.downvotes.filter(
    vote => vote.toString() !== userIdStr
  );
  
  // Add to upvotes if not already upvoted
  if (!this.hasUpvoted(userId)) {
    this.votes.upvotes.push(userId);
  }
  
  this.voteCount = this.votes.upvotes.length - this.votes.downvotes.length;
};

// Method to downvote
postSchema.methods.downvote = function(userId) {
  const userIdStr = userId.toString();
  
  // Remove from upvotes if exists
  this.votes.upvotes = this.votes.upvotes.filter(
    vote => vote.toString() !== userIdStr
  );
  
  // Add to downvotes if not already downvoted
  if (!this.hasDownvoted(userId)) {
    this.votes.downvotes.push(userId);
  }
  
  this.voteCount = this.votes.upvotes.length - this.votes.downvotes.length;
};

// Method to remove vote
postSchema.methods.removeVote = function(userId) {
  const userIdStr = userId.toString();
  
  this.votes.upvotes = this.votes.upvotes.filter(
    vote => vote.toString() !== userIdStr
  );
  this.votes.downvotes = this.votes.downvotes.filter(
    vote => vote.toString() !== userIdStr
  );
  
  this.voteCount = this.votes.upvotes.length - this.votes.downvotes.length;
};

// Method to check if user is author
postSchema.methods.isAuthor = function(userId) {
  return this.author.toString() === userId.toString();
};

module.exports = mongoose.model('Post', postSchema);
