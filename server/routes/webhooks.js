const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireOfficer, OFFICER_ROLES } = require('../middleware/auth');
const { dispatchToHook, broadcastToClub } = require('../services/webhookDispatcher');

// Helper to check officer permissions for a webhook
async function verifyOfficerForWebhook(webhookId, userId) {
  const hookRes = await db.query('SELECT club_id FROM club_webhooks WHERE id = $1', [webhookId]);
  if (hookRes.rows.length === 0) return { error: 'Webhook configuration not found', status: 404 };

  const clubId = hookRes.rows[0].club_id;
  const roleCheck = await db.query(
    'SELECT role FROM club_members WHERE club_id = $1 AND user_id = $2',
    [clubId, userId]
  );

  if (roleCheck.rows.length === 0 || !OFFICER_ROLES.includes(roleCheck.rows[0].role)) {
    return { error: 'Only club officers can manage webhook integrations', status: 403 };
  }

  return { clubId };
}

/**
 * GET /api/webhooks/clubs/:clubId
 * Fetch all configured webhooks, delivery logs, and delivery health stats for a club
 */
router.get('/clubs/:clubId', requireAuth, requireOfficer('clubId'), async (req, res) => {
  try {
    const { clubId } = req.params;

    // Fetch webhooks
    const { rows: webhooks } = await db.query(`
      SELECT 
        w.id, w.club_id, w.platform, w.channel_name,
        CASE 
          WHEN w.webhook_url IS NOT NULL 
          THEN SUBSTRING(w.webhook_url, 1, 35) || '••••••••' || RIGHT(w.webhook_url, 6)
          ELSE NULL 
        END AS masked_webhook_url,
        w.webhook_url,
        CASE 
          WHEN w.telegram_bot_token IS NOT NULL 
          THEN SUBSTRING(w.telegram_bot_token, 1, 8) || '••••••••'
          ELSE NULL 
        END AS masked_bot_token,
        w.telegram_bot_token,
        w.telegram_chat_id,
        w.is_active,
        w.events_enabled,
        w.last_status,
        w.last_error,
        w.last_triggered_at,
        w.created_at,
        u.full_name AS creator_name
      FROM club_webhooks w
      LEFT JOIN users u ON w.created_by = u.id
      WHERE w.club_id = $1
      ORDER BY w.created_at DESC
    `, [clubId]);

    // Fetch delivery logs
    const { rows: logs } = await db.query(`
      SELECT 
        l.*,
        w.channel_name
      FROM club_webhook_logs l
      LEFT JOIN club_webhooks w ON l.webhook_id = w.id
      WHERE l.club_id = $1
      ORDER BY l.created_at DESC
      LIMIT 25
    `, [clubId]);

    // Calculate delivery health stats
    const totalDispatches = logs.length;
    const successfulDispatches = logs.filter(l => l.status === 'SUCCESS').length;
    const successRate = totalDispatches > 0 ? Math.round((successfulDispatches / totalDispatches) * 100) : 100;
    const activeCount = webhooks.filter(w => w.is_active).length;

    res.json({
      webhooks,
      logs,
      stats: {
        total_bridges: webhooks.length,
        active_bridges: activeCount,
        total_dispatches: totalDispatches,
        success_rate_pct: successRate,
        last_dispatch_at: logs[0]?.created_at || null
      }
    });
  } catch (error) {
    console.error('[Get Webhooks Error]:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

/**
 * POST /api/webhooks/clubs/:clubId
 * Register a new webhook bridge
 */
router.post('/clubs/:clubId', requireAuth, requireOfficer('clubId'), async (req, res) => {
  try {
    const { clubId } = req.params;
    const {
      platform,
      channel_name,
      webhook_url,
      telegram_bot_token,
      telegram_chat_id,
      events_enabled
    } = req.body;

    if (!platform || !['DISCORD', 'TELEGRAM', 'SLACK'].includes(platform)) {
      return res.status(400).json({ error: 'Valid platform (DISCORD, TELEGRAM, or SLACK) is required' });
    }

    if (platform === 'DISCORD' || platform === 'SLACK') {
      if (!webhook_url || !webhook_url.trim()) {
        return res.status(400).json({ error: 'Webhook URL is required' });
      }
    } else if (platform === 'TELEGRAM') {
      if (!telegram_bot_token || !telegram_chat_id) {
        return res.status(400).json({ error: 'Telegram Bot Token and Chat ID are required' });
      }
    }

    const defaultEvents = events_enabled || {
      on_event_created: true,
      on_broadcast: true,
      on_recruitment_open: true
    };

    const { rows } = await db.query(`
      INSERT INTO club_webhooks (
        club_id, platform, channel_name, webhook_url, telegram_bot_token,
        telegram_chat_id, is_active, events_enabled, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
      RETURNING *
    `, [
      clubId,
      platform,
      channel_name ? channel_name.trim() : (platform === 'DISCORD' ? '#announcements' : '@channel'),
      webhook_url ? webhook_url.trim() : null,
      telegram_bot_token ? telegram_bot_token.trim() : null,
      telegram_chat_id ? telegram_chat_id.trim() : null,
      JSON.stringify(defaultEvents),
      req.user.id
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('[Create Webhook Error]:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
  }
});

/**
 * PUT /api/webhooks/:id
 * Update an existing webhook bridge settings
 */
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const webhookId = req.params.id;
    const authCheck = await verifyOfficerForWebhook(webhookId, req.user.id);
    if (authCheck.error) {
      return res.status(authCheck.status).json({ error: authCheck.error });
    }

    const {
      channel_name,
      webhook_url,
      telegram_bot_token,
      telegram_chat_id,
      is_active,
      events_enabled
    } = req.body;

    const { rows } = await db.query(`
      UPDATE club_webhooks
      SET 
        channel_name = COALESCE($1, channel_name),
        webhook_url = COALESCE($2, webhook_url),
        telegram_bot_token = COALESCE($3, telegram_bot_token),
        telegram_chat_id = COALESCE($4, telegram_chat_id),
        is_active = COALESCE($5, is_active),
        events_enabled = COALESCE($6, events_enabled),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `, [
      channel_name ? channel_name.trim() : null,
      webhook_url ? webhook_url.trim() : null,
      telegram_bot_token ? telegram_bot_token.trim() : null,
      telegram_chat_id ? telegram_chat_id.trim() : null,
      is_active !== undefined ? is_active : null,
      events_enabled ? JSON.stringify(events_enabled) : null,
      webhookId
    ]);

    res.json(rows[0]);
  } catch (error) {
    console.error('[Update Webhook Error]:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
  }
});

/**
 * POST /api/webhooks/:id/test
 * Test ping dispatch to verify connection
 */
router.post('/:id/test', requireAuth, async (req, res) => {
  try {
    const webhookId = req.params.id;
    const authCheck = await verifyOfficerForWebhook(webhookId, req.user.id);
    if (authCheck.error) {
      return res.status(authCheck.status).json({ error: authCheck.error });
    }

    const { rows } = await db.query('SELECT * FROM club_webhooks WHERE id = $1', [webhookId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Webhook not found' });

    const webhook = rows[0];
    const result = await dispatchToHook(webhook, 'TEST_DISPATCH', {
      title: 'Connection Ping',
      message: 'PICT ClubSync webhook bridge verified successfully!'
    });

    res.json({
      success: result.status === 'SUCCESS',
      statusCode: result.statusCode,
      error: result.errorMessage
    });
  } catch (error) {
    console.error('[Test Webhook Error]:', error);
    res.status(500).json({ error: 'Failed to dispatch test notification' });
  }
});

/**
 * POST /api/webhooks/clubs/:clubId/broadcast
 * Broadcast a live announcement to all active webhooks for this club
 */
router.post('/clubs/:clubId/broadcast', requireAuth, requireOfficer('clubId'), async (req, res) => {
  try {
    const { clubId } = req.params;
    const { title, message } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and announcement message are required' });
    }

    const result = await broadcastToClub(clubId, 'BROADCAST_SENT', {
      title: title.trim(),
      message: message.trim(),
      sender_name: req.user.full_name || req.user.email
    });

    res.json({
      message: 'Announcement broadcast dispatched to external channels',
      dispatched: result.dispatched,
      successes: result.successes,
      failures: result.failures
    });
  } catch (error) {
    console.error('[Broadcast Webhooks Error]:', error);
    res.status(500).json({ error: 'Failed to broadcast to webhooks' });
  }
});

/**
 * DELETE /api/webhooks/:id
 * Delete webhook configuration
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const webhookId = req.params.id;
    const authCheck = await verifyOfficerForWebhook(webhookId, req.user.id);
    if (authCheck.error) {
      return res.status(authCheck.status).json({ error: authCheck.error });
    }

    await db.query('DELETE FROM club_webhooks WHERE id = $1', [webhookId]);
    res.json({ message: 'Webhook bridge deleted successfully' });
  } catch (error) {
    console.error('[Delete Webhook Error]:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

module.exports = router;
