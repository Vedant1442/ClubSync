const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer } = require('../middleware/auth');

// Create a new election
router.post('/', requireAuth, requireOfficer('club_id'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { club_id, title, description, start_date, end_date, candidates } = req.body;
    
    if (!club_id || !title) {
      return res.status(400).json({ error: 'Club ID and election title are required' });
    }

    await client.query('BEGIN');

    const electionRes = await client.query(
      `INSERT INTO elections (club_id, title, description, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, 'active') RETURNING *`,
      [
        club_id, 
        String(title).trim(), 
        description ? String(description).trim() : null, 
        start_date || new Date(), 
        end_date || new Date(Date.now() + 7*24*60*60*1000)
      ]
    );

    const electionId = electionRes.rows[0].id;

    if (Array.isArray(candidates)) {
      for (const name of candidates) {
        if (!name || typeof name !== 'string') continue;
        const trimmedName = name.trim();
        if (!trimmedName) continue;

        let userRes = await client.query(
          'SELECT id FROM users WHERE full_name ILIKE $1 LIMIT 1', 
          [trimmedName]
        );
        if (userRes.rows.length > 0) {
          await client.query(
            'INSERT INTO election_candidates (election_id, user_id, manifesto) VALUES ($1, $2, $3)',
            [electionId, userRes.rows[0].id, `Candidate: ${trimmedName}`]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json(electionRes.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Create Election Error]:', error);
    res.status(500).json({ error: 'Failed to create election' });
  } finally {
    client.release();
  }
});

// Cast a vote (Double voting prevention)
router.post('/:id/vote', requireAuth, async (req, res) => {
  try {
    const electionId = req.params.id;
    const { candidate_id } = req.body;
    const voterId = req.user.id;

    // Database unique constraint UNIQUE(election_id, voter_id) handles double-voting prevention
    // but we can catch it specifically
    const { rows } = await db.query(
      'INSERT INTO election_votes (election_id, candidate_id, voter_id) VALUES ($1, $2, $3) RETURNING *',
      [electionId, candidate_id, voterId]
    );

    res.json(rows[0]);
  } catch (error) {
    // Check for unique constraint violation error code in Postgres (23505)
    if (error.code === '23505') {
      return res.status(403).json({ error: 'You have already voted in this election' });
    }
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

module.exports = router;
