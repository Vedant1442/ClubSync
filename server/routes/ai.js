const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const Groq = require('groq-sdk');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-clubsync-key';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'mock-key' });

const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Generate Meeting Summary
router.post('/summarize', requireAuth, async (req, res) => {
  try {
    const { meetingId, minutes } = req.body;
    
    let summary = '';
    
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'mock-key') {
      summary = "AI Summary (Mock): " + minutes.substring(0, 50) + "...";
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

module.exports = router;
