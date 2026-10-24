const db = require('./db');

async function migratePayments() {
  console.log('--- Migrating Database for YouPI Zero-Fee UPI Payment Gateway ---');

  // 1. Add UPI configuration to clubs
  await db.query(`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS upi_vpa TEXT DEFAULT 'pictrobocon@upi';`);
  await db.query(`ALTER TABLE clubs ADD COLUMN IF NOT EXISTS upi_payee_name TEXT DEFAULT 'PICT Robocon Pune';`);

  // 2. Add price to events table
  await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;`);

  // 3. Create payments table
  await db.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      event_id UUID REFERENCES events(id) ON DELETE SET NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'event_ticket',
      amount NUMERIC NOT NULL,
      currency VARCHAR(10) DEFAULT 'INR',
      vpa VARCHAR(100) NOT NULL,
      payee_name VARCHAR(150),
      transaction_note TEXT,
      ref_id VARCHAR(100) UNIQUE NOT NULL,
      utr VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      verified_at TIMESTAMP WITH TIME ZONE,
      verified_by UUID REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 4. Update events with realistic college student ticket prices
  await db.query(`
    UPDATE events 
    SET price = 150 
    WHERE title ILIKE '%RoboRave%' AND (price IS NULL OR price = 0);
  `);
  await db.query(`
    UPDATE events 
    SET price = 250 
    WHERE title ILIKE '%Credenz%' AND (price IS NULL OR price = 0);
  `);
  await db.query(`
    UPDATE events 
    SET price = 200 
    WHERE title ILIKE '%Pulzion%' AND (price IS NULL OR price = 0);
  `);

  // 5. Set up default UPI VPAs for all PICT clubs
  await db.query(`
    UPDATE clubs 
    SET upi_vpa = 'pictrobocon@oksbi', upi_payee_name = 'PICT Robocon Pune'
    WHERE name ILIKE '%Robocon%' AND (upi_vpa IS NULL OR upi_vpa = '');
  `);
  await db.query(`
    UPDATE clubs 
    SET upi_vpa = 'pisb.pict@hdfcbank', upi_payee_name = 'PICT IEEE Student Branch'
    WHERE name ILIKE '%IEEE%' AND (upi_vpa IS NULL OR upi_vpa = '');
  `);
  await db.query(`
    UPDATE clubs 
    SET upi_vpa = 'pasc.treasurer@icici', upi_payee_name = 'PICT ACM Student Chapter'
    WHERE name ILIKE '%ACM%' AND (upi_vpa IS NULL OR upi_vpa = '');
  `);

  console.log('--- Migration for YouPI UPI Payments Completed Successfully! ---');
}

migratePayments()
  .catch(console.error)
  .finally(() => db.pool.end());
