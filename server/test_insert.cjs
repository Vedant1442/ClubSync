const { Client } = require('pg');
const DB_URL = 'postgresql://neondb_owner:npg_JzyN51IDfqZW@ep-fragrant-violet-au1mfp4x-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  try {
    const clubId = '8193deff-f1e2-4277-abd4-a4c294ed7589';
    const userId = 'eecf8a78-174f-4848-8320-bbc097acaee8'; // From previous log
    await client.query(
      'INSERT INTO meetings (club_id, title, date, time, location, description, minutes, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [
        clubId, 
        'Test Meeting', 
        new Date().toISOString(), 
        '10:00 AM', 
        'Room 101', 
        'Testing API', 
        'N/A', 
        userId
      ]
    );
    console.log('Success!');
  } catch (e) {
    console.error('Insert Failed:', e);
  } finally {
    client.end();
  }
}
run();
