const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const { JWT_SECRET, requireAuth } = require('../middleware/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  try {
    let { email, password, fullName } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    email = String(email).trim().toLowerCase();
    fullName = String(fullName).trim();

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (fullName.length < 2 || fullName.length > 80) {
      return res.status(400).json({ error: 'Full name must be between 2 and 80 characters' });
    }
    
    // Check if user exists
    const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, bio, avatar_url',
      [email, hash, fullName]
    );

    const token = jwt.sign({ id: newUser.rows[0].id }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: newUser.rows[0] });
  } catch (error) {
    console.error('[Register Error]:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    email = String(email).trim().toLowerCase();

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Use generic error message to prevent account enumeration
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // If user registered with OAuth and has no password
    if (!user.password_hash) {
      return res.status(400).json({ 
        error: 'This account was created with Google Sign-In. Please sign in with Google.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name,
        bio: user.bio,
        avatar_url: user.avatar_url
      } 
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ error: 'Failed to process login' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, full_name, bio, avatar_url, created_at FROM users WHERE id = $1', 
      [req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('[Auth /me Error]:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

const passport = require('passport');

// Guard Google OAuth if credentials not configured in production
const isGoogleOAuthConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'mock-client-id';

// Initiate Google OAuth
router.get('/google', (req, res, next) => {
  if (!isGoogleOAuthConfigured) {
    return res.status(503).json({ 
      error: 'Google OAuth is not configured on this server. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' 
    });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// Google OAuth Callback
router.get(
  '/google/callback', 
  (req, res, next) => {
    if (!isGoogleOAuthConfigured) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/#/login?error=oauth_not_configured`);
    }
    passport.authenticate('google', { 
      session: false, 
      failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/#/login?error=true` 
    })(req, res, next);
  }, 
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/#/dashboard?token=${token}`);
  }
);

// Update Profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    let { full_name, bio, avatar_url } = req.body;
    
    if (full_name !== undefined) {
      full_name = String(full_name).trim();
      if (full_name.length < 2 || full_name.length > 80) {
        return res.status(400).json({ error: 'Full name must be between 2 and 80 characters' });
      }
    }

    if (bio !== undefined) {
      bio = String(bio).trim();
      if (bio.length > 500) {
        return res.status(400).json({ error: 'Bio must be at most 500 characters' });
      }
    }

    if (avatar_url !== undefined && avatar_url !== null) {
      avatar_url = String(avatar_url).trim();
      if (avatar_url.length > 2048) {
        return res.status(400).json({ error: 'Avatar URL is too long' });
      }
    }
    
    const result = await db.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           bio = COALESCE($2, bio), 
           avatar_url = COALESCE($3, avatar_url) 
       WHERE id = $4 
       RETURNING id, email, full_name, bio, avatar_url`,
      [full_name || null, bio || null, avatar_url || null, req.user.id]
    );
    
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('[Update Profile Error]:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
