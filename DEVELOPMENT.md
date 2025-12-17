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

## Testing Strategy

### Test Environment Setup
- **Test Framework**: Jest 27.5.1
- **HTTP Testing**: Supertest 7.1.4
- **Test Database**: Separate MongoDB database (`test`)
- **Test Runner**: Node environment (not React Scripts)

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
├── server.test.js    # Database connection tests
└── user.test.js      # User & auth endpoint tests (52 tests)
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

### Test Results
- **Total Tests**: 52
- **Pass Rate**: 100%
- **Average Test Time**: ~15 seconds for full suite
- **Coverage**: Authentication, authorization, CRUD operations, security

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

4. **Models** (`server/models/`)
   - `User.js`: Mongoose schema with validation

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
- **Persistent State**: localStorage
  - `reditto_auth_token`: JWT token
  - `reditto_user`: User object

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
│   └── userAPI.deleteUser()
└── authService.js   # Auth state management
    ├── saveAuth()
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

### Production Checklist
- [ ] Environment variables secured
- [ ] CORS origin restricted to production domain
- [ ] JWT secret changed to strong random value
- [ ] MongoDB connection string updated for production
- [ ] Frontend built (`npm run build`)
- [ ] Backend served with process manager (PM2)
- [ ] HTTPS enabled
- [ ] Rate limiting implemented
- [ ] Logging configured
- [ ] Error monitoring setup

### Build Process
```bash
# Frontend production build
npm run build

# Backend (no build needed, runs Node directly)
NODE_ENV=production npm run server
```

## Future Development

### Planned Features
- [ ] Post creation and management
- [ ] Comment system
- [ ] Community (subreddit) functionality
- [ ] Voting system (upvote/downvote)
- [ ] User feed/timeline
- [ ] Search functionality
- [ ] Image upload
- [ ] Notifications
- [ ] User settings page
- [ ] Password reset flow

### Technical Improvements
- [ ] Frontend routing with React Router
- [ ] State management (Context API or Redux)
- [ ] Real-time features (Socket.io)
- [ ] Pagination for lists
- [ ] Image optimization and CDN
- [ ] API rate limiting
- [ ] Redis caching
- [ ] Frontend test coverage
- [ ] CI/CD pipeline
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

## References

### Documentation
- [Express.js Docs](https://expressjs.com/)
- [MongoDB/Mongoose Docs](https://mongoosejs.com/)
- [React Docs](https://react.dev/)
- [JWT.io](https://jwt.io/)
- [Jest Docs](https://jestjs.io/)

### Learning Resources
- [MDN Web Docs](https://developer.mozilla.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [React Best Practices](https://react.dev/learn)

---

*Last Updated: December 17, 2025*
