# ReDitto Development Documentation

This document outlines the development process, environment setup, testing procedures, and technical implementation details for the ReDitto project.

## Development Environment

### System Requirements
- **Operating System**: Windows (development), cross-platform compatible
- **Node.js**: v14 or higher
- **npm**: v6 or higher
- **MongoDB Atlas**: Cloud database service
- **IDE**: Visual Studio Code (recommended)

### Development Tools & Extensions
- **VS Code Extensions**:
  - ESLint - Code quality
  - Prettier - Code formatting
  - GitLens - Git integration
  - Thunder Client / Postman - API testing
  - MongoDB for VS Code - Database management

### Environment Configuration

#### Backend Environment Variables (`.env`)
```env
# MongoDB Connection Strings
MONGODB_URI=mongodb+srv://maro_devuser:password@cluster0.lyrluc7.mongodb.net/dev?appName=Cluster0
MONGODB_TEST_URI=mongodb+srv://maro_tstuser:password@cluster0.lyrluc7.mongodb.net/test?appName=Cluster0

# Server Configuration
SERVER_PORT=5000

# JWT Configuration
JWT_SECRET=rdutfbuygiyu
JWT_EXPIRES_IN=7d
```

**Database Strategy**:
- `dev` database: Used during development (`npm run dev`, `npm run server`)
- `test` database: Used for automated testing (`npm run test:server`)
- Separate databases ensure test data doesn't contaminate development data

#### Frontend Environment Variables (`.env.local`)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Port Configuration
- **Frontend (React)**: Port 3000 (default)
- **Backend (Express)**: Port 5000 (configured via `SERVER_PORT`)
- **MongoDB Atlas**: Cloud-hosted (no local port)

## Development Workflow

### Initial Setup

1. **Clone and Install**
```bash
cd ReDitto/reditto
npm install
```

2. **Configure Environment**
- Copy `.env.example` to `.env`
- Update MongoDB connection strings
- Set JWT secret key
- Create `.env.local` for frontend

3. **Verify Database Connection**
```bash
npm run server
# Should see: "MongoDB connected successfully"
```

### Running in Development Mode

#### Full Stack Development
```bash
npm run dev
```
This command uses `concurrently` to run both frontend and backend simultaneously:
- Frontend dev server on http://localhost:3000
- Backend API server on http://localhost:5000
- Hot reload enabled for both

#### Frontend Only
```bash
npm start
```
- Opens browser automatically
- Hot module replacement enabled
- Proxy API requests to backend (if configured)

#### Backend Only
```bash
npm run server
```
- Runs Express server
- Connects to MongoDB `dev` database
- Nodemon auto-restart on file changes (if configured)

### Database Population

#### Populate Development Data (scripts/populate.js)

**Warning — destructive:** `node scripts/populate.js` is intended for development and will remove and recreate large parts of the database. By default the script connects to `process.env.MONGODB_URI` (the development DB) and performs the following destructive cleanup before seeding:

- Deletes all comments, posts, and communities
- Deletes all users except `monketest1` (the script resets `monketest1` instead of deleting it)

Run this script only on non-production databases or after taking a backup.

Run:
```bash
node scripts/populate.js
```

This script populates the development database with test data:
- **7 Users**
- **3 Communities**: `webdev`, `reactjs`, `javascript`
- **5 Posts**: Mix of text and link posts from different users

Connects to `MONGODB_URI` (not `MONGODB_TEST_URI`) by default — set `MONGODB_URI` to point at a throwaway DB if you want to seed a test instance.
- Removes existing comments/posts/communities and resets most user state (keeps `monketest1`).

**Features**:
- Direct MongoDB access (bypasses authentication)
- Initializes user communities properly
- Handles duplicate data gracefully
- Uses bcrypt for password hashing

**Test Credentials**:
- Username: `monketest1`
- Password: `Test123!`

#### Generate Commit History
```bash
npm run git-history
```
This script (`scripts/generate-commits.js`) generates a formatted commit history:
- Fetches all git commits from repository
- Organizes commits by date
- Outputs to `COMMITS.md`
- Includes commit hash, author, date, and changed files
- Auto-generates table of contents

<!-- Postman collection generation script removed from docs. Use Postman manually to test endpoints. -->

### Available Scripts Summary

| Script | Command | Description |
|--------|---------|-------------|
| Start Frontend | `npm start` | Runs React dev server on port 3000 |
| Start Backend | `npm run server` | Runs Express server on port 5000 |
| Full Stack | `npm run dev` | Runs both frontend and backend concurrently |
| Run Tests | `npm run test:server` | Executes all backend tests with Jest |
| Frontend Tests | `npm test` | Runs React test suite |
| Build Production | `npm run build` | Creates optimized production build |
| Populate Database | `node scripts/populate.js` | Seeds database with test data |
| Generate Commits | `npm run git-history` | Creates formatted commit history |

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


