# ReDitto API Documentation

This document provides comprehensive documentation for all ReDitto API endpoints.

## Base URL

```
Development: http://localhost:5000/api
```

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Authentication Routes

Base path: `/api/auth`

### Register User

Creates a new user account.

**Endpoint:** `POST /register`

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "string (required, 3-20 chars, alphanumeric + underscore)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars, must contain uppercase, lowercase, number)",
  "displayName": "string (optional, max 30 chars)"
}
```

**Success Response (201):**
```json
{
  "token": "jwt_token_string",
  "user": {
    "_id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User",
    "karma": {
      "postKarma": 0,
      "commentKarma": 0
    },
    "communities": {
      "created": [],
      "joined": [],
      "moderated": []
    },
    "createdAt": "2025-12-18T10:00:00.000Z"
  },
  "message": "User registered successfully"
}
```

**Error Responses:**
- 400: Username already exists
- 400: Email already exists
- 400: Password doesn't meet requirements
- 400: Invalid email format

---

### Login User

Authenticates user and returns JWT token.

**Endpoint:** `POST /login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string (required, case-insensitive)",
  "password": "string (required)"
}
```

**Success Response (200):**
```json
{
  "token": "jwt_token_string",
  "user": {
    "_id": "user_id",
    "username": "testuser",
    "email": "test@example.com",
    "displayName": "Test User",
    "karma": {
      "postKarma": 0,
      "commentKarma": 0
    },
    "communities": {
      "created": [],
      "joined": ["community_id_1", "community_id_2"],
      "moderated": []
    }
  },
  "message": "Login successful"
}
```

**Error Responses:**
- 400: Missing email or password
- 401: Invalid credentials
- 404: User not found

---

### Get Current User

Retrieves the authenticated user's information.

**Endpoint:** `GET /me`

**Authentication:** Required

**Success Response (200):**
```json
{
  "_id": "user_id",
  "username": "testuser",
  "email": "test@example.com",
  "displayName": "Test User",
  "karma": {
    "postKarma": 50,
    "commentKarma": 25
  },
  "communities": {
    "created": ["community_id_1"],
    "joined": ["community_id_2", "community_id_3"],
    "moderated": ["community_id_1"]
  },
  "savedPosts": ["post_id_1", "post_id_2"],
  "upvotedPosts": ["post_id_3"],
  "downvotedPosts": [],
  "upvotedComments": ["comment_id_1"],
  "downvotedComments": [],
  "followers": [],
  "following": [],
  "settings": {
    "lastActive": "2025-12-18T10:00:00.000Z"
  },
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

**Error Responses:**
- 401: Invalid or missing token
- 404: User not found

---

### Refresh Token

Refreshes the JWT token for an authenticated user.

**Endpoint:** `POST /refresh`

**Authentication:** Required

**Success Response (200):**
```json
{
  "token": "new_jwt_token_string",
  "message": "Token refreshed successfully"
}
```

**Error Responses:**
- 401: Invalid or expired token

---

## User Routes

Base path: `/api/users`

### Get User by ID

Retrieves a user's public profile by their ID.

**Endpoint:** `GET /:userId`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "_id": "user_id",
  "username": "testuser",
  "displayName": "Test User",
  "karma": {
    "postKarma": 50,
    "commentKarma": 25
  },
  "createdAt": "2025-12-01T10:00:00.000Z"
}
```

**Error Responses:**
- 400: Invalid user ID format
- 404: User not found

---

### Get User by Username

Retrieves a user's public profile by their username.

**Endpoint:** `GET /username/:username`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "_id": "user_id",
  "username": "testuser",
  "displayName": "Test User",
  "karma": {
    "postKarma": 50,
    "commentKarma": 25
  },
  "createdAt": "2025-12-01T10:00:00.000Z"
}
```

**Error Responses:**
- 404: User not found

---

### Update User

Updates user profile information.

**Endpoint:** `PUT /:userId`

**Authentication:** Required (must be the user being updated)

