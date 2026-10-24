const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer } = require('../middleware/auth');

/**
 * 1. CREATE PAYMENT INTENT (UPI Order)
 * POST /api/payments/create
 */
router.post('/create', requireAuth, async (req, res) => {
  try {
    const { club_id, event_id, type = 'event_ticket', amount, transaction_note } = req.body;
    const userId = req.user.id;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount in INR is required' });
    }

    if (!club_id) {
      return res.status(400).json({ error: 'Club ID is required' });
    }

    // Retrieve club UPI configuration
    const clubRes = await db.query('SELECT id, name, upi_vpa, upi_payee_name FROM clubs WHERE id = $1', [club_id]);
    if (clubRes.rows.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }
    const club = clubRes.rows[0];

    const vpa = club.upi_vpa || 'vedant1442@fam';
    const payeeName = club.upi_payee_name || club.name || 'Vedant';

    // Generate unique reference ID (e.g. CS-9X2A-K84F)
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const refId = `CS-${Date.now().toString(36).toUpperCase()}-${randomHex}`;

    // Note for banking app
    const note = (transaction_note || `${club.name} ${type === 'event_ticket' ? 'Ticket' : 'Dues'}`)
      .substring(0, 50)
      .replace(/[^a-zA-Z0-9\s_-]/g, '');

    // Standard NPCI UPI URI Specification
    const upiUri = `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}&am=${numAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}&tr=${refId}`;

    const insertRes = await db.query(`
      INSERT INTO payments (
        club_id, user_id, event_id, type, amount, currency, vpa, payee_name, transaction_note, ref_id, status
      )
      VALUES ($1, $2, $3, $4, $5, 'INR', $6, $7, $8, $9, 'pending')
      RETURNING *
    `, [
      club_id,
      userId,
      event_id || null,
      type,
      numAmount,
      vpa,
      payeeName,
      note,
      refId
    ]);

    const payment = insertRes.rows[0];

    res.status(201).json({
      payment,
      upiUri,
      qrData: upiUri,
      refId,
      vpa,
      payeeName,
      amount: numAmount
    });
  } catch (error) {
    console.error('[Create Payment Error]:', error);
    res.status(500).json({ error: 'Failed to initiate UPI payment' });
  }
});

/**
 * 2. SUBMIT 12-DIGIT UTR REFERENCE
 * POST /api/payments/:id/submit-utr
 */
router.post('/:id/submit-utr', requireAuth, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const paymentId = req.params.id;
    const { utr } = req.body;
    const userId = req.user.id;

    // Validate 12-digit Indian Banking UTR number (Google Pay, PhonePe, Paytm, BHIM)
    const cleanUtr = String(utr || '').trim().replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanUtr)) {
      return res.status(400).json({ 
        error: 'Invalid UTR format. Please provide a valid 12-digit numeric UPI reference number.' 
      });
    }

    await client.query('BEGIN');

    // Fetch existing payment
    const paymentRes = await client.query('SELECT * FROM payments WHERE id = $1 FOR UPDATE', [paymentId]);
    if (paymentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const payment = paymentRes.rows[0];
    if (payment.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized to update this payment' });
    }

    // Check if this UTR was already verified elsewhere (prevent replay attack)
    const existingUtr = await client.query(
      'SELECT id FROM payments WHERE utr = $1 AND id != $2 AND status = \'verified\'',
      [cleanUtr, paymentId]
    );
    if (existingUtr.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This UTR has already been claimed for another verified transaction.' });
    }

    // Mark as verified (YouPI zero-fee instant attribution pattern)
    const updatedPayment = await client.query(`
      UPDATE payments 
      SET utr = $1, status = 'verified', verified_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [cleanUtr, paymentId]);

    const verifiedRecord = updatedPayment.rows[0];

    // If event ticket: Ensure user is RSVPed into event_members
    if (verifiedRecord.event_id) {
      await client.query(`
        INSERT INTO event_members (event_id, user_id, status)
        VALUES ($1, $2, 'going')
        ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'going'
      `, [verifiedRecord.event_id, userId]);
    }

    // If membership dues: Ensure member is enrolled in club_members
    if (verifiedRecord.type === 'membership_dues') {
      await client.query(`
        INSERT INTO club_members (club_id, user_id, role)
        VALUES ($1, $2, 'Member')
        ON CONFLICT (club_id, user_id) DO NOTHING
      `, [verifiedRecord.club_id, userId]);
    }

    // Auto-record in club_transactions (Income / Dues)
    const txType = verifiedRecord.type === 'membership_dues' ? 'dues' : 'income';
    const txDesc = `UPI Payment (${verifiedRecord.type}) - UTR: ${cleanUtr}`;
    await client.query(`
      INSERT INTO club_transactions (club_id, amount, description, type, created_by)
      VALUES ($1, $2, $3, $4, $5)
    `, [verifiedRecord.club_id, verifiedRecord.amount, txDesc, txType, userId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Payment verified and credited successfully!',
      payment: verifiedRecord
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Submit UTR Error]:', error);
    res.status(500).json({ error: 'Failed to record and verify UTR' });
  } finally {
    client.release();
  }
});

/**
 * 3. GET CLUB PAYMENTS & AUDIT LEDGER
 * GET /api/payments/club/:clubId
 */
router.get('/club/:clubId', requireAuth, requireOfficer('clubId'), async (req, res) => {
  try {
    const { clubId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT p.*, u.full_name AS user_name, u.email AS user_email, e.title AS event_title
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.club_id = $1
    `;
    const params = [clubId];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND p.status = $${params.length}`;
    }

    query += ' ORDER BY p.created_at DESC';

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('[Get Club Payments Error]:', error);
    res.status(500).json({ error: 'Failed to fetch payments audit ledger' });
  }
});

/**
 * 4. GET MY PAYMENTS HISTORY
 * GET /api/payments/my
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await db.query(`
      SELECT p.*, c.name AS club_name, c.color AS club_color, e.title AS event_title
      FROM payments p
      LEFT JOIN clubs c ON p.club_id = c.id
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);

    res.json(rows);
  } catch (error) {
    console.error('[Get My Payments Error]:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
});