## Testing Strategy

### Test Environment Setup
- **Test Framework**: Jest 27.5.1
- **HTTP Testing**: Supertest 7.1.4
- **Test Database**: Separate MongoDB database (`test`)
- **Test Runner**: Node environment (not React Scripts)

### Key Testing Features
- Integration testing with Supertest
- MongoDB test database isolation
- JWT authentication testing
- Comprehensive validation testing
- Soft delete verification
- Vote system integrity testing

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

### Backend Testing

#### Running Tests
```bash
npm run test:server
```

This executes all tests in `server/testing/` using the Jest configuration:
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/testing/**/*.test.js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
};
```

#### Test Structure

**Test File Organization**:
```
server/testing/
├── server.test.js              # Database connection tests (2 tests)
├── user.test.js                # User & auth endpoint tests (52 tests)
├── community.test.js           # Community model tests (13 tests)
├── communityController.test.js # Community API tests (22 tests)
├── post.test.js                # Post model tests (10 tests)
├── postController.test.js      # Post API tests (51 tests)
├── comment.test.js             # Comment model tests (13 tests)
└── commentController.test.js   # Comment API tests (51 tests)
```

**Test Categories**:

1. **Database Connection Tests** (`server.test.js`)
   - MongoDB connection establishment
   - Connection error handling

2. **Authentication Tests** (`user.test.js`)
   - User Registration (9 tests)
     - Valid registration
     - JWT token validation
     - Password hashing verification
     - Default values
     - Duplicate username/email detection
     - Missing field validation
     - Invalid email format
     - Weak password rejection
   
   - User Login (6 tests)
     - Valid credentials login
     - JWT token generation
     - Last active timestamp update
     - Incorrect password handling
     - Non-existent email
     - Missing credentials
     - Case-insensitive email matching
   
   - Get Current User (6 tests)
     - Valid token authentication
     - Missing token rejection
     - Invalid token rejection
     - Expired token handling
     - Wrong secret detection
     - Malformed Authorization header
     - Deleted user detection
   
   - Token Refresh (4 tests)
     - Successful token refresh
     - Missing token rejection
     - Invalid token rejection
     - Deleted user handling

3. **Security Tests** (5 tests)
   - Token payload modification detection
   - Fabricated token rejection
   - Missing userId claim handling
   - Token signed with wrong secret (multiple endpoints)

4. **User Profile Tests** (22 tests)
   - Get user by ID
   - Get user by username
   - Update user (protected)
   - Delete user (protected)
   - Field validation
   - Authorization checks

#### Test Utilities

**Helper Functions**:
```javascript
// registerUser helper
const registerUser = async (userData = validUserData) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
  return response.body;
};
```

**Test Data**:
```javascript
const validUserData = {
  username: 'testuser123',
  email: 'test@example.com',
  password: 'Test123Pass',
  displayName: 'Test User'
};
```

**Test Lifecycle**:
- `beforeAll`: Connect to test database
- `afterAll`: Close database connection
- `beforeEach`: Clear users collection (ensures clean state)

### Smoke testing
All test suites run for every new functionality implementation as smoke testing to find bugs

### Test Results
- **Total Tests**: 319
- **Pass Rate**: 100%
- **Average Test Time**: ~400 seconds for all suites
- **Coverage**: Authentication, authorization, CRUD operations, security, communities, posts, comments, voting, nested threading

### Early development testing

![Older tests screenshot](./screenshots/older.png)

### Mid development testing with coverage

![Tests screenshot](./screenshots/testf.png)
- Failed test cases helped in finding bugs in the software.

### Final release testing with coverage

![Tests screenshot](./screenshots/tests.png)

![Coverage screenshot](./screenshots/cvrg.png)


### Alpha Releases & Exploratory Testing

- Deploy alpha builds to a small group of trusted testers (friends) on a development preview environment.
- Encourage exploratory testing: let testers exercise features freely to uncover edge-case bugs, unclear UX, and data issues.
- Capture feedback via a shared issue tracker (GitHub Issues) with a short template: steps to reproduce, expected vs actual, screenshots, and environment (dev/release).
- Use alpha feedback to iterate rapidly on the dev environment before promoting changes to the `release` branch and production.

### Postman API Testing

#### Setup Postman Environment
1. **Install Postman**: Download from [postman.com](https://www.postman.com/)
2. **Import Collection**: Import a Postman collection JSON if provided, or create requests manually in Postman to test the API.
3. **Create Environment Variables**:
   ```
   baseUrl: http://localhost:5000/api
   token: (will be set automatically after login)
   userId: (will be set automatically after login)
   communityName: webdev
   postId: (set after creating post)
   ```

#### Postman Collection Structure

**Authentication Folder**:
- `POST {{baseUrl}}/auth/register` - Register new user
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!",
    "displayName": "Test User"
  }
  ```
  *Tests*: Save token and userId to environment

