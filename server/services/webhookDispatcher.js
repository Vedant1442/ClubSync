const db = require('../db');

/**
 * Format a rich Discord Embed
 */
function buildDiscordPayload(eventType, data) {
  let title = '📢 ClubSync Announcement';
  let description = data.description || data.message || 'No description provided.';
  let color = 0x6366f1; // Indigo
  const fields = [];

  if (eventType === 'EVENT_PUBLISHED') {
    title = `🎉 New Event: ${data.title}`;
    color = 0x10b981; // Emerald
    if (data.date) {
      fields.push({
        name: '📅 Date & Time',
        value: new Date(data.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        inline: true
      });
    }
    if (data.location) {
      fields.push({ name: '📍 Venue', value: data.location, inline: true });
    }
    if (data.entry_fee !== undefined) {
      fields.push({ name: '🎟️ Entry Fee', value: data.entry_fee > 0 ? `₹${data.entry_fee}` : 'FREE', inline: true });
    }
    if (data.activity_points) {
      fields.push({ name: '⚡ AICTE Points', value: `+${data.activity_points} Pts`, inline: true });
    }
  } else if (eventType === 'BROADCAST_SENT') {
    title = `🚨 Urgent Broadcast: ${data.title || 'Notice from Club Officers'}`;
    color = 0xef4444; // Red
    if (data.event_title) {
      fields.push({ name: '📌 Related Event', value: data.event_title, inline: true });
    }
    if (data.sender_name) {
      fields.push({ name: '👤 Officer', value: data.sender_name, inline: true });
    }
  } else if (eventType === 'RECRUITMENT_OPEN') {
    title = `💼 Auditions & Recruitment Live: ${data.title || 'New Drive'}`;
    color = 0x8b5cf6; // Purple
    if (data.deadline) {
      fields.push({
        name: '⏳ Application Deadline',
        value: new Date(data.deadline).toLocaleDateString('en-IN', { dateStyle: 'medium' }),
        inline: true
      });
    }
    if (data.target_years) {
      fields.push({ name: '🎓 Open To', value: Array.isArray(data.target_years) ? data.target_years.join(', ') : data.target_years, inline: true });
    }
  } else if (eventType === 'TEST_DISPATCH') {
    title = '✅ Webhook Bridge Connection Test';
    description = 'Connection from PICT ClubSync to this channel is active and operating normally.';
    color = 0x3b82f6; // Blue
    fields.push({ name: '📡 Status', value: 'Verified & Connected', inline: true });
    fields.push({ name: '⏱️ Timestamp', value: new Date().toLocaleTimeString('en-IN'), inline: true });
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const eventUrl = data.id ? `${clientUrl}/events/${data.id}` : clientUrl;

  return {
    username: 'ClubSync Campus Bot',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
    embeds: [{
      title,
      description: description.slice(0, 1000),
      color,
      url: eventUrl,
      fields,
      footer: {
        text: 'Pune Institute of Computer Technology (PICT) • ClubSync Verified'
      },
      timestamp: new Date().toISOString()
    }]
  };
}

/**
 * Format Telegram message text
 */
function buildTelegramPayload(eventType, data, chatId) {
  let text = '<b>📢 ClubSync Campus Announcement</b>\n\n';

  if (eventType === 'EVENT_PUBLISHED') {
    text = `<b>🎉 New Campus Event Published!</b>\n\n` +
      `<b>Title:</b> ${data.title}\n` +
      `<b>Venue:</b> ${data.location || 'PICT Campus'}\n` +
      `<b>Date:</b> ${new Date(data.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}\n` +
      `<b>Fee:</b> ${data.entry_fee > 0 ? '₹' + data.entry_fee : 'FREE'}\n\n` +
      `<i>${(data.description || '').slice(0, 300)}...</i>\n\n` +
      `🔗 <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/events/${data.id}">Register on ClubSync</a>`;
  } else if (eventType === 'BROADCAST_SENT') {
    text = `<b>🚨 URGENT BROADCAST NOTICE</b>\n\n` +
      `<b>${data.title || 'Official Update'}</b>\n\n` +
      `${data.message || data.description}\n\n` +
      `<i>Sent by ${data.sender_name || 'Club Officer'} via PICT ClubSync</i>`;
  } else if (eventType === 'RECRUITMENT_OPEN') {
    text = `<b>💼 Club Auditions & Recruitment Open!</b>\n\n` +
      `<b>Drive:</b> ${data.title}\n` +
      `<b>Deadline:</b> ${new Date(data.deadline).toLocaleDateString('en-IN')}\n\n` +
      `🔗 <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}">Apply via ClubSync Portal</a>`;
  } else if (eventType === 'TEST_DISPATCH') {
    text = `<b>✅ ClubSync Webhook Bridge Verified</b>\n\n` +
      `Connection from PICT ClubSync to Telegram is operational.\n` +
      `<i>Test ping recorded at ${new Date().toLocaleTimeString('en-IN')}.</i>`;
  }

  return {
    chat_id: chatId,
    text,
    parse_mode: 'HTML'
  };
}

/**
 * Dispatch an individual webhook
 */
async function dispatchToHook(webhook, eventType, data) {
  let statusCode = 200;
  let status = 'SUCCESS';
  let errorMessage = null;

  try {
    if (webhook.platform === 'DISCORD') {
      const payload = buildDiscordPayload(eventType, data);

      // Check if sample demo webhook URL
      if (!webhook.webhook_url || webhook.webhook_url.includes('sample_token') || !webhook.webhook_url.startsWith('https://discord.com')) {
        // Simulated success for test/demo tokens
        statusCode = 204;
      } else {
        const res = await fetch(webhook.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        statusCode = res.status;
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Discord API responded with status ${res.status}: ${errText.slice(0, 150)}`);
        }
      }
    } else if (webhook.platform === 'TELEGRAM') {
      const payload = buildTelegramPayload(eventType, data, webhook.telegram_chat_id);

      if (!webhook.telegram_bot_token || webhook.telegram_bot_token.includes('ABCDefgh') || !webhook.telegram_chat_id) {
        // Simulated success for demo tokens
        statusCode = 200;
      } else {
        const tgUrl = `https://api.telegram.org/bot${webhook.telegram_bot_token}/sendMessage`;
        const res = await fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        statusCode = res.status;
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Telegram API responded with status ${res.status}: ${errText.slice(0, 150)}`);
        }
      }
    }
  } catch (err) {
    status = 'FAILED';
    statusCode = statusCode === 200 ? 500 : statusCode;
    errorMessage = err.message || 'Dispatch failed';
    console.error(`[Webhook Dispatch Error - ${webhook.platform}]:`, err.message);
  }

  // Update webhook status
  await db.query(`
    UPDATE club_webhooks
    SET 
      last_status = $1,
      last_error = $2,
      last_triggered_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
  `, [status, errorMessage, webhook.id]);

  // Insert audit delivery log
  const summary = (data.title || data.message || 'Test Dispatch').slice(0, 200);
  await db.query(`
    INSERT INTO club_webhook_logs (webhook_id, club_id, platform, event_type, payload_summary, status, status_code, error_message)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    webhook.id,
    webhook.club_id,
    webhook.platform,
    eventType,
    summary,
    status,
    statusCode,
    errorMessage
  ]);

  return { status, statusCode, errorMessage };
}

/**
 * Dispatch to all active webhooks for a club
 */
async function broadcastToClub(clubId, eventType, data) {
  try {
    const triggerKey = 
      eventType === 'EVENT_PUBLISHED' ? 'on_event_created' :
      eventType === 'BROADCAST_SENT' ? 'on_broadcast' :
      eventType === 'RECRUITMENT_OPEN' ? 'on_recruitment_open' : null;

    let query = 'SELECT * FROM club_webhooks WHERE club_id = $1 AND is_active = TRUE';
    const params = [clubId];

    if (triggerKey) {
      query += ` AND (events_enabled->>$2)::boolean = TRUE`;
      params.push(triggerKey);
    }

    const { rows: hooks } = await db.query(query, params);
    if (hooks.length === 0) return { dispatched: 0, successes: 0, failures: 0 };

    const results = await Promise.allSettled(
      hooks.map(hook => dispatchToHook(hook, eventType, data))
    );

    const successes = results.filter(r => r.status === 'fulfilled' && r.value.status === 'SUCCESS').length;
    const failures = results.length - successes;

    return {
      dispatched: hooks.length,
      successes,
      failures
    };
  } catch (error) {
    console.error('[Broadcast Webhooks Error]:', error);
    return { dispatched: 0, error: error.message };
  }
}

module.exports = {
  dispatchToHook,
  broadcastToClub
};
