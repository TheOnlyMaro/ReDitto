# ReDitto Quick Start Guide

Get ReDitto running on your local machine in minutes!

## Prerequisites

Before you begin, ensure you have:
- ✅ Node.js (v14 or higher) - [Download here](https://nodejs.org/)
- ✅ MongoDB Atlas account - [Sign up free](https://www.mongodb.com/cloud/atlas/register)
- ✅ Code editor (VS Code recommended)
- ✅ Git installed

## Quick Setup (5 minutes)

### 1. Clone and Install

```bash
# Navigate to the project directory
cd ReDitto/reditto

# Install all dependencies
npm install
```

### 2. Set Up Environment Variables

**Backend (.env)**

Create a `.env` file in the `reditto` folder:

```env
# MongoDB Connection Strings
MONGODB_URI=your_mongodb_connection_string/dev
MONGODB_TEST_URI=your_mongodb_connection_string/test

# Server Port
SERVER_PORT=5000

# JWT Configuration
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```

**Frontend (.env.local)**

Create a `.env.local` file in the `reditto` folder:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Get MongoDB Connection String

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click "Connect" on your cluster
3. Select "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database password
6. Add `/dev` at the end for development database

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dev?appName=Cluster0
```

### 4. Start the Application

**Option A: Run Full Stack (Recommended)**

```bash
npm run dev
```

This starts both frontend (port 3000) and backend (port 5000) simultaneously.

**Option B: Run Separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm start
```

### 5. Populate with Test Data (Optional)

```bash
node scripts/populate.js
```

This creates:
- 3 test users
- 3 communities (webdev, reactjs, javascript)
- 4 sample posts

**Test Login:**
- Username: `monketest1`
- Password: `Test123!`

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## First Steps

1. **Register an account** at http://localhost:3000/register
   - Or use test account: monketest1 / Test123!

2. **Explore the home feed** - See posts from communities

3. **Join communities** - Click "Join" on posts

4. **Vote on posts** - Click upvote/downvote arrows

5. **Try dark mode** - Toggle in profile dropdown menu

## Common Issues & Solutions

### "MongoDB connection error"
- ✅ Check internet connection
- ✅ Verify connection string in `.env`
- ✅ Whitelist your IP in MongoDB Atlas (Network Access)
- ✅ Confirm password is correct (no special characters in URI)

### "EADDRINUSE: Port already in use"
**Port 3000 conflict:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

**Port 5000 conflict:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:5000 | xargs kill
```

### "Cannot GET /api/..."
- ✅ Make sure backend server is running (`npm run server`)
- ✅ Check `REACT_APP_API_URL` in `.env.local`
- ✅ Verify backend is on port 5000

### "Failed to fetch" / CORS errors
- ✅ Backend must be running on port 5000
- ✅ Frontend must be on port 3000
- ✅ Check CORS configuration in `server/index.js`

### JWT Token errors
- ✅ Log out and log back in
- ✅ Clear localStorage (Browser DevTools → Application → Local Storage)
- ✅ Check JWT_SECRET in `.env` matches

## Running Tests

```bash
# Run all backend tests
npm run test:server

# Run with coverage
npm run test:server -- --coverage

# Run frontend tests
npm test
```

## Project Structure Quick Reference

```
reditto/
├── server/              # Backend (Express + MongoDB)
│   ├── controllers/     # Request handlers
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth & validation
│   └── index.js         # Server entry point
│
├── src/                 # Frontend (React)
│   ├── components/      # Reusable UI components
│   ├── pages/           # Page components
│   ├── services/        # API calls
│   └── App.js           # Root component
│
├── public/              # Static assets
├── scripts/             # Utility scripts
└── .env                 # Environment variables (create this!)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run frontend + backend together |
| `npm start` | Run frontend only (port 3000) |
| `npm run server` | Run backend only (port 5000) |
| `npm run test:server` | Run all backend tests |
| `npm test` | Run frontend tests |
| `npm run build` | Build production version |
| `node scripts/populate.js` | Seed database with test data |

## Next Steps

- 📖 Read [README.md](../README.md) for feature overview
- 🔧 Read [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide
- 🌐 Read [API.md](API.md) for complete API documentation
- 🐛 Check [DEVELOPMENT.md](DEVELOPMENT.md) troubleshooting section
- 🎨 Customize theme colors in `src/index.css`

## Useful Links

- **MongoDB Atlas**: https://cloud.mongodb.com/
- **React Documentation**: https://react.dev/
- **Express Documentation**: https://expressjs.com/
- **Mongoose Documentation**: https://mongoosejs.com/

## Getting Help

If you encounter issues:

1. Check the troubleshooting sections in DEVELOPMENT.md
2. Review the console for error messages
3. Check Browser DevTools Network tab for API errors
4. Verify all environment variables are set correctly
5. Ensure MongoDB connection is successful

## Success Checklist

Before considering setup complete, verify:

- [ ] Backend server starts without errors
- [ ] Frontend opens in browser at http://localhost:3000
- [ ] Can register a new user account
- [ ] Can log in successfully
- [ ] Home page displays posts
- [ ] Can join a community
- [ ] Can upvote/downvote posts
- [ ] Dark mode toggle works
- [ ] All tests pass (`npm run test:server`)

---

**Ready to code!** 🚀

For detailed information, refer to:
- [README.md](../README.md) - Project overview
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [API.md](API.md) - API documentation

*Last Updated: December 18, 2025*
