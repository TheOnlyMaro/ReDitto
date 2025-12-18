const mongoose = require('mongoose');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');
const Community = require('../models/Community');
require('dotenv').config();

describe('Comment Model Tests', () => {
  let testUser;
  let testPost;
  let testCommunity;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    // Close database connection
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Comment.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({});
    await Community.deleteMany({});

    // Create test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword123',
      communities: {
        joined: [],
        created: [],
        moderated: []
      }
    });

    // Create test community
    testCommunity = await Community.create({
      name: 'testcommunity',
      description: 'Test community',
      creator: testUser._id
    });

    // Create test post
    testPost = await Post.create({
      title: 'Test Post',
      content: 'Test content',
      author: testUser._id,
      community: testCommunity._id,
      type: 'text'
    });
  });

  describe('Comment Creation', () => {
    test('should create a valid comment', async () => {
      const comment = await Comment.create({
        content: 'This is a test comment',
        author: testUser._id,
        post: testPost._id
      });

      expect(comment.content).toBe('This is a test comment');
      expect(comment.author.toString()).toBe(testUser._id.toString());
      expect(comment.post.toString()).toBe(testPost._id.toString());
      expect(comment.parentComment).toBeNull();
      expect(comment.voteCount).toBe(0);
      expect(comment.replyCount).toBe(0);
      expect(comment.flags.isDeleted).toBe(false);
      expect(comment.flags.isEdited).toBe(false);
    });

    test('should create a reply to another comment', async () => {
      const parentComment = await Comment.create({
        content: 'Parent comment',
        author: testUser._id,
        post: testPost._id
      });

      const replyComment = await Comment.create({
        content: 'Reply to parent',
        author: testUser._id,
        post: testPost._id,
        parentComment: parentComment._id
      });

      expect(replyComment.parentComment.toString()).toBe(parentComment._id.toString());
    });

    test('should fail without required content', async () => {
      await expect(Comment.create({
        author: testUser._id,
        post: testPost._id
      })).rejects.toThrow();
    });

    test('should fail without required author', async () => {
      await expect(Comment.create({
        content: 'Test comment',
        post: testPost._id
      })).rejects.toThrow();
    });

    test('should fail without required post', async () => {
      await expect(Comment.create({
        content: 'Test comment',
        author: testUser._id
      })).rejects.toThrow();
    });

    test('should trim whitespace from content', async () => {
      const comment = await Comment.create({
        content: '  Test comment with whitespace  ',
        author: testUser._id,
        post: testPost._id
      });

      expect(comment.content).toBe('Test comment with whitespace');
    });

    test('should reject content longer than 10000 characters', async () => {
      const longContent = 'a'.repeat(10001);
      
      await expect(Comment.create({
        content: longContent,
        author: testUser._id,
        post: testPost._id
      })).rejects.toThrow();
    });
  });

  describe('Comment Voting', () => {
    let comment;
    let voter;

    beforeEach(async () => {
      comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      voter = await User.create({
        username: 'voter',
        email: 'voter@example.com',
        password: 'hashedpassword123',
        communities: {
          joined: [],
          created: [],
          moderated: []
        }
      });
    });

    test('should upvote a comment', async () => {
      comment.upvote(voter._id);
      await comment.save();

      expect(comment.votes.upvotes).toHaveLength(1);
      expect(comment.votes.upvotes[0].toString()).toBe(voter._id.toString());
      expect(comment.voteCount).toBe(1);
    });

    test('should downvote a comment', async () => {
      comment.downvote(voter._id);
      await comment.save();

      expect(comment.votes.downvotes).toHaveLength(1);
      expect(comment.votes.downvotes[0].toString()).toBe(voter._id.toString());
      expect(comment.voteCount).toBe(-1);
    });

    test('should not duplicate upvote from same user', async () => {
      comment.upvote(voter._id);
      await comment.save();
      comment.upvote(voter._id);
      await comment.save();

      expect(comment.votes.upvotes).toHaveLength(1);
      expect(comment.voteCount).toBe(1);
    });

    test('should not duplicate downvote from same user', async () => {
      comment.downvote(voter._id);
      await comment.save();
      comment.downvote(voter._id);
      await comment.save();

      expect(comment.votes.downvotes).toHaveLength(1);
      expect(comment.voteCount).toBe(-1);
    });

    test('should switch from upvote to downvote', async () => {
      comment.upvote(voter._id);
      await comment.save();
      expect(comment.voteCount).toBe(1);

      comment.downvote(voter._id);
      await comment.save();
      
      expect(comment.votes.upvotes).toHaveLength(0);
      expect(comment.votes.downvotes).toHaveLength(1);
      expect(comment.voteCount).toBe(-1);
    });

    test('should switch from downvote to upvote', async () => {
      comment.downvote(voter._id);
      await comment.save();
      expect(comment.voteCount).toBe(-1);

      comment.upvote(voter._id);
      await comment.save();
      
      expect(comment.votes.downvotes).toHaveLength(0);
      expect(comment.votes.upvotes).toHaveLength(1);
      expect(comment.voteCount).toBe(1);
    });

    test('should remove vote', async () => {
      comment.upvote(voter._id);
      await comment.save();
      expect(comment.voteCount).toBe(1);

      comment.removeVote(voter._id);
      await comment.save();

      expect(comment.votes.upvotes).toHaveLength(0);
      expect(comment.votes.downvotes).toHaveLength(0);
      expect(comment.voteCount).toBe(0);
    });

    test('should calculate correct vote count with multiple voters', async () => {
      const voter2 = await User.create({
        username: 'voter2',
        email: 'voter2@example.com',
        password: 'hashedpassword123',
        communities: {
          joined: [],
          created: [],
          moderated: []
        }
      });

      const voter3 = await User.create({
        username: 'voter3',
        email: 'voter3@example.com',
        password: 'hashedpassword123',
        communities: {
          joined: [],
          created: [],
          moderated: []
        }
      });

      comment.upvote(voter._id);
      comment.upvote(voter2._id);
      comment.downvote(voter3._id);
      await comment.save();

      expect(comment.voteCount).toBe(1); // 2 upvotes - 1 downvote
    });

    test('hasUpvoted should return true if user upvoted', async () => {
      comment.upvote(voter._id);
      await comment.save();

      expect(comment.hasUpvoted(voter._id)).toBe(true);
      expect(comment.hasDownvoted(voter._id)).toBe(false);
    });

    test('hasDownvoted should return true if user downvoted', async () => {
      comment.downvote(voter._id);
      await comment.save();

      expect(comment.hasDownvoted(voter._id)).toBe(true);
      expect(comment.hasUpvoted(voter._id)).toBe(false);
    });
  });

  describe('Comment Methods', () => {
    test('isAuthor should return true for comment author', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      expect(comment.isAuthor(testUser._id)).toBe(true);
    });

    test('isAuthor should return false for non-author', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'hashedpassword123',
        communities: {
          joined: [],
          created: [],
          moderated: []
        }
      });

      expect(comment.isAuthor(otherUser._id)).toBe(false);
    });
  });

  describe('Comment Flags', () => {
    test('should soft delete a comment', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      comment.flags.isDeleted = true;
      await comment.save();

      expect(comment.flags.isDeleted).toBe(true);
    });

    test('should mark comment as edited', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      comment.content = 'Edited content';
      comment.flags.isEdited = true;
      comment.editedAt = Date.now();
      await comment.save();

      expect(comment.flags.isEdited).toBe(true);
      expect(comment.editedAt).toBeDefined();
    });
  });

  describe('Comment Timestamps', () => {
    test('should automatically set createdAt and updatedAt', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      expect(comment.createdAt).toBeDefined();
      expect(comment.updatedAt).toBeDefined();
    });

    test('should update updatedAt on save', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      const originalUpdatedAt = comment.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      comment.content = 'Updated content';
      await comment.save();

      expect(comment.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Comment Reply Count', () => {
    test('should initialize replyCount to 0', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      expect(comment.replyCount).toBe(0);
    });

    test('should allow manual update of replyCount', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      comment.replyCount = 5;
      await comment.save();

      expect(comment.replyCount).toBe(5);
    });
  });

  describe('Comment Population', () => {
    test('should populate author details', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      // eslint-disable-next-line testing-library/await-async-query
      const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'username email');

      expect(populatedComment.author.username).toBe('testuser');
      expect(populatedComment.author.email).toBe('test@example.com');
    });

    test('should populate post details', async () => {
      const comment = await Comment.create({
        content: 'Test comment',
        author: testUser._id,
        post: testPost._id
      });

      // eslint-disable-next-line testing-library/await-async-query
      const populatedComment = await Comment.findById(comment._id)
        .populate('post', 'title content')
        .exec();

      expect(populatedComment.post.title).toBe('Test Post');
    });

    test('should populate parent comment', async () => {
      const parentComment = await Comment.create({
        content: 'Parent comment',
        author: testUser._id,
        post: testPost._id
      });

      const replyComment = await Comment.create({
        content: 'Reply comment',
        author: testUser._id,
        post: testPost._id,
        parentComment: parentComment._id
      });

      // eslint-disable-next-line testing-library/await-async-query
      const populatedReply = await Comment.findById(replyComment._id)
        .populate('parentComment', 'content')
        .exec();

      expect(populatedReply.parentComment.content).toBe('Parent comment');
    });
  });
});
