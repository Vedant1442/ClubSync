const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer, OFFICER_ROLES } = require('../middleware/auth');

// GET all clubs (Paginated, Searchable, Filterable)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const search = req.query.search || '';
    const category = req.query.category && req.query.category !== 'All' ? req.query.category : null;

    let query = 'SELECT * FROM clubs WHERE 1=1';
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name ILIKE $${params.length}`;
    }
    
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    // Sort logic
    const sortBy = req.query.sortBy || 'Newest';
    let orderClause = 'ORDER BY created_at DESC';
    if (sortBy === 'Oldest') orderClause = 'ORDER BY created_at ASC';
    if (sortBy === 'A-Z') orderClause = 'ORDER BY name ASC';
    // Most Members requires a JOIN, let's keep it simple for MVP or just sort by created_at.
    
    // Total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count);

    // Fetch data
    query += ` ${orderClause} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const { rows } = await db.query(query, [...params, limit, offset]);

    res.json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
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
  const client = await db.pool.connect();
  try {
    let { name, description, category } = req.body;
    const userId = req.user.id; 

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Club name is required' });
    }

    name = name.trim();
    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Club name must be between 2 and 100 characters' });
    }

    await client.query('BEGIN');
    const query = `
      INSERT INTO clubs (name, description, category, members_count, created_by)
      VALUES ($1, $2, $3, 1, $4) RETURNING *
    `;
    const values = [name, description ? description.trim() : null, category || 'Other', userId];
    const { rows } = await client.query(query, values);
    const newClub = rows[0];

    await client.query(
      'INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)',
      [newClub.id, userId, 'President']
    );

    await client.query('COMMIT');
    res.status(201).json(newClub);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Create Club Error]:', error);
    res.status(500).json({ error: 'Failed to create club' });
  } finally {
    client.release();
  }
});

// JOIN club (Atomic & Idempotent)
router.post('/:id/join', requireAuth, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const clubId = req.params.id;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Check if already a member
    const existing = await client.query(
      'SELECT id FROM club_members WHERE club_id = $1 AND user_id = $2',
      [clubId, userId]
    );

    if (existing.rows.length > 0) {
      await client.query('COMMIT');
      return res.json({ success: true, message: 'Already a member' });
    }

    await client.query(
      'INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)', 
      [clubId, userId, 'Member']
    );
    await client.query(
      'UPDATE clubs SET members_count = members_count + 1 WHERE id = $1', 
      [clubId]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Join Club Error]:', error);
    res.status(500).json({ error: 'Failed to join club' });
  } finally {
    client.release();
  }
});

// LEAVE club (Atomic)
router.post('/:id/leave', requireAuth, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const clubId = req.params.id;
    const userId = req.user.id;

    await client.query('BEGIN');

    const deleted = await client.query(
      'DELETE FROM club_members WHERE club_id = $1 AND user_id = $2 RETURNING id', 
      [clubId, userId]
    );

    if (deleted.rows.length > 0) {
      await client.query(
        'UPDATE clubs SET members_count = GREATEST(members_count - 1, 0) WHERE id = $1', 
        [clubId]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Leave Club Error]:', error);
    res.status(500).json({ error: 'Failed to leave club' });
  } finally {
    client.release();
  }
});