**Request Body:**
```json
{
  "displayName": "string (optional, max 30 chars)",
  "avatar": "string (optional, URL)",
  "communities": {
    "joined": ["community_id_1", "community_id_2"]
  }
}
```

**Success Response (200):**
```json
{
  "_id": "user_id",
  "username": "testuser",
  "email": "test@example.com",
  "displayName": "Updated Name",
  "communities": {
    "joined": ["community_id_1", "community_id_2"]
  },
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

**Error Responses:**
- 401: Unauthorized
- 404: User not found

---

### Delete User

Deletes a user account.

**Endpoint:** `DELETE /:userId`

**Authentication:** Required (must be the user being deleted)

**Success Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

**Error Responses:**
- 401: Unauthorized
- 404: User not found

---

## Community Routes

Base path: `/api/communities`

### Create Community

Creates a new community (subreddit).

**Endpoint:** `POST /`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "string (required, 3-21 chars, lowercase, alphanumeric + underscore)",
  "description": "string (optional, max 500 chars)",
  "settings": {
    "isPrivate": "boolean (optional, default: false)",
    "allowTextPosts": "boolean (optional, default: true)",
    "allowLinkPosts": "boolean (optional, default: true)",
    "allowImagePosts": "boolean (optional, default: true)",
    "requirePostApproval": "boolean (optional, default: false)"
  }
}
```

**Success Response (201):**
```json
{
  "_id": "community_id",
  "name": "testcommunity",
  "description": "A test community",
  "creator": "user_id",
  "moderators": ["user_id"],
  "memberCount": 1,
  "settings": {
    "isPrivate": false,
    "allowTextPosts": true,
    "allowLinkPosts": true,
    "allowImagePosts": true,
    "requirePostApproval": false
  },
  "createdAt": "2025-12-18T10:00:00.000Z",
  "message": "Community created successfully"
}
```

**Error Responses:**
- 400: Community name already exists
- 400: Invalid community name format
- 401: Unauthorized

---

### Get All Communities

Retrieves a list of all communities.

**Endpoint:** `GET /`

**Authentication:** Not required

**Success Response (200):**
```json
[
  {
    "_id": "community_id",
    "name": "webdev",
    "description": "Web development community",
    "memberCount": 150,
    "createdAt": "2025-12-01T10:00:00.000Z"
  },
  {
    "_id": "community_id_2",
    "name": "reactjs",
    "description": "React.js community",
    "memberCount": 200,
    "createdAt": "2025-12-05T10:00:00.000Z"
  }
]
```

---

### Get Community by Name

Retrieves detailed information about a specific community.

**Endpoint:** `GET /:name`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "_id": "community_id",
  "name": "webdev",
  "description": "Web development community",
  "creator": "user_id",
  "moderators": ["user_id"],
  "memberCount": 150,
  "rules": [
    {
      "title": "Be respectful",
      "description": "Treat others with respect",
      "order": 1
    }
  ],
  "flairs": [
    {
      "text": "Tutorial",
      "backgroundColor": "#0079D3",
      "textColor": "#ffffff"
    }
  ],
  "settings": {
    "isPrivate": false,
    "allowTextPosts": true,
    "allowLinkPosts": true,
    "allowImagePosts": true,
    "requirePostApproval": false
  },
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

**Error Responses:**
- 404: Community not found

---

### Update Community

Updates community information.

**Endpoint:** `PUT /:name`

**Authentication:** Required (must be creator or moderator)

**Request Body:**
```json
{
  "description": "string (optional)",
  "rules": "array (optional)",
  "settings": "object (optional)"
}
```

**Success Response (200):**
```json
{
  "_id": "community_id",
  "name": "webdev",
  "description": "Updated description",
  "updatedAt": "2025-12-18T10:00:00.000Z",
  "message": "Community updated successfully"
}
```

**Error Responses:**
- 401: Unauthorized
- 404: Community not found

---

### Delete Community

Deletes a community.

**Endpoint:** `DELETE /:name`

**Authentication:** Required (must be creator)

**Success Response (200):**
```json
{
  "message": "Community deleted successfully"
}
```

