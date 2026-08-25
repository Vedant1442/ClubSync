const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const passport = require('./passport');
app.use(passport.initialize());

// Routes
const authRouter = require('./routes/auth');
const clubsRouter = require('./routes/clubs');
const syncRouter = require('./routes/sync');
const eventsRouter = require('./routes/events');
const tasksRouter = require('./routes/tasks');
const electionsRouter = require('./routes/elections');
const aiRouter = require('./routes/ai');

app.use('/api/auth', authRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/events', eventsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/elections', electionsRouter);
app.use('/api/ai', aiRouter);

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: 'Neon connected' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
