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
    const club_id = req.params.id;
    const { title, date, time, location, description, minutes } = req.body;
    const { rows } = await db.query(
      'INSERT INTO meetings (club_id, title, date, time, location, description, minutes, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        club_id, 
        title, 
        date, 
        time || null, 
        location || null, 
        description || null, 
        minutes || null, 
        req.user.id
      ]
    );

    const newMeeting = rows[0];

    // EMAIL NOTIFICATION
    try {
      const clubRes = await db.query('SELECT name FROM clubs WHERE id = $1', [club_id]);
      const membersRes = await db.query(
        'SELECT u.email, u.name FROM users u JOIN club_members cm ON u.id = cm.user_id WHERE cm.club_id = $1',
        [club_id]
      );
      
      if (clubRes.rows.length > 0 && membersRes.rows.length > 0) {
        const clubName = clubRes.rows[0].name;
        const { sendEmail } = require('../utils/email');
        
        // Send email to all members
        const bccList = membersRes.rows.map(m => m.email).join(', ');
        
        await sendEmail({
          to: '"Club Members" <noreply@clubsync.app>',
          bcc: bccList,
          subject: `New Meeting Scheduled: ${title}`,
          text: `A new meeting has been scheduled for ${clubName}.\n\nTitle: ${title}\nDate: ${date}\nTime: ${time || 'TBD'}\nLocation: ${location || 'TBD'}\n\n${description || ''}\n\nSee you there!`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
              <h2 style="color: #6c5ce7;">New Meeting: ${clubName}</h2>
              <p>A new meeting has been scheduled!</p>
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; margin-bottom: 10px;">${title}</h3>
                <p style="margin: 0; color: #475569;"><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                <p style="margin: 0; color: #475569;"><strong>Time:</strong> ${time || 'TBD'}</p>
                <p style="margin: 0; color: #475569;"><strong>Location:</strong> ${location || 'TBD'}</p>
                <p style="margin-top: 10px; color: #475569;">${description || ''}</p>
              </div>
              <a href="https://clubsync.app/clubs/${club_id}" style="display: inline-block; background-color: #6c5ce7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error('Failed to send meeting emails:', emailErr);
    }

    res.json(newMeeting);
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

// Log a Treasury Transaction
router.post('/:id/transactions', requireAuth, async (req, res) => {
  try {
    const { amount, description, type } = req.body;
    const { id: clubId } = req.params;
    const userId = req.user.id;

    // Check if officer
    const memberCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [clubId, userId]
    );
    const role = memberCheck.rows[0]?.role;
    if (!role || !['President', 'Vice President', 'Treasurer', 'Secretary'].includes(role)) {
      return res.status(403).json({ error: 'Only officers can add transactions' });
    }

    const result = await db.query(
      `INSERT INTO club_transactions (club_id, amount, description, type, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [clubId, amount, description, type, userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
