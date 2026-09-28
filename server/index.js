const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./db');

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for reverse proxies (Render, Railway, Netlify, Nginx)
if (isProduction) {
  app.set('trust proxy', 1);
}

// 1. Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Managed by frontend hosting or custom headers
  })
);

// 2. Response Compression
app.use(compression());

// 3. CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowed => 
        origin === allowed || 
        origin.endsWith('.netlify.app') || 
        origin.endsWith('.vercel.app') ||
        origin.startsWith('http://localhost:')
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// 4. Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Rate Limiting
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 25, // Stricter limit for auth endpoints to prevent brute force
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login/registration attempts. Please wait 15 minutes.' },
});

app.use('/api', globalApiLimiter);
app.use('/api/auth/login', authRateLimiter);
app.use('/api/auth/register', authRateLimiter);

// 6. Passport for OAuth
const passport = require('./passport');
app.use(passport.initialize());

// 7. Health Check with Live DB Ping
app.get('/api/health', async (req, res) => {
  try {
    const dbLatencyMs = await db.healthCheck();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      db: {
        status: 'connected',
        latencyMs: dbLatencyMs,
      },
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    console.error('[Healthcheck Failed]:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      db: {
        status: 'disconnected',
        error: error.message,
      },
    });
  }
});

// 8. Application Routes
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

// 9. 404 Handler for Unknown API Endpoints
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint '${req.method} ${req.originalUrl}' not found` });
});

// 10. Centralized Production Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err.stack || err);
  
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  const statusCode = err.status || 500;
  res.status(statusCode).json({
    error: isProduction ? 'Internal Server Error' : err.message || 'An unexpected error occurred',
    code: err.code || 'SERVER_ERROR',
  });
});

// 11. Server Start & Graceful Shutdown
const server = app.listen(port, () => {
  console.log(`[Production Server] ClubSync backend listening on port ${port} (${process.env.NODE_ENV || 'development'})`);
});

const gracefulShutdown = async (signal) => {
  console.log(`\n[Shutdown] Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    console.log('[Shutdown] HTTP server closed.');
    try {
      if (db.pool) {
        await db.pool.end();
        console.log('[Shutdown] Database connection pool closed.');
      }
      process.exit(0);
    } catch (err) {
      console.error('[Shutdown Error] Failed to cleanly close db pool:', err);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if shutdown hangs
  setTimeout(() => {
    console.error('[Shutdown] Forced shutdown timed out. Exiting now.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
