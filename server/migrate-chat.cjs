const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS club_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("club_messages table created");
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
