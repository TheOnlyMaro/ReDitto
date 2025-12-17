const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Community name is required'],
    unique: true,
    lowercase: true,
    trim: true,
    minlength: [3, 'Community name must be at least 3 characters'],
    maxlength: [21, 'Community name cannot exceed 21 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Community name can only contain letters, numbers, and underscores']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  memberCount: {
    type: Number,
    default: 1,
    min: 0
  },
  rules: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  flairs: [{
    text: {
      type: String,
      required: true,
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
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowTextPosts: {
      type: Boolean,
      default: true
    },
    allowLinkPosts: {
      type: Boolean,
      default: true
    },
    allowImagePosts: {
      type: Boolean,
      default: true
    },
    requirePostApproval: {
      type: Boolean,
      default: false
    }
  },
  appearance: {
    icon: {
      type: String,
      default: ''
    },
    banner: {
      type: String,
      default: ''
    },
    primaryColor: {
      type: String,
      default: '#0079D3'
    }
  },
  category: {
    type: String,
    enum: ['General', 'Gaming', 'Sports', 'Technology', 'Entertainment', 'News', 'Education', 'Science', 'Art', 'Music', 'Other'],
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
communitySchema.index({ name: 1 });
communitySchema.index({ creator: 1 });
communitySchema.index({ memberCount: -1 });
communitySchema.index({ createdAt: -1 });

// Update the updatedAt timestamp before saving
communitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add creator as moderator automatically
communitySchema.pre('save', function(next) {
  if (this.isNew && !this.moderators.includes(this.creator)) {
    this.moderators.push(this.creator);
  }
  next();
});

// Virtual for URL-friendly name
communitySchema.virtual('url').get(function() {
  return `/r/${this.name}`;
});

// Method to check if user is moderator
communitySchema.methods.isModerator = function(userId) {
  return this.moderators.some(mod => mod.toString() === userId.toString());
};

// Method to check if user is creator
communitySchema.methods.isCreator = function(userId) {
  return this.creator.toString() === userId.toString();
};

module.exports = mongoose.model('Community', communitySchema);
