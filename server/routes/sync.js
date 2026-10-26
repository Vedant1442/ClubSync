const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Run in controlled batches (5 queries per batch) to prevent connection spikes during Neon cold starts
    const [
      { rows: clubs },
      { rows: events },
      { rows: clubMemberships },
      { rows: eventMembers },
      { rows: constitutions },
    ] = await Promise.all([
      db.query('SELECT * FROM clubs'),
      db.query('SELECT * FROM events'),
      db.query('SELECT * FROM club_members'),
      db.query('SELECT * FROM event_members'),
      db.query('SELECT * FROM constitutions'),
    ]);

    const [
      { rows: meetings },
      { rows: elections },
      { rows: candidates },
      { rows: votes },
      { rows: documents },
    ] = await Promise.all([
      db.query('SELECT * FROM meetings'),
      db.query('SELECT * FROM elections'),
      db.query('SELECT * FROM election_candidates'),
      db.query('SELECT * FROM election_votes'),
      db.query('SELECT * FROM documents'),
    ]);

    const [
      { rows: tasks },
      { rows: notifications },
      { rows: transactions },
      { rows: messages },
      { rows: payments },
    ] = await Promise.all([
      db.query('SELECT * FROM tasks'),
      db.query('SELECT * FROM notifications WHERE user_id = $1', [userId]),
      db.query('SELECT * FROM club_transactions'),
      db.query('SELECT * FROM club_messages ORDER BY created_at ASC'),
      db.query('SELECT p.*, u.full_name as user_name FROM payments p LEFT JOIN users u ON p.user_id = u.id WHERE p.user_id = $1 OR p.club_id IN (SELECT club_id FROM club_members WHERE user_id = $1) ORDER BY p.created_at DESC', [userId]),
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
      payments,
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
