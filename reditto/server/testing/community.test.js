const mongoose = require('mongoose');
const Community = require('../models/Community');
const User = require('../models/User');
require('dotenv').config();

describe('Community Model Tests', () => {
  let testUser;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create a test user for community creation
    testUser = await User.create({
      username: 'testcreator',
      email: 'creator@test.com',
      password: 'password123'
    });
  });

  afterEach(async () => {
    await Community.deleteMany({});
    await User.deleteMany({});
  });

  describe('Community Creation', () => {
    test('should create a valid community with required fields', async () => {
      const communityData = {
        name: 'testcommunity_create',
        description: 'A test community',
        creator: testUser._id
      };

      const community = await Community.create(communityData);

      expect(community.name).toBe('testcommunity_create');
      expect(community.description).toBe('A test community');
      expect(community.creator.toString()).toBe(testUser._id.toString());
      expect(community.memberCount).toBe(1);
      expect(community.moderators).toContainEqual(testUser._id);
    });

    test('should automatically add creator as moderator', async () => {
      const community = await Community.create({
        name: 'automod',
        creator: testUser._id
      });

      expect(community.moderators).toHaveLength(1);
      expect(community.moderators[0].toString()).toBe(testUser._id.toString());
    });

    test('should convert community name to lowercase', async () => {
      const community = await Community.create({
        name: 'TestCommunity',
        creator: testUser._id
      });

      expect(community.name).toBe('testcommunity');
    });

    test('should fail without required name field', async () => {
      const communityData = {
        creator: testUser._id
      };

      await expect(Community.create(communityData)).rejects.toThrow();
    });

    test('should fail without required creator field', async () => {
      const communityData = {
        name: 'testcommunity'
      };

      await expect(Community.create(communityData)).rejects.toThrow();
    });

    test('should fail with duplicate community name', async () => {
        await Community.create({
        name: 'duplicate_test',
        creator: testUser._id
      });
      
      // Force index build and wait
      await Community.ensureIndexes();
      await new Promise(resolve => setTimeout(resolve, 100));

      await expect(Community.create({
        name: 'duplicate_test',
        creator: testUser._id
      })).rejects.toThrow();
    });

    test('should fail with name shorter than 3 characters', async () => {
      const communityData = {
        name: 'ab',
        creator: testUser._id
      };

      await expect(Community.create(communityData)).rejects.toThrow();
    });

    test('should fail with name longer than 21 characters', async () => {
      const communityData = {
        name: 'a'.repeat(22),
        creator: testUser._id
      };

      await expect(Community.create(communityData)).rejects.toThrow();
    });

    test('should fail with invalid characters in name', async () => {
      const communityData = {
        name: 'test-community',
        creator: testUser._id
      };

      await expect(Community.create(communityData)).rejects.toThrow();
    });

    test('should accept valid name with underscores and numbers', async () => {
      const community = await Community.create({
        name: 'test_community_123',
        creator: testUser._id
      });

      expect(community.name).toBe('test_community_123');
    });
  });

  describe('Community Settings', () => {
    test('should create community with default settings', async () => {
      const community = await Community.create({
        name: 'settings_test',
        creator: testUser._id
      });

      expect(community.settings.isPrivate).toBe(false);
      expect(community.settings.allowTextPosts).toBe(true);
      expect(community.settings.allowLinkPosts).toBe(true);
      expect(community.settings.allowImagePosts).toBe(true);
      expect(community.settings.requirePostApproval).toBe(false);
    });

    test('should allow custom settings', async () => {
      const community = await Community.create({
        name: 'custom_settings',
        creator: testUser._id,
        settings: {
          isPrivate: true,
          allowTextPosts: false,
          requirePostApproval: true
        }
      });

      expect(community.settings.isPrivate).toBe(true);
      expect(community.settings.allowTextPosts).toBe(false);
      expect(community.settings.requirePostApproval).toBe(true);
    });
  });

  describe('Community Rules and Flairs', () => {
    test('should allow adding rules', async () => {
      const community = await Community.create({
        name: 'rules_test',
        creator: testUser._id,
        rules: [
          { title: 'Be respectful', description: 'No harassment', order: 1 },
          { title: 'No spam', description: 'Keep it relevant', order: 2 }
        ]
      });

      expect(community.rules).toHaveLength(2);
      expect(community.rules[0].title).toBe('Be respectful');
      expect(community.rules[1].title).toBe('No spam');
    });

    test('should allow adding flairs', async () => {
      const community = await Community.create({
        name: 'flair_test',
        creator: testUser._id,
        flairs: [
          { text: 'Discussion', backgroundColor: '#FF4500', textColor: '#FFFFFF' },
          { text: 'News', backgroundColor: '#0079D3', textColor: '#FFFFFF' }
        ]
      });

      expect(community.flairs).toHaveLength(2);
      expect(community.flairs[0].text).toBe('Discussion');
      expect(community.flairs[1].text).toBe('News');
    });
  });

  describe('Community Methods', () => {
    let community;
    let moderator;

    beforeEach(async () => {
      moderator = await User.create({
        username: 'moderator',
        email: 'mod@test.com',
        password: 'password123'
      });

      community = await Community.create({
        name: 'method_test',
        creator: testUser._id,
        moderators: [testUser._id, moderator._id]
      });
    });

    test('should correctly identify moderator', () => {
      expect(community.isModerator(testUser._id)).toBe(true);
      expect(community.isModerator(moderator._id)).toBe(true);
    });

    test('should correctly identify non-moderator', async () => {
      const nonMod = await User.create({
        username: 'nonmod',
        email: 'nonmod@test.com',
        password: 'password123'
      });

      expect(community.isModerator(nonMod._id)).toBe(false);
    });

    test('should correctly identify creator', () => {
      expect(community.isCreator(testUser._id)).toBe(true);
      expect(community.isCreator(moderator._id)).toBe(false);
    });
  });

  describe('Community Virtuals', () => {
    test('should generate correct URL', async () => {
      const community = await Community.create({
        name: 'url_test',
        creator: testUser._id
      });

      expect(community.url).toBe('/r/url_test');
    });
  });

  describe('Community Category', () => {
    test('should default to General category', async () => {
      const community = await Community.create({
        name: 'category_test',
        creator: testUser._id
      });

      expect(community.category).toBe('General');
    });

    test('should accept valid category', async () => {
      const community = await Community.create({
        name: 'gaming_community',
        creator: testUser._id,
        category: 'Gaming'
      });

      expect(community.category).toBe('Gaming');
    });

    test('should fail with invalid category', async () => {
      await expect(Community.create({
        name: 'invalid_category',
        creator: testUser._id,
        category: 'InvalidCategory'
      })).rejects.toThrow();
    });
  });

  describe('Community Appearance', () => {
    test('should have default appearance settings', async () => {
      const community = await Community.create({
        name: 'appearance_test',
        creator: testUser._id
      });

      expect(community.appearance.icon).toBe('');
      expect(community.appearance.banner).toBe('');
      expect(community.appearance.primaryColor).toBe('#0079D3');
    });

    test('should allow custom appearance', async () => {
      const community = await Community.create({
        name: 'custom_appearance',
        creator: testUser._id,
        appearance: {
          icon: 'https://example.com/icon.png',
          banner: 'https://example.com/banner.png',
          primaryColor: '#FF4500'
        }
      });

      expect(community.appearance.icon).toBe('https://example.com/icon.png');
      expect(community.appearance.banner).toBe('https://example.com/banner.png');
      expect(community.appearance.primaryColor).toBe('#FF4500');
    });
  });

  describe('Community Timestamps', () => {
    test('should have createdAt and updatedAt timestamps', async () => {
      const community = await Community.create({
        name: 'timestamp_test',
        creator: testUser._id
      });

      expect(community.createdAt).toBeDefined();
      expect(community.updatedAt).toBeDefined();
    });

    test('should update updatedAt on save', async () => {
      const community = await Community.create({
        name: 'update_test',
        creator: testUser._id
      });

      const originalUpdatedAt = community.updatedAt;
      const communityId = community._id;
      
      // Wait a bit and update
      await new Promise(resolve => setTimeout(resolve, 50));
      community.description = 'Updated description';
      await community.save();

      // Refetch from database to ensure we have the latest
      const updatedCommunity = await Community.findById(communityId);
      expect(updatedCommunity.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});
