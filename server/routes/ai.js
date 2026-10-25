const express = require('express');
const router = express.Router();
const db = require('../db');
const Groq = require('groq-sdk');
const { requireAuth } = require('../middleware/auth');

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const hasGroqKey = Boolean(
  process.env.GROQ_API_KEY && 
  process.env.GROQ_API_KEY !== 'mock-key' && 
  process.env.GROQ_API_KEY.startsWith('gsk_')
);
const groq = hasGroqKey ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

// Helper: Intelligent Local Meeting Summarizer Fallback
function generateLocalMeetingSummary(minutes) {
  const lines = minutes
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  const actionItems = lines.filter(l => /action|todo|assign|deadline|follow-up|task/i.test(l));
  const decisions = lines.filter(l => /decid|approv|resolv|agreed|conclud/i.test(l));
  const keyPoints = lines.slice(0, 4);

  let summary = `### 📋 Meeting Summary & Action Items\n\n`;
  summary += `**Key Highlights:**\n`;
  (keyPoints.length > 0 ? keyPoints : ['Meeting convened as scheduled.']).forEach(p => {
    summary += `- ${p.replace(/^[-*•\d.]+\s*/, '')}\n`;
  });

  if (decisions.length > 0) {
    summary += `\n**Key Decisions:**\n`;
    decisions.slice(0, 3).forEach(d => {
      summary += `- ${d.replace(/^[-*•\d.]+\s*/, '')}\n`;
    });
  }

  if (actionItems.length > 0) {
    summary += `\n**Assigned Action Items:**\n`;
    actionItems.slice(0, 4).forEach(a => {
      summary += `- ${a.replace(/^[-*•\d.]+\s*/, '')}\n`;
    });
  }

  return summary;
}

