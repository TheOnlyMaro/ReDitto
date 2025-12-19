const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;

// Middleware - CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowed => {
      // Exact match
      if (origin === allowed) return true;
      // For Vercel deployments: allow all subdomains (e.g., preview deployments)
      if (allowed && allowed.includes('vercel.app') && origin.endsWith('vercel.app')) return true;
      // Flexible matching for localhost and the allowed origin
      return origin.startsWith(allowed);
    });
    
    if (isAllowed) {
      console.log('✅ CORS allowed:', origin);
      callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const communityRoutes = require('./routes/communityRoutes');
const commentRoutes = require('./routes/commentRoutes');
const searchRoutes = require('./routes/searchRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search', searchRoutes);


// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

// Initialize database connection
connectDB();

// Log environment configuration on startup
console.log('🚀 Server Configuration:');
console.log('- PORT:', PORT);
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set (using localhost:3000)');
console.log('- MongoDB URI:', process.env.MONGODB_URI ? 'Connected' : 'NOT SET');
console.log('- Allowed CORS Origins:', allowedOrigins);

app.get('/', (req, res) => {
  res.send('ReDitto API Server');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
