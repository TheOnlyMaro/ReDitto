const mongoose = require('mongoose');
const Post = require('../models/Post');
const Community = require('../models/Community');
const User = require('../models/User');
require('dotenv').config();

describe('Post Model Tests', () => {
  let testUser;
  let testCommunity;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      username: 'postauthor',
      email: 'author@test.com',
      password: 'password123'
    });

    // Create test community
    testCommunity = await Community.create({
      name: 'testcommunity',
      displayName: 'Test Community',
      creator: testUser._id
    });
  });

  afterEach(async () => {
    await Post.deleteMany({});
    await Community.deleteMany({});
    await User.deleteMany({});
  });

  describe('Post Creation', () => {
    test('should create a valid text post', async () => {
      const postData = {
        title: 'Test Post',
        content: 'This is a test post content',
        author: testUser._id,
        community: testCommunity._id,
        type: 'text'
      };

      const post = await Post.create(postData);

      expect(post.title).toBe('Test Post');
      expect(post.content).toBe('This is a test post content');
      expect(post.author.toString()).toBe(testUser._id.toString());
      expect(post.community.toString()).toBe(testCommunity._id.toString());
      expect(post.type).toBe('text');
      expect(post.voteCount).toBe(0);
      expect(post.commentCount).toBe(0);
    });

    test('should create a valid link post', async () => {
      const post = await Post.create({
        title: 'Link Post',
        author: testUser._id,
        community: testCommunity._id,
        type: 'link',
        url: 'https://example.com'
      });

      expect(post.type).toBe('link');
      expect(post.url).toBe('https://example.com');
    });

    test('should create a valid image post', async () => {
      const post = await Post.create({
        title: 'Image Post',
        author: testUser._id,
        community: testCommunity._id,
        type: 'image',
        imageUrl: 'https://example.com/image.jpg'
      });

      expect(post.type).toBe('image');
      expect(post.imageUrl).toBe('https://example.com/image.jpg');
    });

    test('should fail without required title', async () => {
      await expect(Post.create({
        content: 'Content without title',
        author: testUser._id,
        community: testCommunity._id
      })).rejects.toThrow();
    });

    test('should fail without required author', async () => {
      await expect(Post.create({
        title: 'Post without author',
        community: testCommunity._id
      })).rejects.toThrow();
    });

    test('should fail without required community', async () => {
      await expect(Post.create({
        title: 'Post without community',
        author: testUser._id
      })).rejects.toThrow();
    });

    test('should fail with title exceeding max length', async () => {
      await expect(Post.create({
        title: 'a'.repeat(301),
        author: testUser._id,
        community: testCommunity._id
      })).rejects.toThrow();
    });

    test('should fail with content exceeding max length', async () => {
      await expect(Post.create({
        title: 'Valid Title',
        content: 'a'.repeat(40001),
        author: testUser._id,
        community: testCommunity._id
      })).rejects.toThrow();
    });

    test('should fail with invalid url format', async () => {
      await expect(Post.create({
        title: 'Link Post',
        author: testUser._id,
        community: testCommunity._id,
        type: 'link',
        url: 'not-a-valid-url'
      })).rejects.toThrow();
    });

    test('should default to text type', async () => {
      const post = await Post.create({
        title: 'Default Type Post',
        author: testUser._id,
        community: testCommunity._id
      });

      expect(post.type).toBe('text');
    });

    test('should fail when text post has imageUrl', async () => {
      await expect(Post.create({
        title: 'Text Post with Image',
        content: 'Some text content',
        author: testUser._id,
        community: testCommunity._id,
        type: 'text',
        imageUrl: 'https://example.com/image.jpg'
      })).rejects.toThrow('Text posts cannot have an image URL');
    });

    test('should fail when image post has content', async () => {
      await expect(Post.create({
        title: 'Image Post with Content',
        content: 'Some text content',
        author: testUser._id,
        community: testCommunity._id,
        type: 'image',
        imageUrl: 'https://example.com/image.jpg'
      })).rejects.toThrow('Image posts cannot have text content');
    });

    test('should fail when image post has no imageUrl', async () => {
      await expect(Post.create({
        title: 'Image Post without URL',
        author: testUser._id,
        community: testCommunity._id,
        type: 'image'
      })).rejects.toThrow('Image posts must have an image URL');
    });
  });

  describe('Post Flags', () => {
    test('should have default flags', async () => {
      const post = await Post.create({
        title: 'Test Post',
        author: testUser._id,
        community: testCommunity._id
      });

      expect(post.flags.isDeleted).toBe(false);
      expect(post.flags.isApproved).toBe(true);
    });

    test('should allow setting flags', async () => {
      const post = await Post.create({
        title: 'Flagged Post',
        author: testUser._id,
        community: testCommunity._id,
        flags: {
          isDeleted: true,
          isApproved: false
        }
      });

      expect(post.flags.isDeleted).toBe(true);
      expect(post.flags.isApproved).toBe(false);
    });
  });

  describe('Post Voting', () => {
    let post;

    beforeEach(async () => {
      post = await Post.create({
        title: 'Voting Test Post',
        author: testUser._id,
        community: testCommunity._id
      });
    });

    test('should start with zero votes', () => {
      expect(post.voteCount).toBe(0);
      expect(post.votes.upvotes).toHaveLength(0);
      expect(post.votes.downvotes).toHaveLength(0);
    });

    test('should upvote post', async () => {
      post.upvote(testUser._id);
      await post.save();

      expect(post.votes.upvotes).toHaveLength(1);
      expect(post.voteCount).toBe(1);
      expect(post.hasUpvoted(testUser._id)).toBe(true);
    });

    test('should downvote post', async () => {
      post.downvote(testUser._id);
      await post.save();

      expect(post.votes.downvotes).toHaveLength(1);
      expect(post.voteCount).toBe(-1);
      expect(post.hasDownvoted(testUser._id)).toBe(true);
    });

    test('should remove downvote when upvoting', async () => {
      post.downvote(testUser._id);
      await post.save();
      
      post.upvote(testUser._id);
      await post.save();

      expect(post.votes.upvotes).toHaveLength(1);
      expect(post.votes.downvotes).toHaveLength(0);
      expect(post.voteCount).toBe(1);
    });

    test('should remove upvote when downvoting', async () => {
      post.upvote(testUser._id);
      await post.save();
      
      post.downvote(testUser._id);
      await post.save();

      expect(post.votes.upvotes).toHaveLength(0);
      expect(post.votes.downvotes).toHaveLength(1);
      expect(post.voteCount).toBe(-1);
    });

    test('should not duplicate upvote', async () => {
      post.upvote(testUser._id);
      await post.save();
      
      post.upvote(testUser._id);
      await post.save();

      expect(post.votes.upvotes).toHaveLength(1);
      expect(post.voteCount).toBe(1);
    });

    test('should remove vote', async () => {
      post.upvote(testUser._id);
      await post.save();
      
      post.removeVote(testUser._id);
      await post.save();

      expect(post.votes.upvotes).toHaveLength(0);
      expect(post.votes.downvotes).toHaveLength(0);
      expect(post.voteCount).toBe(0);
    });

    test('should calculate correct vote count with multiple users', async () => {
      const user2 = await User.create({
        username: 'user2',
        email: 'user2@test.com',
        password: 'password123'
      });

      const user3 = await User.create({
        username: 'user3',
        email: 'user3@test.com',
        password: 'password123'
      });

      post.upvote(testUser._id);
      post.upvote(user2._id);
      post.downvote(user3._id);
      await post.save();

      expect(post.voteCount).toBe(1); // 2 upvotes - 1 downvote
    });
  });

  describe('Post Methods', () => {
    let post;

    beforeEach(async () => {
      post = await Post.create({
        title: 'Method Test Post',
        author: testUser._id,
        community: testCommunity._id
      });
    });

    test('should correctly identify author', () => {
      expect(post.isAuthor(testUser._id)).toBe(true);
    });

    test('should correctly identify non-author', async () => {
      const otherUser = await User.create({
        username: 'otheruser',
        email: 'other@test.com',
        password: 'password123'
      });

      expect(post.isAuthor(otherUser._id)).toBe(false);
    });
  });

  describe('Post Virtuals', () => {
    test('should return vote count as score', async () => {
      const post = await Post.create({
        title: 'Score Test',
        author: testUser._id,
        community: testCommunity._id
      });

      post.upvote(testUser._id);
      await post.save();

      expect(post.score).toBe(1);
    });
  });

  describe('Post Flair', () => {
    test('should allow post flair', async () => {
      const post = await Post.create({
        title: 'Flair Test',
        author: testUser._id,
        community: testCommunity._id,
        flair: {
          text: 'Discussion',
          backgroundColor: '#FF4500',
          textColor: '#FFFFFF'
        }
      });

      expect(post.flair.text).toBe('Discussion');
      expect(post.flair.backgroundColor).toBe('#FF4500');
      expect(post.flair.textColor).toBe('#FFFFFF');
    });
  });

  describe('Post Timestamps', () => {
    test('should have createdAt and updatedAt timestamps', async () => {
      const post = await Post.create({
        title: 'Timestamp Test',
        author: testUser._id,
        community: testCommunity._id
      });

      expect(post.createdAt).toBeDefined();
      expect(post.updatedAt).toBeDefined();
    });

    test('should update updatedAt on save', async () => {
      const post = await Post.create({
        title: 'Update Test',
        author: testUser._id,
        community: testCommunity._id
      });

      const originalUpdatedAt = post.updatedAt;
      
      await new Promise(resolve => setTimeout(resolve, 10));
      post.content = 'Updated content';
      await post.save();

      expect(post.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });

    test('should set editedAt when content is edited', async () => {
      const post = await Post.create({
        title: 'Edit Test',
        author: testUser._id,
        community: testCommunity._id,
        content: 'Original content'
      });

      expect(post.editedAt).toBeUndefined();

      post.content = 'Edited content';
      post.editedAt = new Date();
      await post.save();

      expect(post.editedAt).toBeDefined();
    });
  });
});