// 1. Generate Meeting Summary
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
    
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "You are an executive meeting recorder. Summarize the minutes into clean, concise bullet points: Key Takeaways, Decisions Made, and Action Items.",
            },
            {
              role: "user",
              content: minutes,
            },
          ],
          model: GROQ_MODEL,
        });
        summary = completion.choices[0]?.message?.content;
      } catch (groqErr) {
        console.warn('[AI Summarize Groq API Fallback]:', groqErr.message);
      }
    }

    if (!summary) {
      summary = generateLocalMeetingSummary(minutes);
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

// 2. Club Knowledge Assistant (RAG with Groq Llama-3.1 & Intelligent Campus Engine Fallback)
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { clubId, question } = req.body;

    if (!clubId || !question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Valid clubId and question are required' });
    }

    // 1. Fetch comprehensive live club data from Postgres
    const [clubRes, constRes, meetRes, evRes, memRes, mentorRes, sponsorRes, resRes] = await Promise.all([
      db.query('SELECT name, description, category, upi_vpa, members_count FROM clubs WHERE id = $1', [clubId]),
      db.query('SELECT title, content, version FROM constitutions WHERE club_id = $1 ORDER BY version DESC LIMIT 1', [clubId]),
      db.query('SELECT title, date, minutes, ai_summary FROM meetings WHERE club_id = $1 ORDER BY date DESC LIMIT 4', [clubId]),
      db.query('SELECT title, date, location, category, price, activity_points, description FROM events WHERE club_id = $1 ORDER BY date DESC LIMIT 5', [clubId]),
      db.query(`
        SELECT u.full_name, cm.role 
        FROM club_members cm 
        JOIN users u ON cm.user_id = u.id 
        WHERE cm.club_id = $1 
        ORDER BY CASE 
          WHEN cm.role ILIKE '%president%' THEN 1 
          WHEN cm.role ILIKE '%vice%' THEN 2 
          WHEN cm.role ILIKE '%secretary%' THEN 3
          WHEN cm.role ILIKE '%lead%' THEN 4
          ELSE 5 
        END LIMIT 8
      `, [clubId]),
      db.query(`
        SELECT u.full_name, m.domains, m.year_of_study, m.rating_avg 
        FROM club_mentors m 
        JOIN users u ON m.user_id = u.id 
        WHERE m.club_id = $1 AND m.is_accepting_mentees = true 
        LIMIT 5
      `, [clubId]),
      db.query('SELECT company_name, tier, committed_amount, stage FROM club_sponsorship_deals WHERE club_id = $1 LIMIT 5', [clubId]),
      db.query('SELECT title, clause_affected, status, rationale FROM club_resolutions WHERE club_id = $1 ORDER BY created_at DESC LIMIT 3', [clubId])
    ]);

    const club = clubRes.rows[0];
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    const constitution = constRes.rows[0];
    const meetings = meetRes.rows;
    const events = evRes.rows;
    const members = memRes.rows;
    const mentors = mentorRes.rows;
    const sponsors = sponsorRes.rows;
    const resolutions = resRes.rows;

    // Build structured RAG context
    let context = `Club Name: ${club.name}\nCategory: ${club.category}\nDescription: ${club.description}\nOfficial UPI VPA: ${club.upi_vpa || 'vedant1442@fam'}\nTotal Registered Members: ${club.members_count || members.length}\nCollege: SCTR's Pune Institute of Computer Technology (PICT), Pune\n\n`;

    if (members.length > 0) {
      context += `Executive Committee & Key Officers:\n${members.map(m => `- ${m.full_name}: ${m.role}`).join('\n')}\n\n`;
    }

    if (events.length > 0) {
      context += `Events & Workshops:\n${events.map(e => `- ${e.title} (${new Date(e.date).toLocaleDateString('en-IN')}) at ${e.location} | Category: ${e.category} | Fee: ${Number(e.price) > 0 ? `₹${e.price}` : 'Free'} | AICTE Credits: +${e.activity_points || 10} pts`).join('\n')}\n\n`;
    }

    if (mentors.length > 0) {
      context += `Senior Mentors:\n${mentors.map(m => `- ${m.full_name} (${m.year_of_study || 'Senior'}): Domains: ${Array.isArray(m.domains) ? m.domains.join(', ') : m.domains}`).join('\n')}\n\n`;
    }

    if (sponsors.length > 0) {
      context += `Corporate Sponsors & Partners:\n${sponsors.map(s => `- ${s.company_name} (${s.tier} Tier, Amount: ₹${Number(s.committed_amount || 0).toLocaleString('en-IN')}, Stage: ${s.stage})`).join('\n')}\n\n`;
    }

    if (resolutions.length > 0) {
      context += `Constitutional Resolutions:\n${resolutions.map(r => `- ${r.title} (${r.clause_affected || 'General Clause'}) - Status: ${r.status}`).join('\n')}\n\n`;
    }

    if (meetings.length > 0) {
      context += `Recent Meetings:\n${meetings.map(m => `- ${m.title} (${m.date}): ${m.ai_summary || m.minutes || 'Minutes recorded'}`).join('\n')}\n\n`;
    }

    if (constitution) {
      context += `Club Constitution (${constitution.title || 'Official By-Laws'} v${constitution.version}):\n${constitution.content.slice(0, 1500)}\n\n`;
    }

    let answer = '';

    // If Groq is available, attempt modern Llama 3.1 generation
    if (groq) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are ClubSync Knowledge AI, an intelligent assistant for "${club.name}" at PICT Pune.
Answer student questions accurately, politely, and concisely using the club context below.
Format responses in clean GitHub Markdown with emojis, bullet points, and bold text.
If asked about topics not in the records, answer from general knowledge while clarifying it is not in the club archives.

Club Context:
${context}`,
            },
            {
              role: "user",
              content: question,
            },
          ],
          model: GROQ_MODEL,
          temperature: 0.3,
        });

        answer = completion.choices[0]?.message?.content;
      } catch (groqErr) {
        console.warn('[AI Chat Groq API Fallback]:', groqErr.message);
      }
    }

    // Resilient Fallback: Conversational Natural Campus Engine
    if (!answer) {
      const q = question.toLowerCase().trim();

      // Greetings & small talk
      if (/^(hi|hello|hey|yo|sup|wassup|hola|greetings|morning|afternoon|evening)\b/i.test(q)) {
        answer = `Hey there! 👋 I'm your student guide for **${club.name}** here at PICT Pune.\n\nI can tell you about who's heading the team, upcoming workshops and hackathons, senior mentors you can pair with, or how to join. What would you like to know?`;
      } else if (/how are you|how's it going|what are you doing/i.test(q)) {
        answer = `I'm doing great, thanks for asking! Ready to help you explore everything happening at **${club.name}**. Are you looking to join an event, find a mentor, or learn more about what we do?`;
      } else if (/who are you|what can you do|what are your capabilities|help/i.test(q)) {
        answer = `I'm your **${club.name}** knowledge companion! Think of me as a senior student coordinator who knows all the club records inside out.\n\nYou can ask me about:\n• Who the current presidents and officers are\n• Upcoming events, hackathons, and registration details\n• Available senior project mentors and their domains\n• Corporate sponsors and brand outreach\n• Club constitution, by-laws, and voting resolutions`;
      } else if (/president|lead|head|secretary|vice|officer|team|leader|who is|committee|incharge|running/i.test(q)) {
        const pres = members.find(m => /president/i.test(m.role) && !/vice/i.test(m.role));
        const vp = members.find(m => /vice/i.test(m.role));
        const sec = members.find(m => /secretary/i.test(m.role));
        const otherOfficers = members.filter(m => m !== pres && m !== vp && m !== sec).slice(0, 4);

        if (pres || vp || members.length > 0) {
          let leadText = `Here's who's currently leading **${club.name}**:\n\n`;
          if (pres) leadText += `• **President:** ${pres.full_name}\n`;
          if (vp) leadText += `• **Vice President:** ${vp.full_name}\n`;
          if (sec) leadText += `• **Secretary:** ${sec.full_name}\n`;
          if (otherOfficers.length > 0) {
            leadText += `• **Core Team:** ${otherOfficers.map(o => `${o.full_name} (*${o.role}*)`).join(', ')}\n`;
          }
          leadText += `\nYou can reach out to any of them directly in the **Members** tab or catch them around the campus lab!`;
          answer = leadText;
        } else {
          answer = `**${club.name}** is actively coordinated by our registered student members at PICT. You can check the live member directory right in the **Members** tab!`;
        }
      } else if (/event|workshop|hackathon|pulzion|credenz|summit|seminar|session|calendar|date|happening/i.test(q)) {
        if (events.length > 0) {
          answer = `We've got some exciting events lined up for **${club.name}**! 🎉\n\n` +
            events.map(e => (
              `• **${e.title}**\n` +
              `  📅 **When:** ${new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}\n` +
              `  📍 **Where:** ${e.location}\n` +
              `  💰 **Entry:** ${Number(e.price) > 0 ? `₹${e.price}` : 'Free Entry'}\n` +
              `  ⚡ **AICTE Points:** +${e.activity_points || 10} Activity Points`
            )).join('\n\n') +
            `\n\n👉 Head over to the **Events** tab to RSVP, grab your dynamic QR entry pass, and team up!`;
        } else {
          answer = `There aren't any events on the schedule for **${club.name}** at this exact moment, but keep an eye on the **Events** tab—new workshops and hackathons get posted regularly!`;
        }
      } else if (/mentor|guidance|senior|project|domain|advice|alumni|help with project/i.test(q)) {
        if (mentors.length > 0) {
          answer = `Looking for senior guidance? We have active project mentors ready to help you out:\n\n` +
            mentors.map(m => (
              `• **${m.full_name}** (${m.year_of_study || 'Senior Mentor'})\n` +
              `  🎯 **Focus Domains:** ${Array.isArray(m.domains) ? m.domains.join(', ') : m.domains}\n` +
              `  ⭐ **Rating:** ${m.rating_avg ? `${m.rating_avg} / 5.0` : '5.0 / 5.0'}`
            )).join('\n\n') +
            `\n\n💡 You can book a 1-on-1 pairing session directly through the **Mentorship** tab!`;
        } else {
          answer = `Our senior mentorship pairing hub is being prepped for the current academic session. Feel free to connect with club officers in the meantime!`;
        }
      } else if (/sponsor|partner|persistent|red bull|brand|money|funding|outreach|company/i.test(q)) {
        if (sponsors.length > 0) {
          answer = `Here are the corporate sponsors and brand partners supporting **${club.name}**:\n\n` +
            sponsors.map(s => `• **${s.company_name}** — ${s.tier} Tier (${s.stage.replace('_', ' ').toLowerCase()} • committed: ₹${Number(s.committed_amount || 0).toLocaleString('en-IN')})`).join('\n') +
            `\n\nClub officers can track partner deliverables and MOU documentation inside the **Sponsorships** CRM tab.`;
        } else {
          answer = `**${club.name}** is currently open to corporate outreach and sponsorship collaborations for upcoming fests. Reach out to our outreach team in the **Sponsorships** tab!`;
        }
      } else if (/constitution|rule|by-law|law|resolution|amendment|article|policy/i.test(q)) {
        if (constitution) {
          answer = `Here's a look at the official governance for **${club.name}**:\n\n**${constitution.title || 'Society By-Laws'} (Version ${constitution.version})**\n${constitution.content.slice(0, 350)}...\n\n🗳️ To amend any by-law clause, a 66.6% supermajority vote is required. You can see active proposals in the **Constitution** tab!`;
        } else if (resolutions.length > 0) {
          answer = `Here are the current constitutional resolutions on the floor:\n\n` +
            resolutions.map(r => `• **${r.title}** (${r.clause_affected || 'General Clause'}) — Status: **${r.status}**`).join('\n') +
            `\n\nCheck out the **Constitution** tab to review the arguments and cast your vote!`;
        } else {
          answer = `**${club.name}** follows standard PICT Gymkhana Society guidelines. Officers can draft new constitutional amendments and by-laws in the **Constitution** tab.`;
        }
      } else if (/meeting|minutes|mom|summary|discussion|agenda/i.test(q)) {
        if (meetings.length > 0) {
          answer = `Here are the key takeaways from our recent meetings:\n\n` +
            meetings.map(m => `• **${m.title}** (${m.date}):\n  ${m.ai_summary || m.minutes || 'Minutes recorded.'}`).join('\n\n') +
            `\n\nOfficers can log new minutes or join live meeting rooms in the **Meetings** tab!`;
        } else {
          answer = `No meeting minutes have been formally published yet for **${club.name}**. Check back soon or ask an officer!`;
        }
      } else if (/fee|pay|membership|join|upi|vpa|register|how to join/i.test(q)) {
        answer = `Joining **${club.name}** is easy! 👍\n\n• Just click the **Join Club** button at the very top of this page to join the roster.\n• **Category:** ${club.category}\n• **Official Society UPI:** \`${club.upi_vpa || 'vedant1442@fam'}\` (zero transaction fees with instant 12-digit UTR digital receipts).\n\nOnce you're in, you can take on tasks, participate in elections, and attend members-only sessions!`;
      } else {
        answer = `Hey! I'm your **${club.name}** campus assistant. ${club.description ? `\n\n*${club.description}*\n` : ''}\nFeel free to ask me questions like:\n• *"Who's leading the club?"*\n• *"What hackathons or events are coming up?"*\n• *"How can I get a senior mentor?"*\n• *"Who are your sponsors?"*\n• *"How do I join?"*`;
      }
    }

    res.json({ answer });
  } catch (error) {
    console.error('[AI Chat Error]:', error);
    res.status(500).json({ error: 'Failed to process AI chat query' });
  }
});

