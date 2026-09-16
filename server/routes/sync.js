const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-clubsync-key';

// Middleware to protect route
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

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      { rows: clubs },
      { rows: events },
      { rows: clubMemberships },
      { rows: eventMembers },
      { rows: constitutions },
      { rows: meetings },
      { rows: elections },
      { rows: candidates },
      { rows: votes },
      { rows: documents },
      { rows: tasks },
      { rows: notifications },
      { rows: transactions },
      { rows: messages },
    ] = await Promise.all([
      db.query('SELECT * FROM clubs'),
      db.query('SELECT * FROM events'),
      db.query('SELECT * FROM club_members'),
      db.query('SELECT * FROM event_members'),
      db.query('SELECT * FROM constitutions'),
      db.query('SELECT * FROM meetings'),
      db.query('SELECT * FROM elections'),
      db.query('SELECT * FROM election_candidates'),
      db.query('SELECT * FROM election_votes'),
      db.query('SELECT * FROM documents'),
      db.query('SELECT * FROM tasks'),
      db.query('SELECT * FROM notifications WHERE user_id = $1', [userId]),
    ]);

    res.json({
      clubs,
      events,
      clubMemberships,
      eventMembers,
      constitutions,
      meetings,
      elections,
      candidates,
      votes,
      documents,
      tasks,
      notifications,
      transactions,
      messages,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// Create notification
router.post('/notifications', requireAuth, async (req, res) => {
  try {
    const { title, message } = req.body;
    const { rows } = await db.query(
      "INSERT INTO notifications (user_id, title, message, time) VALUES ($1, $2, $3, 'Just now') RETURNING *",
      [req.user.id, title, message]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

// Mark as read
router.put('/notifications/:id/read', requireAuth, async (req, res) => {
  try {
    await db.query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
