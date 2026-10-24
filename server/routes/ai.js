const express = require('express');
const router = express.Router();
const db = require('../db');
const Groq = require('groq-sdk');
const { requireAuth } = require('../middleware/auth');

const hasGroqKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'mock-key');
const groq = hasGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Generate Meeting Summary
router.post('/summarize', requireAuth, async (req, res) => {
  try {
    const { meetingId, minutes } = req.body;
    
    if (!meetingId || !minutes || typeof minutes !== 'string' || !minutes.trim()) {
      return res.status(400).json({ error: 'Valid meeting ID and minutes text are required' });
    }

    if (minutes.length > 50000) {
      return res.status(400).json({ error: 'Meeting minutes text is too large (max 50,000 characters)' });
    }

    let summary = '';
    
    if (!groq) {
      summary = "AI Summary (Mock): " + minutes.trim().substring(0, 150) + "...";
    } else {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "user",
            content: `Summarize the following meeting minutes into 3-4 bullet points of key takeaways and action items:\n\n${minutes}`,
          },
        ],
        model: "llama3-8b-8192",
      });
      summary = completion.choices[0]?.message?.content || "Could not generate summary.";
    }

    // Save summary back to database
    await db.query(
      'UPDATE meetings SET minutes = $1, ai_summary = $2 WHERE id = $3',
      [minutes, summary, meetingId]
    );

    res.json({ summary });
  } catch (error) {
    console.error('AI Summarization Error:', error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// AI Chatbot (RAG based on club data)
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { clubId, question } = req.body;

    // Fetch context from DB (Constitution, Meetings)
    const { rows: constitutions } = await db.query(
      'SELECT content FROM constitutions WHERE club_id = $1 ORDER BY version DESC LIMIT 1',
      [clubId]
    );
    
    const { rows: meetings } = await db.query(
      'SELECT title, date, minutes, ai_summary FROM meetings WHERE club_id = $1 ORDER BY date DESC LIMIT 3',
      [clubId]
    );

    let context = '';
    if (constitutions.length > 0) {
      context += `Club Constitution:\n${constitutions[0].content}\n\n`;
    }
    if (meetings.length > 0) {
      context += `Recent Meetings:\n`;
      meetings.forEach(m => {
        context += `- ${m.title} (${m.date}): ${m.ai_summary || m.minutes}\n`;
      });
      context += '\n';
    }

    let answer = '';

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'mock-key') {
       answer = "I am a mock AI because no GROQ_API_KEY is provided in .env. But based on my DB check, " + 
                (constitutions.length > 0 ? "you have a constitution." : "you have no constitution.");
    } else {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are ClubSync AI, a friendly and helpful assistant for a university club. 
If the user asks a question about the club, answer it based ONLY on the following club data context. 
If the context is empty or doesn't contain the answer, politely say that you don't have that information in the club's records, but feel free to answer general questions anyway.

Context:
${context ? context : "(No club documents or meetings have been uploaded yet.)"}`
          },
          {
            role: "user",
            content: question
          }
        ],
        model: "llama3-8b-8192",
      });
      
      answer = completion.choices[0]?.message?.content || "Could not generate response.";
    }

    res.json({ answer });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Failed to chat with AI' });
  }
});

// AI Event Concierge (Instant FAQ for attendees)
router.post('/event-concierge', requireAuth, async (req, res) => {
  try {
    const { eventId, question } = req.body;

    if (!eventId || !question) {
      return res.status(400).json({ error: 'Event ID and question are required' });
    }

    const evRes = await db.query(
      `SELECT e.*, c.name AS club_name, c.upi_vpa
       FROM events e
       JOIN clubs c ON e.club_id = c.id
       WHERE e.id = $1`,
      [eventId]
    );

    if (evRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const event = evRes.rows[0];

    const bcRes = await db.query(
      `SELECT title, message, priority FROM event_broadcasts WHERE event_id = $1 ORDER BY created_at DESC LIMIT 3`,
      [eventId]
    );
    const broadcasts = bcRes.rows;

    const eventContext = `
Event Title: ${event.title}
Host Club: ${event.club_name}
Date: ${new Date(event.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
Time: ${event.time || '10:00 AM'}
Venue / Location: ${event.location || 'PICT Campus'}
Category: ${event.category}
Entry Fee: ${Number(event.price) > 0 ? `₹${event.price}` : 'Free'}
AICTE Activity Points: ${event.activity_points || 10} Points
Team Event: ${event.is_team_event ? 'Yes (2 to 4 members squad)' : 'Individual participation'}
Description: ${event.description}
Recent Urgent Bulletins: ${broadcasts.map(b => `[${b.priority.toUpperCase()}] ${b.title}: ${b.message}`).join(' | ') || 'None'}
College: Pune Institute of Computer Technology (PICT), Pune
Attendance Leave: Official On-Duty (OD / DL) Attendance letters are automatically generated on ClubSync for all verified attendees after gate check-in.
`;

    let answer = '';

    if (groq) {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are ClubSync AI Concierge for "${event.title}" at PICT Pune.
Answer the student's question accurately, concisely, and warmly based on the event context below.
If asked about attendance leave, explain that students get an official On-Duty (OD) letter to submit to their HOD once checked in at the gate.
If asked about UPI payment, explain it uses YouPI Zero-Fee UPI with a 12-digit UTR receipt.

Context:
${eventContext}`
          },
          {
            role: "user",
            content: question
          }
        ],
        model: "llama3-8b-8192",
      });
      answer = completion.choices[0]?.message?.content || "I am here to help with your event queries.";
    } else {
      const q = question.toLowerCase();
      if (q.includes('where') || q.includes('venue') || q.includes('location') || q.includes('room')) {
        answer = `📍 **Venue & Location:** "${event.title}" is scheduled at **${event.location || 'PICT Campus'}** on **${new Date(event.date).toLocaleDateString('en-IN')}** at **${event.time || '10:00 AM'}**.`;
      } else if (q.includes('fee') || q.includes('cost') || q.includes('pay') || q.includes('price')) {
        answer = Number(event.price) > 0 
          ? `💰 **Entry Fee:** ₹${event.price} per participant/squad. Payments are processed with zero aggregator fees via YouPI Indian UPI with automatic 12-digit UTR reconciliation.`
          : `🎉 **Free Entry:** This event is completely free for all participating students!`;
      } else if (q.includes('team') || q.includes('squad') || q.includes('member') || q.includes('group')) {
        answer = event.is_team_event 
          ? `👥 **Squad Formation:** Yes, this is an official Hackathon Squad event (2 to 4 members). You can create a squad on this page to get a 6-character invite code or join with your teammate's code!`
          : `👤 **Solo Entry:** This is an individual participation event.`;
      } else if (q.includes('od') || q.includes('duty') || q.includes('leave') || q.includes('attendance')) {
        answer = `🎓 **On-Duty (OD / DL) Attendance:** Yes! Once you are verified and scanned at the entrance gate with your ClubSync QR pass, an official **On-Duty (OD) Attendance Letter** addressed to your HOD will unlock on this page and on your profile for 1-click download.`;
      } else if (q.includes('point') || q.includes('aicte') || q.includes('credit')) {
        answer = `⚡ **AICTE Activity Points:** Attending this event earns you **+${event.activity_points || 10} AICTE Activity Points** towards your mandatory 100-point degree requirement.`;
      } else {
        answer = `🤖 **${event.title} Overview:**\n- **Date & Time:** ${new Date(event.date).toLocaleDateString('en-IN')} at ${event.time || '10:00 AM'}\n- **Venue:** ${event.location}\n- **Host Club:** ${event.club_name}\n- **AICTE Credits:** +${event.activity_points || 10} Points\n- **Format:** ${event.is_team_event ? 'Hackathon Squad (2-4 Members)' : 'Individual'}\n\nAsk me anything about venue, team formation, or OD attendance!`;
      }
    }

    res.json({ answer });
  } catch (error) {
    console.error('[AI Concierge Error]:', error);
    res.status(500).json({ error: 'Failed to answer query' });
  }
});

module.exports = router;
