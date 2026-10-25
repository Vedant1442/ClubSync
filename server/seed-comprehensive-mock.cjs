const db = require('./db');

async function seedComprehensiveMock() {
  console.log('🚀 --- Seeding Comprehensive Realistic Indian/PICT Mock Data ---');

  // 1. Fetch Users
  const usersRes = await db.query('SELECT id, email, full_name, college_id, branch FROM users ORDER BY full_name ASC');
  const users = usersRes.rows;
  const userMap = {};
  users.forEach(u => { userMap[u.email] = u; });

  const officer = userMap['officer@clubsync.app'];
  const member = userMap['member@clubsync.app'];
  const atharva = userMap['atharva@pict.edu'];
  const rutuja = userMap['rutuja@pict.edu'];
  const omkar = userMap['omkar@pict.edu'];
  const siddharth = userMap['siddharth@pict.edu'];
  const ishita = userMap['ishita@pict.edu'];
  const tanmay = userMap['tanmay@pict.edu'];
  const ananya = userMap['ananya@pict.edu'];
  const rohan = userMap['rohan@pict.edu'];
  const sneha = userMap['sneha@pict.edu'];

  console.log(`Found ${users.length} users in database.`);

  // 2. Fetch Clubs
  const clubsRes = await db.query('SELECT id, name FROM clubs ORDER BY name ASC');
  const clubs = clubsRes.rows;
  const clubMap = {};
  clubs.forEach(c => { clubMap[c.name] = c.id; });

  const roboconId = clubMap['PICT Robocon'] || clubs[0]?.id;
  const pisbId = clubMap['PICT IEEE Student Branch (PISB)'] || clubs[1]?.id;
  const pascId = clubMap['PICT ACM Student Chapter (PASC)'] || clubs[2]?.id;
  const edcId = clubMap['PICT EDC (Entrepreneurship Cell)'] || clubs[3]?.id;

  // 3. Fetch Events
  const eventsRes = await db.query('SELECT id, title, club_id FROM events ORDER BY date ASC');
  const events = eventsRes.rows;
  const eventMap = {};
  events.forEach(e => { eventMap[e.title] = e.id; });

  const roboRaveEvent = events.find(e => e.title.includes('RoboRave')) || events[0];
  const credenzEvent = events.find(e => e.title.includes('Credenz')) || events[1] || events[0];
  const pulzionEvent = events.find(e => e.title.includes('Pulzion')) || events[2] || events[0];
  const summitEvent = events.find(e => e.title.includes('Startup') || e.title.includes('Summit')) || events[3] || events[0];

  // ==========================================
  // A. ENSURE ALL TABLES & COLUMNS EXIST
  // ==========================================
  console.log('Ensuring tables and schema columns exist...');

  // Event broadcasts
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_broadcasts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
      author_id UUID REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Event Q&A questions
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_qa_questions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      author_name TEXT,
      author_branch TEXT,
      content TEXT NOT NULL,
      upvotes_count INTEGER DEFAULT 0,
      is_pinned BOOLEAN DEFAULT false,
      is_answered BOOLEAN DEFAULT false,
      answer_text TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // Event Q&A upvotes
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_qa_upvotes (
      question_id UUID REFERENCES event_qa_questions(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (question_id, user_id)
    );
  `);

  // Event squads / teams
  await db.query(`
    CREATE TABLE IF NOT EXISTS event_teams (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      invite_code TEXT NOT NULL,
      leader_id UUID REFERENCES users(id) ON DELETE SET NULL,
      leader_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(event_id, invite_code)
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS event_team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID REFERENCES event_teams(id) ON DELETE CASCADE,
      event_id UUID REFERENCES events(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT,
      user_email TEXT,
      college_id TEXT,
      branch TEXT,
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(event_id, user_id)
    );
  `);

  // Event members columns
  await db.query(`ALTER TABLE event_members ADD COLUMN IF NOT EXISTS ticket_code TEXT;`);
  await db.query(`ALTER TABLE event_members ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;`);
  await db.query(`ALTER TABLE event_members ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;`);
  await db.query(`ALTER TABLE event_members ADD COLUMN IF NOT EXISTS certificate_id TEXT;`);

  // Notifications columns
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS time TEXT;`);
  await db.query(`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;`);

  // Club Applications columns
  await db.query(`ALTER TABLE club_applications ADD COLUMN IF NOT EXISTS interview_slot TEXT;`);
  await db.query(`ALTER TABLE club_applications ADD COLUMN IF NOT EXISTS notes TEXT;`);

  // ==========================================
  // B. SEED EVENT MEMBERS (ATTENDEES & CHECK-INS)
  // ==========================================
  console.log('Seeding Event Attendees into event_members...');
  await db.query('DELETE FROM event_members');

  const seedAttendee = async (eventId, user, isCheckedIn, ticketCode, certId) => {
    if (!eventId || !user) return;
    await db.query(`
      INSERT INTO event_members (event_id, user_id, status, ticket_code, checked_in, checked_in_at, certificate_id)
      VALUES ($1, $2, 'registered', $3, $4, $5, $6)
      ON CONFLICT (event_id, user_id) DO UPDATE
      SET ticket_code = $3, checked_in = $4, checked_in_at = $5, certificate_id = $6
    `, [
      eventId,
      user.id,
      ticketCode,
      isCheckedIn,
      isCheckedIn ? new Date(Date.now() - 3600000) : null,
      certId
    ]);
  };

  if (roboRaveEvent) {
    // 1. Aditya Deshmukh (Officer & Attendee with the famous demo certificate)
    await seedAttendee(roboRaveEvent.id, officer, true, 'TK-RB001', 'PICT-CERT-2026-X89');
    // 2. Kavya Kulkarni (Member demo account)
    await seedAttendee(roboRaveEvent.id, member, true, 'TK-RB002', 'PICT-CERT-2026-K92');
    // 3. Omkar Patil
    await seedAttendee(roboRaveEvent.id, omkar, true, 'TK-RB003', 'PICT-CERT-2026-O44');
    // 4. Rutuja Deshmukh
    await seedAttendee(roboRaveEvent.id, rutuja, true, 'TK-RB004', 'PICT-CERT-2026-R19');
    // 5. Atharva Joshi (Not yet checked in - ready for live demo check-in!)
    await seedAttendee(roboRaveEvent.id, atharva, false, 'TK-RB005', null);
    // 6. Siddharth Menon (Not checked in)
    await seedAttendee(roboRaveEvent.id, siddharth, false, 'TK-RB006', null);
    // 7. Ishita Kulkarni (Not checked in)
    await seedAttendee(roboRaveEvent.id, ishita, false, 'TK-RB007', null);
    // 8. Rohan Sawant (Not checked in)
    await seedAttendee(roboRaveEvent.id, rohan, false, 'TK-RB008', null);
    // 9. Sneha Nair (Not checked in)
    await seedAttendee(roboRaveEvent.id, sneha, false, 'TK-RB009', null);
    // 10. Tanmay Kulkarni (Not checked in)
    await seedAttendee(roboRaveEvent.id, tanmay, false, 'TK-RB010', null);
  }

  if (credenzEvent) {
    await seedAttendee(credenzEvent.id, officer, true, 'TK-CR101', 'PICT-CERT-2026-C01');
    await seedAttendee(credenzEvent.id, member, false, 'TK-CR102', null);
    await seedAttendee(credenzEvent.id, siddharth, true, 'TK-CR103', 'PICT-CERT-2026-C03');
    await seedAttendee(credenzEvent.id, sneha, false, 'TK-CR104', null);
    await seedAttendee(credenzEvent.id, ananya, true, 'TK-CR105', 'PICT-CERT-2026-C05');
  }

  if (pulzionEvent) {
    await seedAttendee(pulzionEvent.id, member, true, 'TK-PZ201', 'PICT-CERT-2026-P01');
    await seedAttendee(pulzionEvent.id, siddharth, true, 'TK-PZ202', 'PICT-CERT-2026-P02');
    await seedAttendee(pulzionEvent.id, tanmay, false, 'TK-PZ203', null);
    await seedAttendee(pulzionEvent.id, sneha, false, 'TK-PZ204', null);
    await seedAttendee(pulzionEvent.id, rutuja, false, 'TK-PZ205', null);
    await seedAttendee(pulzionEvent.id, ananya, false, 'TK-PZ206', null);
  }

  // ==========================================
  // C. SEED LIVE EVENT BROADCASTS
  // ==========================================
  console.log('Seeding Event Broadcasts...');
  await db.query('DELETE FROM event_broadcasts');

  if (roboRaveEvent) {
    await db.query(`
      INSERT INTO event_broadcasts (event_id, club_id, author_id, author_name, title, message, priority, created_at)
      VALUES 
      ($1, $2, $3, 'Aditya Deshmukh', '🚨 Spot Desk Check-In is LIVE at Audi-2 Foyer', 'Please present your ClubSync Digital Gate Pass or QR code at Desk 3 for badge verification and kit collection.', 'high', NOW() - INTERVAL '45 minutes'),
      ($1, $2, $3, 'Aditya Deshmukh', '🔧 Hardware Toolkits Ready for Pickup', 'LiDAR sensors (RPLidar A1M8) and STM32 microcontroller developer boards can be checked out from Workshop Bay 2 with your student ID.', 'normal', NOW() - INTERVAL '2 hours'),
      ($1, $2, $3, 'Aditya Deshmukh', '📄 Rules Packet & Arena Track Layout Released', 'Arena obstacle course dimensions and scoring rubrics have been uploaded to the Documents tab.', 'normal', NOW() - INTERVAL '1 day')
    `, [roboRaveEvent.id, roboconId, officer?.id]);
  }

  if (pulzionEvent) {
    await db.query(`
      INSERT INTO event_broadcasts (event_id, club_id, author_id, author_name, title, message, priority, created_at)
      VALUES 
      ($1, $2, $3, 'Siddharth Menon', '⚡ Hackathon Problem Statements Unlocked!', 'Problem statements across AI/ML, Web3, and Systems tracks are live on the squad portal. 24-hour timer starts at 9:00 AM.', 'high', NOW() - INTERVAL '3 hours'),
      ($1, $2, $3, 'Siddharth Menon', '☕ Midnight Refreshments & Red Bull Station', 'Catering counter open at Central Computing Facility (CCF) foyer throughout the night.', 'normal', NOW() - INTERVAL '5 hours')
    `, [pulzionEvent.id, pascId, siddharth?.id]);
  }

  // ==========================================
  // D. SEED LIVE EVENT Q&A
  // ==========================================
  console.log('Seeding Event Live Q&A questions...');
  await db.query('DELETE FROM event_qa_upvotes');
  await db.query('DELETE FROM event_qa_questions');

  if (roboRaveEvent) {
    const q1 = await db.query(`
      INSERT INTO event_qa_questions (event_id, user_id, author_name, author_branch, content, upvotes_count, is_pinned, is_answered, answer_text, created_at)
      VALUES (
        $1, $2, 'Omkar Patil', 'TE E&TC',
        'Will ROS2 Humble environments be pre-installed on the lab systems, or should we dual boot our personal laptops?',
        16, true, true,
        'All desktop systems in Room 304 are pre-configured with Ubuntu 22.04 LTS and ROS2 Humble. Dual-booting personal laptops is also welcome; setup guides are available in the Documents tab.',
        NOW() - INTERVAL '3 hours'
      ) RETURNING id
    `, [roboRaveEvent.id, omkar?.id]);

    const q2 = await db.query(`
      INSERT INTO event_qa_questions (event_id, user_id, author_name, author_branch, content, upvotes_count, is_pinned, is_answered, answer_text, created_at)
      VALUES (
        $1, $2, 'Kavya Kulkarni', 'TE IT',
        'Are AICTE activity points granted for attending the full 2-day session?',
        22, true, true,
        'Yes! +10 AICTE activity points and an SPPU-endorsed verifiable collegiate certificate (verifiable via ClubSync public ledger) are issued upon completion.',
        NOW() - INTERVAL '2 hours'
      ) RETURNING id
    `, [roboRaveEvent.id, member?.id]);

    const q3 = await db.query(`
      INSERT INTO event_qa_questions (event_id, user_id, author_name, author_branch, content, upvotes_count, is_pinned, is_answered, answer_text, created_at)
      VALUES (
        $1, $2, 'Sneha Nair', 'SE Comp',
        'Can first-year (FE) and second-year (SE) students form cross-branch teams for the autonomous maze solver?',
        9, false, true,
        'Yes, inter-departmental and cross-year squads (Comp, IT, E&TC, AI&DS) are encouraged. You can use the Squad feature to link teammates.',
        NOW() - INTERVAL '90 minutes'
      ) RETURNING id
    `, [roboRaveEvent.id, sneha?.id]);

    const q4 = await db.query(`
      INSERT INTO event_qa_questions (event_id, user_id, author_name, author_branch, content, upvotes_count, is_pinned, is_answered, answer_text, created_at)
      VALUES (
        $1, $2, 'Rohan Sawant', 'TE Mech/Robo',
        'Will hardware components (LiDAR, motor drivers) be provided for keeping after the workshop?',
        5, false, true,
        'Hardware kits are for lab use during the session, but the top 3 podium winners get an STM32 dev kit and sensor bundle to keep!',
        NOW() - INTERVAL '45 minutes'
      ) RETURNING id
    `, [roboRaveEvent.id, rohan?.id]);

    // Upvote seeds
    if (officer && q1.rows[0]) await db.query('INSERT INTO event_qa_upvotes VALUES ($1, $2) ON CONFLICT DO NOTHING', [q1.rows[0].id, officer.id]);
    if (member && q1.rows[0]) await db.query('INSERT INTO event_qa_upvotes VALUES ($1, $2) ON CONFLICT DO NOTHING', [q1.rows[0].id, member.id]);
    if (officer && q2.rows[0]) await db.query('INSERT INTO event_qa_upvotes VALUES ($1, $2) ON CONFLICT DO NOTHING', [q2.rows[0].id, officer.id]);
  }

  // ==========================================
  // E. SEED HACKATHON / EVENT SQUADS (TEAMS)
  // ==========================================
  console.log('Seeding Event Squads / Teams...');
  await db.query('DELETE FROM event_team_members');
  await db.query('DELETE FROM event_teams');

  if (pulzionEvent) {
    const t1Res = await db.query(`
      INSERT INTO event_teams (event_id, name, invite_code, leader_id, leader_name)
      VALUES ($1, 'AlgoKnights', 'ALG001', $2, 'Siddharth Menon')
      RETURNING id
    `, [pulzionEvent.id, siddharth?.id]);
    const t1Id = t1Res.rows[0].id;

    await db.query(`
      INSERT INTO event_team_members (team_id, event_id, user_id, user_name, user_email, college_id, branch)
      VALUES 
      ($1, $2, $3, 'Siddharth Menon', 'siddharth@pict.edu', 'PRN: 72149025K', 'Computer Engineering (BE)'),
      ($1, $2, $4, 'Sneha Nair', 'sneha@pict.edu', 'PRN: 72149040K', 'Computer Engineering (SE)'),
      ($1, $2, $5, 'Tanmay Kulkarni', 'tanmay@pict.edu', 'PRN: 72149033K', 'Information Technology (SE)')
    `, [t1Id, pulzionEvent.id, siddharth?.id, sneha?.id, tanmay?.id]);

    const t2Res = await db.query(`
      INSERT INTO event_teams (event_id, name, invite_code, leader_id, leader_name)
      VALUES ($1, 'NeuralForge', 'NRF002', $2, 'Rutuja Deshmukh')
      RETURNING id
    `, [pulzionEvent.id, rutuja?.id]);
    const t2Id = t2Res.rows[0].id;

    await db.query(`
      INSERT INTO event_team_members (team_id, event_id, user_id, user_name, user_email, college_id, branch)
      VALUES 
      ($1, $2, $3, 'Rutuja Deshmukh', 'rutuja@pict.edu', 'PRN: 72149022K', 'Information Technology (TE)'),
      ($1, $2, $4, 'Ananya Sharma', 'ananya@pict.edu', 'PRN: 72149035K', 'Computer Engineering (SE)')
    `, [t2Id, pulzionEvent.id, rutuja?.id, ananya?.id]);
  }

  if (roboRaveEvent) {
    const tRobo = await db.query(`
      INSERT INTO event_teams (event_id, name, invite_code, leader_id, leader_name)
      VALUES ($1, 'BotBusters', 'BOT101', $2, 'Omkar Patil')
      RETURNING id
    `, [roboRaveEvent.id, omkar?.id]);
    const tRoboId = tRobo.rows[0].id;

    await db.query(`
      INSERT INTO event_team_members (team_id, event_id, user_id, user_name, user_email, college_id, branch)
      VALUES 
      ($1, $2, $3, 'Omkar Patil', 'omkar@pict.edu', 'PRN: 72149023K', 'Electronics & Telecommunication (TE)'),
      ($1, $2, $4, 'Rohan Sawant', 'rohan@pict.edu', 'PRN: 72149038K', 'Mechanical Engineering (TE)')
    `, [tRoboId, roboRaveEvent.id, omkar?.id, rohan?.id]);
  }

  // ==========================================
  // F. SEED INVENTORY BORROWING REQUESTS
  // ==========================================
  console.log('Seeding Club Inventory Requests...');
  await db.query('DELETE FROM club_inventory_requests');

  const invItems = await db.query('SELECT id, name FROM club_inventory_items WHERE club_id = $1', [roboconId]);
  if (invItems.rows.length > 0) {
    const lipoItem = invItems.rows.find(i => i.name.includes('LiPo')) || invItems.rows[0];
    const arduinoItem = invItems.rows.find(i => i.name.includes('Arduino')) || invItems.rows[1] || invItems.rows[0];
    const motorItem = invItems.rows.find(i => i.name.includes('Motor')) || invItems.rows[2] || invItems.rows[0];

    await db.query(`
      INSERT INTO club_inventory_requests (
        item_id, club_id, user_id, user_name, user_email, college_id, branch,
        quantity, purpose, return_date, status, approved_by, approved_at, created_at
      ) VALUES 
      (
        $1, $2, $3, 'Atharva Joshi', 'atharva@pict.edu', 'PRN: 72149020K', 'Robotics & Automation',
        1, 'Autonomous Arena Speed Run and ESC current draw bench testing.',
        CURRENT_DATE + INTERVAL '3 days', 'approved', $4, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'
      ),
      (
        $5, $2, $6, 'Omkar Patil', 'omkar@pict.edu', 'PRN: 72149023K', 'Electronics & Telecommunication',
        2, 'Quadrature optical encoder PID velocity tuning on secondary bot chassis.',
        CURRENT_DATE + INTERVAL '5 days', 'approved', $4, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day'
      ),
      (
        $7, $2, $8, 'Rohan Sawant', 'rohan@pict.edu', 'PRN: 72149038K', 'Mechanical Engineering',
        1, 'Propeller thrust bench measurement for autonomous aerial payload drop.',
        CURRENT_DATE + INTERVAL '7 days', 'pending', NULL, NULL, NOW() - INTERVAL '2 hours'
      )
    `, [
      lipoItem.id, roboconId, atharva?.id, officer?.id,
      arduinoItem.id, omkar?.id,
      motorItem.id, rohan?.id
    ]);
  }

  // ==========================================
  // G. SEED RECRUITMENT DRIVES & APPLICATIONS
  // ==========================================
  console.log('Seeding Recruitment Drives & Applications...');
  await db.query('DELETE FROM club_applications');
  await db.query('DELETE FROM club_recruitment_drives WHERE club_id = $1', [roboconId]);

  const driveDomains = [
    'Embedded Systems & ROS2',
    'Computer Vision & SLAM',
    'Mechanical CAD & 3D Fabrication',
    'Web & Telemetry Dashboard',
    'Public Relations & Corporate Sponsorship'
  ];

  const driveRes = await db.query(`
    INSERT INTO club_recruitment_drives (
      club_id, title, description, domains, deadline, is_active, created_at
    ) VALUES (
      $1,
      'PICT Robocon Core Committee Auditions FY26-27',
      'Annual recruitment drive for selecting the 2026-27 core technical and operations crew representing PICT Pune at the National Robocon Arena.',
      $2,
      CURRENT_DATE + INTERVAL '14 days',
      true,
      NOW() - INTERVAL '3 days'
    ) RETURNING id
  `, [roboconId, driveDomains]);

  const driveId = driveRes.rows[0].id;

  await db.query(`
    INSERT INTO club_applications (
      drive_id, club_id, user_id, full_name, email, college_id, branch,
      domain, portfolio_url, statement_of_purpose, status, interview_slot, notes, created_at
    ) VALUES 
    (
      $1, $2, $3, 'Tanmay Kulkarni', 'tanmay@pict.edu', 'PRN: 72149033K', 'Information Technology (SE)',
      'Embedded Systems & ROS2', 'https://github.com/tanmay-k/stm32-ros2-bridge',
      'Passionate about bare-metal STM32 HAL drivers and real-time microcontroller interfaces. Built an autonomous differential line follower bot in FE that won 2nd prize at Credenz.',
      'shortlisted', 'Wednesday, 4:30 PM (Robotics Lab 304)', 'Strong grasp of UART, DMA, and timer interrupts. Recommended for round 2 technical viva.', NOW() - INTERVAL '2 days'
    ),
    (
      $1, $2, $4, 'Sneha Nair', 'sneha@pict.edu', 'PRN: 72149040K', 'Computer Engineering (SE)',
      'Computer Vision & SLAM', 'https://github.com/sneha-nair/arena-detector-yolo',
      'Proficient in OpenCV, C++ STL, and PyTorch. Implemented real-time ball detection at 60 FPS using TensorRT on Jetson Nano. Excited to build the arena camera tracking pipeline.',
      'interviewed', 'Completed (Score: 9.2/10)', 'Outstanding algorithmic clarity. Can independently lead secondary bot ball localization stack.', NOW() - INTERVAL '1 day'
    ),
    (
      $1, $2, $5, 'Ishita Kulkarni', 'ishita@pict.edu', 'PRN: 72149030K', 'Electronics & Telecommunication (SE)',
      'Public Relations & Corporate Sponsorship', 'https://linkedin.com/in/ishita-k-pict',
      'Led corporate sponsorship outreach for Department Tech Week raising ₹18,000 from local tech firms. Fluent communication, pitch deck design, and event anchoring experience.',
      'offered', 'Offer Letter Dispatched', 'Confirmed selection for Assistant Sponsorship Lead role.', NOW() - INTERVAL '3 days'
    ),
    (
      $1, $2, $6, 'Ananya Sharma', 'ananya@pict.edu', 'PRN: 72149035K', 'Computer Engineering (SE)',
      'Web & Telemetry Dashboard', 'https://github.com/ananya-sharma/pict-telemetry',
      'Experienced in React, Tailwind CSS, WebSockets, and three.js. Eager to build the live robot telemetry visualization HUD for driver stations.',
      'shortlisted', 'Thursday, 5:00 PM (CCF Lab 2)', 'Portfolio UI is clean and responsive. Good knowledge of state management.', NOW() - INTERVAL '18 hours'
    )
  `, [driveId, roboconId, tanmay?.id, sneha?.id, ishita?.id, ananya?.id]);

  // ==========================================
  // H. SEED NOTIFICATIONS
  // ==========================================
  console.log('Seeding Notifications...');
  await db.query('DELETE FROM notifications');

  // Officer notifications
  if (officer) {
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, read, created_at)
      VALUES 
      ($1, '🎉 Persistent Systems Sponsorship Grant Received', 'Sponsorship fund of ₹25,000 has been credited to PICT Robocon treasury account.', 'treasury', false, NOW() - INTERVAL '30 minutes'),
      ($1, '📦 New Equipment Checkout Request', 'Rohan Sawant submitted an issue request for DJI S500 Brushless Motor Set.', 'inventory', false, NOW() - INTERVAL '2 hours'),
      ($1, '🏛️ Auditorium 2 Sanction Confirmed', 'Estates Office and Gymkhana confirmed Audi-2 booking for RoboRave Pune 2026.', 'event', true, NOW() - INTERVAL '1 day'),
      ($1, '🗳️ Technical Head Election Voting Active', '4 votes recorded so far. Voting closes in 4 days.', 'election', true, NOW() - INTERVAL '2 days')
    `, [officer.id]);
  }

  // Member notifications (Kavya Kulkarni)
  if (member) {
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, read, created_at)
      VALUES 
      ($1, '🎟️ Registration Confirmed: RoboRave Pune', 'You are registered! Your digital gate pass (TK-RB002) is ready in your wallet.', 'event', false, NOW() - INTERVAL '1 hour'),
      ($1, '📜 OD Letter Available for Download', 'Official Duty letter for RoboRave Pune is ready for academic attendance sanction.', 'od_letter', false, NOW() - INTERVAL '3 hours'),
      ($1, '🎓 Mentorship Session Confirmed', 'Siddharth Menon accepted your 1-on-1 mentorship session on ROS2 Humble.', 'mentorship', true, NOW() - INTERVAL '1 day'),
      ($1, '🏆 Certificate of Merit Issued', 'Credential PICT-CERT-2026-X89 is verified on the college ledger.', 'certificate', true, NOW() - INTERVAL '2 days')
    `, [member.id]);
  }

  // ==========================================
  // I. SEED MENTORS & SESSIONS
  // ==========================================
  console.log('Seeding Mentors & Mentorship Sessions...');
  await db.query('DELETE FROM club_mentorship_sessions');
  await db.query('DELETE FROM club_mentors');

  if (siddharth) {
    const m1 = await db.query(`
      INSERT INTO club_mentors (
        club_id, user_id, domains, year_of_study, bio,
        max_weekly_slots, is_accepting_mentees, rating_avg, sessions_completed
      ) VALUES (
        $1, $2, $3, 'BE Comp',
        'Senior Web Master & Full-Stack Developer. Mentoring junior developers in clean architecture, APIs, and cloud deployments.',
        4, true, 4.9, 12
      ) RETURNING id
    `, [roboconId, siddharth.id, JSON.stringify(['Web Development', 'Cloud & Docker', 'System Architecture'])]);

    if (member) {
      await db.query(`
        INSERT INTO club_mentorship_sessions (
          club_id, mentor_id, mentee_id, topic, description,
          preferred_date, preferred_time, meeting_venue, status, rating, review_feedback
        ) VALUES (
          $1, $2, $3, 'ROS2 Humble Architecture & Node Communication via DDS',
          'Deep-dive into pub/sub architecture and custom message definitions for robot navigation.',
          CURRENT_DATE + INTERVAL '1 day', '05:00 PM', 'Robotics Lab Bay 3',
          'CONFIRMED', NULL, NULL
        )
      `, [roboconId, m1.rows[0].id, member.id]);
    }
  }

  if (omkar) {
    const m2 = await db.query(`
      INSERT INTO club_mentors (
        club_id, user_id, domains, year_of_study, bio,
        max_weekly_slots, is_accepting_mentees, rating_avg, sessions_completed
      ) VALUES (
        $1, $2, $3, 'TE ENTC',
        'Technical Lead @ PICT Robocon. Hands-on expertise in microcontroller firmware, sensor fusion, and motor drives.',
        3, true, 4.8, 8
      ) RETURNING id
    `, [roboconId, omkar.id, JSON.stringify(['Embedded Systems', 'STM32 HAL', 'LiDAR SLAM'])]);

    if (tanmay) {
      await db.query(`
        INSERT INTO club_mentorship_sessions (
          club_id, mentor_id, mentee_id, topic, description,
          preferred_date, preferred_time, meeting_venue, status, rating, review_feedback
        ) VALUES (
          $1, $2, $3, 'Bare-Metal STM32 Register Configuration vs HAL Drivers',
          'Hands-on register level debugging on STM32F407 discovery board.',
          CURRENT_DATE - INTERVAL '3 days', '04:30 PM', 'Room 304 Hardware Bench',
          'COMPLETED', 5,
          'Super clear explanation of timer clock trees and interrupt priorities. Helped resolve a hardfault in my firmware!'
        )
      `, [roboconId, m2.rows[0].id, tanmay.id]);
    }
  }

  // ==========================================
  // J. SEED WEBHOOK BRIDGES FOR ROBOCON
  // ==========================================
  console.log('Seeding Webhook Bridges for PICT Robocon...');
  await db.query('DELETE FROM club_webhooks WHERE club_id = $1', [roboconId]);

  await db.query(`
    INSERT INTO club_webhooks (
      club_id, platform, channel_name, webhook_url, is_active, events_enabled,
      last_status, last_triggered_at, created_by
    ) VALUES (
      $1, 'DISCORD', '#robocon-announcements',
      'https://discord.com/api/webhooks/123456789012345678/sample_token_pict_robocon',
      true,
      '{"on_event_created": true, "on_broadcast": true, "on_recruitment_open": true}',
      'SUCCESS', NOW() - INTERVAL '1 hour', $2
    )
  `, [roboconId, officer?.id]);

  await db.query(`
    INSERT INTO club_webhooks (
      club_id, platform, channel_name, telegram_bot_token, telegram_chat_id,
      is_active, events_enabled, last_status, last_triggered_at, created_by
    ) VALUES (
      $1, 'TELEGRAM', '@pict_robocon_live',
      '7987654321:ABCDefghIJklmnOPQRstuvwxyz654321', '@pict_robocon_channel',
      true,
      '{"on_event_created": true, "on_broadcast": true, "on_recruitment_open": false}',
      'SUCCESS', NOW() - INTERVAL '2 hours', $2
    )
  `, [roboconId, officer?.id]);

  console.log('✅ --- Successfully Completed Comprehensive Indian/PICT Seeding! ---');
}

seedComprehensiveMock()
  .catch(err => {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
  })
  .finally(() => db.pool.end());
