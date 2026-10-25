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

// 6.5 Root Welcome Endpoint
app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ClubSync API Server</title>
        <style>
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #0b0f19;
            color: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 16px;
            padding: 2.5rem;
            max-width: 520px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
            text-align: center;
          }
          .badge {
            display: inline-block;
            background: #064e3b;
            color: #34d399;
            font-weight: 600;
            font-size: 0.85rem;
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            margin-bottom: 1rem;
          }
          h1 {
            margin: 0 0 0.75rem;
            font-size: 1.75rem;
            font-weight: 700;
          }
          p {
            color: #9ca3af;
            line-height: 1.6;
            margin: 0 0 1.5rem;
          }
          .links {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
          }
          a {
            display: inline-flex;
            align-items: center;
            background: #4f46e5;
            color: #fff;
            padding: 0.65rem 1.25rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            font-size: 0.9rem;
            transition: background 0.2s;
          }
          a:hover {
            background: #4338ca;
          }
          a.secondary {
            background: #1f2937;
            color: #d1d5db;
          }
          a.secondary:hover {
            background: #374151;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">● Server Online</div>
          <h1>ClubSync API Server</h1>
          <p>The Express backend for ClubSync is running smoothly and connected to Neon Postgres. The React frontend is running on port 5173.</p>
          <div class="links">
            <a href="http://localhost:5173" target="_blank">Open App (localhost:5173) &rarr;</a>
            <a class="secondary" href="/api/health">Health Check API</a>
          </div>
        </div>
      </body>
      </html>
    `);
  }

  res.json({
    name: 'ClubSync API Server',
    status: 'online',
    version: '1.0.0',
    frontend: 'http://localhost:5173',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString()
  });
});

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
const paymentsRouter = require('./routes/payments');
const recruitmentRouter = require('./routes/recruitment');
const inventoryRouter = require('./routes/inventory');
const sponsorshipsRouter = require('./routes/sponsorships');
const webhooksRouter = require('./routes/webhooks');
const mentorshipRouter = require('./routes/mentorship');
const resolutionsRouter = require('./routes/resolutions');

app.use('/api/auth', authRouter);
app.use('/api/clubs', clubsRouter);
app.use('/api/sync', syncRouter);
app.use('/api/events', eventsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/elections', electionsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/recruitment', recruitmentRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/sponsorships', sponsorshipsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/mentorship', mentorshipRouter);
app.use('/api/resolutions', resolutionsRouter);

// 9. 404 Handler for Unknown Endpoints
app.use((req, res) => {
  if (req.accepts('html')) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>404 Not Found - ClubSync API</title>
        <style>
          body {
            margin: 0;
            background: #0b0f19;
            color: #f3f4f6;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .card {
            background: #111827;
            border: 1px solid #1f2937;
            border-radius: 12px;
            padding: 2rem;
            text-align: center;
            max-width: 440px;
          }
          code {
            background: #1f2937;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            color: #f87171;
          }
          a {
            color: #818cf8;
            text-decoration: none;
            display: inline-block;
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>404 - Endpoint Not Found</h2>
          <p style="color:#9ca3af;">Route <code>${req.method} ${req.originalUrl}</code> does not exist on this server.</p>
          <a href="/">← Return to API Home</a>
        </div>
      </body>
      </html>
    `);
  }
  res.status(404).json({ error: `Endpoint '${req.method} ${req.originalUrl}' not found` });
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
