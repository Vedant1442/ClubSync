const db = require('./db');

async function check() {
  const r = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
  console.log('USERS COLUMNS:', r.rows);
}

check().catch(console.error).finally(() => db.pool.end());
