const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer, OFFICER_ROLES } = require('../middleware/auth');

/**
 * Standard collegiate deliverable templates for Indian engineering symposiums
 */
const DEFAULT_DELIVERABLES_BY_TIER = {
  TITLE: [
    { title: 'Main Stage Flex Banner Logo (Top Center)', completed: false },
    { title: '5-Minute Keynote Address in PICT Auditorium', completed: false },
    { title: 'Exclusive Standee Placement at F-Building Foyer Entrance', completed: false },
    { title: 'Logo on Verified Digital Certificates & Gate Passes', completed: false },
    { title: 'Curated Resume Book of Top 25 Finalists', completed: false }
  ],
  POWERED_BY: [
    { title: 'Co-Branded Hackathon Track / Coding Round Platform', completed: false },
    { title: 'Logo on Event T-Shirts & Volunteer Badges', completed: false },
    { title: 'Dedicated Workshop Slot in Computer Center Labs', completed: false },
    { title: 'Featured Logo on ClubSync Public Showcase Page', completed: false }
  ],
  ASSOCIATE: [
    { title: 'Logo on Partner Wall & Event Standees', completed: false },
    { title: 'Swag & Promotional Brochure Distribution', completed: false },
    { title: 'Social Media Shoutout (Instagram Reel + LinkedIn Post)', completed: false }
  ],
  IN_KIND: [
    { title: 'Product Sampling / Refreshment Station on Campus', completed: false },
    { title: 'Logo on Event Collateral & Announcements', completed: false },
    { title: 'Social Media Appreciation Post', completed: false }
  ],
  GOODIES_PARTNER: [
    { title: 'Branded Goodies & Swag Kit Inclusion', completed: false },
    { title: 'Logo on Presentation Slides during Valedictory', completed: false }
  ]
};

// Helper to verify user is officer for a deal's club
async function verifyOfficerForDeal(dealId, userId) {
  const dealRes = await db.query('SELECT club_id FROM club_sponsorship_deals WHERE id = $1', [dealId]);
  if (dealRes.rows.length === 0) return { error: 'Deal not found', status: 404 };

  const clubId = dealRes.rows[0].club_id;
  const roleCheck = await db.query(
    'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
    [clubId, userId]
  );

  if (roleCheck.rows.length === 0 || !OFFICER_ROLES.includes(roleCheck.rows[0].role)) {
    return { error: 'Only club officers can manage sponsorship deals', status: 403 };
  }

  return { clubId };
}

/**
 * GET /api/sponsorships/clubs/:clubId
 * Fetch all sponsorship deals and calculated financial metrics for a club
 */
router.get('/clubs/:clubId', requireAuth, requireOfficer('clubId'), async (req, res) => {
  try {
    const { clubId } = req.params;

    const { rows: deals } = await db.query(`
      SELECT 
        d.*,
        e.title AS event_title,
        e.date AS event_date,
        u.full_name AS creator_name
      FROM club_sponsorship_deals d
      LEFT JOIN events e ON d.event_id = e.id
      LEFT JOIN users u ON d.created_by = u.id
      WHERE d.club_id = $1
      ORDER BY 
        CASE d.stage
          WHEN 'FUNDS_RECEIVED' THEN 5
          WHEN 'MOU_SIGNED' THEN 4
          WHEN 'IN_NEGOTIATION' THEN 3
          WHEN 'PROPOSAL_SENT' THEN 2
          WHEN 'LEAD' THEN 1
          ELSE 0
        END DESC,
        d.committed_amount DESC,
        d.created_at DESC
    `, [clubId]);

    // Financial calculations
    let totalPipelineValue = 0;
    let fundsReceived = 0;
    let activeDealsCount = 0;
    let mouSignedCount = 0;

    for (const d of deals) {
      const amount = parseFloat(d.committed_amount) || 0;
      if (d.stage !== 'DECLINED') {
        totalPipelineValue += amount;
      }
      if (d.stage === 'FUNDS_RECEIVED') {
        fundsReceived += amount;
      }
      if (d.stage === 'MOU_SIGNED') {
        mouSignedCount += 1;
      }
      if (d.stage !== 'DECLINED' && d.stage !== 'FUNDS_RECEIVED') {
        activeDealsCount += 1;
      }
    }

    res.json({
      deals,
      stats: {
        total_pipeline_value: totalPipelineValue,
        funds_received: fundsReceived,
        active_deals_count: activeDealsCount,
        mou_signed_count: mouSignedCount,
        total_deals_count: deals.length
      }
    });
  } catch (error) {
    console.error('[Get Sponsorship Deals Error]:', error);
    res.status(500).json({ error: 'Failed to fetch sponsorship deals' });
  }
});

/**
 * POST /api/sponsorships/clubs/:clubId
 * Create a new sponsor lead/deal
 */
