const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedScreenshotsData() {
  console.log('--- Seeding Realistic Indian & PICT Mock Data for Screenshots ---');

  // Ensure all necessary columns exist on meetings, events, users
  await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS time TEXT;`);
  await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS location TEXT;`);
  await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS description TEXT;`);
  await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS ai_summary TEXT;`);
  await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;`);
  await db.query(`ALTER TABLE meetings ADD COLUMN IF NOT EXISTS meeting_url TEXT;`);

  await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS time TEXT;`);
  await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS location TEXT;`);
  await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS category TEXT;`);
  await db.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS max_attendees INTEGER;`);

  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`);

  // Constitutions table columns
  await db.query(`ALTER TABLE constitutions ADD COLUMN IF NOT EXISTS title TEXT;`);
  await db.query(`ALTER TABLE constitutions ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;`);
  await db.query(`DO $$ BEGIN
    ALTER TABLE constitutions ALTER COLUMN version TYPE TEXT USING version::TEXT;
  EXCEPTION WHEN others THEN null;
  END $$;`);

  // Documents table columns
  await db.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS name TEXT;`);
  await db.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS folder_path TEXT DEFAULT '/';`);
  await db.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size TEXT;`);
  await db.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL;`);
  await db.query(`DO $$ BEGIN
    ALTER TABLE documents ALTER COLUMN title DROP NOT NULL;
  EXCEPTION WHEN others THEN null;
  END $$;`);
  await db.query(`DO $$ BEGIN
    UPDATE documents SET name = title WHERE name IS NULL AND title IS NOT NULL;
  EXCEPTION WHEN others THEN null;
  END $$;`);
  await db.query(`DO $$ BEGIN
    UPDATE documents SET title = name WHERE title IS NULL AND name IS NOT NULL;
  EXCEPTION WHEN others THEN null;
  END $$;`);

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Update/Create Officer User (Aditya Deshmukh)
  const officerRes = await db.query(`
    INSERT INTO users (email, password, password_hash, full_name, bio, avatar_url)
    VALUES (
      'officer@clubsync.app', 
      $1, 
      $1, 
      'Aditya Deshmukh', 
      'President @ PICT Robocon & Technical Council Lead | Final Year Computer Engineering, PICT Pune 🚀',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
    )
    ON CONFLICT (email) DO UPDATE 
    SET full_name = 'Aditya Deshmukh',
        password = $1,
        password_hash = $1,
        bio = 'President @ PICT Robocon & Technical Council Lead | Final Year Computer Engineering, PICT Pune 🚀'
    RETURNING id, email, full_name
  `, [passwordHash]);

  const officerId = officerRes.rows[0].id;
  console.log('Officer Profile Updated:', officerRes.rows[0]);

  // 2. Seed Realistic Indian Student Members
  const indianMembers = [
    { email: 'atharva@pict.edu', name: 'Atharva Joshi', bio: 'Vice President | Hardware & Robotics Enthusiast' },
    { email: 'rutuja@pict.edu', name: 'Rutuja Deshmukh', bio: 'Treasurer @ PICT Robocon | FinTech & Finance Lead' },
    { email: 'omkar@pict.edu', name: 'Omkar Patil', bio: 'Technical Lead | Embedded Systems & ROS2 Developer' },
    { email: 'siddharth@pict.edu', name: 'Siddharth Menon', bio: 'Web Master & Cloud Architect | MERN & DevOps' },
    { email: 'ishita@pict.edu', name: 'Ishita Kulkarni', bio: 'Events & PR Coordinator | DebSoc Head' },
    { email: 'tanmay@pict.edu', name: 'Tanmay Kulkarni', bio: 'Documentation Lead & Open Source Contributor' },
    { email: 'ananya@pict.edu', name: 'Ananya Sharma', bio: 'Design & Media Lead | UI/UX Designer' },
    { email: 'rohan@pict.edu', name: 'Rohan Sawant', bio: 'Robotics Core Team Member | CAD / Mechanical' },
    { email: 'sneha@pict.edu', name: 'Sneha Nair', bio: 'Competitive Programmer & Algorithmic Lead' },
    { email: 'member@clubsync.app', name: 'Kavya Kulkarni', bio: 'Student Member | Third Year IT, PICT Pune' }
  ];

  const memberIds = {};
  for (const m of indianMembers) {
    const res = await db.query(`
      INSERT INTO users (email, password, password_hash, full_name, bio)
      VALUES ($1, $2, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE 
      SET full_name = $3, bio = $4, password = $2, password_hash = $2
      RETURNING id, email, full_name
    `, [m.email, passwordHash, m.name, m.bio]);
    memberIds[m.email] = res.rows[0].id;
  }
  console.log(`Seeded ${Object.keys(memberIds).length} student members.`);

  // 3. Ensure PICT Clubs exist with proper categories
  const pictClubs = [
    {
      name: 'PICT Robocon',
      category: 'Technical',
      description: 'Official collegiate robotics team of PICT Pune competing in ABU Robocon, DD Robocon, and international autonomous robotics challenges.',
      color: '#6c5ce7'
    },
    {
      name: 'PICT IEEE Student Branch (PISB)',
      category: 'Technical',
      description: 'Leading IEEE student chapter organizing Pune’s premier technical symposiums like Credenz, technical workshops, and coding challenges.',
      color: '#0984e3'
    },
    {
      name: 'PICT ACM Student Chapter (PASC)',
      category: 'Technical',
      description: 'Computing society hosting Pulzion, competitive programming contests, algorithmic workshops, and open-source contributions.',
      color: '#00b894'
    },
    {
      name: 'PICT EDC (Entrepreneurship Cell)',
      category: 'Entrepreneurship',
      description: 'Fostering startup culture, venture capital pitch sessions, startup incubator connect, and youth entrepreneurship summits at PICT.',
      color: '#fdcb6e'
    },
    {
      name: 'PICT Art Circle',
      category: 'Cultural',
      description: 'The creative heartbeat of PICT Pune organizing Firodiya Karandak, Purushottam Karandak theatre, classical music, and annual fest Udaan.',
      color: '#e84393'
    },
    {
      name: 'PICT Sports Club',
      category: 'Sports',
      description: 'Inter-college cricket, football, basketball tournaments, annual athletics sports week, and gymkhana fitness initiatives.',
      color: '#e17055'
    }
  ];

  const clubIds = {};
  for (const c of pictClubs) {
    const res = await db.query(`
      INSERT INTO clubs (name, category, description, color, created_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `, [c.name, c.category, c.description, c.color, officerId]);

    if (res.rows.length > 0) {
      clubIds[c.name] = res.rows[0].id;
    } else {
      const existing = await db.query('SELECT id FROM clubs WHERE name = $1', [c.name]);
      clubIds[c.name] = existing.rows[0]?.id;
    }
  }

  const roboconId = clubIds['PICT Robocon'];
  const pisbId = clubIds['PICT IEEE Student Branch (PISB)'];
  const pascId = clubIds['PICT ACM Student Chapter (PASC)'];

  console.log('Active Clubs IDs:', { roboconId, pisbId, pascId });

  // 4. Enroll Members into PICT Robocon & PISB
  if (roboconId) {
    // Aditya as President
    await db.query(`
      INSERT INTO club_members (club_id, user_id, role)
      VALUES ($1, $2, 'President')
      ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'President'
    `, [roboconId, officerId]);

    // Atharva as Vice President
    await db.query(`
      INSERT INTO club_members (club_id, user_id, role)
      VALUES ($1, $2, 'Vice President')
      ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'Vice President'
    `, [roboconId, memberIds['atharva@pict.edu']]);

    // Rutuja as Treasurer
    await db.query(`
      INSERT INTO club_members (club_id, user_id, role)
      VALUES ($1, $2, 'Treasurer')
      ON CONFLICT (club_id, user_id) DO UPDATE SET role = 'Treasurer'
    `, [roboconId, memberIds['rutuja@pict.edu']]);

    // Other members
    const rolesMap = [
      ['omkar@pict.edu', 'Secretary'],
      ['siddharth@pict.edu', 'Member'],
      ['ishita@pict.edu', 'Member'],
      ['tanmay@pict.edu', 'Member'],
      ['ananya@pict.edu', 'Member'],
      ['rohan@pict.edu', 'Member'],
      ['sneha@pict.edu', 'Member'],
      ['member@clubsync.app', 'Member']
    ];

    for (const [em, r] of rolesMap) {
      if (memberIds[em]) {
        await db.query(`
          INSERT INTO club_members (club_id, user_id, role)
          VALUES ($1, $2, $3)
          ON CONFLICT (club_id, user_id) DO UPDATE SET role = $3
        `, [roboconId, memberIds[em], r]);
      }
    }

    // Update members count
    await db.query(`
      UPDATE clubs 
      SET members_count = (SELECT COUNT(*) FROM club_members WHERE club_id = $1)
      WHERE id = $1
    `, [roboconId]);

    // 5. Add Realistic Treasury Logs for PICT Robocon
    await db.query('DELETE FROM club_transactions WHERE club_id = $1', [roboconId]);
    const transactions = [
      { amount: 35000, description: 'PICT Gymkhana Annual Budget Allocation FY26', type: 'income', user: officerId },
      { amount: 25000, description: 'Sponsorship Grant - Persistent Systems Pune', type: 'income', user: memberIds['rutuja@pict.edu'] },
      { amount: 8450, description: 'RPLidar A1M8 360-degree LiDAR & STM32 Dev Boards', type: 'expense', user: memberIds['omkar@pict.edu'] },
      { amount: 6000, description: 'Core Member Annual Lab Dues (Batch 2026)', type: 'dues', user: memberIds['rutuja@pict.edu'] },
      { amount: 3200, description: 'Workshop Refreshments & Snacks for 80 Attendees', type: 'expense', user: officerId },
      { amount: 1800, description: 'Chassis Aluminum Laser Cutting & Fabrication (Bhosari MIDC)', type: 'expense', user: memberIds['rohan@pict.edu'] }
    ];

    for (const t of transactions) {
      await db.query(`
        INSERT INTO club_transactions (club_id, amount, description, type, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '2 days')
      `, [roboconId, t.amount, t.description, t.type, t.user || officerId]);
    }

    // 6. Add Realistic Tasks for Kanban Board
    await db.query('DELETE FROM tasks WHERE club_id = $1', [roboconId]);
    const tasksData = [
      {
        title: 'Calibrate LiDAR Sensor & SLAM Navigation Algorithm',
        desc: 'Tune Gmapping parameters on ROS2 Humble for autonomous arena navigation before state trials.',
        status: 'in_progress',
        assignee: memberIds['omkar@pict.edu'],
        due: new Date(Date.now() + 3 * 86400000)
      },
      {
        title: 'Finalize Sponsorship Deck for Persistent Systems & Bajaj Auto',
        desc: 'Incorporate updated arena footage, past podium finishes, and corporate branding tiers.',
        status: 'done',
        assignee: memberIds['rutuja@pict.edu'],
        due: new Date(Date.now() - 2 * 86400000)
      },
      {
        title: 'Book Auditorium 1 & Workshop Bay for RoboRave 2026',
        desc: 'Submit official sanction letter to College Gymkhana Head and Estates Office.',
        status: 'done',
        assignee: officerId,
        due: new Date(Date.now() - 5 * 86400000)
      },
      {
        title: 'Assemble 4-Wheel Drive Mecanum Chassis for Secondary Bot',
        desc: 'CNC milling is complete at Bhosari. Fit planetary gear DC motors and test torque.',
        status: 'in_progress',
        assignee: memberIds['rohan@pict.edu'],
        due: new Date(Date.now() + 5 * 86400000)
      },
      {
        title: 'Launch Online Registration Portal for Credenz RoboClash',
        desc: 'Connect Stripe/Razorpay payment gateway and verify team slot registration limits.',
        status: 'todo',
        assignee: memberIds['siddharth@pict.edu'],
        due: new Date(Date.now() + 8 * 86400000)
      },
      {
        title: 'Conduct Mock Driver Trials in Campus Amphitheatre',
        desc: 'Test high-speed obstacle clearance and manual override wireless latency.',
        status: 'todo',
        assignee: memberIds['atharva@pict.edu'],
        due: new Date(Date.now() + 10 * 86400000)
      }
    ];

    for (const task of tasksData) {
      await db.query(`
        INSERT INTO tasks (club_id, title, description, status, assignee_id, created_by, due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [roboconId, task.title, task.desc, task.status, task.assignee, officerId, task.due]);
    }

    // 7. Add Realistic Chat Messages
    await db.query('DELETE FROM club_messages WHERE club_id = $1', [roboconId]);
    const chatFeed = [
      { user: officerId, text: 'Hey team! Principal sir and Gymkhana In-charge just approved our budget proposal for National Trials! 🚀', offset: 25 },
      { user: memberIds['atharva@pict.edu'], text: 'Let’s go! Workshop Bay 2 is reserved for us starting tomorrow evening.', offset: 20 },
      { user: memberIds['rutuja@pict.edu'], text: 'Finance update: Persistent Systems sponsorship cheque has been deposited. Total club balance is now over ₹52,000! 💰', offset: 15 },
      { user: memberIds['omkar@pict.edu'], text: 'LiDAR SLAM pull request has been merged on the bot-control repo. Testing auto-pathfinding at 4 PM today.', offset: 10 },
      { user: memberIds['ananya@pict.edu'], text: 'Banner designs and social media teasers for RoboRave are uploaded to the Documents tab. Take a look!', offset: 5 },
      { user: officerId, text: 'Awesome work everyone! Let’s meet at the lab at 4:30 PM for our weekly sync.', offset: 1 }
    ];

    for (const msg of chatFeed) {
      await db.query(`
        INSERT INTO club_messages (club_id, user_id, content, created_at)
        VALUES ($1, $2, $3, NOW() - ($4 || ' minutes')::INTERVAL)
      `, [roboconId, msg.user, msg.text, msg.offset]);
    }

    // 8. Add Meetings
    await db.query('DELETE FROM meetings WHERE club_id = $1', [roboconId]);
    await db.query(`
      INSERT INTO meetings (club_id, title, date, time, location, description, minutes, ai_summary, created_by)
      VALUES (
        $1, 
        'National Robocon Arena Strategy & Bot Review',
        CURRENT_DATE + INTERVAL '2 days',
        '04:30 PM',
        'Robotics Lab (Room 304), PICT Pune',
        'Weekly core committee meeting to review mechanical chassis assembly, sensor calibrations, and travel logistics for national trials.',
        '1. Mechanical team finalized aluminum chassis weight reduction down to 8.2 kg.\n2. Electronics lead calibrated RPLidar range up to 8 meters with 99% accuracy.\n3. Budget review confirmed ₹52,550 available in club treasury.\n4. Scheduled driver trials for Saturday at college quadrangle.',
        '• Chassis fabrication weight targets achieved (-1.4 kg reduction).\n• LiDAR SLAM navigation ready for high-speed obstacle course.\n• Approved ₹8,450 procurement for emergency backup motor drivers.\n• Driver selection trials fixed for this Saturday.',
        $2
      )
    `, [roboconId, officerId]);

    // 9. Add Constitution & Documents
    await db.query('DELETE FROM constitutions WHERE club_id = $1', [roboconId]);
    await db.query(`
      INSERT INTO constitutions (club_id, title, version, content, created_by)
      VALUES (
        $1,
        'PICT Robocon Official Charter & Code of Conduct',
        '2.4',
        'ARTICLE I: PURPOSE AND OBJECTIVES\nPICT Robocon is the dedicated collegiate competitive robotics organization representing Pune Institute of Computer Technology (PICT) in national and international engineering symposiums.\n\nARTICLE II: MEMBERSHIP & ELIGIBILITY\nAll bonafide students of PICT Pune enrolled in Computer, IT, E&TC, and AI branches in good academic standing are eligible for candidate selection through the annual recruitment drive.\n\nARTICLE III: EXECUTIVE COMMITTEE ROLES\n1. President: Chief Executive Officer of the team, liaison with College Gymkhana and Principal.\n2. Vice President: Operations, logistics, and inter-departmental hardware coordination.\n3. Treasurer: Financial custodian, maintaining strict transparency logs on ClubSync.\n\nARTICLE IV: LAB SAFETY PROTOCOLS\nAll members working with high-voltage LiPo batteries, CNC drill presses, and soldering stations must observe verified safety standards.',
        $2
      )
    `, [roboconId, officerId]);

    // 10. Add Documents
    await db.query('DELETE FROM documents WHERE club_id = $1', [roboconId]);
    const docs = [
      { name: 'Credenz_26_Sponsorship_Brochure.pdf', url: 'https://pict.edu/documents/credenz-deck.pdf', path: '/', size: '4.2 MB' },
      { name: 'PICT_Robocon_FY26_Gymkhana_Budget.xlsx', url: 'https://pict.edu/documents/budget-fy26.xlsx', path: '/Finance', size: '1.8 MB' },
      { name: 'LiDAR_SLAM_ROS2_Setup_Guide.pdf', url: 'https://pict.edu/documents/lidar-guide.pdf', path: '/Minutes', size: '3.1 MB' },
      { name: 'Lab_Safety_Code_of_Conduct_v2.pdf', url: 'https://pict.edu/documents/safety.pdf', path: '/Constitution', size: '890 KB' }
    ];

    for (const d of docs) {
      await db.query(`
        INSERT INTO documents (club_id, name, title, file_url, folder_path, file_size, uploaded_by)
        VALUES ($1, $2, $2, $3, $4, $5, $6)
      `, [roboconId, d.name, d.url, d.path, d.size, officerId]);
    }

    // 11. Add Active Election
    await db.query('DELETE FROM elections WHERE club_id = $1', [roboconId]);
    const electionRes = await db.query(`
      INSERT INTO elections (club_id, title, description, start_date, end_date, status)
      VALUES (
        $1,
        'Executive Committee Elections 2026-27: Technical Head',
        'Official election to elect the Technical Lead for the 2026-2027 ABU Robocon academic cycle.',
        NOW() - INTERVAL '1 day',
        NOW() + INTERVAL '5 days',
        'active'
      )
      RETURNING id
    `, [roboconId]);

    const electId = electionRes.rows[0].id;
    const cand1 = await db.query(`
      INSERT INTO election_candidates (election_id, user_id, manifesto)
      VALUES ($1, $2, 'Lead developer of ROS2 navigation stack. Vision: Integrate Isaac Sim digital twins and expand team to 50 active coders.')
      RETURNING id
    `, [electId, memberIds['omkar@pict.edu']]);

    const cand2 = await db.query(`
      INSERT INTO election_candidates (election_id, user_id, manifesto)
      VALUES ($1, $2, 'Mechanical chassis lead. Vision: Light-weight carbon-fiber chassis and automated 3D printing pipeline.')
      RETURNING id
    `, [electId, memberIds['rohan@pict.edu']]);

    // Cast votes
    await db.query(`
      INSERT INTO election_votes (election_id, candidate_id, voter_id)
      VALUES ($1, $2, $3)
    `, [electId, cand1.rows[0].id, officerId]);
    await db.query(`
      INSERT INTO election_votes (election_id, candidate_id, voter_id)
      VALUES ($1, $2, $3)
    `, [electId, cand2.rows[0].id, memberIds['atharva@pict.edu']]);
  }

  // 12. Also seed rich Events into events table for the Events Calendar and Event list
  await db.query('DELETE FROM events');
  const eventsData = [
    {
      club_id: roboconId,
      title: "RoboRave Pune: 2-Day Autonomous Robotics Workshop",
      description: "Hands-on workshop on microcontroller programming, sensor interfacing, and building autonomous maze-solving bots. Open to all engineering students across Pune.",
      date: new Date(Date.now() + 4 * 86400000),
      time: "09:30 AM",
      location: "Workshop Bay & Audi-2, PICT Pune",
      category: "Workshop",
      attendees: 120
    },
    {
      club_id: pisbId || roboconId,
      title: "Credenz '26 - Annual National Technical Symposium",
      description: "Pune’s premier student tech fest featuring Clash (C/C++ contest), WebWeaver, B-Plan, Paper Presentation, and RoboClash arena competitions.",
      date: new Date(Date.now() + 12 * 86400000),
      time: "10:00 AM",
      location: "Main Campus & Computer Dept, PICT Pune",
      category: "Symposium",
      attendees: 350
    },
    {
      club_id: pascId || roboconId,
      title: "Pulzion '26 - 24-Hour National Hackathon & CodeSprint",
      description: "Flagship overnight hackathon tackling real-world problem statements in AI, FinTech, Web3, and HealthTech judged by industry leaders.",
      date: new Date(Date.now() + 18 * 86400000),
      time: "08:00 AM",
      location: "Central Computing Facility (CCF), PICT Pune",
      category: "Hackathon",
      attendees: 200
    },
    {
      club_id: clubIds['PICT EDC'] || roboconId,
      title: "PICT Startup Pitch & Angel Investor Summit '26",
      description: "Student entrepreneurs pitch disruptive technology solutions before top venture capital funds and alumni founders from Pune and Bengaluru.",
      date: new Date(Date.now() + 25 * 86400000),
      time: "02:00 PM",
      location: "Auditorium 1, PICT Campus",
      category: "Summit",
      attendees: 150
    }
  ];

  for (const ev of eventsData) {
    await db.query(`
      INSERT INTO events (club_id, title, description, date, time, location, category, max_attendees, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [ev.club_id, ev.title, ev.description, ev.date, ev.time, ev.location, ev.category, ev.attendees, officerId]);
  }

  console.log('--- Successfully Finished Populating Indian & PICT Mock Data! ---');
}

seedScreenshotsData()
  .catch(console.error)
  .finally(() => db.pool.end());
