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

// Create a new task
router.post('/', requireAuth, async (req, res) => {
  try {
    const { club_id, title, description, assignee_id, due_date } = req.body;
    
    // Check if user is an officer of the club
    const roleCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [club_id, req.user.id]
    );
    
    if (roleCheck.rows.length === 0 || !['President', 'Vice President', 'Secretary', 'Treasurer'].includes(roleCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Only club officers can create tasks' });
    }

    const { rows } = await db.query(
      `INSERT INTO tasks (club_id, title, description, assignee_id, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [club_id, title, description, assignee_id || null, due_date || null, req.user.id]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body; // 'todo', 'in_progress', 'done'

    // We can allow the assignee OR an officer to update status
    // For simplicity, just update it if they are logged in (or we can enforce permissions)
    const { rows } = await db.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, taskId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;