- `POST {{baseUrl}}/auth/login` - Login existing user
  ```json
  {
    "email": "monketest1@example.com",
    "password": "Test123!"
  }
  ```
  *Tests*: 
  ```javascript
  pm.environment.set("token", pm.response.json().token);
  pm.environment.set("userId", pm.response.json().user._id);
  ```

- `GET {{baseUrl}}/auth/me` - Get current user (requires token)
  *Headers*: `Authorization: Bearer {{token}}`

**Users Folder**:
- `GET {{baseUrl}}/users/{{userId}}` - Get user by ID
- `GET {{baseUrl}}/users/username/monketest1` - Get user by username
- `PUT {{baseUrl}}/users/{{userId}}` - Update user (protected)
  ```json
  {
    "displayName": "Updated Name",
    "communities": {
      "joined": ["communityId1", "communityId2"]
    }
  }
  ```
  *Headers*: `Authorization: Bearer {{token}}`

**Communities Folder**:
- `POST {{baseUrl}}/communities` - Create community (protected)
  ```json
  {
    "name": "testcommunity",
    "description": "Test community description"
  }
  ```
  *Tests*: Save communityId to environment

- `GET {{baseUrl}}/communities/{{communityName}}` - Get community by name
- `GET {{baseUrl}}/communities` - Get all communities

**Posts Folder**:
- `POST {{baseUrl}}/posts` - Create post (protected)
  ```json
  {
    "title": "Test Post Title",
    "content": "This is the post content",
    "community": "communityId",
    "type": "text"
  }
  ```
  *Tests*: Save postId to environment

- `GET {{baseUrl}}/posts` - Get all posts
  *Query params*: `?community=webdev&sort=new&limit=10`

- `GET {{baseUrl}}/posts/{{postId}}` - Get post by ID

- `POST {{baseUrl}}/posts/{{postId}}/upvote` - Upvote post (protected)
  *Headers*: `Authorization: Bearer {{token}}`

- `POST {{baseUrl}}/posts/{{postId}}/downvote` - Downvote post (protected)

- `DELETE {{baseUrl}}/posts/{{postId}}/vote` - Remove vote (protected)

**Comments Folder**:
- `POST {{baseUrl}}/comments` - Create comment (protected)
  ```json
  {
    "content": "This is a comment",
    "post": "postId",
    "parentComment": null
  }
  ```
  *Tests*: Save commentId to environment
  *Headers*: `Authorization: Bearer {{token}}`

- `GET {{baseUrl}}/comments/post/{{postId}}` - Get all comments for a post

- `GET {{baseUrl}}/comments/{{commentId}}` - Get comment by ID

- `GET {{baseUrl}}/comments/{{commentId}}/replies` - Get comment replies

- `PUT {{baseUrl}}/comments/{{commentId}}` - Update comment (protected)
  ```json
  {
    "content": "Updated comment content"
  }
  ```
  *Headers*: `Authorization: Bearer {{token}}`

- `POST {{baseUrl}}/comments/{{commentId}}/upvote` - Upvote comment (protected)
  *Headers*: `Authorization: Bearer {{token}}`

- `POST {{baseUrl}}/comments/{{commentId}}/downvote` - Downvote comment (protected)

- `DELETE {{baseUrl}}/comments/{{commentId}}` - Delete comment (protected)

- `DELETE {{baseUrl}}/comments/{{commentId}}/vote` - Remove vote (protected)

#### Testing Workflow

**Manual Testing Flow**:
1. **Register** new user → verify token received
2. **Login** with credentials → save token
3. **Get current user** → verify token works
4. **Create community** → save community ID
5. **Create post** in community → save post ID
6. **Upvote post** → verify vote count increases
7. **Update user** to join community → verify communities.joined updated
8. **Get posts** with filters → verify filtering works

**Automated Test Scripts**:
```javascript
// Add to Postman Tests tab
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    pm.expect(pm.response.json()).to.have.property('token');
});

pm.test("User has required fields", function () {
    const user = pm.response.json().user;
    pm.expect(user).to.have.property('username');
    pm.expect(user).to.have.property('email');
    pm.expect(user).to.not.have.property('password');
});
```

