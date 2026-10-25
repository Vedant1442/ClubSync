const db = require('./db');

async function listAll() {
  const r = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('--- ALL PUBLIC TABLES ---');
  for (const row of r.rows) {
    try {
      const c = await db.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(`${row.table_name}: ${c.rows[0].count} rows`);
    } catch (e) {
      console.log(`${row.table_name}: error reading (${e.message})`);
    }
  }
}

listAll()
  .catch(console.error)
  .finally(() => db.pool.end());
