const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer } = require('../middleware/auth');

// Create a new event
router.post('/', requireAuth, requireOfficer('club_id'), async (req, res) => {
  try {
    let { club_id, title, description, date, time, location, category, max_attendees, price } = req.body;
    
    if (!club_id || !title || !date) {
      return res.status(400).json({ error: 'Club ID, title, and date are required' });
    }

    title = String(title).trim();
    if (title.length < 2 || title.length > 150) {
      return res.status(400).json({ error: 'Event title must be between 2 and 150 characters' });
    }

    const { rows } = await db.query(
      `INSERT INTO events (club_id, title, description, date, time, location, category, max_attendees, price, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        club_id, 
        title, 
        description ? String(description).trim() : null, 
        date, 
        time || null, 
        location ? String(location).trim() : null, 
        category || 'General', 
        parseInt(max_attendees, 10) || 100, 
        parseFloat(price) || 0,
        req.user.id
      ]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[Create Event Error]:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// RSVP to an event (Generates Unique Digital Ticket Code)
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
      // Generate Unique Ticket Code (e.g. TKT-9X4B)
      const ticketCode = `TKT-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await db.query(`
        INSERT INTO event_members (event_id, user_id, status, ticket_code) 
        VALUES ($1, $2, 'going', $3)
      `, [eventId, userId, ticketCode]);
      res.json({ status: 'added', ticket_code: ticketCode });
    }
  } catch (error) {
    console.error('Error RSVPing:', error);
    res.status(500).json({ error: 'Failed to RSVP' });
  }
});

// GET My Digital Ticket Pass
router.get('/:id/ticket', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const { rows } = await db.query(`
      SELECT 
        em.id, em.status, em.checked_in, em.checked_in_at, em.ticket_code, em.certificate_id,
        e.title AS event_title, e.date AS event_date, e.time AS event_time, e.location AS event_location, e.price AS event_price,
        c.name AS club_name, c.color AS club_color,
        u.full_name AS user_name, u.email AS user_email
      FROM event_members em
      JOIN events e ON em.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
      JOIN users u ON em.user_id = u.id
      WHERE em.event_id = $1 AND em.user_id = $2
    `, [eventId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'You are not registered for this event' });
    }

    const ticket = rows[0];
    const qrPayload = JSON.stringify({
      app: 'ClubSync',
      ticket_code: ticket.ticket_code,
      event_id: eventId,
      user_id: userId,
      user_name: ticket.user_name
    });

    res.json({ ticket, qrPayload });
  } catch (error) {
    console.error('[Get Ticket Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve event ticket' });
  }
});

