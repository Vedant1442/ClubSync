const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, OFFICER_ROLES } = require('../middleware/auth');

/**
 * GET /api/resolutions/clubs/:clubId
 * Fetch all constitutional amendment resolutions with live voting tally
 */
router.get('/clubs/:clubId', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.id;

    const { rows: resolutions } = await db.query(`
      SELECT 
        r.*,
        u.full_name AS proposer_name,
        u.email AS proposer_email,
        COUNT(CASE WHEN v.vote = 'YES' THEN 1 END) AS yes_count,
        COUNT(CASE WHEN v.vote = 'NO' THEN 1 END) AS no_count,
        COUNT(CASE WHEN v.vote = 'ABSTAIN' THEN 1 END) AS abstain_count,
        COUNT(v.id) AS total_votes,
        MAX(CASE WHEN v.user_id = $2 THEN v.vote ELSE NULL END) AS user_vote
      FROM club_resolutions r
      LEFT JOIN users u ON r.proposed_by = u.id
      LEFT JOIN club_resolution_votes v ON r.id = v.resolution_id
      WHERE r.club_id = $1
      GROUP BY r.id, u.full_name, u.email
      ORDER BY 
        CASE r.status
          WHEN 'VOTING_OPEN' THEN 1
          WHEN 'DISCUSSION' THEN 2
          WHEN 'PASSED' THEN 3
          ELSE 4
        END,
        r.created_at DESC
    `, [clubId, userId]);

    // Also fetch recent discussion comments for each resolution
    const formatted = await Promise.all(resolutions.map(async (r) => {
      const { rows: comments } = await db.query(`
        SELECT v.vote, v.comment, v.created_at, u.full_name AS voter_name
        FROM club_resolution_votes v
        JOIN users u ON v.user_id = u.id
        WHERE v.resolution_id = $1 AND v.comment IS NOT NULL AND TRIM(v.comment) != ''
        ORDER BY v.created_at DESC
        LIMIT 6
      `, [r.id]);

      const yes = parseInt(r.yes_count, 10) || 0;
      const no = parseInt(r.no_count, 10) || 0;
      const total = parseInt(r.total_votes, 10) || 0;
      const yesPercent = total > 0 ? Math.round((yes / total) * 100) : 0;
      const isExpired = new Date(r.voting_deadline) < new Date();

      return {
        ...r,
        yes_count: yes,
        no_count: no,
        abstain_count: parseInt(r.abstain_count, 10) || 0,
        total_votes: total,
        yes_percent: yesPercent,
        is_expired: isExpired,
        quorum_met: total >= r.quorum_required,
        recent_comments: comments
      };
    }));

    res.json(formatted);
  } catch (error) {
    console.error('[Get Resolutions Error]:', error);
    res.status(500).json({ error: 'Failed to fetch constitutional resolutions' });
  }
});

/**
 * POST /api/resolutions/clubs/:clubId
 * Propose a new resolution amendment
 */
router.post('/clubs/:clubId', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.id;
    const {
      title,
      clause_affected,
      existing_text,
      proposed_amendment,
      rationale,
      voting_deadline,
      quorum_required = 8
    } = req.body;

    if (!title || !clause_affected || !proposed_amendment || !rationale) {
      return res.status(400).json({ error: 'Title, clause, amendment text, and rationale are required' });
    }

    const deadline = voting_deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { rows } = await db.query(`
      INSERT INTO club_resolutions (
        club_id, title, proposed_by, clause_affected, existing_text,
        proposed_amendment, rationale, status, voting_deadline, quorum_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'VOTING_OPEN', $8, $9)
      RETURNING *
    `, [
      clubId,
      title.trim(),
      userId,
      clause_affected.trim(),
      existing_text ? existing_text.trim() : null,
      proposed_amendment.trim(),
      rationale.trim(),
      deadline,
      parseInt(quorum_required, 10) || 8
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[Create Resolution Error]:', error);
    res.status(500).json({ error: 'Failed to propose resolution amendment' });
  }
});

/**
 * POST /api/resolutions/:id/vote
 * Cast or update a vote on a resolution
 */
router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const resolutionId = req.params.id;
    const userId = req.user.id;
    const { vote, comment } = req.body;

    if (!['YES', 'NO', 'ABSTAIN'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be YES, NO, or ABSTAIN' });
    }

    // Check resolution status
    const resCheck = await db.query('SELECT * FROM club_resolutions WHERE id = $1', [resolutionId]);
    if (resCheck.rows.length === 0) return res.status(404).json({ error: 'Resolution not found' });
    const resolution = resCheck.rows[0];

    if (resolution.status !== 'VOTING_OPEN') {
      return res.status(400).json({ error: `Voting is closed for this resolution (status: ${resolution.status})` });
    }

    if (new Date(resolution.voting_deadline) < new Date()) {
      return res.status(400).json({ error: 'The voting window for this resolution has expired' });
    }

    const { rows } = await db.query(`
      INSERT INTO club_resolution_votes (resolution_id, user_id, vote, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (resolution_id, user_id) DO UPDATE
      SET vote = EXCLUDED.vote, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [resolutionId, userId, vote, comment ? comment.trim() : null]);

    res.json({
      success: true,
      message: `Your vote of "${vote}" was recorded successfully.`,
      vote: rows[0]
    });
  } catch (error) {
    console.error('[Cast Resolution Vote Error]:', error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

/**
 * PATCH /api/resolutions/:id/conclude
 * Conclude voting and ratify or reject amendment (Officers only)
 */
router.patch('/:id/conclude', requireAuth, async (req, res) => {
  try {
    const resolutionId = req.params.id;
    const userId = req.user.id;

    const resCheck = await db.query('SELECT * FROM club_resolutions WHERE id = $1', [resolutionId]);
    if (resCheck.rows.length === 0) return res.status(404).json({ error: 'Resolution not found' });
    const resolution = resCheck.rows[0];

    // Check officer role
    const roleCheck = await db.query(
      'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
      [resolution.club_id, userId]
    );
    if (roleCheck.rows.length === 0 || !OFFICER_ROLES.includes(roleCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Only club officers can conclude and ratify resolutions' });
    }

    // Tally votes
    const tallyRes = await db.query(`
      SELECT 
        COUNT(CASE WHEN vote = 'YES' THEN 1 END) AS yes_count,
        COUNT(CASE WHEN vote = 'NO' THEN 1 END) AS no_count,
        COUNT(*) AS total_votes
      FROM club_resolution_votes
      WHERE resolution_id = $1
    `, [resolutionId]);

    const yes = parseInt(tallyRes.rows[0].yes_count, 10) || 0;
    const total = parseInt(tallyRes.rows[0].total_votes, 10) || 0;
    const supermajority = total > 0 && (yes / total) >= 0.66;
    const quorumMet = total >= resolution.quorum_required;

    const finalStatus = (supermajority && quorumMet) ? 'PASSED' : 'REJECTED';

    const { rows } = await db.query(`
      UPDATE club_resolutions
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [finalStatus, resolutionId]);

    res.json({
      message: `Resolution officially concluded as ${finalStatus}`,
      resolution: rows[0],
      supermajority,
      quorumMet,
      yesCount: yes,
      totalVotes: total
    });
  } catch (error) {
    console.error('[Conclude Resolution Error]:', error);
    res.status(500).json({ error: 'Failed to conclude resolution' });
  }
});

module.exports = router;
