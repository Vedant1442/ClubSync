const { Pool } = require('pg');
require('dotenv').config({ path: 'server/.env' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS time TEXT;`);
    await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS location TEXT;`);
    await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS description TEXT;`);
    await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS ai_summary TEXT;`);
    console.log("Success");
  } catch (err) {
    console.error(err);
  } finally {
    db.end();
  }
}
run();
