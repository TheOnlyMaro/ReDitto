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

## Features Implemented

### User Authentication
- ✅ User registration with validation
  - Username (3-20 chars, alphanumeric + underscore)
  - Email validation
  - Password requirements (min 6 chars, uppercase, lowercase, number)
  - Optional display name
- ✅ User login with JWT tokens
- ✅ Case-insensitive email login
- ✅ Password hashing with bcrypt
- ✅ Token refresh functionality
- ✅ Persistent login (localStorage)
- ✅ Fresh user data fetching on app startup
- ✅ Logout functionality

### User Profile System
- ✅ User model with Reddit-like features:
  - Karma system (post karma, comment karma)
  - Communities (created, joined, moderated)
  - Saved posts
  - Upvoted/downvoted posts and comments
  - Followers/following system
  - User settings with last active tracking
- ✅ Get user by ID
- ✅ Get user by username
- ✅ Update user profile (protected route)
- ✅ Update user communities (join/unjoin)
- ✅ Delete user account (protected route)

### Community System
- ✅ Community model with full feature set:
  - Community name, description, type (public/private/restricted)
  - Creator and moderators tracking
  - Member count
  - Rules and flairs
  - Settings (post types, approval requirements)
  - Appearance customization (icon, banner, colors)
- ✅ Create community (protected)
- ✅ Get community by name
- ✅ Join/unjoin communities with live updates
- ✅ Community membership persistence

### Post System
- ✅ Post model with validation:
  - Text, link, and image post types
  - Author and community tracking
  - Vote system (upvotes/downvotes)
  - Comment count tracking
  - Post flairs
  - Soft delete functionality
- ✅ Create posts (protected)
- ✅ Get posts with filtering (community, author, type)
- ✅ Update posts (protected)
- ✅ Delete posts (protected)
- ✅ Upvote/downvote posts (protected)
- ✅ Real-time post feed from database
- ✅ Post validation (text-only OR image-only)

### UI Components
- ✅ Reusable component library:
  - Button (multiple variants and sizes)
  - Input (with icons and error states)
  - Card (container component)
  - Avatar (with fallback initials)
  - Loading spinner
  - Alert notifications (success, error, warning, info)
  - Navbar (with profile dropdown menu)
  - Sidebar (collapsible navigation)
  - Post (with vote, comment, share interactions)
  - Comment (nested comment display)
  - Logo component
  - SearchBar
- ✅ Login page with validation and routing
- ✅ Registration page with validation and routing
- ✅ Home page with post feed
- ✅ Dark mode by default with toggle
- ✅ Light/dark theme system with CSS variables
- ✅ Responsive design
- ✅ Reddit-inspired UI design

### User Interactions
- ✅ Join/unjoin communities
  - Join button on posts from communities not followed
  - Button turns gray "Joined" on click
  - Database persistence of joined communities
  - Proper state management to prevent button flickering
- ✅ Vote on posts (upvote/downvote with toggle)
- ✅ Save posts (options menu)
- ✅ Share posts
- ✅ Profile dropdown menu
  - View Profile
  - Edit Profile
  - Dark Mode toggle
  - Settings
  - Log Out

### Comment System
- ✅ Comment model with full feature set:
  - Content validation (max 10,000 chars)
  - Author and post tracking
  - Nested comment support (parent/child relationships)
  - Reply tracking with counts
  - Vote system (upvotes/downvotes with optimistic updates)
  - User vote tracking (upvotedComments/downvotedComments arrays)
  - Soft delete functionality (maintains thread structure)
  - Edit tracking with timestamps
- ✅ Create comments (protected)
- ✅ Get comments by post ID
- ✅ Comment voting system with:
  - Backend user array updates for persistent vote state
  - Optimistic UI updates for instant feedback
  - Proper vote state initialization from user data
  - Support for nested comments at all depths
  - API endpoints: upvote, downvote, and remove vote
- ✅ Get comment by ID
- ✅ Get comment replies (nested threading)
- ✅ Update comments (protected)
- ✅ Delete comments (protected)
- ✅ Upvote/downvote comments (protected)
- ✅ Remove vote from comments (protected)
- ✅ Recursive reply count updates