#### Common API Test Scenarios

**Authentication Flow**:
- ✅ Valid registration creates user and returns token
- ✅ Duplicate username/email rejected
- ✅ Weak password rejected
- ✅ Login with correct credentials succeeds
- ✅ Login with wrong password fails
- ✅ Protected routes require valid token
- ✅ Expired/invalid tokens rejected

**Community Operations**:
- ✅ Create community with valid data
- ✅ Get community by name
- ✅ Community name must be unique
- ✅ Join/unjoin community updates user.communities.joined

**Post Operations**:
- ✅ Create text post (no image)
- ✅ Create link post with URL
- ✅ Image post cannot have text content
- ✅ Upvote increases vote count
- ✅ Downvote after upvote changes vote
- ✅ Filter posts by community
- ✅ Sort posts by new/top/hot

**Comment Operations**:
- ✅ Create top-level comment
- ✅ Create nested reply to comment
- ✅ Get all comments for a post
- ✅ Get replies for a comment
- ✅ Update comment content
- ✅ Delete comment (soft delete)
- ✅ Upvote/downvote comments
- ✅ Vote count updates correctly
- ✅ Reply count updates recursively

### Manual Frontend Testing

- Frontend testing heavily relied on exploratory testing and console logging

![UI log screenshot](./screenshots/log.png)

- Functionalities were often analysed from Reddit to mimic real functionality

#### Testing Checklist

**Authentication Flow**:
- [ ] Register with valid data → redirects to login
- [ ] Register with duplicate username → shows error
- [ ] Register with weak password → shows validation error
- [ ] Login with valid credentials → redirects to home
- [ ] Login with wrong password → shows error message
- [ ] Logout → clears localStorage and redirects to login
- [ ] Refresh page while logged in → stays logged in
- [ ] Token expiration → redirects to login

**Home Page**:
- [ ] Posts load from database on mount
- [ ] User data loads before posts (no race condition)
- [ ] Join button hidden for already-joined communities
- [ ] Join button shows on non-joined communities
- [ ] Click Join → button turns gray "Joined"
- [ ] Page refresh → joined state persists
- [ ] Upvote button changes color when clicked
- [ ] Vote count updates correctly
- [ ] Dark mode toggle works
- [ ] Profile dropdown menu displays

**UI Components**:
- [ ] Navbar displays username and avatar
- [ ] Sidebar navigation works
- [ ] Post cards render correctly
- [ ] Avatar shows user initials when no image
- [ ] Loading spinner shows during data fetch
- [ ] Alert notifications display and auto-dismiss
- [ ] Buttons show hover states
- [ ] Input fields show focus states
- [ ] Form validation displays inline errors

**Responsive Design**:
- [ ] Desktop view (1920px) renders properly
- [ ] Laptop view (1366px) adjusts layout
- [ ] Tablet view (768px) stacks components
- [ ] Mobile view (375px) single column layout
- [ ] Sidebar collapses on mobile
- [ ] Touch targets appropriate size

**Browser Compatibility**:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (latest)

#### Frontend Debugging Techniques

**React DevTools**:
1. **Install Extension**: Chrome/Firefox React DevTools
2. **Inspect Component Tree**: View component hierarchy
3. **Check Props**: Verify props passed correctly
4. **Monitor State**: Watch state changes in real-time
5. **Profiler**: Identify performance bottlenecks

**Browser DevTools**:
```javascript
// Console debugging
console.log('User:', user);
console.log('Posts:', posts);
console.log('isFollowing:', isFollowing);

// Network tab
// - Check API requests/responses
// - Verify request headers (Authorization)
// - Check response status codes
// - View request/response payloads

// Application tab
// - Inspect localStorage
// - View cookies
// - Check session storage

// Performance tab
// - Identify slow renders
// - Check component mount times
// - Monitor re-renders
```

**Common Frontend Issues**:

**State Not Updating**:
- Check if setState called correctly
- Verify useEffect dependencies array
- Ensure not mutating state directly
- Check for async timing issues

**API Calls Failing**:
- Verify token in localStorage: `localStorage.getItem('reditto_auth_token')`
- Check Authorization header in Network tab
- Verify API URL in .env.local
- Check CORS errors in console
- Verify backend server running on port 5000

**Race Condition Debugging**:
```javascript
// Add logging to track execution order
useEffect(() => {
  console.log('1. Component mounted');
  console.log('2. userLoading:', userLoading);
  console.log('3. user:', user);
  
  if (userLoading) {
    console.log('4. Waiting for user to load...');
    return;
  }
  
  console.log('5. Fetching posts...');
  fetchPosts();
}, [userLoading]);
```

