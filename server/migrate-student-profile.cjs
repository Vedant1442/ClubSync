const db = require('./db');

async function migrate() {
  try {
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS college_id TEXT;');
    await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT;');
    console.log('Columns college_id and branch added successfully.');

    await db.query(
      "UPDATE users SET college_id = 'C2K221142', branch = 'BE - Computer Engineering' WHERE email = 'officer@clubsync.app'"
    );

    await db.query(
      "UPDATE users SET college_id = 'C2K231189', branch = 'TE - Information Technology' WHERE email = 'member@clubsync.app'"
    );

    console.log('Seed users updated with PICT Roll No/PRN and Branch.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
}

migrate();
