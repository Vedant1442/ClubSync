// Boost libuv threadpool size for Windows / Node DNS lookups to avoid getaddrinfo ENOTFOUND
process.env.UV_THREADPOOL_SIZE = process.env.UV_THREADPOOL_SIZE || '16';

const { Pool } = require('pg');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

// Resilient connection pool configured specifically for Neon serverless Postgres
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false },
  max: parseInt(process.env.DB_POOL_MAX || '10', 10), // Keep pool lean to avoid exhausting PgBouncer
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10), // Clean up idle clients before PgBouncer drops them
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '30000', 10), // 30s allowance for scale-to-zero cold start
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Guard against unhandled idle client errors terminating the process
pool.on('error', (err) => {
  console.warn('[DB Pool Notice] Idle client disconnected:', err.code || err.message);
});

const RETRYABLE_CODES = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now (Neon compute activating)
  '08006', // connection_failure
  '08001', // sqlclient_unable_to_establish_sqlconnection
  '08004', // sqlserver_rejected_establishment_of_sqlconnection
]);

function isRetryable(err) {
  if (!err) return false;
  if (err.code && RETRYABLE_CODES.has(err.code)) return true;
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('connection terminated') ||
    msg.includes('connection timeout') ||
    msg.includes('read econnreset') ||
    msg.includes('getaddrinfo') ||
    msg.includes('enotfound') ||
    msg.includes('cannot connect now') ||
    msg.includes('57p03') ||
    msg.includes('socket has been ended') ||
    msg.includes('unexpected error on idle client')
  );
}

// Transparent query retry with exponential backoff on cold starts or network drops
async function query(text, params, maxRetries = 3) {
  let attempt = 0;
  while (true) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      attempt++;
      if (isRetryable(err) && attempt < maxRetries) {
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 2500);
        console.warn(`[DB Resiliency] Query retry ${attempt}/${maxRetries} after transient error (${err.code || err.message}). Waiting ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

// Wrap pool.connect to also retry transient cold-start or socket resets
const originalConnect = pool.connect.bind(pool);
pool.connect = async function (...args) {
  let attempt = 0;
  const maxRetries = 3;
  while (true) {
    try {
      return await originalConnect(...args);
    } catch (err) {
      attempt++;
      if (isRetryable(err) && attempt < maxRetries) {
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 2500);
        console.warn(`[DB Resiliency] pool.connect retry ${attempt}/${maxRetries} after error (${err.code || err.message}). Waiting ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
};

module.exports = {
  query,
  pool,
  healthCheck: async () => {
    const start = Date.now();
    await query('SELECT 1');
    return Date.now() - start;
  },
};