**Error Responses:**
- 401: Unauthorized
- 404: Community not found

---

## Post Routes

Base path: `/api/posts`

### Create Post

Creates a new post in a community.

**Endpoint:** `POST /`

**Authentication:** Required

**Request Body:**
```json
{
  "title": "string (required, max 300 chars)",
  "type": "string (required, one of: 'text', 'link', 'image')",
  "community": "ObjectId (required)",
  "content": "string (optional, for text posts only)",
  "linkUrl": "string (optional, for link posts)",
  "imageUrl": "string (optional, for image posts)",
  "flair": {
    "text": "string (optional)",
    "backgroundColor": "string (optional)",
    "textColor": "string (optional)"
  }
}
```

**Validation Rules:**
- Text posts: Can have `content`, cannot have `imageUrl`
- Image posts: Can have `imageUrl`, cannot have `content`
- Link posts: Must have `linkUrl`

**Success Response (201):**
```json
{
  "_id": "post_id",
  "title": "Test Post",
  "type": "text",
  "content": "This is a test post",
  "author": "user_id",
  "community": "community_id",
  "votes": {
    "upvotes": [],
    "downvotes": []
  },
  "voteCount": 0,
  "commentCount": 0,
  "flags": {
    "isDeleted": false,
    "isApproved": false
  },
  "createdAt": "2025-12-18T10:00:00.000Z"
}
```

**Error Responses:**
- 400: Text post cannot have image
- 400: Image post cannot have text content
- 400: Missing required fields
- 401: Unauthorized
- 404: Community not found

---

### Get All Posts

Retrieves posts with optional filters.

**Endpoint:** `GET /`

**Authentication:** Not required

**Query Parameters:**
- `community` - Filter by community ID
- `author` - Filter by author ID
- `type` - Filter by post type (text/link/image)
- `sort` - Sort order (new/top/hot)
- `limit` - Number of posts to return (default: 20)
- `skip` - Number of posts to skip (pagination)

**Example:** `GET /posts?community=webdev&sort=top&limit=10`

**Success Response (200):**
```json
[
  {
    "_id": "post_id",
    "title": "Test Post",
    "type": "text",
    "content": "This is a test post",
    "author": {
      "_id": "user_id",
      "username": "testuser",
      "displayName": "Test User"
    },
    "community": {
      "_id": "community_id",
      "name": "webdev"
    },
    "voteCount": 15,
    "commentCount": 3,
    "createdAt": "2025-12-18T10:00:00.000Z"
  }
]
```

---

### Get Post by ID

Retrieves detailed information about a specific post.

**Endpoint:** `GET /:postId`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "_id": "post_id",
  "title": "Test Post",
  "type": "text",
  "content": "This is a test post",
  "author": {
    "_id": "user_id",
    "username": "testuser",
    "displayName": "Test User"
  },
  "community": {
    "_id": "community_id",
    "name": "webdev",
    "description": "Web development community"
  },
  "votes": {
    "upvotes": ["user_id_1", "user_id_2"],
    "downvotes": []
  },
  "voteCount": 2,
  "commentCount": 5,
  "createdAt": "2025-12-18T10:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

**Error Responses:**
- 400: Invalid post ID format
- 404: Post not found

---

### Update Post

Updates post content.

**Endpoint:** `PUT /:postId`

**Authentication:** Required (must be author)

**Request Body:**
```json
{
  "content": "string (optional, for text posts)",
  "linkUrl": "string (optional, for link posts)"
}
```

**Success Response (200):**
```json
{
  "_id": "post_id",
  "title": "Test Post",
  "content": "Updated content",
  "editedAt": "2025-12-18T10:00:00.000Z",
  "message": "Post updated successfully"
}
```

**Error Responses:**
- 401: Unauthorized
- 404: Post not found

---

### Delete Post

Soft deletes a post.

**Endpoint:** `DELETE /:postId`

**Authentication:** Required (must be author or moderator)

**Success Response (200):**
```json
{
  "message": "Post deleted successfully"
}
```

