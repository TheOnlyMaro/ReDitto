const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      req.user = decoded; // { userId: ... }
      next();
    });
  } catch (error) {
    console.error('Error authenticating token:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Validate user registration data
const validateUserRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Username validation
  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  } else if (username.length < 3 || username.length > 20) {
    errors.push('Username must be between 3 and 20 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Email validation
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email must be a valid email address');
  }

  // Password validation
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  } else if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  } else if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Validate user update data
const validateUserUpdate = (req, res, next) => {
  const { displayName, avatar } = req.body;
  const errors = [];

  // DisplayName validation (optional)
  if (displayName !== undefined) {
    if (typeof displayName !== 'string') {
      errors.push('Display name must be a string');
    } else if (displayName.length > 30) {
      errors.push('Display name must not exceed 30 characters');
    }
  }

  // Avatar validation (optional)
  if (avatar !== undefined) {
    if (typeof avatar !== 'string') {
      errors.push('Avatar must be a string');
    } else if (avatar.length > 500) {
      errors.push('Avatar URL must not exceed 500 characters');
    } else if (avatar.length > 0 && !/^https?:\/\/.+/.test(avatar)) {
      errors.push('Avatar must be a valid URL');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

// Hash password before saving
const hashPassword = async (req, res, next) => {
  try {
    if (req.body.password) {
      const saltRounds = 10;
      req.body.password = await bcrypt.hash(req.body.password, saltRounds);
    }
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    res.status(500).json({ error: 'Failed to process password' });
  }
};

// Validate MongoDB ObjectId
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  validateUserRegistration,
  validateUserUpdate,
  hashPassword,
  validateObjectId
};
