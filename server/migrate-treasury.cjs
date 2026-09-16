const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        amount NUMERIC NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("club_transactions table created");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