**Error Responses:**
- 401: Unauthorized
- 404: Post not found

---

### Upvote Post

Adds an upvote to a post or removes existing upvote.

**Endpoint:** `POST /:postId/upvote`

**Authentication:** Required

**Success Response (200):**
```json
{
  "_id": "post_id",
  "votes": {
    "upvotes": ["user_id"],
    "downvotes": []
  },
  "voteCount": 1,
  "message": "Post upvoted successfully"
}
```

**Behavior:**
- If user hasn't voted: Adds upvote
- If user already upvoted: Removes upvote
- If user downvoted: Removes downvote and adds upvote

**Error Responses:**
- 401: Unauthorized
- 404: Post not found

---

### Downvote Post

Adds a downvote to a post or removes existing downvote.

**Endpoint:** `POST /:postId/downvote`

**Authentication:** Required

**Success Response (200):**
```json
{
  "_id": "post_id",
  "votes": {
    "upvotes": [],
    "downvotes": ["user_id"]
  },
  "voteCount": -1,
  "message": "Post downvoted successfully"
}
```

**Behavior:**
- If user hasn't voted: Adds downvote
- If user already downvoted: Removes downvote
- If user upvoted: Removes upvote and adds downvote

**Error Responses:**
- 401: Unauthorized
- 404: Post not found

---

### Remove Vote from Post

Removes user's vote (upvote or downvote) from a post.

**Endpoint:** `DELETE /:postId/vote`

**Authentication:** Required

**Success Response (200):**
```json
{
  "_id": "post_id",
  "votes": {
    "upvotes": [],
    "downvotes": []
  },
  "voteCount": 0,
  "message": "Vote removed successfully"
}
```

**Error Responses:**
- 401: Unauthorized
- 404: Post not found

---

## Comment Routes

Base path: `/api/comments`

### Create Comment

Creates a new comment on a post or reply to another comment.

**Endpoint:** `POST /`

**Authentication:** Required

**Request Body:**
```json
{
  "content": "string (required, max 10,000 chars)",
  "post": "ObjectId (required)",
  "parentComment": "ObjectId (optional, null for top-level comments)"
}
```

**Success Response (201):**
```json
{
  "_id": "comment_id",
  "content": "This is a comment",
  "author": "user_id",
  "post": "post_id",
  "parentComment": null,
  "replies": [],
  "votes": {
    "upvotes": [],
    "downvotes": []
  },
  "voteCount": 0,
  "replyCount": 0,
  "flags": {
    "isDeleted": false,
    "isEdited": false
  },
  "createdAt": "2025-12-18T10:00:00.000Z"
}
```

**Error Responses:**
- 400: Missing required fields
- 400: Content exceeds maximum length
- 401: Unauthorized
- 404: Post or parent comment not found

---

### Get Comments by Post

Retrieves all top-level comments for a post.

**Endpoint:** `GET /post/:postId`

**Authentication:** Not required

**Success Response (200):**
```json
[
  {
    "_id": "comment_id",
    "content": "This is a comment",
    "author": {
      "_id": "user_id",
      "username": "testuser",
      "displayName": "Test User"
    },
    "post": "post_id",
    "parentComment": null,
    "replyCount": 3,
    "voteCount": 5,
    "createdAt": "2025-12-18T10:00:00.000Z"
  }
]
```

**Error Responses:**
- 400: Invalid post ID format
- 404: Post not found

---

### Get Comment by ID

Retrieves detailed information about a specific comment.

**Endpoint:** `GET /:commentId`

**Authentication:** Not required

**Success Response (200):**
```json
{
  "_id": "comment_id",
  "content": "This is a comment",
  "author": {
    "_id": "user_id",
    "username": "testuser",
    "displayName": "Test User"
  },
  "post": "post_id",
  "parentComment": null,
  "replies": ["comment_id_1", "comment_id_2"],
  "votes": {
    "upvotes": ["user_id_1"],
    "downvotes": []
  },
  "voteCount": 1,
  "replyCount": 2,
  "createdAt": "2025-12-18T10:00:00.000Z",
  "updatedAt": "2025-12-18T10:00:00.000Z"
}
```

