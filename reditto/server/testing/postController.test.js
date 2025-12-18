const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
require('dotenv').config();

const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');
const postRoutes = require('../routes/postRoutes');
const communityRoutes = require('../routes/communityRoutes');
const authRoutes = require('../routes/authRoutes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);

describe('Post Controller Tests', () => {
  let authToken;
  let authToken2;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await Post.deleteMany({});
    await Community.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Post.deleteMany({});
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
    
    authToken = user1Response.body.token;

    const user2Response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser2',
        email: 'user2@test.com',
        password: 'Test123Pass'
      });
    
    authToken2 = user2Response.body.token;

    // Create test community
    await request(app)
      .post('/api/communities')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'testcommunity',
        description: 'A test community'
      });
    
  });

  describe('POST /api/posts - Create Post', () => {
    test('Should create a text post with valid data', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: 'This is a test post',
          community: 'testcommunity',
          type: 'text'
        })
        .expect(201);

      expect(response.body.message).toBe('Post created successfully');
      expect(response.body.post).toHaveProperty('title', 'Test Post');
      expect(response.body.post).toHaveProperty('content', 'This is a test post');
      expect(response.body.post).toHaveProperty('type', 'text');
      expect(response.body.post.author).toHaveProperty('username', 'testuser1');
      expect(response.body.post.community).toHaveProperty('name', 'testcommunity');
    });

    test('Should create a link post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Link Post',
          community: 'testcommunity',
          type: 'link',
          url: 'https://example.com'
        })
        .expect(201);

      expect(response.body.post).toHaveProperty('type', 'link');
      expect(response.body.post).toHaveProperty('url', 'https://example.com');
    });

    test('Should create an image post', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Image Post',
          community: 'testcommunity',
          type: 'image',
          imageUrl: 'https://example.com/image.jpg'
        })
        .expect(201);

      expect(response.body.post).toHaveProperty('type', 'image');
      expect(response.body.post).toHaveProperty('imageUrl', 'https://example.com/image.jpg');
    });

    test('Should default to text type', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Default Type Post',
          content: 'Content',
          community: 'testcommunity'
        })
        .expect(201);

      expect(response.body.post).toHaveProperty('type', 'text');
    });

    test('Should create post with flair', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Flair Post',
          community: 'testcommunity',
          flair: {
            text: 'Discussion',
            backgroundColor: '#0079D3',
            textColor: '#FFFFFF'
          }
        })
        .expect(201);

      expect(response.body.post.flair).toHaveProperty('text', 'Discussion');
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post('/api/posts')
        .send({
          title: 'Test Post',
          community: 'testcommunity'
        })
        .expect(401);
    });

    test('Should fail without title', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Content',
          community: 'testcommunity'
        })
        .expect(400);

      expect(response.body.error).toContain('title is required');
    });

    test('Should fail without community', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: 'Content'
        })
        .expect(400);

      expect(response.body.error).toContain('Community is required');
    });

    test('Should fail with non-existent community', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          community: 'nonexistent'
        })
        .expect(404);

      expect(response.body.error).toContain('Community not found');
    });

    test('Should fail link post without url', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Link Post',
          community: 'testcommunity',
          type: 'link'
        })
        .expect(400);

      expect(response.body.error).toContain('require a URL');
    });

    test('Should fail image post without imageUrl', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Image Post',
          community: 'testcommunity',
          type: 'image'
        })
        .expect(400);

      expect(response.body.error).toContain('require an image URL');
    });
  });

  describe('GET /api/posts - Get Posts', () => {
    beforeEach(async () => {
      // Create multiple posts
      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Post 1',
          content: 'Content 1',
          community: 'testcommunity',
          type: 'text'
        });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          title: 'Post 2',
          content: 'Content 2',
          community: 'testcommunity',
          type: 'link',
          url: 'https://example.com'
        });

      await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Post 3',
          content: 'Content 3',
          community: 'testcommunity',
          type: 'image',
          imageUrl: 'https://example.com/image.jpg'
        });
    });

    test('Should get all posts', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.posts).toHaveLength(3);
      expect(response.body.pagination).toHaveProperty('total', 3);
    });

    test('Should filter posts by community', async () => {
      const response = await request(app)
        .get('/api/posts?community=testcommunity')
        .expect(200);

      expect(response.body.posts).toHaveLength(3);
      response.body.posts.forEach(post => {
        expect(post.community.name).toBe('testcommunity');
      });
    });

    test('Should filter posts by author', async () => {
      const response = await request(app)
        .get('/api/posts?author=testuser1')
        .expect(200);

      expect(response.body.posts).toHaveLength(2);
      response.body.posts.forEach(post => {
        expect(post.author.username).toBe('testuser1');
      });
    });

    test('Should filter posts by type', async () => {
      const response = await request(app)
        .get('/api/posts?type=text')
        .expect(200);

      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].type).toBe('text');
    });

    test('Should support pagination', async () => {
      const response = await request(app)
        .get('/api/posts?page=1&limit=2')
        .expect(200);

      expect(response.body.posts).toHaveLength(2);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 2);
      expect(response.body.pagination).toHaveProperty('pages', 2);
    });

    test('Should not return deleted posts', async () => {
      // Create and delete a post
      const createResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'To Delete',
          community: 'testcommunity'
        });

      const postId = createResponse.body.post._id;

      await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.posts).toHaveLength(3); // Original 3, not including deleted
    });

    test('Should populate author and community details', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      const post = response.body.posts[0];
      expect(post.author).toHaveProperty('username');
      expect(post.author).toHaveProperty('displayName');
      expect(post.community).toHaveProperty('name');
    });
  });

  describe('GET /api/posts/:postId - Get Post by ID', () => {
    let testPost;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: 'Content',
          community: 'testcommunity'
        });
      
      testPost = response.body.post;
    });

    test('Should get post by ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost._id}`)
        .expect(200);

      expect(response.body.post).toHaveProperty('title', 'Test Post');
      expect(response.body.post).toHaveProperty('content', 'Content');
    });

    test('Should populate author and community', async () => {
      const response = await request(app)
        .get(`/api/posts/${testPost._id}`)
        .expect(200);

      expect(response.body.post.author).toHaveProperty('username', 'testuser1');
      expect(response.body.post.author).toHaveProperty('karma');
      expect(response.body.post.community).toHaveProperty('name', 'testcommunity');
      expect(response.body.post.community).toHaveProperty('memberCount');
    });

    test('Should fail with invalid post ID', async () => {
      const response = await request(app)
        .get('/api/posts/invalid_id')
        .expect(400);

      expect(response.body.error).toContain('Invalid post ID');
    });

    test('Should fail with non-existent post ID', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);
    });

    test('Should not return deleted post to non-author', async () => {
      await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .get(`/api/posts/${testPost._id}`)
        .expect(404);
    });
  });

  describe('PUT /api/posts/:postId - Update Post', () => {
    let testPost;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Original Title',
          content: 'Original content',
          community: 'testcommunity'
        });
      
      testPost = response.body.post;
    });

    test('Should update post title', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title'
        })
        .expect(200);

      expect(response.body.message).toBe('Post updated successfully');
      expect(response.body.post.title).toBe('Updated Title');
    });

    test('Should update post content and set editedAt', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated content'
        })
        .expect(200);

      expect(response.body.post.content).toBe('Updated content');
      expect(response.body.post).toHaveProperty('editedAt');
    });

    test('Should update post flair', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          flair: {
            text: 'Updated',
            backgroundColor: '#FF0000',
            textColor: '#FFFFFF'
          }
        })
        .expect(200);

      expect(response.body.post.flair.text).toBe('Updated');
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .put(`/api/posts/${testPost._id}`)
        .send({
          title: 'Hacked'
        })
        .expect(401);
    });

    test('Should fail if not author', async () => {
      const response = await request(app)
        .put(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          title: 'Hacked Title'
        })
        .expect(403);

      expect(response.body.error).toContain('author');
    });

    test('Should fail with invalid post ID', async () => {
      await request(app)
        .put('/api/posts/invalid_id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated'
        })
        .expect(400);
    });

    test('Should fail with non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .put(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated'
        })
        .expect(404);
    });

    test('Should fail to update deleted post', async () => {
      await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .put(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated'
        })
        .expect(400);

      expect(response.body.error).toContain('deleted');
    });
  });

  describe('DELETE /api/posts/:postId - Delete Post', () => {
    let testPost;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          content: 'Content',
          community: 'testcommunity'
        });
      
      testPost = response.body.post;
    });

    test('Should delete post as author', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Post deleted successfully');

      // Verify soft delete
      const post = await Post.findById(testPost._id);
      expect(post.flags.isDeleted).toBe(true);
    });

    test('Should delete post as community moderator', async () => {
      // Create post by user2
      const postResponse = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          title: 'User2 Post',
          community: 'testcommunity'
        });

      const user2Post = postResponse.body.post;

      // Delete as moderator (testuser1 is creator/moderator of testcommunity)
      const response = await request(app)
        .delete(`/api/posts/${user2Post._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Post deleted successfully');
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .expect(401);
    });

    test('Should fail if not author or moderator', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(403);

      expect(response.body.error).toContain('author or moderators');
    });

    test('Should fail with invalid post ID', async () => {
      await request(app)
        .delete('/api/posts/invalid_id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('Should fail with non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/posts/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/posts/:postId/upvote - Upvote Post', () => {
    let testPost;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          community: 'testcommunity'
        });
      
      testPost = response.body.post;
    });

    test('Should upvote post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.message).toBe('Post upvoted successfully');
      expect(response.body.voteCount).toBe(1);
      expect(response.body.votes.upvotes).toBe(1);
      expect(response.body.votes.downvotes).toBe(0);
    });

    test('Should remove downvote when upvoting', async () => {
      // First downvote
      await request(app)
        .post(`/api/posts/${testPost._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Then upvote
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.voteCount).toBe(1);
      expect(response.body.votes.upvotes).toBe(1);
      expect(response.body.votes.downvotes).toBe(0);
    });

    test('Should not duplicate upvote', async () => {
      await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      const response = await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.votes.upvotes).toBe(1);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .expect(401);
    });

    test('Should fail with invalid post ID', async () => {
      await request(app)
        .post('/api/posts/invalid_id/upvote')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('Should fail to upvote deleted post', async () => {
      await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(400);

      expect(response.body.error).toContain('deleted');
    });
  });

  describe('POST /api/posts/:postId/downvote - Downvote Post', () => {
    let testPost;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          community: 'testcommunity'
        });
      
      testPost = response.body.post;
    });

    test('Should downvote post', async () => {
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.message).toBe('Post downvoted successfully');
      expect(response.body.voteCount).toBe(-1);
      expect(response.body.votes.upvotes).toBe(0);
      expect(response.body.votes.downvotes).toBe(1);
    });

    test('Should remove upvote when downvoting', async () => {
      // First upvote
      await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Then downvote
      const response = await request(app)
        .post(`/api/posts/${testPost._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.voteCount).toBe(-1);
      expect(response.body.votes.upvotes).toBe(0);
      expect(response.body.votes.downvotes).toBe(1);
    });

    test('Should not duplicate downvote', async () => {
      await request(app)
        .post(`/api/posts/${testPost._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      const response = await request(app)
        .post(`/api/posts/${testPost._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.votes.downvotes).toBe(1);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post(`/api/posts/${testPost._id}/downvote`)
        .expect(401);
    });
  });

  describe('DELETE /api/posts/:postId/vote - Remove Vote', () => {
    let testPost;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          community: 'testcommunity'
        });
      
      testPost = response.body.post;
    });

    test('Should remove upvote', async () => {
      // First upvote
      await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Remove vote
      const response = await request(app)
        .delete(`/api/posts/${testPost._id}/vote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.message).toBe('Vote removed successfully');
      expect(response.body.voteCount).toBe(0);
      expect(response.body.votes.upvotes).toBe(0);
    });

    test('Should remove downvote', async () => {
      // First downvote
      await request(app)
        .post(`/api/posts/${testPost._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Remove vote
      const response = await request(app)
        .delete(`/api/posts/${testPost._id}/vote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.voteCount).toBe(0);
      expect(response.body.votes.downvotes).toBe(0);
    });

    test('Should work even if no vote exists', async () => {
      const response = await request(app)
        .delete(`/api/posts/${testPost._id}/vote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.voteCount).toBe(0);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .delete(`/api/posts/${testPost._id}/vote`)
        .expect(401);
    });
  });

  describe('Complex Voting Scenarios', () => {
    let testPost;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Post',
          community: 'testcommunity'
        });
      
      testPost = response.body.post;
    });

    test('Should calculate correct vote count with multiple users', async () => {
      // Create third user
      const user3Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser3',
          email: 'user3@test.com',
          password: 'Test123Pass'
        });
      const authToken3 = user3Response.body.token;

      // User 2 upvotes
      await request(app)
        .post(`/api/posts/${testPost._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // User 3 downvotes
      await request(app)
        .post(`/api/posts/${testPost._id}/downvote`)
        .set('Authorization', `Bearer ${authToken3}`);

      // Check final vote count
      const response = await request(app)
        .get(`/api/posts/${testPost._id}`)
        .expect(200);

      expect(response.body.post.voteCount).toBe(0); // 1 upvote - 1 downvote
    });
  });
});
