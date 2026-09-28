const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer } = require('../middleware/auth');

// Create a new task
router.post('/', requireAuth, requireOfficer('club_id'), async (req, res) => {
  try {
    let { club_id, title, description, assignee_id, due_date } = req.body;
    
    if (!club_id || !title) {
      return res.status(400).json({ error: 'Club ID and task title are required' });
    }

    title = String(title).trim();
    if (title.length < 2 || title.length > 200) {
      return res.status(400).json({ error: 'Task title must be between 2 and 200 characters' });
    }

    const { rows } = await db.query(
      `INSERT INTO tasks (club_id, title, description, assignee_id, due_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        club_id, 
        title, 
        description ? String(description).trim() : null, 
        assignee_id || null, 
        due_date || null, 
        req.user.id
      ]
    );

    const newTask = rows[0];

    // SEND EMAIL NOTIFICATION (Non-blocking / resilient)
    if (assignee_id) {
      (async () => {
        try {
          const userRes = await db.query('SELECT name, email FROM users WHERE id = $1', [assignee_id]);
          const clubRes = await db.query('SELECT name FROM clubs WHERE id = $1', [club_id]);
          if (userRes.rows.length > 0 && clubRes.rows.length > 0) {
            const { sendEmail } = require('../utils/email');
            await sendEmail({
              to: userRes.rows[0].email,
              subject: `New Task Assigned: ${title}`,
              text: `Hi ${userRes.rows[0].name.split(' ')[0]},\n\nYou have been assigned a new task in ${clubRes.rows[0].name}.\n\nTask: ${title}\nDescription: ${description || 'No description'}\nDue: ${due_date || 'No due date'}\n\nPlease check ClubSync for more details!`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
                  <h2 style="color: #6c5ce7;">New Task Assigned</h2>
                  <p>Hi <b>${userRes.rows[0].name.split(' ')[0]}</b>,</p>
                  <p>You have been assigned a new task in <b>${clubRes.rows[0].name}</b>.</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; margin-bottom: 10px;">${title}</h3>
                    <p style="margin: 0; color: #475569;">${description || 'No description'}</p>
                    <p style="margin-top: 10px; margin-bottom: 0; font-size: 14px; color: #64748b;">Due: ${due_date || 'No due date'}</p>
                  </div>
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/#/clubs/${club_id}" style="display: inline-block; background-color: #6c5ce7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View in ClubSync</a>
                </div>
              `
            });
          }
        } catch (emailErr) {
          console.error('[Task Email Notification Error]:', emailErr.message);
        }
      })();
    }

    res.status(201).json(newTask);
  } catch (error) {
    console.error('[Create Task Error]:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task status
const VALID_STATUSES = ['todo', 'in_progress', 'done'];

router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid task status. Allowed: todo, in_progress, done' });
    }

    const { rows } = await db.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, taskId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    
    res.json(rows[0]);
  } catch (error) {
    console.error('[Update Task Error]:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

module.exports = router;
