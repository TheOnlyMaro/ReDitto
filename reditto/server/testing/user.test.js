const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/User');
const userRoutes = require('../routes/userRoutes');
const { hashPassword, validateObjectId } = require('../middleware/validation');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

// Test data
const validUserData = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'Test123Pass',
  displayName: 'Test User'
};

describe('User API Tests', () => {
  beforeAll(async () => {
    const testUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/reditto-test';
    await mongoose.connect(testUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users collection before each test
    await User.deleteMany({});
  });

  describe('POST /api/users - Create User', () => {
    test('Should create a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(201);

      expect(response.body.message).toBe('User created successfully');
      expect(response.body.user).toHaveProperty('username', validUserData.username);
      expect(response.body.user).toHaveProperty('email', validUserData.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user).toHaveProperty('karma');
      expect(response.body.user.karma.post).toBe(0);
      expect(response.body.user.karma.comment).toBe(0);
    });

    test('Should hash password before saving', async () => {
      await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(201);

      const user = await User.findOne({ username: validUserData.username });
      expect(user.password).not.toBe(validUserData.password);
      
      const isMatch = await bcrypt.compare(validUserData.password, user.password);
      expect(isMatch).toBe(true);
    });

    test('Should create user with default values', async () => {
      const minimalUser = {
        username: 'minimal123',
        email: 'minimal@test.com',
        password: 'Test123Pass'
      };

      const response = await request(app)
        .post('/api/users')
        .send(minimalUser)
        .expect(201);

      expect(response.body.user.displayName).toBe(minimalUser.username);
      expect(response.body.user.avatar).toBe('');
      expect(response.body.user.savedPosts).toEqual([]);
      expect(response.body.user.communities.joined).toEqual([]);
    });

    test('Should fail with duplicate username', async () => {
      await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(201);

      const response = await request(app)
        .post('/api/users')
        .send(validUserData)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    test('Should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('Should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ ...validUserData, email: 'invalid-email' })
        .expect(400);

      expect(response.body.errors).toContain('Email must be a valid email address');
    });

    test('Should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ ...validUserData, password: 'weak' })
        .expect(400);

      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/:userId - Get User by ID', () => {
    test('Should retrieve user by ID', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('username', validUserData.username);
      expect(response.body.user).toHaveProperty('email', validUserData.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).toHaveProperty('createdAt');
      expect(response.body.user).toHaveProperty('updatedAt');
    });

    test('Should retrieve user with all fields populated', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('karma');
      expect(response.body.user).toHaveProperty('communities');
      expect(response.body.user).toHaveProperty('savedPosts');
      expect(response.body.user).toHaveProperty('followers');
      expect(response.body.user).toHaveProperty('following');
    });

    test('Should fail with invalid ObjectId', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Invalid ID format');
    });

    test('Should fail with non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/users/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /api/users/username/:username - Get User by Username', () => {
    test('Should retrieve user by username', async () => {
      await request(app)
        .post('/api/users')
        .send(validUserData);

      const response = await request(app)
        .get(`/api/users/username/${validUserData.username}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('username', validUserData.username);
      expect(response.body.user).toHaveProperty('email', validUserData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('Should be case-sensitive for username lookup', async () => {
      await request(app)
        .post('/api/users')
        .send(validUserData);

      const response = await request(app)
        .get(`/api/users/username/${validUserData.username.toUpperCase()}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    test('Should fail with non-existent username', async () => {
      const response = await request(app)
        .get('/api/users/username/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('PUT /api/users/:userId - Update User', () => {
    test('Should update user displayName', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ displayName: 'Updated Name' })
        .expect(200);

      expect(response.body.user.displayName).toBe('Updated Name');
      expect(response.body.message).toBe('User updated successfully');
    });

    test('Should update user avatar', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;
      const avatarUrl = 'https://example.com/avatar.jpg';

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ avatar: avatarUrl })
        .expect(200);

      expect(response.body.user.avatar).toBe(avatarUrl);
    });

    test('Should update both displayName and avatar', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ 
          displayName: 'New Display', 
          avatar: 'https://example.com/new.jpg' 
        })
        .expect(200);

      expect(response.body.user.displayName).toBe('New Display');
      expect(response.body.user.avatar).toBe('https://example.com/new.jpg');
    });

    test('Should update lastActive timestamp', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;
      const originalLastActive = createResponse.body.user.settings.lastActive;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app)
        .put(`/api/users/${userId}`)
        .send({ displayName: 'Updated' })
        .expect(200);

      const updatedUser = await User.findById(userId);
      expect(new Date(updatedUser.settings.lastActive).getTime()).toBeGreaterThan(
        new Date(originalLastActive).getTime()
      );
    });

    test('Should fail with invalid avatar URL', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ avatar: 'not-a-url' })
        .expect(400);

      expect(response.body.errors).toContain('Avatar must be a valid URL');
    });

    test('Should fail with displayName too long', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({ displayName: 'a'.repeat(31) })
        .expect(400);

      expect(response.body.errors).toContain('Display name must not exceed 30 characters');
    });
  });

  describe('DELETE /api/users/:userId - Delete User', () => {
    test('Should delete user successfully', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send(validUserData);

      const userId = createResponse.body.user._id;

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.message).toBe('User deleted successfully');

      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });

    test('Should fail deleting non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/users/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });
});

describe('Validation Middleware Tests', () => {
  describe('validateObjectId', () => {
    test('Should pass with valid ObjectId', () => {
      const req = { params: { userId: '507f1f77bcf86cd799439011' } };
      const res = {};
      const next = jest.fn();

      validateObjectId('userId')(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('Should fail with invalid ObjectId', () => {
      const req = { params: { userId: 'invalid-id' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      validateObjectId('userId')(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('hashPassword', () => {
    test('Should hash password in request body', async () => {
      const password = 'Test123Pass';
      const req = { body: { password } };
      const res = {};
      const next = jest.fn();

      await hashPassword(req, res, next);

      expect(req.body.password).not.toBe(password);
      expect(req.body.password.length).toBeGreaterThan(password.length);
      
      const isMatch = await bcrypt.compare(password, req.body.password);
      expect(isMatch).toBe(true);
      expect(next).toHaveBeenCalled();
    });
  });
});
