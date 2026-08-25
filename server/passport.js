const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./db');
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret',
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists by google_id
        let res = await db.query('SELECT * FROM users WHERE google_id = $1', [profile.id]);
        
        if (res.rows.length === 0) {
          // Check if user exists by email (if they registered with password before)
          const email = profile.emails[0].value;
          res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
          
          if (res.rows.length > 0) {
            // Link google_id to existing account
            const updated = await db.query(
              'UPDATE users SET google_id = $1 WHERE email = $2 RETURNING *',
              [profile.id, email]
            );
            return done(null, updated.rows[0]);
          } else {
            // Create brand new user
            const newUser = await db.query(
              'INSERT INTO users (email, full_name, google_id) VALUES ($1, $2, $3) RETURNING *',
              [email, profile.displayName, profile.id]
            );
            return done(null, newUser.rows[0]);
          }
        }
        
        return done(null, res.rows[0]);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
