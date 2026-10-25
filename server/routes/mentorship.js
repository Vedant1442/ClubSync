const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, OFFICER_ROLES } = require('../middleware/auth');

/**
 * GET /api/mentorship/clubs/:clubId/mentors
 * List all active mentors in the club
 */
router.get('/clubs/:clubId/mentors', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;

    const { rows: mentors } = await db.query(`
      SELECT 
        m.*,
        u.full_name AS mentor_name,
        u.email AS mentor_email,
        u.college_id,
        u.branch,
        u.bio AS user_bio
      FROM club_mentors m
      JOIN users u ON m.user_id = u.id
      WHERE m.club_id = $1
      ORDER BY m.rating_avg DESC, m.sessions_completed DESC
    `, [clubId]);

    res.json(mentors);
  } catch (error) {
    console.error('[Get Mentors Error]:', error);
    res.status(500).json({ error: 'Failed to fetch mentors' });
  }
});

/**
 * POST /api/mentorship/clubs/:clubId/mentors
 * Register or update the current user as a mentor in this club
 */
router.post('/clubs/:clubId/mentors', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.id;
    const {
      domains = [],
      year_of_study = 'TE',
      bio = '',
      max_weekly_slots = 3,
      is_accepting_mentees = true
    } = req.body;

    const { rows } = await db.query(`
      INSERT INTO club_mentors (
        club_id, user_id, domains, year_of_study, bio,
        max_weekly_slots, is_accepting_mentees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (club_id, user_id) DO UPDATE
      SET 
        domains = EXCLUDED.domains,
        year_of_study = EXCLUDED.year_of_study,
        bio = EXCLUDED.bio,
        max_weekly_slots = EXCLUDED.max_weekly_slots,
        is_accepting_mentees = EXCLUDED.is_accepting_mentees
      RETURNING *
    `, [
      clubId,
      userId,
      JSON.stringify(domains),
      year_of_study,
      bio ? bio.trim() : null,
      parseInt(max_weekly_slots, 10) || 3,
      Boolean(is_accepting_mentees)
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[Register Mentor Error]:', error);
    res.status(500).json({ error: 'Failed to save mentor profile' });
  }
});

/**
 * GET /api/mentorship/clubs/:clubId/sessions
 * List mentorship sessions (scoped for member / officer)
 */
