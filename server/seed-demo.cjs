const db = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Synchronizing user schema and creating demo accounts...');

  // 1. Ensure password_hash column exists
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);

  const hash = await bcrypt.hash('Password123!', 10);

  // 2. Set password & password_hash for existing user test@clubsync.com
  await db.query(`
    UPDATE users 
    SET password = $1, password_hash = $1 
    WHERE email = 'test@clubsync.com'
  `, [hash]);

  // 3. Create or update Officer Demo Account
  const officerRes = await db.query(`
    INSERT INTO users (email, password, password_hash, full_name, bio)
    VALUES ('officer@clubsync.app', $1, $1, 'Alex Rivera (Club Officer)', 'President of Robotics and campus tech lead.')
    ON CONFLICT (email) DO UPDATE 
    SET password = $1, password_hash = $1, full_name = 'Alex Rivera (Club Officer)'
    RETURNING id, email, full_name
  `, [hash]);
  const officerId = officerRes.rows[0].id;
  console.log('Officer demo user:', officerRes.rows[0]);

  // 4. Create or update Member Demo Account
  const memberRes = await db.query(`
    INSERT INTO users (email, password, password_hash, full_name, bio)
    VALUES ('member@clubsync.app', $1, $1, 'Sarah Chen (Student Member)', 'Sophomore CS student passionate about campus clubs.')
    ON CONFLICT (email) DO UPDATE 
    SET password = $1, password_hash = $1, full_name = 'Sarah Chen (Student Member)'
    RETURNING id, email, full_name
  `, [hash]);
  const memberId = memberRes.rows[0].id;
  console.log('Member demo user:', memberRes.rows[0]);

  // 5. Connect Officer & Member to active clubs
  const clubs = await db.query('SELECT id, name FROM clubs ORDER BY created_at DESC LIMIT 5');
  for (const c of clubs.rows) {
    await db.query(`
      INSERT INTO club_members (club_id, user_id, role)
      VALUES ($1, $2, 'President')
      ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'President'
    `, [c.id, officerId]);

    await db.query(`
      INSERT INTO club_members (club_id, user_id, role)
      VALUES ($1, $2, 'Member')
      ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'Member'
    `, [c.id, memberId]);
  }

  console.log('Successfully seeded demo users with club permissions!');
}

seed()
  .catch(console.error)
  .finally(() => db.pool.end());