**Component Not Rendering**:
- Check conditional rendering logic
- Verify data exists before mapping
- Check for undefined/null errors
- Use optional chaining: `user?.communities?.joined`
- Verify component imported/exported correctly

#### Performance Testing

**Lighthouse Audit**:
1. Open Chrome DevTools → Lighthouse tab
2. Run audit (Performance, Accessibility, Best Practices, SEO)
3. Review metrics:
   - First Contentful Paint (< 1.8s)
   - Largest Contentful Paint (< 2.5s)
   - Time to Interactive (< 3.8s)
   - Cumulative Layout Shift (< 0.1)

**Network Performance**:
- Check bundle size: `npm run build` → review build/static/
- Minimize API calls (use caching)
- Lazy load components with React.lazy()
- Optimize images (compress, use WebP)
- Use code splitting

**Memory Leaks**:
```javascript
// Clean up in useEffect
useEffect(() => {
  const controller = new AbortController();
  
  fetchData(controller.signal);
  
  return () => {
    controller.abort(); // Cancel pending requests
  };
}, []);
```

## Architecture & Technical Implementation

### Backend Architecture

#### MVC Pattern
```
Request → Routes → Middleware → Controllers → Models → Database
                      ↓
                  Response
```

**Layers**:
1. **Routes** (`server/routes/`)
   - Define API endpoints
   - Apply middleware
   - Map to controllers

2. **Middleware** (`server/middleware/`)
   - `authenticateToken`: JWT verification
   - `validateUserRegistration`: Input validation
   - `validateUserUpdate`: Update validation
   - `hashPassword`: Password hashing (bcrypt)
   - `validateObjectId`: MongoDB ObjectId validation

3. **Controllers** (`server/controllers/`)
   - `authController.js`: Authentication logic
     - register, login, getCurrentUser, refreshToken
   - `userController.js`: User operations
     - updateUser, getUserById, getUserByUsername, deleteUser
   - `communityController.js`: Community operations
     - createCommunity, getCommunity, updateCommunity, deleteCommunity
   - `postController.js`: Post operations
     - createPost, getPosts, getPost, updatePost, deletePost, upvotePost, downvotePost
   - `commentController.js`: Comment operations
     - createComment, getCommentsByPost, getCommentById, getCommentReplies, updateComment, deleteComment, upvoteComment, downvoteComment, removeVote

4. **Models** (`server/models/`)
   - `User.js`: Mongoose schema with validation
   - `Community.js`: Community schema with rules, flairs, settings
   - `Post.js`: Post schema with voting, validation, soft delete
   - `Comment.js`: Comment schema with nested threading, voting, reply counts

#### Authentication Flow

**Registration**:
```
1. Client sends POST /api/auth/register
2. validateUserRegistration middleware checks input
3. hashPassword middleware hashes password (bcrypt, 10 rounds)
4. authController.register creates user
5. JWT token generated (7-day expiration)
6. Return { token, user, message }
```

**Login**:
```
1. Client sends POST /api/auth/login
2. Find user by email.toLowerCase()
3. bcrypt.compare(password, hashedPassword)
4. Update user.settings.lastActive
5. Generate JWT token
6. Return { token, user, message }
```

**Protected Routes**:
```
1. Client sends request with Authorization: Bearer <token>
2. authenticateToken middleware extracts token
3. jwt.verify(token, JWT_SECRET)
4. Attach user ID to req.user
5. Controller accesses req.user.userId
```

### Frontend Architecture

#### Component Hierarchy
```
App
├── Home (page)
│   ├── Navbar
│   │   ├── Logo
│   │   ├── SearchBar
│   │   └── Avatar
│   ├── Sidebar
│   └── Post (multiple)
│       ├── Avatar
│       ├── Card
│       └── Button (join/vote/comment/share)
├── Login (page)
│   ├── Card
│   ├── Input (multiple)
│   ├── Button
│   └── Alert
└── Register (page)
    ├── Card
    ├── Input (multiple)
    ├── Button
    └── Alert
```

#### State Management
- **Local State**: React useState hooks
  - User loading state coordination
  - Dark mode toggle
  - Individual component states (isJoined, etc.)
- **Persistent State**: localStorage
  - `reditto_auth_token`: JWT token
  - `reditto_user`: User object
- **User Loading Pattern**: Prevents race conditions
  - App.js fetches user on mount
  - Sets `userLoading` flag to track fetch status
  - Child components wait for `userLoading=false` before fetching data
  - Ensures user.communities.joined is available before rendering

