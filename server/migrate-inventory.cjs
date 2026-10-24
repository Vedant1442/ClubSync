const db = require('./db');

async function migrate() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS club_inventory_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Hardware',
        serial_number TEXT,
        total_quantity INTEGER DEFAULT 1,
        available_quantity INTEGER DEFAULT 1,
        storage_location TEXT,
        condition TEXT DEFAULT 'Good',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS club_inventory_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_id UUID REFERENCES club_inventory_items(id) ON DELETE CASCADE,
        club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        user_name TEXT,
        user_email TEXT,
        college_id TEXT,
        branch TEXT,
        quantity INTEGER DEFAULT 1,
        purpose TEXT NOT NULL,
        return_date DATE NOT NULL,
        status TEXT DEFAULT 'pending',
        approved_by UUID REFERENCES users(id),
        approved_at TIMESTAMPTZ,
        returned_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_inv_club ON club_inventory_items(club_id);
      CREATE INDEX IF NOT EXISTS idx_inv_requests_club ON club_inventory_requests(club_id);
      CREATE INDEX IF NOT EXISTS idx_inv_requests_user ON club_inventory_requests(user_id);
    `);

    // Seed realistic lab gear for clubs
    const clubs = await client.query('SELECT id, name FROM clubs');
    const robocon = clubs.rows.find(c => c.name.includes('Robocon')) || clubs.rows[0];
    const ieee = clubs.rows.find(c => c.name.includes('IEEE')) || clubs.rows[1] || clubs.rows[0];
    const picto = clubs.rows.find(c => c.name.includes('Picto')) || clubs.rows[2] || clubs.rows[0];

    if (robocon) {
      await client.query(`
        INSERT INTO club_inventory_items (club_id, name, category, serial_number, total_quantity, available_quantity, storage_location, condition)
        VALUES 
          ($1, 'DJI S500 Drone Brushless Motor & ESC Set', 'Motors & ESC', 'PICT-ROBO-MTR-12', 4, 3, 'Mech Workshop Locker 2B', 'Mint'),
          ($1, 'Arduino Mega 2560 Pro Embedded Dev Board', 'Microcontroller', 'PICT-ROBO-ARD-08', 6, 5, 'Electronics Bay Shelf 1', 'Good'),
          ($1, 'Creality PLA 1.75mm 3D Printer Filament (Black/Grey)', 'Fabrication Consumables', 'PICT-ROBO-FIL-01', 8, 7, '3D Printer Bench 4', 'Good'),
          ($1, 'Turnigy 4S 5000mAh 60C LiPo High-Discharge Battery', 'Power Systems', 'PICT-ROBO-BAT-05', 4, 2, 'Fireproof Battery Vault', 'Good')
        ON CONFLICT DO NOTHING
      `, [robocon.id]);
    }

    if (ieee) {
      await client.query(`
        INSERT INTO club_inventory_items (club_id, name, category, serial_number, total_quantity, available_quantity, storage_location, condition)
        VALUES 
          ($1, 'Raspberry Pi 4 Model B (8GB RAM)', 'Single Board Computer', 'PISB-RPI-04', 5, 4, 'A-Building Lab 3 Cabinet', 'Mint'),
          ($1, 'ESP32 Dual-Core Wi-Fi & BLE Development Board', 'IoT & Wireless', 'PISB-ESP-22', 12, 10, 'A-101 Hardware Box', 'Good'),
          ($1, 'Rigol DS1054Z 50MHz 4-Channel Digital Storage Oscilloscope', 'Lab Instrumentation', 'PISB-OSC-01', 2, 2, 'Instrumentation Rack 1', 'Mint')
        ON CONFLICT DO NOTHING
      `, [ieee.id]);
    }

    if (picto) {
      await client.query(`
        INSERT INTO club_inventory_items (club_id, name, category, serial_number, total_quantity, available_quantity, storage_location, condition)
        VALUES 
          ($1, 'Canon EOS 90D DSLR Camera Body', 'Optics & Imaging', 'PICT-MED-CAM-02', 2, 1, 'Digital Media Studio Locker A', 'Mint'),
          ($1, 'Canon EF 50mm f/1.8 STM Portrait Lens', 'Lenses', 'PICT-MED-LNS-03', 2, 2, 'Lens Pouch Bay 3', 'Mint'),
          ($1, 'Rode VideoMic Pro Shotgun On-Camera Microphone', 'Audio Gear', 'PICT-MED-MIC-01', 3, 2, 'Audio Locker 2', 'Good')
        ON CONFLICT DO NOTHING
      `, [picto.id]);
    }

    await client.query('COMMIT');
    console.log('Inventory & Equipment tables migrated and seeded successfully.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
