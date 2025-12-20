# ReDitto - Reddit Clone

A full-stack Reddit clone built with the MERN stack (MongoDB, Express.js, React, Node.js) for the Web Development university course.

## 📚 Documentation

- **[Quick Start Guide](reditto/QUICKSTART.md)** - Get up and running in 5 minutes
- **[Development Guide](DEVELOPMENT.md)** - Comprehensive development documentation
- **[API Documentation](reditto/API.md)** - Complete API endpoint reference
- **[Commit History](reditto/COMMITS.md)** - Project commit log

## Project Overview

ReDitto is a social media platform inspired by Reddit, featuring user authentication, community management, post creation, nested comments, voting system, and a modern, responsive UI with Reddit-like design principles.

## Technology Stack

### Frontend
- **React 19.2.3** - UI framework
- **React Router DOM** - Client-side routing
- **CSS3** - Custom styling with Reddit-inspired design

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB Atlas** - Cloud database
- **Mongoose 9.0.1** - ODM for MongoDB

### Authentication & Security
- **JWT (jsonwebtoken 9.0.3)** - Token-based authentication
- **bcrypt 6.0.0** - Password hashing (10 salt rounds)
- **CORS** - Cross-origin resource sharing

### Testing
- **Jest 27.5.1** - Testing framework
- **Supertest 7.1.4** - HTTP assertion library
- **React Testing Library** - Frontend testing utilities

### Development Tools
- **Concurrently** - Run frontend and backend simultaneously
- **dotenv 17.2.3** - Environment variable management

### AI & Deployment
- **Gemini APIs (Google Generative AI)** - Used by the backend AI feature to summarize posts and discussions.
- **Vercel** - Recommended host for frontend deployments (preview and production).
- **Render** - Recommended host for backend deployments (preview and production).
- **Deployment model:** set up two environments on the hosting platforms — a `development` (preview/alpha) environment for feature testing and a `release` environment for public/stable releases. Connect both to GitHub and configure automated deployments: pushes to feature/dev branches trigger the development environment; merges or pushes to the `release` branch trigger the release deployment.


### Dark Mode (Default)
- **Background Primary**: #030303
- **Background Secondary**: #1a1a1b
- **Background Tertiary**: #272729
- **Text Primary**: #d7dadc
- **Text Secondary**: #818384
- **Border**: #343536
- **Accent**: #0079D3 (Reddit Blue)

### Light Mode
- **Background Primary**: #dae0e6
- **Background Secondary**: #ffffff
- **Background Tertiary**: #f6f7f8
- **Text Primary**: #1c1c1c
- **Text Secondary**: #878a8c
- **Border**: #edeff1
- **Accent**: #0079D3 (Reddit Blue)

### Additional Colors
- **Upvote**: #0079D3 (Blue)
- **Downvote**: #ea0027 (Red)
- **Hover**: #0099ff (Light Blue)

## API Routes

### Auth Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)
- `POST /refresh` - Refresh JWT token (protected)

### User Routes (`/api/users`)
- `GET /:userId` - Get user by ID
- `GET /username/:username` - Get user by username
- `PUT /:userId` - Update user profile and communities (protected)
- `DELETE /:userId` - Delete user (protected)

### Community Routes (`/api/communities`)
- `POST /` - Create community (protected)
- `GET /` - Get all communities
- `GET /:name` - Get community by name
- `PUT /:name` - Update community (protected)
- `DELETE /:name` - Delete community (protected)

### Post Routes (`/api/posts`)
- `POST /` - Create post (protected)
- `GET /` - Get all posts (with filters: community, author, type, sort)
- `GET /:postId` - Get post by ID
- `PUT /:postId` - Update post (protected)
- `DELETE /:postId` - Delete post (protected)
- `POST /:postId/upvote` - Upvote post (protected)
- `POST /:postId/downvote` - Downvote post (protected)
- `DELETE /:postId/vote` - Remove vote (protected)

### Comment Routes (`/api/comments`)
- `POST /` - Create comment (protected)
- `GET /post/:postId` - Get all comments for a post
- `GET /:commentId` - Get comment by ID
- `GET /:commentId/replies` - Get comment replies
- `PUT /:commentId` - Update comment (protected)
- `DELETE /:commentId` - Delete comment (protected)
- `POST /:commentId/upvote` - Upvote comment (protected)
- `POST /:commentId/downvote` - Downvote comment (protected)
- `DELETE /:commentId/vote` - Remove vote (protected)

## Database Structure