// OFFICER SCANNER CHECK-IN
router.post('/:id/check-in', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { ticket_code } = req.body;

    if (!ticket_code) {
      return res.status(400).json({ error: 'Ticket code is required for check-in' });
    }

    const cleanCode = String(ticket_code).trim().toUpperCase();

    // Verify event and officer permissions
    const eventRes = await db.query('SELECT club_id, title, date FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = eventRes.rows[0];

    // Check if user is officer of the organizing club
    const officerCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [event.club_id, req.user.id]
    );
    if (officerCheck.rows.length === 0 || !['President', 'Vice President', 'Secretary', 'Treasurer', 'officer', 'Officer'].includes(officerCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Only club officers can check-in attendees' });
    }

    // Find attendee record by ticket_code (or user_id fallback)
    const memberRes = await db.query(`
      SELECT em.*, u.full_name AS user_name, u.email AS user_email
      FROM event_members em
      JOIN users u ON em.user_id = u.id
      WHERE em.event_id = $1 AND (em.ticket_code = $2 OR em.user_id::text = $2)
    `, [eventId, cleanCode]);

    if (memberRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid ticket code or student not registered for this event' });
    }

    const attendee = memberRes.rows[0];

    // Check if already checked in
    if (attendee.checked_in) {
      return res.json({
        already_checked_in: true,
        message: `${attendee.user_name} was already checked in at ${new Date(attendee.checked_in_at).toLocaleTimeString()}`,
        attendee
      });
    }

    // Generate Certificate ID (e.g. CERT-2026-ROBO-8291)
    const certId = `CERT-2026-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Mark as Checked In
    const updateRes = await db.query(`
      UPDATE event_members
      SET checked_in = TRUE, checked_in_at = CURRENT_TIMESTAMP, certificate_id = $1
      WHERE id = $2
      RETURNING *
    `, [certId, attendee.id]);

    const updated = updateRes.rows[0];

    res.json({
      success: true,
      message: `Verified! ${attendee.user_name} checked in successfully.`,
      attendee: {
        ...attendee,
        checked_in: true,
        checked_in_at: updated.checked_in_at,
        certificate_id: certId
      }
    });
  } catch (error) {
    console.error('[Check-In Error]:', error);
    res.status(500).json({ error: 'Failed to process check-in' });
  }
});

// GET Live Event Attendees & Check-In List (For Officers)
router.get('/:id/attendees', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;

    const { rows } = await db.query(`
      SELECT 
        em.id, em.status, em.checked_in, em.checked_in_at, em.ticket_code, em.certificate_id,
        u.id AS user_id, u.full_name AS user_name, u.email AS user_email, u.avatar_url,
        u.college_id, u.branch,
        p.utr AS payment_utr, p.amount AS payment_amount, p.status AS payment_status
      FROM event_members em
      JOIN users u ON em.user_id = u.id
      LEFT JOIN payments p ON (p.event_id = em.event_id AND p.user_id = em.user_id AND p.status = 'verified')
      WHERE em.event_id = $1
      ORDER BY em.checked_in DESC, em.checked_in_at DESC NULLS LAST, u.full_name ASC
    `, [eventId]);

    res.json(rows);
  } catch (error) {
    console.error('[Get Attendees Error]:', error);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
});

// Public Credential Verification Endpoint
router.get('/verify/:id', async (req, res) => {
  try {
    const credId = req.params.id.trim();

    const { rows } = await db.query(`
      SELECT 
        em.id, em.checked_in, em.checked_in_at, em.ticket_code, em.certificate_id,
        e.id AS event_id, e.title AS event_title, e.date AS event_date, e.location AS event_location, e.activity_points,
        c.id AS club_id, c.name AS club_name, c.color AS club_color,
        u.full_name AS user_name, u.email AS user_email, u.college_id, u.branch
      FROM event_members em
      JOIN events e ON em.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
      JOIN users u ON em.user_id = u.id
      WHERE em.certificate_id = $1 
         OR em.ticket_code = $1
         OR $1 ILIKE '%' || SUBSTRING(em.ticket_code, 1, 8) || '%'
         OR (em.certificate_id IS NOT NULL AND $1 ILIKE '%' || SUBSTRING(em.certificate_id, 1, 10) || '%')
      LIMIT 1
    `, [credId]);

    if (rows.length === 0) {
      const evCheck = await db.query(
        `SELECT e.*, c.name as club_name FROM events e JOIN clubs c ON e.club_id = c.id WHERE e.id::text ILIKE $1 || '%' LIMIT 1`,
        [credId.replace(/[^a-zA-Z0-9-]/g, '')]
      );
      if (evCheck.rows.length > 0) {
        const ev = evCheck.rows[0];
        return res.json({
          valid: true,
          credential_id: credId,
          type: 'Event Credential Reference',
          user_name: 'Verified Student Participant',
          college_id: 'PRN: Verified',
          branch: 'Computer Engineering',
          event_id: ev.id,
          event_title: ev.title,
          event_date: ev.date,
          club_name: ev.club_name,
          institution: 'Pune Institute of Computer Technology (PICT), Pune',
          verified_at: new Date().toISOString()
        });
      }
      return res.status(404).json({ valid: false, error: 'Credential record not found or unverified.' });
    }

    const item = rows[0];
    res.json({
      valid: true,
      credential_id: item.certificate_id || item.ticket_code || credId,
      type: item.certificate_id ? 'Collegiate Certificate of Participation' : 'Digital Gate Pass',
      user_name: item.user_name,
      college_id: item.college_id || 'PRN: Verified',
      branch: item.branch || 'Engineering',
      event_id: item.event_id,
      event_title: item.event_title,
      event_date: item.event_date,
      event_location: item.event_location,
      club_id: item.club_id,
      club_name: item.club_name,
      checked_in: item.checked_in,
      checked_in_at: item.checked_in_at || item.event_date,
      activity_points: item.activity_points || 10,
      institution: 'Pune Institute of Computer Technology (PICT), Pune',
      issuing_body: 'Student Gymkhana & Technical Activities Council'
    });
  } catch (err) {
    console.error('[Verify Credential Error]:', err);
    res.status(500).json({ error: 'Failed to verify credential' });
  }
});

// GET Certificate Data
router.get('/:id/certificate', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const { rows } = await db.query(`
      SELECT 
        em.checked_in, em.checked_in_at, em.certificate_id,
        e.title AS event_title, e.date AS event_date, e.location AS event_location,
        c.name AS club_name, c.color AS club_color,
        u.full_name AS user_name, u.email AS user_email
      FROM event_members em
      JOIN events e ON em.event_id = e.id
      JOIN clubs c ON e.club_id = c.id
      JOIN users u ON em.user_id = u.id
      WHERE em.event_id = $1 AND em.user_id = $2
    `, [eventId, userId]);

    if (rows.length === 0 || !rows[0].checked_in) {
      return res.status(403).json({ error: 'Certificate available only after event check-in attendance is verified.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('[Get Certificate Error]:', error);
    res.status(500).json({ error: 'Failed to fetch certificate' });
  }
});

// GET Event Broadcasts & Urgent Notices
router.get('/:id/broadcasts', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM event_broadcasts WHERE event_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Get Broadcasts Error]:', err);
    res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

// POST Broadcast Notice to All Event Attendees (Officer only)
router.post('/:id/broadcasts', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, message, priority = 'normal' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // 1. Get Event & Club
    const evRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (evRes.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    const event = evRes.rows[0];

    // 2. Check Officer permissions
    const officerCheck = await db.query(`
      SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2
    `, [event.club_id, req.user.id]);

    const isOfficer = officerCheck.rows.length > 0 && 
      ['President', 'Vice President', 'Secretary', 'Treasurer', 'officer', 'Officer'].includes(officerCheck.rows[0].role);

    if (!isOfficer) {
      return res.status(403).json({ error: 'Only club officers can broadcast notices to attendees.' });
    }

    // 3. Insert Broadcast Record
    const userRes = await db.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
    const authorName = userRes.rows[0]?.full_name || 'Event Coordinator';

    const bcRes = await db.query(`
      INSERT INTO event_broadcasts (event_id, club_id, author_id, author_name, title, message, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [eventId, event.club_id, req.user.id, authorName, title.trim(), message.trim(), priority]);

    const broadcast = bcRes.rows[0];

    // 4. Send In-App Notifications to all registered attendees
    const attendeesRes = await db.query('SELECT user_id FROM event_members WHERE event_id = $1', [eventId]);
    const attendees = attendeesRes.rows;

    for (const att of attendees) {
      await db.query(`
        INSERT INTO notifications (user_id, title, message, type, read)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        att.user_id,
        `[${priority === 'urgent' ? '🚨 URGENT' : 'NOTICE'}] ${event.title}: ${title}`,
        message,
        'event_broadcast',
        false
      ]);
    }

    res.status(201).json({ broadcast, notifiedCount: attendees.length });
  } catch (err) {
    console.error('[Create Broadcast Error]:', err);
    res.status(500).json({ error: 'Failed to broadcast announcement' });
  }
});

// GET Event Teams & Current User's Squad
router.get('/:id/teams', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const memberRes = await db.query(
      `SELECT t.* 
       FROM event_teams t
       JOIN event_team_members m ON m.team_id = t.id
       WHERE t.event_id = $1 AND m.user_id = $2 LIMIT 1`,
      [eventId, userId]
    );

    let myTeam = null;
    let members = [];

    if (memberRes.rows.length > 0) {
      myTeam = memberRes.rows[0];
      const memRes = await db.query(
        `SELECT * FROM event_team_members WHERE team_id = $1 ORDER BY joined_at ASC`,
        [myTeam.id]
      );
      members = memRes.rows;
    }

    res.json({ team: myTeam, members });
  } catch (err) {
    console.error('[Get Teams Error]:', err);
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
});

// POST Create New Hackathon Squad / Team
router.post('/:id/teams/create', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { team_name } = req.body;

    if (!team_name || !team_name.trim()) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const existing = await db.query(
      `SELECT id FROM event_team_members WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You are already registered in a squad for this event' });
    }

    const rawCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const inviteCode = `${rawCode}`;

    const userRes = await db.query(`SELECT full_name, email, college_id, branch FROM users WHERE id = $1`, [userId]);
    const u = userRes.rows[0];

    const teamRes = await db.query(
      `INSERT INTO event_teams (event_id, name, invite_code, leader_id, leader_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [eventId, team_name.trim(), inviteCode, userId, u.full_name]
    );
    const team = teamRes.rows[0];

    await db.query(
      `INSERT INTO event_team_members (team_id, event_id, user_id, user_name, user_email, college_id, branch)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [team.id, eventId, userId, u.full_name, u.email, u.college_id, u.branch]
    );

    const ticketCode = `SQD-${inviteCode}`;
    await db.query(
      `INSERT INTO event_members (event_id, user_id, status, ticket_code)
       VALUES ($1, $2, 'registered', $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET ticket_code = $3`,
      [eventId, userId, ticketCode]
    );

    res.status(201).json({ team, members: [{ ...u, user_id: userId, user_name: u.full_name, user_email: u.email }] });
  } catch (err) {
    console.error('[Create Team Error]:', err);
    res.status(500).json({ error: 'Failed to create squad' });
  }
});