router.post('/clubs/:clubId', requireAuth, requireOfficer('clubId'), async (req, res) => {
  try {
    const { clubId } = req.params;
    const {
      company_name,
      contact_person,
      contact_email,
      contact_phone,
      stage = 'LEAD',
      tier = 'ASSOCIATE',
      committed_amount = 0,
      currency = 'INR',
      event_id = null,
      deliverables,
      notes = '',
      mou_document_url = null
    } = req.body;

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ error: 'Company or Brand name is required' });
    }

    // Default deliverables if none provided
    const finalDeliverables = (Array.isArray(deliverables) && deliverables.length > 0)
      ? deliverables
      : (DEFAULT_DELIVERABLES_BY_TIER[tier] || DEFAULT_DELIVERABLES_BY_TIER.ASSOCIATE);

    const { rows } = await db.query(`
      INSERT INTO club_sponsorship_deals (
        club_id, event_id, company_name, contact_person, contact_email,
        contact_phone, stage, tier, committed_amount, currency,
        deliverables, notes, mou_document_url, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      clubId,
      event_id || null,
      company_name.trim(),
      contact_person ? contact_person.trim() : null,
      contact_email ? contact_email.trim() : null,
      contact_phone ? contact_phone.trim() : null,
      stage,
      tier,
      parseFloat(committed_amount) || 0,
      currency,
      JSON.stringify(finalDeliverables),
      notes ? notes.trim() : null,
      mou_document_url,
      req.user.id
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[Create Sponsorship Deal Error]:', error);
    res.status(500).json({ error: 'Failed to create sponsorship deal' });
  }
});

/**
 * PUT /api/sponsorships/:id
 * Update deal details, status/stage, tier, amount, notes
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const dealId = req.params.id;
    const authCheck = await verifyOfficerForDeal(dealId, req.user.id);
    if (authCheck.error) {
      return res.status(authCheck.status).json({ error: authCheck.error });
    }

    const {
      company_name,
      contact_person,
      contact_email,
      contact_phone,
      stage,
      tier,
      committed_amount,
      event_id,
      notes,
      mou_document_url,
      deliverables
    } = req.body;

    const { rows } = await db.query(`
      UPDATE club_sponsorship_deals
      SET 
        company_name = COALESCE($1, company_name),
        contact_person = COALESCE($2, contact_person),
        contact_email = COALESCE($3, contact_email),
        contact_phone = COALESCE($4, contact_phone),
        stage = COALESCE($5, stage),
        tier = COALESCE($6, tier),
        committed_amount = COALESCE($7, committed_amount),
        event_id = $8,
        notes = COALESCE($9, notes),
        mou_document_url = COALESCE($10, mou_document_url),
        deliverables = COALESCE($11, deliverables),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `, [
      company_name ? company_name.trim() : null,
      contact_person !== undefined ? contact_person : null,
      contact_email !== undefined ? contact_email : null,
      contact_phone !== undefined ? contact_phone : null,
      stage || null,
      tier || null,
      committed_amount !== undefined ? parseFloat(committed_amount) : null,
      event_id !== undefined ? (event_id || null) : null,
      notes !== undefined ? notes : null,
      mou_document_url !== undefined ? mou_document_url : null,
      deliverables ? JSON.stringify(deliverables) : null,
      dealId
    ]);

    res.json(rows[0]);
  } catch (error) {
    console.error('[Update Sponsorship Deal Error]:', error);
    res.status(500).json({ error: 'Failed to update sponsorship deal' });
  }
});

/**
 * PATCH /api/sponsorships/:id/deliverables
 * Update or toggle deliverables
 */
router.patch('/:id/deliverables', requireAuth, async (req, res) => {
  try {
    const dealId = req.params.id;
    const authCheck = await verifyOfficerForDeal(dealId, req.user.id);
    if (authCheck.error) {
      return res.status(authCheck.status).json({ error: authCheck.error });
    }

    const { deliverables, toggleIndex } = req.body;

    if (Array.isArray(deliverables)) {
      const { rows } = await db.query(`
        UPDATE club_sponsorship_deals
        SET deliverables = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [JSON.stringify(deliverables), dealId]);
      return res.json(rows[0]);
    }

    if (toggleIndex !== undefined && Number.isInteger(toggleIndex)) {
      const { rows: currentRows } = await db.query('SELECT deliverables FROM club_sponsorship_deals WHERE id = $1', [dealId]);
      if (currentRows.length === 0) return res.status(404).json({ error: 'Deal not found' });

      const currentDeliverables = currentRows[0].deliverables || [];
      if (currentDeliverables[toggleIndex]) {
        currentDeliverables[toggleIndex].completed = !currentDeliverables[toggleIndex].completed;
      }

      const { rows } = await db.query(`
        UPDATE club_sponsorship_deals
        SET deliverables = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `, [JSON.stringify(currentDeliverables), dealId]);
      return res.json(rows[0]);
    }

    res.status(400).json({ error: 'Provide deliverables array or toggleIndex' });
  } catch (error) {
    console.error('[Update Deliverables Error]:', error);
    res.status(500).json({ error: 'Failed to update deliverables' });
  }
});

/**
 * DELETE /api/sponsorships/:id
 * Delete deal
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const dealId = req.params.id;
    const authCheck = await verifyOfficerForDeal(dealId, req.user.id);
    if (authCheck.error) {
      return res.status(authCheck.status).json({ error: authCheck.error });
    }

    await db.query('DELETE FROM club_sponsorship_deals WHERE id = $1', [dealId]);
    res.json({ message: 'Sponsorship deal deleted successfully' });
  } catch (error) {
    console.error('[Delete Deal Error]:', error);
    res.status(500).json({ error: 'Failed to delete sponsorship deal' });
  }
});

module.exports = router;