### User Schema
```javascript
{
  username: String (unique, 3-20 chars),
  email: String (unique, lowercase),
  password: String (hashed),
  displayName: String (optional, max 30 chars),
  avatar: String (URL),
  karma: {
    postKarma: Number,
    commentKarma: Number
  },
  posts: [ObjectId],
  communities: {
    created: [ObjectId],
    joined: [ObjectId],
    moderated: [ObjectId]
  },
  savedPosts: [ObjectId],
  upvotedPosts: [ObjectId],
  downvotedPosts: [ObjectId],
  upvotedComments: [ObjectId],
  downvotedComments: [ObjectId],
  followers: [ObjectId],
  following: [ObjectId],
  settings: {
    lastActive: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Community Schema
```javascript
{
  name: String (unique, lowercase, 3-21 chars),
  description: String (max 500 chars),
  creator: ObjectId,
  moderators: [ObjectId],
  memberCount: Number,
  rules: [{
    title: String,
    description: String,
    order: Number
  }],
  flairs: [{
    text: String,
    backgroundColor: String,
    textColor: String
  }],
  settings: {
    isPrivate: Boolean,
    allowTextPosts: Boolean,
    allowLinkPosts: Boolean,
    allowImagePosts: Boolean,
    requirePostApproval: Boolean
  },
  appearance: {
    icon: String,
    banner: String,
    primaryColor: String,
    backgroundColor: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Post Schema
```javascript
{
  title: String (max 300 chars),
  content: String (for text posts),
  linkUrl: String (for link posts),
  imageUrl: String (for image posts),
  type: String (text/link/image),
  author: ObjectId,
  community: ObjectId,
  votes: {
    upvotes: [ObjectId],
    downvotes: [ObjectId]
  },
  voteCount: Number,
  commentCount: Number,
  flair: {
    text: String,
    backgroundColor: String,
    textColor: String
  },
  flags: {
    isDeleted: Boolean,
    isApproved: Boolean
  },
  createdAt: Date,
  updatedAt: Date,
  editedAt: Date
}
```

### Comment Schema
```javascript
{
  content: String (max 10,000 chars),
  author: ObjectId,
  post: ObjectId,
  parentComment: ObjectId (null for top-level),
  replies: [ObjectId],
  votes: {
    upvotes: [ObjectId],
    downvotes: [ObjectId]
  },
  voteCount: Number,
  replyCount: Number,
  flags: {
    isDeleted: Boolean,
    isEdited: Boolean
  },
  createdAt: Date,
  updatedAt: Date,
  editedAt: Date
}
```

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication (7-day expiration)
- Protected routes with authentication middleware
- Token forgery detection
- CORS configuration for frontend-backend communication
- Environment variable management for sensitive data
- Password validation (minimum 6 chars, uppercase, lowercase, number)

## Testing

The project includes comprehensive backend testing with **excellent coverage**:

### Test Coverage Summary
- **319 passing tests** with **87.5% overall coverage**
  - Models: 97.54% coverage (100% for Comment, Community, User models)
  - Routes: 100% coverage
  - Controllers: 84.98% coverage
  - Middleware: 85.57% coverage

### Test Suites
1. **Authentication Tests** (33 tests)
   - User registration validation
   - Login functionality with case-insensitive email
   - JWT token generation and validation
   - Token security (wrong secrets, expired tokens, manipulated tokens)
   - Token refresh mechanism
   
2. **User Tests** (22 tests)
   - User profile operations (get by ID/username)
   - Protected route authorization
   - User updates and deletion
   
3. **Community Tests** (69 tests)
   - Community model validation (25 tests)
   - Community CRUD operations (44 tests)
   - Moderator and rule management
   
4. **Post Tests** (87 tests)
   - Post model validation (30 tests)
   - Post CRUD operations (57 tests)
   - Post voting with optimistic updates
   - Post type validation (text, link, image)
   
5. **Comment Tests** (108 tests)
   - Comment model validation (34 tests)
   - Comment CRUD operations (74 tests)
   - Nested comment threading
   - Reply count tracking
   - Comment voting with user array updates
   - Soft delete functionality

Run tests with:
```bash
npm run test:server          # Run all backend tests
npm run test:server -- --coverage  # Run with coverage report
```

### Key Testing Features
- Integration testing with Supertest
- MongoDB test database isolation
- JWT authentication testing
- Comprehensive validation testing
- Soft delete verification
- Vote system integrity testing

## Color Scheme

- **Primary**: #FF4500 (Reddit Orange)
- **Secondary**: #0079D3 (Reddit Blue)
- **Background Gradient**: #4FACFE to #00F2FE (Light Blue)
- **Text**: #1C1C1C
- **Borders**: #EDEFF1
- **Background**: #F6F7F8

# ReDitto — Reddit-like app (short overview)

ReDitto is a full-stack Reddit-inspired application built with the MERN stack (MongoDB, Express, React, Node).

This repository contains the frontend React app and the backend API with comprehensive tests.

Key resources (keep these up-to-date):

- Quick start & local setup: [reditto/QUICKSTART.md](reditto/QUICKSTART.md)
- API reference: [reditto/API.md](reditto/API.md)
- Development guide & troubleshooting: [DEVELOPMENT.md](DEVELOPMENT.md)

Running tests (backend)

Run the server test suite (includes coverage):

```
npm run test:server -- --coverage
```

Notes
- The repository ships a focused QUICKSTART and a detailed API document. To avoid repetition, this README is intentionally concise — use the linked documents for setup, API details, and development workflow.

Project layout

```
reditto/
├── server/    # Backend API (controllers, models, routes, tests)
├── src/       # Frontend React app
├── public/    # Static assets
├── scripts/   # Utility scripts (populate, etc.)
├── .env*      # Environment variable templates
└── README.md  # This file (overview + links)
```

If you'd like, I can further consolidate `QUICKSTART.md` and `DEVELOPMENT.md` (merge troubleshooting sections, remove overlap). Would you like me to do that now?