/**
 * 5. GET PAYMENT RECEIPT
 * GET /api/payments/:id/receipt
 */
router.get('/:id/receipt', requireAuth, async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { rows } = await db.query(`
      SELECT 
        p.*, 
        u.full_name AS user_name, 
        u.email AS user_email, 
        c.name AS club_name,
        c.upi_vpa,
        e.title AS event_title,
        e.date AS event_date,
        e.location AS event_location
      FROM payments p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN clubs c ON p.club_id = c.id
      LEFT JOIN events e ON p.event_id = e.id
      WHERE p.id = $1
    `, [paymentId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('[Get Receipt Error]:', error);
    res.status(500).json({ error: 'Failed to retrieve payment receipt' });
  }
});

/**
 * 6. OFFICER VERIFY OR REJECT STATUS
 * PUT /api/payments/:id/status
 */
router.put('/:id/status', requireAuth, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const paymentId = req.params.id;
    const { status } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await client.query('BEGIN');
    const paymentRes = await client.query('SELECT * FROM payments WHERE id = $1 FOR UPDATE', [paymentId]);
    if (paymentRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment not found' });
    }
    const payment = paymentRes.rows[0];

    // Check if officer of this club
    const memberCheck = await client.query(`
      SELECT role FROM club_members 
      WHERE club_id = $1 AND user_id = $2
    `, [payment.club_id, req.user.id]);

    if (memberCheck.rows.length === 0 || !['President', 'Vice President', 'Treasurer', 'Secretary'].includes(memberCheck.rows[0].role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only club officers can verify or reject payments' });
    }

    const updateRes = await client.query(`
      UPDATE payments 
      SET status = $1, verified_at = CURRENT_TIMESTAMP, verified_by = $2
      WHERE id = $3
      RETURNING *
    `, [status, req.user.id, paymentId]);

    const updated = updateRes.rows[0];

    // If verified: confirm event RSVP or club dues
    if (status === 'verified') {
      if (updated.event_id) {
        await client.query(`
          INSERT INTO event_members (event_id, user_id, status)
          VALUES ($1, $2, 'going')
          ON CONFLICT (event_id, user_id) DO UPDATE SET status = 'going'
        `, [updated.event_id, updated.user_id]);
      }

      await client.query(`
        INSERT INTO club_transactions (club_id, amount, description, type, created_by)
        VALUES ($1, $2, $3, $4, $5)
      `, [updated.club_id, updated.amount, `Verified UPI Payment - Ref: ${updated.ref_id}`, 'income', req.user.id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, payment: updated });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Update Payment Status Error]:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  } finally {
    client.release();
  }
});

module.exports = router;