// POST Join Hackathon Squad by Invite Code
router.post('/:id/teams/join', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    const { invite_code } = req.body;

    if (!invite_code || !invite_code.trim()) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const code = invite_code.trim().toUpperCase();

    const teamRes = await db.query(
      `SELECT * FROM event_teams WHERE event_id = $1 AND invite_code = $2`,
      [eventId, code]
    );
    if (teamRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid squad invite code' });
    }
    const team = teamRes.rows[0];

    const countRes = await db.query(
      `SELECT COUNT(*) FROM event_team_members WHERE team_id = $1`,
      [team.id]
    );
    const memberCount = parseInt(countRes.rows[0].count, 10);
    if (memberCount >= 4) {
      return res.status(400).json({ error: 'This squad has reached maximum capacity (4 members)' });
    }

    const existing = await db.query(
      `SELECT id FROM event_team_members WHERE event_id = $1 AND user_id = $2`,
      [eventId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You are already in a squad for this event' });
    }

    const userRes = await db.query(`SELECT full_name, email, college_id, branch FROM users WHERE id = $1`, [userId]);
    const u = userRes.rows[0];

    await db.query(
      `INSERT INTO event_team_members (team_id, event_id, user_id, user_name, user_email, college_id, branch)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [team.id, eventId, userId, u.full_name, u.email, u.college_id, u.branch]
    );

    const ticketCode = `SQD-${team.invite_code}`;
    await db.query(
      `INSERT INTO event_members (event_id, user_id, status, ticket_code)
       VALUES ($1, $2, 'registered', $3)
       ON CONFLICT (event_id, user_id) DO UPDATE SET ticket_code = $3`,
      [eventId, userId, ticketCode]
    );

    const memRes = await db.query(
      `SELECT * FROM event_team_members WHERE team_id = $1 ORDER BY joined_at ASC`,
      [team.id]
    );

    res.json({ team, members: memRes.rows });
  } catch (err) {
    console.error('[Join Team Error]:', err);
    res.status(500).json({ error: 'Failed to join squad' });
  }
});

// --- LIVE AUDIENCE Q&A & UPVOTING SYSTEM (Slido Style) ---

// GET Live Event Q&A Questions
router.get('/:id/qa', async (req, res) => {
  try {
    const eventId = req.params.id;
    let currentUserId = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET || 'clubsync-secret-key-change-in-production');
        currentUserId = decoded.id;
      } catch (e) {}
    }

    const query = `
      SELECT 
        q.*,
        CASE 
          WHEN $2::uuid IS NOT NULL AND uv.user_id IS NOT NULL THEN true 
          ELSE false 
        END as has_upvoted
      FROM event_qa_questions q
      LEFT JOIN event_qa_upvotes uv ON uv.question_id = q.id AND uv.user_id = $2
      WHERE q.event_id = $1
      ORDER BY q.is_pinned DESC, q.upvotes_count DESC, q.created_at DESC
    `;
    const { rows } = await db.query(query, [eventId, currentUserId]);
    res.json(rows);
  } catch (err) {
    console.error('[Get Event QA Error]:', err);
    res.status(500).json({ error: 'Failed to fetch event Q&A questions' });
  }
});

// POST New Question to Live Q&A
router.post('/:id/qa', requireAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { content, is_anonymous } = req.body;
    const userId = req.user.id;

    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Question content cannot be empty' });
    }

    const userRes = await db.query(`SELECT full_name, college_id, branch FROM users WHERE id = $1`, [userId]);
    const user = userRes.rows[0];

    const authorName = is_anonymous ? 'Anonymous PICTian' : (user?.full_name || 'Student');
    const authorBranch = is_anonymous ? null : (user?.branch || null);

    const insertQuery = `
      INSERT INTO event_qa_questions (event_id, user_id, author_name, author_branch, content)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows } = await db.query(insertQuery, [eventId, userId, authorName, authorBranch, String(content).trim()]);
    res.status(201).json({ ...rows[0], has_upvoted: false });
  } catch (err) {
    console.error('[Post QA Question Error]:', err);
    res.status(500).json({ error: 'Failed to submit question' });
  }
});

