const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('../models/User');
const userRoutes = require('../routes/userRoutes');
const authRoutes = require('../routes/authRoutes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Test data
const validUserData = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'Test123Pass',
  displayName: 'Test User'
};

// Helper function to register and login user
const registerUser = async (userData = validUserData) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
  return response.body;
};

describe('Authentication Tests', () => {
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

  describe('POST /api/auth/register - User Registration', () => {
    test('Should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', validUserData.username);
      expect(response.body.user).toHaveProperty('email', validUserData.email);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user).toHaveProperty('karma');
    });

    test('Should return valid JWT token on registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('userId');
      expect(decoded.userId).toBe(response.body.user._id);
    });

    test('Should hash password before saving', async () => {
      await request(app)
        .post('/api/auth/register')
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
        .post('/api/auth/register')
        .send(minimalUser)
        .expect(201);

      expect(response.body.user.displayName).toBe(minimalUser.username);
      expect(response.body.user.avatar).toBe('');
      expect(response.body.user.savedPosts).toEqual([]);
    });

    test('Should fail with duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    test('Should fail with duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      const duplicateEmailUser = {
        username: 'different123',
        email: validUserData.email,
        password: 'Test123Pass'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateEmailUser)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    test('Should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    test('Should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, email: 'invalid-email' })
        .expect(400);

      expect(response.body.errors).toContain('Email must be a valid email address');
    });

    test('Should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ ...validUserData, password: 'weak' })
        .expect(400);

      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/auth/login - User Login', () => {
    test('Should login with valid credentials', async () => {
      // First register a user
      await registerUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('username', validUserData.username);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('Should return valid JWT token on login', async () => {
      const registered = await registerUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('userId');
      expect(decoded.userId).toBe(registered.user._id);
    });

    test('Should update lastActive on login', async () => {
      await registerUser();
      const originalUser = await User.findOne({ email: validUserData.email });
      const originalLastActive = originalUser.settings.lastActive;

      await new Promise(resolve => setTimeout(resolve, 100));

      await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: validUserData.password
        })
        .expect(200);

      const updatedUser = await User.findOne({ email: validUserData.email });
      expect(new Date(updatedUser.settings.lastActive).getTime()).toBeGreaterThan(
        new Date(originalLastActive).getTime()
      );
    });

    test('Should fail with incorrect password', async () => {
      await registerUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email,
          password: 'WrongPassword123'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    test('Should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Test123Pass'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    test('Should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    test('Should be case-insensitive for email', async () => {
      await registerUser();

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: validUserData.email.toUpperCase(),
          password: validUserData.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });
  });

  describe('GET /api/auth/me - Get Current User', () => {
    test('Should get current user with valid token', async () => {
      const registered = await registerUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registered.token}`)
        .expect(200);

      expect(response.body.user).toHaveProperty('username', validUserData.username);
      expect(response.body.user).toHaveProperty('email', validUserData.email);
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('Should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('Should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token_here')
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('Should fail with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('Should fail with token signed with wrong secret', async () => {
      const stolenToken = jwt.sign(
        { userId: new mongoose.Types.ObjectId() },
        'wrong_secret_key',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${stolenToken}`)
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('Should fail with malformed Authorization header', async () => {
      const registered = await registerUser();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', registered.token) // Missing "Bearer" prefix
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('Should fail if user has been deleted', async () => {
      const registered = await registerUser();

      // Delete the user
      await User.findByIdAndDelete(registered.user._id);

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registered.token}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('POST /api/auth/refresh - Refresh Token', () => {
    test('Should refresh token with valid token', async () => {
      const registered = await registerUser();

      // Wait a moment to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${registered.token}`)
        .expect(200);

      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(registered.token);

      // New token should be valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
      expect(decoded.userId).toBe(registered.user._id);
    });

    test('Should fail to refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.error).toBe('Access token required');
    });

    test('Should fail to refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid_token')
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('Should fail to refresh if user deleted', async () => {
      const registered = await registerUser();
      await User.findByIdAndDelete(registered.user._id);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${registered.token}`)
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });

  describe('Security Tests - Token Manipulation', () => {
    test('Should reject token with modified payload', async () => {
      // Create a token with a different user ID
      const modifiedToken = jwt.sign(
        { userId: new mongoose.Types.ObjectId().toString() }, // Different user ID
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${modifiedToken}`)
        .expect(404); // User not found because ID doesn't exist

      expect(response.body.error).toBe('User not found');
    });

    test('Should reject completely fabricated token', async () => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTYiLCJpYXQiOjE1MTYyMzkwMjJ9.FakeSignatureHere';

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${fakeToken}`)
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('Should handle token with missing userId claim', async () => {
      const invalidToken = jwt.sign(
        { someOtherField: 'value' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(404); // Returns 404 because userId is undefined

      expect(response.body.error).toBe('User not found');
    });

    test('Should reject token signed with different secret on /api/auth/me', async () => {
      const registered = await registerUser();
      
      // Create token with wrong secret using the registered user's ID
      const tokenWithWrongSecret = jwt.sign(
        { userId: registered.user._id },
        'completely_different_secret_key',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tokenWithWrongSecret}`)
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('Should reject token signed with different secret on protected update', async () => {
      const registered = await registerUser();
      
      // Create token with wrong secret
      const tokenWithWrongSecret = jwt.sign(
        { userId: registered.user._id },
        'another_wrong_secret',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .put(`/api/users/${registered.user._id}`)
        .set('Authorization', `Bearer ${tokenWithWrongSecret}`)
        .send({ displayName: 'Hacker Name' })
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
      
      // Verify the user was not updated
      const user = await User.findById(registered.user._id);
      expect(user.displayName).not.toBe('Hacker Name');
    });

    test('Should reject token signed with different secret on token refresh', async () => {
      const registered = await registerUser();
      
      // Create token with wrong secret
      const tokenWithWrongSecret = jwt.sign(
        { userId: registered.user._id },
        'wrong_refresh_secret',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${tokenWithWrongSecret}`)
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
    });

    test('Should reject token signed with different secret on delete', async () => {
      const registered = await registerUser();
      
      // Create token with wrong secret
      const tokenWithWrongSecret = jwt.sign(
        { userId: registered.user._id },
        'malicious_delete_secret',
        { expiresIn: '7d' }
      );

      const response = await request(app)
        .delete(`/api/users/${registered.user._id}`)
        .set('Authorization', `Bearer ${tokenWithWrongSecret}`)
        .expect(403);

      expect(response.body.error).toBe('Invalid or expired token');
      
      // Verify the user was not deleted
      const user = await User.findById(registered.user._id);
      expect(user).not.toBeNull();
    });
  });

  describe('User Profile Tests', () => {
    describe('GET /api/users/:userId - Get User by ID', () => {
      test('Should retrieve user by ID', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

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
        const registered = await registerUser();
        const userId = registered.user._id;

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
        await registerUser();

        const response = await request(app)
          .get(`/api/users/username/${validUserData.username}`)
          .expect(200);

        expect(response.body.user).toHaveProperty('username', validUserData.username);
        expect(response.body.user).toHaveProperty('email', validUserData.email);
        expect(response.body.user).not.toHaveProperty('password');
      });

      test('Should be case-sensitive for username lookup', async () => {
        await registerUser();

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

    describe('PUT /api/users/:userId - Update User (Protected)', () => {
      test('Should update user displayName with valid token', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .put(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${registered.token}`)
          .send({ displayName: 'Updated Name' })
          .expect(200);

        expect(response.body.user.displayName).toBe('Updated Name');
        expect(response.body.message).toBe('User updated successfully');
      });

      test('Should update user avatar', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;
        const avatarUrl = 'https://example.com/avatar.jpg';

        const response = await request(app)
          .put(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${registered.token}`)
          .send({ avatar: avatarUrl })
          .expect(200);

        expect(response.body.user.avatar).toBe(avatarUrl);
      });

      test('Should update both displayName and avatar', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .put(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${registered.token}`)
          .send({ 
            displayName: 'New Display', 
            avatar: 'https://example.com/new.jpg' 
          })
          .expect(200);

        expect(response.body.user.displayName).toBe('New Display');
        expect(response.body.user.avatar).toBe('https://example.com/new.jpg');
      });

      test('Should fail to update without token', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .put(`/api/users/${userId}`)
          .send({ displayName: 'Updated Name' })
          .expect(401);

        expect(response.body.error).toBe('Access token required');
      });

      test('Should fail with invalid token', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .put(`/api/users/${userId}`)
          .set('Authorization', 'Bearer invalid_token')
          .send({ displayName: 'Updated Name' })
          .expect(403);

        expect(response.body.error).toBe('Invalid or expired token');
      });

      test('Should fail with invalid avatar URL', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .put(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${registered.token}`)
          .send({ avatar: 'not-a-url' })
          .expect(400);

        expect(response.body.errors).toContain('Avatar must be a valid URL');
      });

      test('Should fail with displayName too long', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .put(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${registered.token}`)
          .send({ displayName: 'a'.repeat(31) })
          .expect(400);

        expect(response.body.errors).toContain('Display name must not exceed 30 characters');
      });
    });

    describe('DELETE /api/users/:userId - Delete User (Protected)', () => {
      test('Should delete user successfully with valid token', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .delete(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${registered.token}`)
          .expect(200);

        expect(response.body.message).toBe('User deleted successfully');

        const deletedUser = await User.findById(userId);
        expect(deletedUser).toBeNull();
      });

      test('Should fail to delete without token', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .delete(`/api/users/${userId}`)
          .expect(401);

        expect(response.body.error).toBe('Access token required');
      });

      test('Should fail to delete with invalid token', async () => {
        const registered = await registerUser();
        const userId = registered.user._id;

        const response = await request(app)
          .delete(`/api/users/${userId}`)
          .set('Authorization', 'Bearer invalid_token')
          .expect(403);

        expect(response.body.error).toBe('Invalid or expired token');
      });

      test('Should fail deleting non-existent user', async () => {
        const registered = await registerUser();
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
          .delete(`/api/users/${fakeId}`)
          .set('Authorization', `Bearer ${registered.token}`)
          .expect(404);

        expect(response.body.error).toBe('User not found');
      });
    });
  });
});
