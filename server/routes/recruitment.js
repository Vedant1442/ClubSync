const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET Active Recruitment Drive & Applications for a Club
router.get('/:clubId', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.id;

    // 1. Fetch active recruitment drive
    const driveRes = await db.query(
      `SELECT * FROM club_recruitment_drives WHERE club_id = $1 AND is_active = true ORDER BY created_at DESC LIMIT 1`,
      [clubId]
    );

    const drive = driveRes.rows[0] || null;

    // 2. Check if user is officer
    const officerCheck = await db.query(
      `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2`,
      [clubId, userId]
    );
    const isOfficer = officerCheck.rows.length > 0 &&
      ['President', 'Vice President', 'Secretary', 'Treasurer', 'officer', 'Officer'].includes(officerCheck.rows[0].role);

    // 3. Fetch applications
    let applications = [];
    if (drive) {
      if (isOfficer) {
        const appsRes = await db.query(
          `SELECT * FROM club_applications WHERE drive_id = $1 ORDER BY created_at DESC`,
          [drive.id]
        );
        applications = appsRes.rows;
      } else {
        const myAppRes = await db.query(
          `SELECT * FROM club_applications WHERE drive_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1`,
          [drive.id, userId]
        );
        applications = myAppRes.rows;
      }
    }

    res.json({ drive, applications, isOfficer });
  } catch (err) {
    console.error('[Get Recruitment Error]:', err);
    res.status(500).json({ error: 'Failed to fetch recruitment details' });
  }
});

// POST Student applies for recruitment drive
router.post('/:clubId/apply', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.id;
    const { drive_id, domain, portfolio_url, statement_of_purpose } = req.body;

    if (!domain || !statement_of_purpose) {
      return res.status(400).json({ error: 'Domain and Statement of Purpose are required' });
    }

    // Check drive exists and is active
    const driveRes = await db.query(
      `SELECT * FROM club_recruitment_drives WHERE id = $1 AND club_id = $2 AND is_active = true`,
      [drive_id, clubId]
    );
    if (driveRes.rows.length === 0) {
      return res.status(404).json({ error: 'No active recruitment drive found for this club' });
    }

    // Check if user already applied
    const existing = await db.query(
      `SELECT id FROM club_applications WHERE drive_id = $1 AND user_id = $2`,
      [drive_id, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already submitted an application for this drive' });
    }

    // Get user details
    const userRes = await db.query(`SELECT full_name, email, college_id, branch FROM users WHERE id = $1`, [userId]);
    const u = userRes.rows[0];

    const result = await db.query(`
      INSERT INTO club_applications (
        drive_id, club_id, user_id, full_name, email, college_id, branch,
        domain, portfolio_url, statement_of_purpose, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *
    `, [
      drive_id, clubId, userId, u.full_name, u.email,
      u.college_id || 'N/A', u.branch || 'N/A',
      domain.trim(), portfolio_url?.trim() || null, statement_of_purpose.trim()
    ]);

    // Send in-app notification to club officers
    const officers = await db.query(
      `SELECT user_id FROM club_members WHERE club_id = $1 AND role IN ('President', 'Vice President', 'Secretary', 'Treasurer')`,
      [clubId]
    );
    for (const off of officers.rows) {
      await db.query(`
        INSERT INTO notifications (user_id, title, message, type, read)
        VALUES ($1, $2, $3, 'recruitment_application', false)
      `, [
        off.user_id,
        `New Recruitment Application: ${u.full_name}`,
        `Candidate applied for domain "${domain}". View in Club Recruitment tab.`
      ]);
    }

    res.status(201).json({ application: result.rows[0] });
  } catch (err) {
    console.error('[Apply Recruitment Error]:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// PATCH Officer updates application status
router.patch('/:clubId/applications/:appId', requireAuth, async (req, res) => {
  try {
    const { clubId, appId } = req.params;
    const { status, officer_notes } = req.body;

    // Verify officer
    const officerCheck = await db.query(
      `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2`,
      [clubId, req.user.id]
    );
    const isOfficer = officerCheck.rows.length > 0 &&
      ['President', 'Vice President', 'Secretary', 'Treasurer', 'officer', 'Officer'].includes(officerCheck.rows[0].role);

    if (!isOfficer) {
      return res.status(403).json({ error: 'Only club officers can review applications.' });
    }

    const appRes = await db.query(
      `UPDATE club_applications 
       SET status = COALESCE($1, status),
           officer_notes = COALESCE($2, officer_notes),
           reviewed_at = NOW()
       WHERE id = $3 AND club_id = $4
       RETURNING *`,
      [status, officer_notes, appId, clubId]
    );

    if (appRes.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = appRes.rows[0];

    // If accepted, add to club_members or update role to Core Member
    if (status === 'accepted') {
      const existingMember = await db.query(
        `SELECT id, role FROM club_members WHERE club_id = $1 AND user_id = $2`,
        [clubId, application.user_id]
      );
      if (existingMember.rows.length === 0) {
        await db.query(
          `INSERT INTO club_members (club_id, user_id, role) VALUES ($1, $2, $3)`,
          [clubId, application.user_id, `Core - ${application.domain}`]
        );
      } else {
        await db.query(
          `UPDATE club_members SET role = $1 WHERE club_id = $2 AND user_id = $3`,
          [`Core - ${application.domain}`, clubId, application.user_id]
        );
      }
    }

    // Notify applicant of status update
    const clubRes = await db.query('SELECT name FROM clubs WHERE id = $1', [clubId]);
    const clubName = clubRes.rows[0]?.name || 'Club';
    let statusMsg = `Your application for ${clubName} (${application.domain}) is now ${status.replace('_', ' ').toUpperCase()}.`;
    if (status === 'accepted') {
      statusMsg = `🎉 Congratulations! You have been accepted into the Core Team of ${clubName} for ${application.domain}!`;
    } else if (status === 'shortlisted') {
      statusMsg = `✨ You have been shortlisted for an interview with ${clubName} for ${application.domain}!`;
    }

    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES ($1, $2, $3, 'recruitment_status', false)
    `, [
      application.user_id,
      `Application Update: ${clubName}`,
      statusMsg
    ]);

    res.json({ application });
  } catch (err) {
    console.error('[Update Application Error]:', err);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// POST Create or Update Drive (Officer only)
router.post('/:clubId/drive', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const { title, description, deadline, domains, is_active = true } = req.body;

    const officerCheck = await db.query(
      `SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2`,
      [clubId, req.user.id]
    );
    const isOfficer = officerCheck.rows.length > 0 &&
      ['President', 'Vice President', 'Secretary', 'Treasurer', 'officer', 'Officer'].includes(officerCheck.rows[0].role);

    if (!isOfficer) {
      return res.status(403).json({ error: 'Only club officers can configure recruitment drives.' });
    }

    const driveRes = await db.query(`
      INSERT INTO club_recruitment_drives (club_id, title, description, deadline, domains, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [clubId, title.trim(), description?.trim() || null, deadline || null, domains || [], is_active]);

    res.status(201).json({ drive: driveRes.rows[0] });
  } catch (err) {
    console.error('[Create Drive Error]:', err);
    res.status(500).json({ error: 'Failed to create recruitment drive' });
  }
});

module.exports = router;