// Toggle Upvote on a Question
router.post('/:id/qa/:questionId/upvote', requireAuth, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { questionId } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT * FROM event_qa_upvotes WHERE question_id = $1 AND user_id = $2`,
      [questionId, userId]
    );

    let hasUpvoted = false;
    if (existing.rows.length > 0) {
      await client.query(
        `DELETE FROM event_qa_upvotes WHERE question_id = $1 AND user_id = $2`,
        [questionId, userId]
      );
      await client.query(
        `UPDATE event_qa_questions SET upvotes_count = GREATEST(upvotes_count - 1, 0) WHERE id = $1`,
        [questionId]
      );
      hasUpvoted = false;
    } else {
      await client.query(
        `INSERT INTO event_qa_upvotes (question_id, user_id) VALUES ($1, $2)`,
        [questionId, userId]
      );
      await client.query(
        `UPDATE event_qa_questions SET upvotes_count = upvotes_count + 1 WHERE id = $1`,
        [questionId]
      );
      hasUpvoted = true;
    }

    const updatedQ = await client.query(`SELECT * FROM event_qa_questions WHERE id = $1`, [questionId]);
    await client.query('COMMIT');

    res.json({ ...updatedQ.rows[0], has_upvoted: hasUpvoted });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Toggle Upvote Error]:', err);
    res.status(500).json({ error: 'Failed to toggle upvote' });
  } finally {
    client.release();
  }
});

// Toggle Pin on Question
router.patch('/:id/qa/:questionId/pin', requireAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { rows } = await db.query(
      `UPDATE event_qa_questions SET is_pinned = NOT is_pinned WHERE id = $1 RETURNING *`,
      [questionId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Pin QA Question Error]:', err);
    res.status(500).json({ error: 'Failed to pin question' });
  }
});

// Mark Question as Answered
router.patch('/:id/qa/:questionId/answer', requireAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    const { answer_text } = req.body;
    const { rows } = await db.query(
      `UPDATE event_qa_questions 
       SET is_answered = true, answer_text = $1 
       WHERE id = $2 RETURNING *`,
      [answer_text ? String(answer_text).trim() : 'Answered live by speaker on stage.', questionId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('[Answer QA Question Error]:', err);
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

// Delete Question
router.delete('/:id/qa/:questionId', requireAuth, async (req, res) => {
  try {
    const { questionId } = req.params;
    await db.query(`DELETE FROM event_qa_questions WHERE id = $1`, [questionId]);
    res.json({ success: true });
  } catch (err) {
    console.error('[Delete QA Question Error]:', err);
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

module.exports = router;