#### Service Layer
```
src/services/
├── api.js           # HTTP requests to backend
│   ├── authAPI.register()
│   ├── authAPI.login()
│   ├── authAPI.getCurrentUser()
│   ├── authAPI.refreshToken()
│   ├── userAPI.getUserById()
│   ├── userAPI.getUserByUsername()
│   ├── userAPI.updateUser()
│   ├── userAPI.deleteUser()
│   ├── communityAPI.createCommunity()
│   ├── communityAPI.getCommunity()
│   ├── postAPI.getPosts()
│   ├── postAPI.getPost()
│   ├── postAPI.createPost()
│   ├── postAPI.upvotePost()
│   └── postAPI.downvotePost()
└── authService.js   # Auth state management
    ├── saveAuth()
    ├── saveUser()       # Update user without changing token
    ├── getToken()
    ├── getUser()
    ├── clearAuth()
    └── isAuthenticated()
```

#### API Communication
```javascript
// Example: Register user
const response = await authAPI.register({
  username: 'user123',
  email: 'user@example.com',
  password: 'Pass123',
  displayName: 'User'
});

authService.saveAuth(response.token, response.user);
```

### Security Implementation

#### Password Security
- **Hashing Algorithm**: bcrypt
- **Salt Rounds**: 10
- **Storage**: Only hashed passwords stored in database
- **Validation**: Regex pattern `(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}`

#### JWT Security
- **Secret**: Environment variable (`JWT_SECRET`)
- **Expiration**: 7 days (configurable)
- **Payload**: `{ userId: ObjectId }`
- **Verification**: On every protected route
- **Refresh**: Token refresh endpoint available

#### CORS Configuration
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

#### Input Validation
- Email format validation
- Username length and character restrictions
- Password strength requirements
- Display name length limits
- MongoDB ObjectId validation

### Community Join/Unjoin Flow

**Join Workflow**:
```
1. User clicks Join button on Post component
2. Post component toggles local isJoined state (UI feedback)
3. Post calls onJoin(communityName, isJoining, communityId)
4. Home passes call to App.handleJoinCommunity
5. App updates user.communities.joined array
6. App calls PUT /api/users/:userId with { communities: { joined: [...] } }
7. Backend updates user document
8. App updates localStorage and user state
9. On next page load, isFollowing calculated from fresh user.communities.joined
```

**State Separation**:
- `isFollowing` (from API): Set once when posts are fetched, determines if Join button renders
- `isJoined` (local UI): Toggles when user clicks, controls button appearance (Join/Joined)
- This separation prevents button from disappearing on click while still reflecting database state on page load

**Race Condition Prevention**:
- App.js fetches user from `/api/auth/me` on mount
- `userLoading` state tracks fetch completion
- Home.js waits for `userLoading=false` before fetching posts
- This ensures `user.communities.joined` is available when calculating `isFollowing`

### Post Model Validation

**Text vs Image Exclusivity**:
```javascript
// Pre-save hook in Post.js
if (this.type === 'text' && this.imageUrl) {
  throw new Error('Text posts cannot have images');
}
if (this.type === 'image' && this.content) {
  throw new Error('Image posts cannot have text content');
}
```

**Vote Count Calculation**:
```javascript
// Automatically calculated on save
this.voteCount = this.votes.upvotes.length - this.votes.downvotes.length;
```

**Consolidated Pre-Save Hooks**:
- Fixed "next is not a function" error by combining multiple hooks into one
- Validates text/image exclusivity, updates timestamps, calculates vote count
- Uses `throw` instead of `next(error)` for proper error handling

### Database Schema Design

#### User Model Features
- **Unique Constraints**: username, email
- **Lowercase Transformation**: email (automatic)
- **Validation**: Built into Mongoose schema
- **Indexes**: Automatic on unique fields
- **Timestamps**: createdAt, updatedAt (automatic)

#### Karma System
```javascript
karma: {
  postKarma: { type: Number, default: 0 },
  commentKarma: { type: Number, default: 0 }
}
```

#### Relationships (for future implementation)
- Communities: References to Community model
- Posts: Upvoted, downvoted, saved
- Social: Followers, following (user references)

## Development Challenges & Solutions

### Challenge 1: CORS Errors
**Problem**: Frontend couldn't communicate with backend ("Failed to fetch")

