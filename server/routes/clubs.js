const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-clubsync-key';

// Middleware to protect routes
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

// GET all clubs
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM clubs ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// GET club by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM clubs WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Club not found' });
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch club' });
  }
});

// POST new club (Protected route)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, category } = req.body;
    const userId = req.user.id; 
    
    await db.query('BEGIN');
    const query = `
      INSERT INTO clubs (name, description, category, members_count, created_by)
      VALUES ($1, $2, $3, 1, $4) RETURNING *
    `;
    const values = [name, description, category, userId];
    const { rows } = await db.query(query, values);
    const newClub = rows[0];

    await db.query(
      'INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)',
      [newClub.id, userId, 'President']
    );

    await db.query('COMMIT');
    res.status(201).json(newClub);
  } catch (error) {
    await db.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Failed to create club' });
  }
});

// JOIN club
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.user.id;
    await db.query('INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)', [clubId, userId, 'Member']);
    await db.query('UPDATE clubs SET members_count = members_count + 1 WHERE id = $1', [clubId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to join club' });
  }
});

// LEAVE club
router.post('/:id/leave', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const userId = req.user.id;
    await db.query('DELETE FROM club_members WHERE club_id = $1 AND user_id = $2', [clubId, userId]);
    await db.query('UPDATE clubs SET members_count = GREATEST(members_count - 1, 0) WHERE id = $1', [clubId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to leave club' });
  }
});

// UPDATE role
router.put('/:id/members/:userId/role', requireAuth, async (req, res) => {
  try {
    const clubId = req.params.id;
    const targetUserId = req.params.userId;
    const { role } = req.body;
    
    // Check if requester is officer/president
    const check = await db.query('SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2', [clubId, req.user.id]);
    if (check.rows.length === 0 || !['President', 'officer'].includes(check.rows[0].role)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.query('UPDATE club_members SET role = $1 WHERE club_id = $2 AND user_id = $3', [role, clubId, targetUserId]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ADD CONSTITUTION
router.post('/:id/constitution', requireAuth, async (req, res) => {
  try {
    const { version, content, title } = req.body;
    const { rows } = await db.query(
      'INSERT INTO constitutions (club_id, version, content, title, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.id, version, content, title, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

// ADD MEETING
router.post('/:id/meetings', requireAuth, async (req, res) => {
  try {
    const { title, date, time, location, description, minutes } = req.body;
    const { rows } = await db.query(
      'INSERT INTO meetings (club_id, title, date, time, location, description, minutes, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.params.id, title, date, time, location, description, minutes, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

// ADD DOCUMENT RECORD
router.post('/:id/documents', requireAuth, async (req, res) => {
  try {
    const { name, file_url, folder_path, file_size } = req.body;
    const { rows } = await db.query(
      'INSERT INTO documents (club_id, name, file_url, folder_path, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.params.id, name, file_url, folder_path, file_size, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