// UPDATE role
router.put('/:id/members/:userId/role', requireAuth, requireOfficer('id'), async (req, res) => {
  try {
    const clubId = req.params.id;
    const targetUserId = req.params.userId;
    const { role } = req.body;

    if (!role || !['President', 'Vice President', 'Secretary', 'Treasurer', 'Member', 'officer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    const result = await db.query(
      'UPDATE club_members SET role = $1 WHERE club_id = $2 AND user_id = $3 RETURNING *', 
      [role, clubId, targetUserId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found in this club' });
    }

    res.json({ success: true, member: result.rows[0] });
  } catch (error) {
    console.error('[Update Role Error]:', error);
    res.status(500).json({ error: 'Failed to update member role' });
  }
});

// ADD CONSTITUTION
router.post('/:id/constitution', requireAuth, requireOfficer('id'), async (req, res) => {
  try {
    const { version, content, title } = req.body;
    if (!content || !title) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const { rows } = await db.query(
      'INSERT INTO constitutions (club_id, version, content, title, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.id, version || '1.0', content, title, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Add Constitution Error]:', err);
    res.status(500).json({ error: 'Failed to save constitution' });
  }
});

// ADD MEETING
router.post('/:id/meetings', requireAuth, requireOfficer('id'), async (req, res) => {
  try {
    const club_id = req.params.id;
    let { title, date, time, location, description, minutes } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Meeting title and date are required' });
    }

    const { rows } = await db.query(
      'INSERT INTO meetings (club_id, title, date, time, location, description, minutes, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        club_id, 
        String(title).trim(), 
        date, 
        time || null, 
        location ? String(location).trim() : null, 
        description ? String(description).trim() : null, 
        minutes || null, 
        req.user.id
      ]
    );

    const newMeeting = rows[0];

    // NON-BLOCKING EMAIL NOTIFICATION
    (async () => {
      try {
        const clubRes = await db.query('SELECT name FROM clubs WHERE id = $1', [club_id]);
        const membersRes = await db.query(
          'SELECT u.email, u.name FROM users u JOIN club_members cm ON u.id = cm.user_id WHERE cm.club_id = $1',
          [club_id]
        );
        
        if (clubRes.rows.length > 0 && membersRes.rows.length > 0) {
          const clubName = clubRes.rows[0].name;
          const { sendEmail } = require('../utils/email');
          const bccList = membersRes.rows.map(m => m.email).filter(Boolean).join(', ');
          
          if (bccList) {
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
                  <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/#/clubs/${club_id}" style="display: inline-block; background-color: #6c5ce7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
                </div>
              `
            });
          }
        }
      } catch (emailErr) {
        console.error('[Meeting Email Notification Error]:', emailErr.message);
      }
    })();

    res.status(201).json(newMeeting);
  } catch (err) {
    console.error('[Add Meeting Error]:', err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// ADD DOCUMENT RECORD
router.post('/:id/documents', requireAuth, requireOfficer('id'), async (req, res) => {
  try {
    let { name, file_url, folder_path, file_size } = req.body;
    if (!name || !file_url) {
      return res.status(400).json({ error: 'Document name and file URL are required' });
    }

    const { rows } = await db.query(
      'INSERT INTO documents (club_id, name, file_url, folder_path, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.params.id, String(name).trim(), file_url, folder_path || '/', file_size || '0 KB', req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Add Document Error]:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Log a Treasury Transaction
const VALID_TRANSACTION_TYPES = ['income', 'expense', 'dues'];

router.post('/:id/transactions', requireAuth, requireOfficer('id'), async (req, res) => {
  try {
    const { amount, description, type } = req.body;
    const { id: clubId } = req.params;
    const userId = req.user.id;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (!VALID_TRANSACTION_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Type must be income, expense, or dues' });
    }

    if (!description || !String(description).trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const result = await db.query(
      `INSERT INTO club_transactions (club_id, amount, description, type, created_by) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [clubId, numAmount, String(description).trim(), type, userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Add Transaction Error]:', error);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// Post a Chat Message
router.post('/:id/messages', requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    const { id: clubId } = req.params;
    const userId = req.user.id;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    const trimmed = content.trim();
    if (trimmed.length > 2000) {
      return res.status(400).json({ error: 'Message cannot exceed 2000 characters' });
    }

    // Check if member
    const memberCheck = await db.query(
      'SELECT id FROM club_members WHERE club_id = $1 AND user_id = $2',
      [clubId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Only club members can participate in chat' });
    }

    const result = await db.query(
      `INSERT INTO club_messages (club_id, user_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [clubId, userId, trimmed]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Post Message Error]:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;