**Solution**:
```javascript
// server/index.js
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Challenge 2: Port Conflicts
**Problem**: Both frontend and backend tried to use same PORT variable

**Solution**: Separated environment variables
- Backend: `SERVER_PORT=5000`
- Frontend: Uses default React port (3000)

### Challenge 3: Database Separation
**Problem**: Tests modifying development data

**Solution**: Database-specific connection strings
- Development: `/dev` database
- Testing: `/test` database

### Challenge 4: Case-Insensitive Email Login
**Problem**: Users couldn't login with uppercase emails

**Solution**:
- Schema: `lowercase: true` on email field
- Login: `email.toLowerCase()` in query
- Registration: Check duplicates with `email.toLowerCase()`

### Challenge 5: Test Suite Imbalance
**Problem**: Too many negative tests, not enough positive tests

**Solution**: Rebalanced test suite to 17 positive vs 7 negative tests initially, expanded to 52 comprehensive tests

## Code Quality Standards

### Linting & Formatting
- **ESLint**: React app configuration
- **Rules**: jsx-a11y/anchor-is-valid warnings for accessibility

### Code Organization
- **Separation of Concerns**: Routes, controllers, models, middleware
- **DRY Principle**: Reusable components and utilities
- **Naming Conventions**:
  - camelCase for variables and functions
  - PascalCase for components and classes
  - UPPERCASE for environment variables

### Error Handling
```javascript
// Controller pattern
try {
  // Operation
} catch (error) {
  console.error('Error context:', error);
  res.status(500).json({ 
    error: 'User-friendly message',
    details: error.message 
  });
}
```

## Performance Considerations

### Backend Optimizations
- MongoDB connection pooling (default)
- Password comparison runs once per login
- JWT tokens reduce database queries
- Selective field projection (exclude password)

### Frontend Optimizations
- React lazy loading (ready for implementation)
- Local storage for auth state (reduces API calls)
- Component memoization opportunities
- Asset optimization (minification in production)

## Deployment Readiness

- **Alpha build** already deployed
- **Beta versions** may be deployed after major bug fixes are complete
- **Official releases** may be deployed once optimizations have been made and bonus features implemented

### Production Checklist
- [x] Environment variables secured
- [x] CORS origin restricted to production domain
- [x] JWT secret changed to strong random value
- [x] MongoDB connection string updated for production
- [ ] Frontend built (`npm run build`)
- [ ] Backend served with process manager (PM2)
- [x] HTTPS enabled
- [ ] Rate limiting implemented
- [x] Logging configured
- [ ] Error monitoring setup

### Build Process
```bash
# Frontend production build
npm run build

