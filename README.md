# ReDitto - Reddit Clone

A full-stack Reddit clone built with the MERN stack (MongoDB, Express.js, React, Node.js) for the Web Development university course.

### Visit deployed app through here: **[ReDitto](https://reditto-zeta.vercel.app)**

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
- **Postman** - API endpoint testing
- **Alpha-release** - Exploratory testing by trusted testers on deployed version

### Development Tools
- **Concurrently** - Run frontend and backend simultaneously
- **dotenv 17.2.3** - Environment variable management

### AI & Deployment
- **Gemini APIs (Google Generative AI)** - Used by the backend AI feature to summarize posts and discussions.
- **Vercel** - Recommended host for frontend deployments (preview and production).
- **Render** - Recommended host for backend deployments (preview and production).
- **Deployment model:** set up two environments on the hosting platforms — a `development` (preview/alpha) environment for feature testing and a `release` environment for public/stable releases. Connect both to GitHub and configure automated deployments: pushes to feature/dev branches trigger the development environment; merges or pushes to the `release` branch trigger the release deployment.

## Themes

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

### Color Scheme

- **Primary**: #FF4500 (Reddit Orange)
- **Secondary**: #0079D3 (Reddit Blue)
- **Background Gradient**: #4FACFE to #00F2FE (Light Blue)
- **Text**: #1C1C1C
- **Borders**: #EDEFF1
- **Background**: #F6F7F8

### Additional Colors
- **Upvote**: #0079D3 (Blue)
- **Downvote**: #ea0027 (Red)
- **Hover**: #0099ff (Light Blue)

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
