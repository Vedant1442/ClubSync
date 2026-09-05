const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'super-secret-clubsync-key';
const DB_URL = 'postgresql://neondb_owner:npg_JzyN51IDfqZW@ep-fragrant-violet-au1mfp4x-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

async function run() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  
  console.log('--- Step 1: Find User and Club ---');
  const userRes = await client.query('SELECT * FROM users LIMIT 1');
  const user = userRes.rows[0];
  console.log('Found User:', user.email);
  
  const clubRes = await client.query('SELECT * FROM clubs LIMIT 1');
  const club = clubRes.rows[0];
  console.log('Found Club:', club.id);
  
  client.end();

  console.log('\n--- Step 2: Login ---');
  // Attempt to hit the login endpoint using fetch
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: 'password123' })
    });
    let loginData;
    try {
      loginData = await loginRes.json();
    } catch(e) {
      loginData = await loginRes.text();
    }
    console.log('Login Response:', loginRes.status, loginData);
  } catch (err) {
    console.error('Login Request Failed:', err.message);
  }

  console.log('\nMinting token manually since login is expected to fail due to DB schema mismatch (password vs password_hash)...');
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

  console.log('\n--- Step 3: Create Meeting ---');
  try {
    const meetingRes = await fetch(`http://localhost:5000/api/clubs/${club.id}/meetings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Meeting',
        date: new Date().toISOString(),
        time: '10:00 AM',
        location: 'Room 101',
        description: 'Testing API',
        minutes: 'N/A'
      })
    });
    let meetingData;
    try {
      meetingData = await meetingRes.json();
    } catch(e) {
      meetingData = await meetingRes.text();
    }
    console.log('Create Meeting Response:', meetingRes.status, meetingData);
  } catch (err) {
    console.error('Create Meeting Request Failed:', err.message);
  }
}

run();
