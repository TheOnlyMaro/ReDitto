const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: 30
  },
  avatar: {
    type: String,
    default: ''
  },
  karma: {
    post: {
      type: Number,
      default: 0
    },
    comment: {
      type: Number,
      default: 0
    }
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  communities: {
    created: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }],
    joined: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }],
    moderated: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community'
    }]
  },
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  upvotedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  downvotedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  upvotedComments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  downvotedComments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  settings: {
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  flags: {
    isDeleted: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