**Error Responses:**
- 400: Invalid comment ID format
- 404: Comment not found

---

### Get Comment Replies

Retrieves all direct replies to a comment.

**Endpoint:** `GET /:commentId/replies`

**Authentication:** Not required

**Success Response (200):**
```json
[
  {
    "_id": "reply_comment_id",
    "content": "This is a reply",
    "author": {
      "_id": "user_id",
      "username": "testuser2",
      "displayName": "Test User 2"
    },
    "parentComment": "comment_id",
    "replyCount": 0,
    "voteCount": 2,
    "createdAt": "2025-12-18T10:05:00.000Z"
  }
]
```

**Error Responses:**
- 400: Invalid comment ID format
- 404: Comment not found

---

### Update Comment

Updates comment content.

**Endpoint:** `PUT /:commentId`

**Authentication:** Required (must be author)

**Request Body:**
```json
{
  "content": "string (required, max 10,000 chars)"
}
```

**Success Response (200):**
```json
{
  "_id": "comment_id",
  "content": "Updated comment content",
  "flags": {
    "isEdited": true
  },
  "editedAt": "2025-12-18T10:00:00.000Z",
  "message": "Comment updated successfully"
}
```

**Error Responses:**
- 400: Content exceeds maximum length
- 401: Unauthorized
- 404: Comment not found

---

### Delete Comment

Soft deletes a comment.

**Endpoint:** `DELETE /:commentId`

**Authentication:** Required (must be author or moderator)

**Success Response (200):**
```json
{
  "message": "Comment deleted successfully"
}
```

**Notes:**
- Soft delete sets `flags.isDeleted = true`
- Comment remains in database for threading
- Reply counts are updated recursively for all ancestor comments

**Error Responses:**
- 401: Unauthorized
- 404: Comment not found

---

### Upvote Comment

Adds an upvote to a comment or removes existing upvote.

**Endpoint:** `POST /:commentId/upvote`

**Authentication:** Required

**Success Response (200):**
```json
{
  "_id": "comment_id",
  "votes": {
    "upvotes": ["user_id"],
    "downvotes": []
  },
  "voteCount": 1,
  "message": "Comment upvoted successfully"
}
```

**Behavior:**
- If user hasn't voted: Adds upvote
- If user already upvoted: Removes upvote
- If user downvoted: Removes downvote and adds upvote

**Error Responses:**
- 401: Unauthorized
- 404: Comment not found

---

### Downvote Comment

Adds a downvote to a comment or removes existing downvote.

**Endpoint:** `POST /:commentId/downvote`

**Authentication:** Required

**Success Response (200):**
```json
{
  "_id": "comment_id",
  "votes": {
    "upvotes": [],
    "downvotes": ["user_id"]
  },
  "voteCount": -1,
  "message": "Comment downvoted successfully"
}
```

**Behavior:**
- If user hasn't voted: Adds downvote
- If user already downvoted: Removes downvote
- If user upvoted: Removes upvote and adds downvote

**Error Responses:**
- 401: Unauthorized
- 404: Comment not found

---

### Remove Vote from Comment

Removes user's vote (upvote or downvote) from a comment.

**Endpoint:** `DELETE /:commentId/vote`

**Authentication:** Required

**Success Response (200):**
```json
{
  "_id": "comment_id",
  "votes": {
    "upvotes": [],
    "downvotes": []
  },
  "voteCount": 0,
  "message": "Vote removed successfully"
}
```

**Error Responses:**
- 401: Unauthorized
- 404: Comment not found

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message description",
  "details": "Additional error details (optional)"
}
```

## Rate Limiting

Currently not implemented. Future versions will include rate limiting to prevent abuse.

## Pagination

Posts and comments support pagination using `limit` and `skip` query parameters:

```
GET /api/posts?limit=20&skip=0  // First page
GET /api/posts?limit=20&skip=20 // Second page
```

---

*Last Updated: December 18, 2025*
