const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
require('dotenv').config();

const User = require('../models/User');
const Community = require('../models/Community');
const communityRoutes = require('../routes/communityRoutes');
const authRoutes = require('../routes/authRoutes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);

describe('Community Controller Tests', () => {
  let testUser;
  let testUser2;
  let authToken;
  let authToken2;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await Community.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Community.deleteMany({});
    await User.deleteMany({});

    // Create test users
    const user1Response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser1',
        email: 'user1@test.com',
        password: 'Test123Pass'
      });
    
    testUser = user1Response.body.user;
    authToken = user1Response.body.token;

    const user2Response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'user2@test.com',
        password: 'Test123Pass'
      });
    
    testUser2 = user2Response.body.user;
    authToken2 = user2Response.body.token;
  });

  describe('POST /api/communities - Create Community', () => {
    test('Should create a community with valid data', async () => {
      const response = await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity',
          description: 'A test community',
          category: 'Technology'
        })
        .expect(201);

      expect(response.body.message).toBe('Community created successfully');
      expect(response.body.community).toHaveProperty('name', 'testcommunity');
      expect(response.body.community).toHaveProperty('description', 'A test community');
      expect(response.body.community).toHaveProperty('category', 'Technology');
      expect(response.body.community.creator).toHaveProperty('username', 'testuser1');
      expect(response.body.community.moderators).toContainEqual(
        expect.objectContaining({ username: 'testuser1' })
      );
    });

    test('Should create community with minimal data', async () => {
      const response = await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'minimal'
        })
        .expect(201);

      expect(response.body.community).toHaveProperty('name', 'minimal');
      expect(response.body.community).toHaveProperty('description', '');
      expect(response.body.community).toHaveProperty('category', 'General');
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post('/api/communities')
        .send({
          name: 'testcommunity'
        })
        .expect(401);
    });

    test('Should fail with invalid token', async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', 'Bearer invalid_token')
        .send({
          name: 'testcommunity'
        })
        .expect(403);
    });

    test('Should fail with name too short', async () => {
      const response = await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'ab'
        })
        .expect(400);

      expect(response.body.error).toContain('between 3 and 21 characters');
    });

    test('Should fail with name too long', async () => {
      const response = await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'a'.repeat(22)
        })
        .expect(400);

      expect(response.body.error).toContain('between 3 and 21 characters');
    });

    test('Should fail with duplicate community name', async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity'
        })
        .expect(201);

      await Community.ensureIndexes();
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity'
        })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    test('Should convert name to lowercase', async () => {
      const response = await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'TestCommunity'
        })
        .expect(201);

      expect(response.body.community.name).toBe('testcommunity');
    });
  });

  describe('GET /api/communities - Get All Communities', () => {
    beforeEach(async () => {
      // Create multiple communities
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'community1', category: 'Technology' });

      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'community2', category: 'Gaming' });

      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'community3', category: 'Technology' });
    });

    test('Should get all communities', async () => {
      const response = await request(app)
        .get('/api/communities')
        .expect(200);

      expect(response.body.communities).toHaveLength(3);
      expect(response.body.pagination).toHaveProperty('total', 3);
      expect(response.body.pagination).toHaveProperty('page', 1);
    });

    test('Should filter communities by category', async () => {
      const response = await request(app)
        .get('/api/communities?category=Technology')
        .expect(200);

      expect(response.body.communities).toHaveLength(2);
      response.body.communities.forEach(community => {
        expect(community.category).toBe('Technology');
      });
    });

    test('Should support pagination', async () => {
      const response = await request(app)
        .get('/api/communities?page=1&limit=2')
        .expect(200);

      expect(response.body.communities).toHaveLength(2);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('pages', 2);
    });

    test('Should sort communities by memberCount by default', async () => {
      const response = await request(app)
        .get('/api/communities')
        .expect(200);

      expect(response.body.communities).toHaveLength(3);
      // All should have memberCount of 1 (creator)
      response.body.communities.forEach(community => {
        expect(community.memberCount).toBe(1);
      });
    });
  });

  describe('GET /api/communities/:name - Get Community by Name', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity',
          description: 'Test description'
        });
    });

    test('Should get community by name', async () => {
      const response = await request(app)
        .get('/api/communities/testcommunity')
        .expect(200);

      expect(response.body.community).toHaveProperty('name', 'testcommunity');
      expect(response.body.community).toHaveProperty('description', 'Test description');
      expect(response.body.community.creator).toHaveProperty('username', 'testuser1');
    });

    test('Should be case-insensitive', async () => {
      const response = await request(app)
        .get('/api/communities/TestCommunity')
        .expect(200);

      expect(response.body.community).toHaveProperty('name', 'testcommunity');
    });

    test('Should fail with non-existent community', async () => {
      const response = await request(app)
        .get('/api/communities/nonexistent')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    test('Should populate creator and moderators', async () => {
      const response = await request(app)
        .get('/api/communities/testcommunity')
        .expect(200);

      expect(response.body.community.creator).toHaveProperty('username');
      expect(response.body.community.creator).toHaveProperty('displayName');
      expect(response.body.community.moderators).toBeInstanceOf(Array);
      expect(response.body.community.moderators[0]).toHaveProperty('username');
    });
  });

  describe('PUT /api/communities/:name - Update Community', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity',
          description: 'Original description'
        });
    });

    test('Should update community description', async () => {
      const response = await request(app)
        .put('/api/communities/testcommunity')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated description'
        })
        .expect(200);

      expect(response.body.message).toBe('Community updated successfully');
      expect(response.body.community.description).toBe('Updated description');
    });

    test('Should update community settings', async () => {
      const response = await request(app)
        .put('/api/communities/testcommunity')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          settings: {
            isPrivate: true,
            allowTextPosts: false
          }
        })
        .expect(200);

      expect(response.body.community.settings.isPrivate).toBe(true);
      expect(response.body.community.settings.allowTextPosts).toBe(false);
    });

    test('Should update community appearance', async () => {
      const response = await request(app)
        .put('/api/communities/testcommunity')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          appearance: {
            primaryColor: '#FF0000',
            icon: 'https://example.com/icon.png'
          }
        })
        .expect(200);

      expect(response.body.community.appearance.primaryColor).toBe('#FF0000');
      expect(response.body.community.appearance.icon).toBe('https://example.com/icon.png');
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .put('/api/communities/testcommunity')
        .send({
          description: 'Updated'
        })
        .expect(401);
    });

    test('Should fail if not moderator', async () => {
      const response = await request(app)
        .put('/api/communities/testcommunity')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          description: 'Hacked description'
        })
        .expect(403);

      expect(response.body.error).toContain('moderators');
    });

    test('Should fail with non-existent community', async () => {
      await request(app)
        .put('/api/communities/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Updated'
        })
        .expect(404);
    });
  });

  describe('DELETE /api/communities/:name - Delete Community', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity'
        });
    });

    test('Should delete community as creator', async () => {
      const response = await request(app)
        .delete('/api/communities/testcommunity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Community deleted successfully');

      // Verify deletion
      const checkResponse = await request(app)
        .get('/api/communities/testcommunity')
        .expect(404);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .delete('/api/communities/testcommunity')
        .expect(401);
    });

    test('Should fail if not creator', async () => {
      const response = await request(app)
        .delete('/api/communities/testcommunity')
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);

      expect(response.body.error).toContain('creator');
    });

    test('Should fail with non-existent community', async () => {
      await request(app)
        .delete('/api/communities/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/communities/:name/moderators - Add Moderator', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity'
        });
    });

    test('Should add moderator as creator', async () => {
      const response = await request(app)
        .post('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'testuser2'
        })
        .expect(200);

      expect(response.body.message).toBe('Moderator added successfully');
      expect(response.body.moderators).toHaveLength(2);
      expect(response.body.moderators).toContainEqual(
        expect.objectContaining({ username: 'testuser2' })
      );
    });

    test('Should fail if not creator', async () => {
      const response = await request(app)
        .post('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          username: 'testuser2'
        })
        .expect(403);

      expect(response.body.error).toContain('creator');
    });

    test('Should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'nonexistentuser'
        })
        .expect(404);

      expect(response.body.error).toContain('User not found');
    });

    test('Should fail if user already moderator', async () => {
      await request(app)
        .post('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'testuser2'
        })
        .expect(200);

      const response = await request(app)
        .post('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'testuser2'
        })
        .expect(400);

      expect(response.body.error).toContain('already a moderator');
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post('/api/communities/testcommunity/moderators')
        .send({
          username: 'testuser2'
        })
        .expect(401);
    });
  });

  describe('DELETE /api/communities/:name/moderators - Remove Moderator', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity'
        });

      // Add testuser2 as moderator
      await request(app)
        .post('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'testuser2'
        });
    });

    test('Should remove moderator as creator', async () => {
      const response = await request(app)
        .delete('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'testuser2'
        })
        .expect(200);

      expect(response.body.message).toBe('Moderator removed successfully');
      expect(response.body.moderators).toHaveLength(1);
      expect(response.body.moderators).not.toContainEqual(
        expect.objectContaining({ username: 'testuser2' })
      );
    });

    test('Should fail if not creator', async () => {
      const response = await request(app)
        .delete('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          username: 'testuser2'
        })
        .expect(403);

      expect(response.body.error).toContain('creator');
    });

    test('Should fail when trying to remove creator', async () => {
      const response = await request(app)
        .delete('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'testuser1'
        })
        .expect(400);

      expect(response.body.error).toContain('Cannot remove the creator');
    });

    test('Should fail with non-existent user', async () => {
      const response = await request(app)
        .delete('/api/communities/testcommunity/moderators')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'nonexistentuser'
        })
        .expect(404);

      expect(response.body.error).toContain('User not found');
    });
  });

  describe('POST /api/communities/:name/rules - Add Rule', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity'
        });
    });

    test('Should add rule as moderator', async () => {
      const response = await request(app)
        .post('/api/communities/testcommunity/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Be respectful',
          description: 'Treat others with respect'
        })
        .expect(200);

      expect(response.body.message).toBe('Rule added successfully');
      expect(response.body.rules).toHaveLength(1);
      expect(response.body.rules[0]).toHaveProperty('title', 'Be respectful');
      expect(response.body.rules[0]).toHaveProperty('description', 'Treat others with respect');
    });

    test('Should fail if not moderator', async () => {
      const response = await request(app)
        .post('/api/communities/testcommunity/rules')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          title: 'Test rule',
          description: 'Test'
        })
        .expect(403);

      expect(response.body.error).toContain('moderators');
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post('/api/communities/testcommunity/rules')
        .send({
          title: 'Test rule',
          description: 'Test'
        })
        .expect(401);
    });

    test('Should allow adding multiple rules', async () => {
      await request(app)
        .post('/api/communities/testcommunity/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Rule 1',
          description: 'Description 1'
        })
        .expect(200);

      const response = await request(app)
        .post('/api/communities/testcommunity/rules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Rule 2',
          description: 'Description 2'
        })
        .expect(200);

      expect(response.body.rules).toHaveLength(2);
    });
  });

  describe('POST /api/communities/:name/flairs - Add Flair', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/communities')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'testcommunity'
        });
    });

    test('Should add flair as moderator', async () => {
      const response = await request(app)
        .post('/api/communities/testcommunity/flairs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Discussion',
          backgroundColor: '#0079D3',
          textColor: '#FFFFFF'
        })
        .expect(200);

      expect(response.body.message).toBe('Flair added successfully');
      expect(response.body.flairs).toHaveLength(1);
      expect(response.body.flairs[0]).toHaveProperty('text', 'Discussion');
      expect(response.body.flairs[0]).toHaveProperty('backgroundColor', '#0079D3');
      expect(response.body.flairs[0]).toHaveProperty('textColor', '#FFFFFF');
    });

    test('Should fail if not moderator', async () => {
      const response = await request(app)
        .post('/api/communities/testcommunity/flairs')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          text: 'Test flair',
          backgroundColor: '#000000',
          textColor: '#FFFFFF'
        })
        .expect(403);

      expect(response.body.error).toContain('moderators');
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post('/api/communities/testcommunity/flairs')
        .send({
          text: 'Test flair',
          backgroundColor: '#000000',
          textColor: '#FFFFFF'
        })
        .expect(401);
    });

    test('Should allow adding multiple flairs', async () => {
      await request(app)
        .post('/api/communities/testcommunity/flairs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Discussion',
          backgroundColor: '#0079D3',
          textColor: '#FFFFFF'
        })
        .expect(200);

      const response = await request(app)
        .post('/api/communities/testcommunity/flairs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          text: 'Question',
          backgroundColor: '#FF4500',
          textColor: '#FFFFFF'
        })
        .expect(200);

      expect(response.body.flairs).toHaveLength(2);
    });
  });
});
