const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
require('dotenv').config();

const User = require('../models/User');
const Community = require('../models/Community');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const commentRoutes = require('../routes/commentRoutes');
const postRoutes = require('../routes/postRoutes');
const communityRoutes = require('../routes/communityRoutes');
const authRoutes = require('../routes/authRoutes');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);

describe('Comment Controller Tests', () => {
  let authToken;
  let authToken2;
  let testPost;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  afterAll(async () => {
    await Comment.deleteMany({});
    await Post.deleteMany({});
    await Community.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Comment.deleteMany({});
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

    // Create test post
    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Post',
        content: 'This is a test post',
        community: 'testcommunity'
      });
    
    testPost = postResponse.body.post;
  });

  describe('POST /api/comments - Create Comment', () => {
    test('Should create a comment with valid data', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a test comment',
          post: testPost._id
        })
        .expect(201);

      expect(response.body.message).toBe('Comment created successfully');
      expect(response.body.comment).toHaveProperty('content', 'This is a test comment');
      expect(response.body.comment.author).toHaveProperty('username', 'testuser1');
      expect(response.body.comment.post).toHaveProperty('_id', testPost._id);
      expect(response.body.comment.voteCount).toBe(0);
      expect(response.body.comment.replyCount).toBe(0);
    });

    test('Should create a reply to another comment', async () => {
      // Create parent comment
      const parentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Parent comment',
          post: testPost._id
        });

      const parentComment = parentResponse.body.comment;

      // Create reply
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Reply to parent',
          post: testPost._id,
          parentComment: parentComment._id
        })
        .expect(201);

      expect(response.body.comment.content).toBe('Reply to parent');
      expect(response.body.comment.parentComment).toHaveProperty('_id', parentComment._id);
    });

    test('Should increment post commentCount', async () => {
      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'First comment',
          post: testPost._id
        });

      const postResponse = await request(app)
        .get(`/api/posts/${testPost._id}`);

      expect(postResponse.body.post.commentCount).toBe(1);
    });

    test('Should increment parent comment replyCount', async () => {
      // Create parent comment
      const parentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Parent comment',
          post: testPost._id
        });

      const parentComment = parentResponse.body.comment;

      // Create reply
      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Reply',
          post: testPost._id,
          parentComment: parentComment._id
        });

      // Get updated parent comment
      const updatedParent = await Comment.findById(parentComment._id);
      expect(updatedParent.replyCount).toBe(1);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post('/api/comments')
        .send({
          content: 'Test comment',
          post: testPost._id
        })
        .expect(401);
    });

    test('Should fail without content', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          post: testPost._id
        })
        .expect(400);

      expect(response.body.errors).toContain('Comment content is required');
    });

    test('Should fail with empty content', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '   ',
          post: testPost._id
        })
        .expect(400);

      expect(response.body.errors).toContain('Comment content is required');
    });

    test('Should fail with content exceeding 10000 characters', async () => {
      const longContent = 'a'.repeat(10001);
      
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent,
          post: testPost._id
        })
        .expect(400);

      expect(response.body.errors).toContain('Comment content must not exceed 10,000 characters');
    });

    test('Should fail without post ID', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment'
        })
        .expect(400);

      expect(response.body.errors).toContain('Valid post ID is required');
    });

    test('Should fail with invalid post ID', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment',
          post: 'invalid_id'
        })
        .expect(400);

      expect(response.body.errors).toContain('Valid post ID is required');
    });

    test('Should fail with non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment',
          post: fakeId
        })
        .expect(404);

      expect(response.body.error).toContain('Post not found');
    });

    test('Should fail when commenting on deleted post', async () => {
      // Delete the post
      await request(app)
        .delete(`/api/posts/${testPost._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Comment on deleted post',
          post: testPost._id
        })
        .expect(400);

      expect(response.body.error).toContain('Cannot comment on deleted post');
    });

    test('Should fail with invalid parent comment ID', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply',
          post: testPost._id,
          parentComment: 'invalid_id'
        })
        .expect(400);

      expect(response.body.errors).toContain('Invalid parent comment ID format');
    });

    test('Should fail with non-existent parent comment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply',
          post: testPost._id,
          parentComment: fakeId
        })
        .expect(404);

      expect(response.body.error).toContain('Parent comment not found');
    });

    test('Should fail when parent comment belongs to different post', async () => {
      // Create another post
      const post2Response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Second Post',
          content: 'Another post',
          community: 'testcommunity'
        });

      const post2 = post2Response.body.post;

      // Create comment on first post
      const commentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Comment on first post',
          post: testPost._id
        });

      const comment = commentResponse.body.comment;

      // Try to reply on second post with parent from first post
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Invalid reply',
          post: post2._id,
          parentComment: comment._id
        })
        .expect(400);

      expect(response.body.error).toContain('Parent comment does not belong to this post');
    });

    test('Should fail when replying to deleted comment', async () => {
      // Create and delete parent comment
      const parentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Parent comment',
          post: testPost._id
        });

      const parentComment = parentResponse.body.comment;

      await request(app)
        .delete(`/api/comments/${parentComment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Reply to deleted',
          post: testPost._id,
          parentComment: parentComment._id
        })
        .expect(400);

      expect(response.body.error).toContain('Cannot reply to deleted comment');
    });
  });

  describe('GET /api/comments/post/:postId - Get Comments by Post', () => {
    beforeEach(async () => {
      // Create multiple comments
      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'First comment',
          post: testPost._id
        });

      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Second comment',
          post: testPost._id
        });

      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Third comment',
          post: testPost._id
        });
    });

    test('Should get all comments for a post', async () => {
      const response = await request(app)
        .get(`/api/comments/post/${testPost._id}`)
        .expect(200);

      expect(response.body.comments).toHaveLength(3);
      expect(response.body.pagination.totalComments).toBe(3);
    });

    test('Should populate author details', async () => {
      const response = await request(app)
        .get(`/api/comments/post/${testPost._id}`)
        .expect(200);

      expect(response.body.comments[0].author).toHaveProperty('username');
      expect(response.body.comments[0].author).toHaveProperty('karma');
    });

    test('Should support pagination', async () => {
      const response = await request(app)
        .get(`/api/comments/post/${testPost._id}?page=1&limit=2`)
        .expect(200);

      expect(response.body.comments).toHaveLength(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    test('Should sort by createdAt by default', async () => {
      const response = await request(app)
        .get(`/api/comments/post/${testPost._id}`)
        .expect(200);

      // Most recent first
      expect(response.body.comments[0].content).toBe('Third comment');
      expect(response.body.comments[2].content).toBe('First comment');
    });

    test('Should sort by voteCount when specified', async () => {
      // Get comments and upvote the second one
      const commentsResponse = await request(app)
        .get(`/api/comments/post/${testPost._id}`);
      
      const comments = commentsResponse.body.comments;
      const secondComment = comments.find(c => c.content === 'Second comment');

      await request(app)
        .post(`/api/comments/${secondComment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get(`/api/comments/post/${testPost._id}?sortBy=voteCount`)
        .expect(200);

      expect(response.body.comments[0].content).toBe('Second comment');
      expect(response.body.comments[0].voteCount).toBe(1);
    });

    test('Should filter top-level comments when no parentComment specified', async () => {
      // Create a reply
      const commentsResponse = await request(app)
        .get(`/api/comments/post/${testPost._id}`);
      
      const parentComment = commentsResponse.body.comments[0];

      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply comment',
          post: testPost._id,
          parentComment: parentComment._id
        });

      const response = await request(app)
        .get(`/api/comments/post/${testPost._id}`)
        .expect(200);

      // Should only return top-level comments (not replies)
      expect(response.body.comments).toHaveLength(3);
      expect(response.body.comments.every(c => c.parentComment === null)).toBe(true);
    });

    test('Should filter replies by parentComment', async () => {
      // Create a reply
      const commentsResponse = await request(app)
        .get(`/api/comments/post/${testPost._id}`);
      
      const parentComment = commentsResponse.body.comments[0];

      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Reply 1',
          post: testPost._id,
          parentComment: parentComment._id
        });

      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Reply 2',
          post: testPost._id,
          parentComment: parentComment._id
        });

      const response = await request(app)
        .get(`/api/comments/post/${testPost._id}?parentComment=${parentComment._id}`)
        .expect(200);

      expect(response.body.comments).toHaveLength(2);
      expect(response.body.comments[0].content).toContain('Reply');
    });

    test('Should not return deleted comments', async () => {
      const commentsResponse = await request(app)
        .get(`/api/comments/post/${testPost._id}`);
      
      const commentToDelete = commentsResponse.body.comments[0];

      await request(app)
        .delete(`/api/comments/${commentToDelete._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .get(`/api/comments/post/${testPost._id}`)
        .expect(200);

      expect(response.body.comments).toHaveLength(2);
    });

    test('Should fail with invalid post ID', async () => {
      const response = await request(app)
        .get('/api/comments/post/invalid_id')
        .expect(400);

      expect(response.body.error).toContain('Invalid post ID');
    });

    test('Should fail with non-existent post', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/api/comments/post/${fakeId}`)
        .expect(404);

      expect(response.body.error).toContain('Post not found');
    });
  });

  describe('GET /api/comments/:commentId - Get Comment by ID', () => {
    let testComment;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment',
          post: testPost._id
        });
      
      testComment = response.body.comment;
    });

    test('Should get comment by ID', async () => {
      const response = await request(app)
        .get(`/api/comments/${testComment._id}`)
        .expect(200);

      expect(response.body.comment).toHaveProperty('content', 'Test comment');
      expect(response.body.comment.author).toHaveProperty('username', 'testuser1');
    });

    test('Should populate author, post, and parentComment', async () => {
      // Create a reply
      const replyResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Reply comment',
          post: testPost._id,
          parentComment: testComment._id
        });

      const reply = replyResponse.body.comment;

      const response = await request(app)
        .get(`/api/comments/${reply._id}`)
        .expect(200);

      expect(response.body.comment.author).toHaveProperty('username');
      expect(response.body.comment.post).toHaveProperty('title');
      expect(response.body.comment.parentComment).toHaveProperty('content');
    });

    test('Should fail with invalid comment ID', async () => {
      const response = await request(app)
        .get('/api/comments/invalid_id')
        .expect(400);

      expect(response.body.error).toContain('Invalid comment ID');
    });

    test('Should fail with non-existent comment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/comments/${fakeId}`)
        .expect(404);
    });

    test('Should not return deleted comment to non-author', async () => {
      await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app)
        .get(`/api/comments/${testComment._id}`)
        .expect(404);
    });
  });

  describe('PUT /api/comments/:commentId - Update Comment', () => {
    let testComment;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Original comment',
          post: testPost._id
        });
      
      testComment = response.body.comment;
    });

    test('Should update comment content', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated comment'
        })
        .expect(200);

      expect(response.body.message).toBe('Comment updated successfully');
      expect(response.body.comment.content).toBe('Updated comment');
      expect(response.body.comment.flags.isEdited).toBe(true);
      expect(response.body.comment.editedAt).toBeDefined();
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .put(`/api/comments/${testComment._id}`)
        .send({
          content: 'Hacked content'
        })
        .expect(401);
    });

    test('Should fail if not author', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Hacked content'
        })
        .expect(403);

      expect(response.body.error).toContain('You can only edit your own comments');
    });

    test('Should fail without content', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.errors).toContain('Content is required for update');
    });

    test('Should fail with empty content', async () => {
      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '   '
        })
        .expect(400);

      expect(response.body.errors).toContain('Content cannot be empty');
    });

    test('Should fail with content exceeding 10000 characters', async () => {
      const longContent = 'a'.repeat(10001);
      
      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: longContent
        })
        .expect(400);

      expect(response.body.errors).toContain('Content must not exceed 10,000 characters');
    });

    test('Should fail with invalid comment ID', async () => {
      await request(app)
        .put('/api/comments/invalid_id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated'
        })
        .expect(400);
    });

    test('Should fail with non-existent comment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .put(`/api/comments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated'
        })
        .expect(404);
    });

    test('Should fail to update deleted comment', async () => {
      await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Updated'
        })
        .expect(400);

      expect(response.body.error).toContain('Cannot edit deleted comment');
    });
  });

  describe('DELETE /api/comments/:commentId - Delete Comment', () => {
    let testComment;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment',
          post: testPost._id
        });
      
      testComment = response.body.comment;
    });

    test('Should delete comment as author', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Comment deleted successfully');

      // Verify soft delete
      const comment = await Comment.findById(testComment._id);
      expect(comment.flags.isDeleted).toBe(true);
      expect(comment.content).toBe('[deleted]');
    });

    test('Should delete comment as post author', async () => {
      // Create comment by user2 on user1's post
      const commentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'User2 comment',
          post: testPost._id
        });

      const user2Comment = commentResponse.body.comment;

      // Delete as post author (user1)
      const response = await request(app)
        .delete(`/api/comments/${user2Comment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Comment deleted successfully');
    });

    test('Should delete comment as community moderator', async () => {
      // Create comment by user2
      const commentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'User2 comment',
          post: testPost._id
        });

      const user2Comment = commentResponse.body.comment;

      // Delete as moderator (user1 created the community)
      const response = await request(app)
        .delete(`/api/comments/${user2Comment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toBe('Comment deleted successfully');
    });

    test('Should decrement post commentCount', async () => {
      await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const postResponse = await request(app)
        .get(`/api/posts/${testPost._id}`);

      expect(postResponse.body.post.commentCount).toBe(0);
    });

    test('Should decrement parent comment replyCount', async () => {
      // Create reply
      const replyResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'Reply',
          post: testPost._id,
          parentComment: testComment._id
        });

      const reply = replyResponse.body.comment;

      // Verify replyCount increased
      const parentBefore = await Comment.findById(testComment._id);
      expect(parentBefore.replyCount).toBe(1);

      // Delete reply
      await request(app)
        .delete(`/api/comments/${reply._id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Verify replyCount decreased
      const parentAfter = await Comment.findById(testComment._id);
      expect(parentAfter.replyCount).toBe(0);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .expect(401);
    });

    test('Should fail if not author, post author, or moderator', async () => {
      // Create third user
      const user3Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser3',
          email: 'user3@test.com',
          password: 'Test123Pass'
        });

      const authToken3 = user3Response.body.token;

      const response = await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken3}`)
        .expect(403);

      expect(response.body.error).toContain('You can only delete your own comments');
    });

    test('Should fail with invalid comment ID', async () => {
      await request(app)
        .delete('/api/comments/invalid_id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('Should fail with non-existent comment', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      await request(app)
        .delete(`/api/comments/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/comments/:commentId/upvote - Upvote Comment', () => {
    let testComment;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment',
          post: testPost._id
        });
      
      testComment = response.body.comment;
    });

    test('Should upvote comment', async () => {
      const response = await request(app)
        .post(`/api/comments/${testComment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.message).toBe('Comment upvoted successfully');
      expect(response.body.voteCount).toBe(1);
      expect(response.body.votes.upvotes).toBe(1);
      expect(response.body.votes.downvotes).toBe(0);
    });

    test('Should remove downvote when upvoting', async () => {
      // First downvote
      await request(app)
        .post(`/api/comments/${testComment._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Then upvote
      const response = await request(app)
        .post(`/api/comments/${testComment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.voteCount).toBe(1);
      expect(response.body.votes.upvotes).toBe(1);
      expect(response.body.votes.downvotes).toBe(0);
    });

    test('Should not duplicate upvote', async () => {
      await request(app)
        .post(`/api/comments/${testComment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      const response = await request(app)
        .post(`/api/comments/${testComment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.votes.upvotes).toBe(1);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post(`/api/comments/${testComment._id}/upvote`)
        .expect(401);
    });

    test('Should fail with invalid comment ID', async () => {
      await request(app)
        .post('/api/comments/invalid_id/upvote')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    test('Should fail to upvote deleted comment', async () => {
      await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const response = await request(app)
        .post(`/api/comments/${testComment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(400);

      expect(response.body.error).toContain('Cannot vote on deleted comment');
    });
  });

  describe('POST /api/comments/:commentId/downvote - Downvote Comment', () => {
    let testComment;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment',
          post: testPost._id
        });
      
      testComment = response.body.comment;
    });

    test('Should downvote comment', async () => {
      const response = await request(app)
        .post(`/api/comments/${testComment._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.message).toBe('Comment downvoted successfully');
      expect(response.body.voteCount).toBe(-1);
      expect(response.body.votes.upvotes).toBe(0);
      expect(response.body.votes.downvotes).toBe(1);
    });

    test('Should remove upvote when downvoting', async () => {
      // First upvote
      await request(app)
        .post(`/api/comments/${testComment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Then downvote
      const response = await request(app)
        .post(`/api/comments/${testComment._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.voteCount).toBe(-1);
      expect(response.body.votes.upvotes).toBe(0);
      expect(response.body.votes.downvotes).toBe(1);
    });

    test('Should not duplicate downvote', async () => {
      await request(app)
        .post(`/api/comments/${testComment._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      const response = await request(app)
        .post(`/api/comments/${testComment._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.votes.downvotes).toBe(1);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .post(`/api/comments/${testComment._id}/downvote`)
        .expect(401);
    });
  });

  describe('DELETE /api/comments/:commentId/vote - Remove Vote', () => {
    let testComment;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment',
          post: testPost._id
        });
      
      testComment = response.body.comment;
    });

    test('Should remove upvote', async () => {
      // First upvote
      await request(app)
        .post(`/api/comments/${testComment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Remove vote
      const response = await request(app)
        .delete(`/api/comments/${testComment._id}/vote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.message).toBe('Vote removed successfully');
      expect(response.body.voteCount).toBe(0);
      expect(response.body.votes.upvotes).toBe(0);
    });

    test('Should remove downvote', async () => {
      // First downvote
      await request(app)
        .post(`/api/comments/${testComment._id}/downvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      // Remove vote
      const response = await request(app)
        .delete(`/api/comments/${testComment._id}/vote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.voteCount).toBe(0);
      expect(response.body.votes.downvotes).toBe(0);
    });

    test('Should work even if no vote exists', async () => {
      const response = await request(app)
        .delete(`/api/comments/${testComment._id}/vote`)
        .set('Authorization', `Bearer ${authToken2}`)
        .expect(200);

      expect(response.body.voteCount).toBe(0);
    });

    test('Should fail without authentication', async () => {
      await request(app)
        .delete(`/api/comments/${testComment._id}/vote`)
        .expect(401);
    });
  });

  describe('Complex Comment Scenarios', () => {
    test('Should handle multiple levels of nested replies', async () => {
      // Create top-level comment
      const comment1Response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Top level comment',
          post: testPost._id
        });

      const comment1 = comment1Response.body.comment;

      // Create first-level reply
      const comment2Response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({
          content: 'First level reply',
          post: testPost._id,
          parentComment: comment1._id
        });

      const comment2 = comment2Response.body.comment;

      // Create second-level reply
      await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Second level reply',
          post: testPost._id,
          parentComment: comment2._id
        });

      // Verify structure
      const topLevel = await Comment.findById(comment1._id);
      const firstLevel = await Comment.findById(comment2._id);

      expect(topLevel.replyCount).toBe(1);
      expect(firstLevel.replyCount).toBe(1);
    });

    test('Should calculate correct vote count with multiple voters', async () => {
      const commentResponse = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test comment',
          post: testPost._id
        });

      const comment = commentResponse.body.comment;

      // Create third user
      const user3Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser3',
          email: 'user3@test.com',
          password: 'Test123Pass'
        });

      const authToken3 = user3Response.body.token;

      // Multiple votes
      await request(app)
        .post(`/api/comments/${comment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken2}`);

      await request(app)
        .post(`/api/comments/${comment._id}/upvote`)
        .set('Authorization', `Bearer ${authToken3}`);

      await request(app)
        .post(`/api/comments/${comment._id}/downvote`)
        .set('Authorization', `Bearer ${authToken}`);

      const updatedComment = await Comment.findById(comment._id);
      expect(updatedComment.voteCount).toBe(1); // 2 upvotes - 1 downvote
    });
  });
});