// 3. AI Event Concierge (Instant FAQ for attendees)
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
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are ClubSync AI Concierge for "${event.title}" at PICT Pune.
Answer the student's question accurately, concisely, and warmly based on the event context below.
If asked about attendance leave, explain that students get an official On-Duty (OD) letter to submit to their HOD once checked in at the gate.
If asked about UPI payment, explain it uses YouPI Zero-Fee UPI with a 12-digit UTR receipt.

Context:
${eventContext}`,
            },
            {
              role: "user",
              content: question,
            },
          ],
          model: GROQ_MODEL,
          temperature: 0.3,
        });
        answer = completion.choices[0]?.message?.content;
      } catch (groqErr) {
        console.warn('[AI Concierge Groq API Fallback]:', groqErr.message);
      }
    }

    if (!answer) {
      const q = question.toLowerCase();
      if (q.includes('where') || q.includes('venue') || q.includes('location') || q.includes('room') || q.includes('map') || q.includes('direction')) {
        answer = `📍 **Venue & Location:** "${event.title}" is scheduled at **${event.location || 'PICT Campus'}** on **${new Date(event.date).toLocaleDateString('en-IN')}** at **${event.time || '10:00 AM'}**.\n\nYou can view the interactive campus floor guide with the **PICT Campus Map** button on this page!`;
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
