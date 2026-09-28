const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer } = require('../middleware/auth');

// Create a new event
router.post('/', requireAuth, requireOfficer('club_id'), async (req, res) => {
  try {
    let { club_id, title, description, date, time, location, category, max_attendees } = req.body;
    
    if (!club_id || !title || !date) {
      return res.status(400).json({ error: 'Club ID, title, and date are required' });
    }

    title = String(title).trim();
    if (title.length < 2 || title.length > 150) {
      return res.status(400).json({ error: 'Event title must be between 2 and 150 characters' });
    }

    const { rows } = await db.query(
      `INSERT INTO events (club_id, title, description, date, time, location, category, max_attendees, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        club_id, 
        title, 
        description ? String(description).trim() : null, 
        date, 
        time || null, 
        location ? String(location).trim() : null, 
        category || 'General', 
        parseInt(max_attendees, 10) || 100, 
        req.user.id
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[Create Event Error]:', error);
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
