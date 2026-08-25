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

// Create a new event
router.post('/', requireAuth, async (req, res) => {
  try {
    const { club_id, title, description, date, time, location, category, max_attendees } = req.body;
    
    // Check if user is an officer of the club
    const roleCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [club_id, req.user.id]
    );
    
    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'officer') {
      return res.status(403).json({ error: 'Only club officers can create events' });
    }

    const { rows } = await db.query(
      `INSERT INTO events (club_id, title, description, date, time, location, category, max_attendees, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [club_id, title, description, date, time, location, category, max_attendees || 100, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// RSVP to an event
router.post('/:id/rsvp', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Check if already RSVPed
    const existing = await db.query('SELECT * FROM event_members WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
    
    if (existing.rows.length > 0) {
      // Un-RSVP
      await db.query('DELETE FROM event_members WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
      res.json({ status: 'removed' });
    } else {
      // Add RSVP
      await db.query('INSERT INTO event_members (event_id, user_id, status) VALUES ($1, $2, $3)', [eventId, userId, 'going']);
      res.json({ status: 'added' });
    }
  } catch (error) {
    console.error('Error RSVPing:', error);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
});

module.exports = router;