# Backend (no build needed, runs Node directly)
NODE_ENV=production npm run server
```

### Hosting & deployment automation

- **Frontend:** Vercel (supports previews, branch deployments, and environment variables).
- **Backend:** Render (supports private services, background workers, and environment groups).
- **Environments:** Configured two environments on each platform:
  - `development` (preview/alpha) — for feature branches and internal testing (restricted access to teammates).
  - `release` — public/stable environment served to end users (currently alpha versions).
- **Automation:** Connect the repository to the hosting platforms and configure automatic deployments:
  - Development deployments: triggered by pushes to feature branches.
  - Release deployments: triggered by pushes or merges to the `release` branch.
- **Secrets & envs:** Store distinct environment variables for each environment (API keys, DB URIs). Do NOT store secrets in the repository.


## Future Development

### Completed Features
- [x] Post creation and management (API ready)
- [x] Community (subreddit) functionality
- [x] Voting system (upvote/downvote posts and comments)
- [x] User feed/timeline (Home page with real-time posts)
- [x] Community join/unjoin
- [x] Post display with votes, comments, share
- [x] Comment system (create, reply, vote, nested threading)
- [x] Dark mode theme
- [x] Database population script
- [x] Community pages (view all posts in community)
- [x] User profile pages
- [x] Create post UI (currently API-only)
- [x] Search functionality
- [x] Post flairs UI
- [x] Community rules display
- [x] Moderator tools

### Planned Features
- The remaining planned features to implement are intentionally small, prioritized, and listed below. All other previously planned items are implemented.
- [ ] Image upload using block storage (e.g., Cloudinary) — currently image posting is URL-based
- [ ] Notifications (in-app notification center and opt-in preferences)
- [ ] User settings page (profile preferences, privacy, notification toggles)
- [ ] Password reset flow (email reset + tokenized link)
- [ ] Edit posts/comments (allow authors to edit their content with edit metadata)
- [ ] User chat (Real-time, Socket.io)

### Technical Improvements
- [x] Frontend routing with React Router
- [ ] State management (Context API or Redux)
- [ ] Real-time features (Socket.io)
- [ ] Pagination for lists
- [ ] Image optimization and CDN
- [ ] API rate limiting
- [ ] Redis caching
- [ ] Frontend test coverage
- [x] CI/CD pipeline
- [ ] Docker containerization

## Maintenance & Monitoring

### Logging Strategy
- Console logging in development
- File logging for production (winston/pino)
- Error tracking (Sentry)
- Request logging (morgan)

### Database Maintenance
- Regular backups (MongoDB Atlas automatic)
- Index optimization
- Query performance monitoring
- Storage monitoring

### Updates & Dependencies
```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Audit security
npm audit
npm audit fix
```

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Check internet connection
- Verify IP whitelist in MongoDB Atlas
- Confirm credentials in `.env`
- Check database name in connection string

**JWT Token Invalid**
- Check JWT_SECRET matches between requests
- Verify token not expired
- Check Authorization header format: `Bearer <token>`

**CORS Errors**
- Verify backend CORS origin matches frontend URL
- Check credentials: true if using cookies
- Ensure preflight requests handled

**Tests Failing**
- Check test database connection
- Verify test data cleanup in beforeEach
- Ensure test isolation (no shared state)
- Check for timing issues (add delays if needed)

**Post Model "next is not a function"**
- Multiple pre-save hooks conflict
- Consolidate into single pre-save hook
- Use `throw new Error()` instead of `next(error)`

**Join Button Not Showing/Disappearing**
- Check `userLoading` state propagation
- Verify user fetch completes before post fetch
- Ensure `isFollowing` calculated from `user.communities.joined`
- Confirm `isJoined` local state separate from `isFollowing`

**User Data Empty on Page Load**
- Race condition: Home.js fetching before App.js finishes user fetch
- Solution: Use `userLoading` flag to coordinate timing
- App.js: Set `userLoading=true`, fetch user, set `userLoading=false`
- Home.js: `if (userLoading) return;` in useEffect before fetching posts
- Dependency array should be `[userLoading]` not `[user]`

**Debugging API Requests**
- Use Browser Network tab to inspect requests
- Check request headers: `Authorization: Bearer <token>`
- Verify request payload format (JSON)
- Check response status codes (200, 401, 404, 500)
- Use Postman to isolate backend issues
- Check server console for error logs

**Debugging React Components**
- Use React DevTools to inspect props/state
- Add console.logs at component entry points
- Check useEffect execution with logs
- Verify conditional rendering logic
- Use debugger statements or breakpoints
- Check for infinite render loops (missing dependencies)

## References

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [MongoDB/Mongoose Docs](https://mongoosejs.com/)
- [React Docs](https://react.dev/)
- [JWT.io](https://jwt.io/)
- [Jest Docs](https://jestjs.io/)

### Project & Library References
- [Node.js](https://nodejs.org/) — runtime used for backend scripts and server
- [dotenv](https://www.npmjs.com/package/dotenv) — environment variable loading (`.env` files)
- [bcrypt / bcryptjs](https://www.npmjs.com/package/bcrypt) / https://www.npmjs.com/package/bcryptjs — password hashing used in `scripts/populate.js` and auth flows
- [Supertest](https://www.npmjs.com/package/supertest) — HTTP integration testing for backend tests in `server/testing`
- [React Router](https://reactrouter.com/) — frontend routing (`react-router-dom`)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) — frontend unit/integration testing utilities
- [Axios](https://axios-http.com/) — HTTP client used in frontend services

### Hosting, Deployment & Ops
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) — recommended DB hosting
- [Cloudinary](https://cloudinary.com/) — suggested block-storage/image hosting provider for future image upload feature
- [Vercel](https://vercel.com/) — recommended frontend hosting
- [Render](https://render.com/) — recommended backend hosting (or similar provider)
- [PM2](https://pm2.keymetrics.io/) — process manager suggested for production Node servers
- [Docker](https://www.docker.com/) — containerization for deployments (optional)

### Monitoring, Logging & Security
- [Sentry](https://sentry.io/) — error monitoring
- [Winston](https://github.com/winstonjs/winston) / [Pino](https://getpino.io/) — structured logging suggestions
- [Morgan](https://github.com/expressjs/morgan) — HTTP request logging middleware for Express
- [Helmet](https://helmetjs.github.io/) — security hardening middleware for Express

### Tools & Utilities
- [Postman](https://www.postman.com/) — API testing and collection import/export (Postman collection generation script lives in `scripts/output`)
- [GitHub](https://github.com/) — code hosting and CI/CD integration
- [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) — linting and formatting
- [concurrently](https://www.npmjs.com/package/concurrently) — used by `npm run dev` to run frontend+backend

---

*Last Updated: December 20, 2025*

### Learning Resources
- [MDN Web Docs](https://developer.mozilla.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Best Practices](https://react.dev/learn)

---
