const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-clubsync-key';

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create a new election
router.post('/', requireAuth, async (req, res) => {
  try {
    const { club_id, title, description, start_date, end_date, candidates } = req.body;
    
    // Check if user is an officer
    const roleCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [club_id, req.user.id]
    );
    
    if (roleCheck.rows.length === 0 || !['President', 'Vice President', 'Secretary', 'Treasurer'].includes(roleCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Only club officers can create elections' });
    }

    await db.query('BEGIN');

    const electionRes = await db.query(
      `INSERT INTO elections (club_id, title, description, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
      [club_id, title, description, start_date || new Date(), end_date || new Date(Date.now() + 7*24*60*60*1000)]
    );

    const electionId = electionRes.rows[0].id;

    // Insert candidates (we expect candidate names or IDs, let's say they are just text for now, but schema says user_id.
    // If candidates array contains names, we might need to look up users, or modify schema. 
    // In ClubDetail.jsx: candidatesText.split(',')... so they are strings.
    // Let's adapt to store strings in manifesto for now if we can't find users, OR let's just create dummy users/look them up.
    // Actually, schema has `user_id UUID`. Let's just lookup by name or email.
    
    for (const name of candidates) {
      // Very naive lookup, real app should select from members list
      let userRes = await db.query('SELECT id FROM users WHERE full_name ILIKE $1 LIMIT 1', [name]);
      if (userRes.rows.length > 0) {
        await db.query(
          'INSERT INTO election_candidates (election_id, user_id, manifesto) VALUES ($1, $2, $3)',
          [electionId, userRes.rows[0].id, `Vote for ${name}`]
        );
      }
    }

    await db.query('COMMIT');
    res.status(201).json(electionRes.rows[0]);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error creating election:', error);
    res.status(500).json({ error: 'Failed to create election' });
  }
});

// Cast a vote (Double voting prevention)
router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const electionId = req.params.id;
    const { candidate_id } = req.body;
    const voterId = req.user.id;

    // Database unique constraint UNIQUE(election_id, voter_id) handles double-voting prevention
    // but we can catch it specifically
    const { rows } = await db.query(
      'INSERT INTO election_votes (election_id, candidate_id, voter_id) VALUES ($1, $2, $3) RETURNING *',
      [electionId, candidate_id, voterId]
    );

    res.json(rows[0]);
  } catch (error) {
    // Check for unique constraint violation error code in Postgres (23505)
    if (error.code === '23505') {
      return res.status(403).json({ error: 'You have already voted in this election' });
    }
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

module.exports = router;