router.get('/clubs/:clubId/sessions', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.id;

    // Check if user is officer
    const roleCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [clubId, userId]
    );
    const isOfficer = roleCheck.rows.length > 0 && OFFICER_ROLES.includes(roleCheck.rows[0].role);

    let query = `
      SELECT 
        s.*,
        u_mentee.full_name AS mentee_name,
        u_mentee.email AS mentee_email,
        u_mentee.college_id AS mentee_college_id,
        u_mentee.branch AS mentee_branch,
        u_mentor.full_name AS mentor_name,
        u_mentor.email AS mentor_email,
        m.user_id AS mentor_user_id,
        m.year_of_study AS mentor_year
      FROM club_mentorship_sessions s
      JOIN club_mentors m ON s.mentor_id = m.id
      JOIN users u_mentor ON m.user_id = u_mentor.id
      JOIN users u_mentee ON s.mentee_id = u_mentee.id
      WHERE s.club_id = $1
    `;
    const params = [clubId];

    if (!isOfficer) {
      query += ` AND (s.mentee_id = $2 OR m.user_id = $2)`;
      params.push(userId);
    }

    query += ` ORDER BY s.preferred_date DESC, s.created_at DESC`;

    const { rows: sessions } = await db.query(query, params);
    res.json(sessions);
  } catch (error) {
    console.error('[Get Mentorship Sessions Error]:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * POST /api/mentorship/clubs/:clubId/sessions
 * Book a new mentorship session with a senior mentor
 */
router.post('/clubs/:clubId/sessions', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const menteeId = req.user.id;
    const {
      mentor_id,
      topic,
      description = '',
      preferred_date,
      preferred_time,
      meeting_venue = 'PICT Central Reading Hall'
    } = req.body;

    if (!mentor_id || !topic || !preferred_date || !preferred_time) {
      return res.status(400).json({ error: 'Mentor, topic, date, and preferred time are required' });
    }

    // Check mentor exists and accepts mentees
    const mentorCheck = await db.query(
      'SELECT m.*, u.full_name, u.id AS mentor_user_id FROM club_mentors m JOIN users u ON m.user_id = u.id WHERE m.id = $1 AND m.club_id = $2',
      [mentor_id, clubId]
    );
    if (mentorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Mentor not found in this club' });
    }

    const mentor = mentorCheck.rows[0];
    if (!mentor.is_accepting_mentees) {
      return res.status(400).json({ error: 'This mentor is currently not accepting new mentees' });
    }

    // Insert session
    const { rows } = await db.query(`
      INSERT INTO club_mentorship_sessions (
        club_id, mentor_id, mentee_id, topic, description,
        preferred_date, preferred_time, meeting_venue, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'REQUESTED')
      RETURNING *
    `, [
      clubId,
      mentor_id,
      menteeId,
      topic.trim(),
      description ? description.trim() : null,
      preferred_date,
      preferred_time.trim(),
      meeting_venue ? meeting_venue.trim() : 'PICT Reading Hall'
    ]);

    const session = rows[0];

    // Notify senior mentor
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES ($1, $2, $3, 'mentorship_request', false)
    `, [
      mentor.mentor_user_id,
      '🤝 New Mentorship Request Received',
      `A junior student has requested guidance on: "${topic}". Check your club Mentorship Hub to confirm.`
    ]);

    res.status(201).json(session);
  } catch (error) {
    console.error('[Book Session Error]:', error);
    res.status(500).json({ error: 'Failed to book mentorship session' });
  }
});

/**
 * PATCH /api/mentorship/sessions/:id/status
 * Update session status (CONFIRMED, COMPLETED, CANCELLED)
 */
router.patch('/sessions/:id/status', requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const { status, meeting_venue, meeting_link, mentor_notes } = req.body;

    if (!['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get session
    const { rows: sessions } = await db.query(`
      SELECT s.*, m.user_id AS mentor_user_id, u_mentee.full_name AS mentee_name
      FROM club_mentorship_sessions s
      JOIN club_mentors m ON s.mentor_id = m.id
      JOIN users u_mentee ON s.mentee_id = u_mentee.id
      WHERE s.id = $1
    `, [sessionId]);

    if (sessions.length === 0) return res.status(404).json({ error: 'Session not found' });
    const session = sessions[0];

    // Check authority: must be mentor, mentee (for cancel), or club officer
    const isMentor = session.mentor_user_id === userId;
    const isMentee = session.mentee_id === userId;

    if (!isMentor && !isMentee) {
      const roleCheck = await db.query(
        'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
        [session.club_id, userId]
      );
      if (roleCheck.rows.length === 0 || !OFFICER_ROLES.includes(roleCheck.rows[0].role)) {
        return res.status(403).json({ error: 'Unauthorized to update this session' });
      }
    }

    const { rows: updatedRows } = await db.query(`
      UPDATE club_mentorship_sessions
      SET 
        status = $1,
        meeting_venue = COALESCE($2, meeting_venue),
        meeting_link = COALESCE($3, meeting_link),
        mentor_notes = COALESCE($4, mentor_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [
      status,
      meeting_venue !== undefined ? meeting_venue : null,
      meeting_link !== undefined ? meeting_link : null,
      mentor_notes !== undefined ? mentor_notes : null,
      sessionId
    ]);

    // If completed, increment mentor's completed sessions count
    if (status === 'COMPLETED' && session.status !== 'COMPLETED') {
      await db.query(`
        UPDATE club_mentors
        SET sessions_completed = sessions_completed + 1
        WHERE id = $1
      `, [session.mentor_id]);
    }

    // Send notification to mentee
    const notifyUser = isMentor ? session.mentee_id : session.mentor_user_id;
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES ($1, $2, $3, 'mentorship_update', false)
    `, [
      notifyUser,
      `🤝 Mentorship Session ${status}`,
      `Your session on "${session.topic}" has been marked as ${status}.`
    ]);

    res.json(updatedRows[0]);
  } catch (error) {
    console.error('[Update Session Status Error]:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * PATCH /api/mentorship/sessions/:id/review
 * Submit mentee star rating & feedback after session
 */
router.patch('/sessions/:id/review', requireAuth, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const userId = req.user.id;
    const { rating, review_feedback } = req.body;

    const parsedRating = parseInt(rating, 10);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    const { rows: sessions } = await db.query(
      'SELECT * FROM club_mentorship_sessions WHERE id = $1',
      [sessionId]
    );
    if (sessions.length === 0) return res.status(404).json({ error: 'Session not found' });
    const session = sessions[0];

    if (session.mentee_id !== userId) {
      return res.status(403).json({ error: 'Only the mentee can review this session' });
    }

    const { rows } = await db.query(`
      UPDATE club_mentorship_sessions
      SET rating = $1, review_feedback = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [parsedRating, review_feedback ? review_feedback.trim() : null, sessionId]);

    // Recalculate mentor's average rating
    const ratingRes = await db.query(`
      SELECT AVG(rating)::numeric(3, 2) AS avg_rating
      FROM club_mentorship_sessions
      WHERE mentor_id = $1 AND rating IS NOT NULL
    `, [session.mentor_id]);

    if (ratingRes.rows.length > 0 && ratingRes.rows[0].avg_rating) {
      await db.query(`
        UPDATE club_mentors
        SET rating_avg = $1
        WHERE id = $2
      `, [ratingRes.rows[0].avg_rating, session.mentor_id]);
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('[Session Review Error]:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
