# ReDitto - Reddit Clone

A full-stack Reddit clone built with the MERN stack (MongoDB, Express.js, React, Node.js) for the Web Development university course.

## Project Overview

ReDitto is a social media platform inspired by Reddit, featuring user authentication, profile management, and a modern, responsive UI with Reddit-like design principles.

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
- ✅ Logout functionality

### User Profile System
- ✅ User model with Reddit-like features:
  - Karma system (post karma, comment karma)
  - Communities (created, joined)
  - Saved posts
  - Upvoted/downvoted posts and comments
  - Followers/following system
  - User settings with last active tracking
- ✅ Get user by ID
- ✅ Get user by username
- ✅ Update user profile (protected route)
- ✅ Delete user account (protected route)

### UI Components
- ✅ Reusable component library:
  - Button (multiple variants and sizes)
  - Input (with icons and error states)
  - Card (container component)
  - Avatar (with fallback initials)
  - Loading spinner
  - Alert notifications (success, error, warning, info)
  - Header (with navigation and user menu)
- ✅ Login page with validation
- ✅ Registration page with validation
- ✅ Responsive design
- ✅ Light blue gradient theme

### Testing
- ✅ 52 comprehensive backend tests
  - User registration tests
  - Login validation tests
  - JWT token security tests
  - Token forgery detection
  - Expired token handling
  - User profile CRUD tests
  - Protected route tests

## Project Structure

```
reditto/
├── public/              # Static assets
│   ├── logo192.png     # App logo
│   ├── logo512.png
│   └── index.html
├── server/             # Backend API
│   ├── controllers/    # Route controllers
│   │   ├── authController.js
│   │   └── userController.js
│   ├── middleware/     # Custom middleware
│   │   └── validation.js
│   ├── models/        # MongoDB schemas
│   │   └── User.js
│   ├── routes/        # API routes
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── testing/       # Backend tests
│   │   ├── server.test.js
│   │   └── user.test.js
│   └── index.js       # Server entry point
├── src/               # Frontend React app
│   ├── components/    # Reusable UI components
│   │   ├── Alert/
│   │   ├── Avatar/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Header/
│   │   ├── Input/
│   │   ├── Loading/
│   │   └── index.js
│   ├── pages/         # Page components
│   │   ├── Login/
│   │   └── Register/
│   ├── services/      # API services
│   │   ├── api.js
│   │   └── authService.js
│   └── App.js         # Root component
├── .env               # Environment variables (not in git)
├── .env.example       # Environment template
├── .env.local         # Frontend environment
├── .gitignore
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
```

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
```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (protected)
- `POST /refresh` - Refresh JWT token (protected)

### User Routes (`/api/users`)
- `GET /username/:username` - Get user by username
- `GET /:userId` - Get user by ID
- `PUT /:userId` - Update user (protected)
- `DELETE /:userId` - Delete user (protected)

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
  communities: {
    created: [ObjectId],
    joined: [ObjectId]
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

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- JWT token-based authentication (7-day expiration)
- Protected routes with authentication middleware
- Token forgery detection
- CORS configuration for frontend-backend communication
- Environment variable management for sensitive data
- Password validation (minimum 6 chars, uppercase, lowercase, number)

## Testing

The project includes comprehensive backend testing:
- **52 passing tests** covering:
  - User registration validation
  - Login functionality
  - JWT token generation and validation
  - Token security (wrong secrets, expired tokens, stolen tokens)
  - User CRUD operations
  - Protected route authorization

Run tests with:
```bash
npm run test:server
```

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
