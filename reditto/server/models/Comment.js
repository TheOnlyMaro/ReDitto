const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    maxlength: 10000,
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
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
  replyCount: {
    type: Number,
    default: 0
  },
  flags: {
    isDeleted: {
      type: Boolean,
      default: false
    },
    isEdited: {
      type: Boolean,
      default: false
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
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ post: 1, parentComment: 1 });
commentSchema.index({ 'flags.isDeleted': 1 });

// Pre-save hook to calculate vote count
commentSchema.pre('save', function() {
  this.updatedAt = Date.now();
  this.voteCount = this.votes.upvotes.length - this.votes.downvotes.length;
});

// Method to check if user has upvoted
commentSchema.methods.hasUpvoted = function(userId) {
  return this.votes.upvotes.some(vote => vote.toString() === userId.toString());
};

// Method to check if user has downvoted
commentSchema.methods.hasDownvoted = function(userId) {
  return this.votes.downvotes.some(vote => vote.toString() === userId.toString());
};

// Method to upvote
commentSchema.methods.upvote = function(userId) {
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
commentSchema.methods.downvote = function(userId) {
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
commentSchema.methods.removeVote = function(userId) {
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
commentSchema.methods.isAuthor = function(userId) {
  return this.author.toString() === userId.toString();
};

module.exports = mongoose.model('Comment', commentSchema);