### Testing
- ✅ Postman-tested API endpoints
- ✅ 202+ comprehensive backend tests
  - User registration tests (9 tests)
  - Login validation tests (6 tests)
  - JWT token security tests (5 tests)
  - Token refresh tests (4 tests)
  - Get current user tests (6 tests)
  - User profile CRUD tests (22 tests)
  - Protected route tests
  - Community model tests (13 tests)
  - Community CRUD tests (22 tests)
  - Post model tests (10 tests)
  - Post CRUD tests (51 tests)
  - Comment model tests (13 tests)
  - Comment CRUD tests (51 tests)
  - Voting functionality tests (posts and comments)
  - Post/Comment validation tests

## Project Structure

```
reditto/
├── public/              # Static assets
│   ├── logo192.png     # App logo
│   ├── logo512.png
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── scripts/            # Utility scripts
│   ├── populate.js    # Database population script
│   └── output/        # Generated files
├── server/             # Backend API
│   ├── controllers/    # Route controllers
│   │   ├── authController.js
│   │   ├── communityController.js
│   │   ├── postController.js
│   │   └── userController.js
│   ├── middleware/     # Custom middleware
│   │   └── validation.js
│   ├── models/        # MongoDB schemas
│   │   ├── User.js
│   │   ├── Community.js
│   │   ├── Post.js
│   │   └── Comment.js
│   ├── routes/        # API routes
│   │   ├── authRoutes.js
│   │   ├── communityRoutes.js
│   │   ├── postRoutes.js
│   │   ├── commentRoutes.js
│   │   └── userRoutes.js
│   ├── testing/       # Backend tests
│   │   ├── server.test.js
│   │   ├── user.test.js
│   │   ├── community.test.js
│   │   ├── communityController.test.js
│   │   ├── post.test.js
│   │   ├── postController.test.js
│   │   ├── comment.test.js
│   │   └── commentController.test.js
│   └── index.js       # Server entry point
├── src/               # Frontend React app
│   ├── components/    # Reusable UI components
│   │   ├── Alert/
│   │   ├── Avatar/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Comment/
│   │   ├── Header/
│   │   ├── Input/
│   │   ├── Loading/
│   │   ├── Logo/
│   │   ├── Navbar/
│   │   ├── Post/
│   │   ├── SearchBar/
│   │   ├── Sidebar/
│   │   └── index.js
│   ├── pages/         # Page components
│   │   ├── CommentThread/
│   │   ├── CommunityPage/
│   │   ├── CreateCommunity/
│   │   ├── CreatePost/
│   │   ├── Home/
│   │   ├── Login/
│   │   ├── PostPage/
│   │   └── Register/
│   ├── services/      # API services
│   │   ├── api.js
│   │   └── authService.js
│   ├── App.js         # Root component
│   ├── App.css
│   ├── index.js
│   └── index.css
├── .env               # Environment variables (not in git)
├── .env.example       # Environment template
├── .env.local         # Frontend environment
├── .gitignore
├── jest.config.js
├── package.json
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd ReDitto/reditto
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the `reditto` directory:
```env
# MongoDB Connection Strings
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dev?appName=Cluster0
MONGODB_TEST_URI=mongodb+srv://username:password@cluster.mongodb.net/test?appName=Cluster0

# Server Port
SERVER_PORT=5000

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```Populate Database with Test Data
```bash
node scripts/populate.js
```
This creates:
- 3 test users (monketest1, johndoe, janesmithdev)
- 3 communities (webdev, reactjs, javascript)
- 4 sample posts

Test credentials:
- **Username**: monketest1
- **Password**: Test123!

### 

Create a `.env.local` file for frontend:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

### Development Mode (Frontend + Backend)
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Frontend Only
```bash
npm start
```

### Backend Only
```bash
npm run server
```

### Run Tests
```bash
npm run test:server
```profile and communities (protected)
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
  },202 passing tests** covering:
  - User registration validation
  - Login functionality
  - JWT token generation and validation
  - Token security (wrong secrets, expired tokens, stolen tokens)
  - User CRUD operations
  - Protected route authorization
  - Community creation and management
  - Post CRUD operations
  - Post voting functionality
  - Post type validation (text-only vs image-only)

Run tests with:
```bash
npm run test:server
```

## Color Scheme

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

## Contributing

This is a university project for the Web Development course.

## License

Academic project - All rights reserved

## Acknowledgments

- Built with Create React App
- Inspired by Reddit's design and functionality
- MongoDB Atlas for cloud database hosting
