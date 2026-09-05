const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;`);
    console.log("Success");
  } catch (err) {
    console.error(err);
  } finally {
    db.end();
  }
}
run();
