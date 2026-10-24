const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer } = require('../middleware/auth');

// GET all equipment items for a club
router.get('/clubs/:clubId/items', async (req, res) => {
  try {
    const { clubId } = req.params;
    const { rows } = await db.query(
      `SELECT * FROM club_inventory_items WHERE club_id = $1 ORDER BY name ASC`,
      [clubId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Get Inventory Items Error]:', err);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// POST add new inventory item (Officers only)
router.post('/clubs/:clubId/items', requireAuth, requireOfficer('clubId'), async (req, res) => {
  try {
    const { clubId } = req.params;
    const { name, category, serial_number, total_quantity, storage_location, condition } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const qty = parseInt(total_quantity, 10) || 1;

    const query = `
      INSERT INTO club_inventory_items (club_id, name, category, serial_number, total_quantity, available_quantity, storage_location, condition)
      VALUES ($1, $2, $3, $4, $5, $5, $6, $7)
      RETURNING *
    `;
    const { rows } = await db.query(query, [
      clubId,
      String(name).trim(),
      category || 'Hardware',
      serial_number ? String(serial_number).trim() : null,
      qty,
      storage_location ? String(storage_location).trim() : 'Club Workshop',
      condition || 'Good'
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('[Add Inventory Item Error]:', err);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// GET all checkout requests for a club
router.get('/clubs/:clubId/requests', requireAuth, async (req, res) => {
  try {
    const { clubId } = req.params;
    const { rows } = await db.query(
      `SELECT r.*, i.name as item_name, i.category as item_category, i.storage_location
       FROM club_inventory_requests r
       JOIN club_inventory_items i ON r.item_id = i.id
       WHERE r.club_id = $1
       ORDER BY r.created_at DESC`,
      [clubId]
    );
    res.json(rows);
  } catch (err) {
    console.error('[Get Inventory Requests Error]:', err);
    res.status(500).json({ error: 'Failed to fetch inventory requests' });
  }
});

// POST request checkout for an item (Any student / member)
router.post('/clubs/:clubId/items/:itemId/request', requireAuth, async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { clubId, itemId } = req.params;
    const { quantity, purpose, return_date } = req.body;
    const userId = req.user.id;

    if (!purpose || !String(purpose).trim()) {
      return res.status(400).json({ error: 'Purpose of checkout is required' });
    }

    if (!return_date) {
      return res.status(400).json({ error: 'Expected return date is required' });
    }

    const qty = parseInt(quantity, 10) || 1;

    await client.query('BEGIN');

    // Check item availability
    const itemRes = await client.query(`SELECT * FROM club_inventory_items WHERE id = $1 AND club_id = $2`, [itemId, clubId]);
    if (itemRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const item = itemRes.rows[0];
    if (item.available_quantity < qty) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Only ${item.available_quantity} unit(s) available for checkout` });
    }

    const userRes = await client.query(`SELECT full_name, email, college_id, branch FROM users WHERE id = $1`, [userId]);
    const u = userRes.rows[0];

    const insertRes = await client.query(
      `INSERT INTO club_inventory_requests (item_id, club_id, user_id, user_name, user_email, college_id, branch, quantity, purpose, return_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
       RETURNING *`,
      [
        itemId, 
        clubId, 
        userId, 
        u?.full_name || 'Student', 
        u?.email || '', 
        u?.college_id || 'N/A', 
        u?.branch || 'N/A',
        qty, 
        String(purpose).trim(), 
        return_date
      ]
    );

    await client.query('COMMIT');
    res.status(201).json(insertRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Request Checkout Error]:', err);
    res.status(500).json({ error: 'Failed to submit checkout request' });
  } finally {
    client.release();
  }
});

// PATCH update request status: 'approved', 'rejected', 'returned' (Officers only)
router.patch('/clubs/:clubId/requests/:requestId/status', requireAuth, requireOfficer('clubId'), async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { clubId, requestId } = req.params;
    const { status } = req.body; // 'approved', 'rejected', 'returned'
    const officerId = req.user.id;

    if (!['approved', 'rejected', 'returned'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await client.query('BEGIN');

    const reqRes = await client.query(`SELECT * FROM club_inventory_requests WHERE id = $1 AND club_id = $2`, [requestId, clubId]);
    if (reqRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Request not found' });
    }

    const loanReq = reqRes.rows[0];

    if (status === 'approved' && loanReq.status !== 'approved') {
      // Deduct available quantity
      await client.query(
        `UPDATE club_inventory_items 
         SET available_quantity = GREATEST(available_quantity - $1, 0) 
         WHERE id = $2`,
        [loanReq.quantity, loanReq.item_id]
      );
      await client.query(
        `UPDATE club_inventory_requests 
         SET status = 'approved', approved_by = $1, approved_at = NOW() 
         WHERE id = $2`,
        [officerId, requestId]
      );
    } else if (status === 'returned' && loanReq.status === 'approved') {
      // Restore available quantity
      await client.query(
        `UPDATE club_inventory_items 
         SET available_quantity = available_quantity + $1 
         WHERE id = $2`,
        [loanReq.quantity, loanReq.item_id]
      );
      await client.query(
        `UPDATE club_inventory_requests 
         SET status = 'returned', returned_at = NOW() 
         WHERE id = $1`,
        [requestId]
      );
    } else if (status === 'rejected') {
      await client.query(
        `UPDATE club_inventory_requests 
         SET status = 'rejected' 
         WHERE id = $1`,
        [requestId]
      );
    }

    const updatedRes = await client.query(
      `SELECT r.*, i.name as item_name, i.category as item_category, i.storage_location
       FROM club_inventory_requests r
       JOIN club_inventory_items i ON r.item_id = i.id
       WHERE r.id = $1`,
      [requestId]
    );

    await client.query('COMMIT');
    res.json(updatedRes.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Update Request Status Error]:', err);
    res.status(500).json({ error: 'Failed to update request status' });
  } finally {
    client.release();
  }
});

module.exports = router;
