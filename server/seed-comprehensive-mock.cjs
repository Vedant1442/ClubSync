const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedMaster() {
  console.log('🚀 ========================================================');
  console.log('🚀 SEEDING MASTER REALISTIC PICT CAMPUS MOCK DATABASE');
  console.log('🚀 ========================================================');

  const pwHash = await bcrypt.hash('Password123!', 10);
  const stdPwHash = await bcrypt.hash('password123', 10);

  // ------------------------------------------------------------------
  // 1. ENSURE USERS (20 PICT Students & Faculty)
  // ------------------------------------------------------------------
  console.log('[1/12] Ensuring 20 PICT students and faculty exist...');

  const baseUsers = [
    { email: 'officer@clubsync.app', full_name: 'Aditya Deshmukh', college_id: 'C2K221142', branch: 'BE - Computer Engineering', bio: 'President @ PICT Robocon | Embedded Systems & Autonomous Systems Enthusiast', pw: pwHash },
    { email: 'member@clubsync.app', full_name: 'Kavya Kulkarni', college_id: 'C2K231189', branch: 'TE - Information Technology', bio: 'Student Member | Full Stack Web & Open Source Contributor', pw: pwHash },
    { email: 'atharva@pict.edu', full_name: 'Atharva Joshi', college_id: 'C2K231012', branch: 'TE - Computer Engineering', bio: 'Vice President @ PASC | Algorithmic Problem Solving & Competitive Coding', pw: stdPwHash },
    { email: 'rutuja@pict.edu', full_name: 'Rutuja Deshmukh', college_id: 'C2K221088', branch: 'BE - Information Technology', bio: 'Chairperson @ PISB | Cloud Native & Distributed Systems', pw: stdPwHash },
    { email: 'omkar@pict.edu', full_name: 'Omkar Patil', college_id: 'C2K241199', branch: 'SE - Computer Engineering', bio: 'Technical Lead @ PICT Robocon | ROS2 & Robotics Automation', pw: stdPwHash },
    { email: 'siddharth@pict.edu', full_name: 'Siddharth Menon', college_id: 'C2K251020', branch: 'FE - First Year Engineering', bio: 'Web Master @ PASC | MERN Stack, Docker, & Kubernetes', pw: stdPwHash },
    { email: 'ishita@pict.edu', full_name: 'Ishita Kulkarni', college_id: 'C2K231450', branch: 'TE - Electronics & Telecommunication', bio: 'General Secretary @ PICT Art Circle | Classical Vocalist & Playwright', pw: stdPwHash },
    { email: 'tanmay@pict.edu', full_name: 'Tanmay Kulkarni', college_id: 'C2K221142', branch: 'BE - Computer Engineering', bio: 'Lead Developer @ PICT FOSS Club | Linux Kernel Internals & C/Rust Developer', pw: stdPwHash },
    { email: 'ananya@pict.edu', full_name: 'Ananya Sharma', college_id: 'C2K231189', branch: 'TE - Information Technology', bio: 'Convener @ PICT EDC | Startup Strategist & Product Evangelist', pw: stdPwHash },
    { email: 'rohan@pict.edu', full_name: 'Rohan Sawant', college_id: 'C2K221142', branch: 'BE - Computer Engineering', bio: 'Captain @ PICT Sports Club | Fast Bowler & Collegiate Athletics Medalist', pw: stdPwHash },
    { email: 'sneha@pict.edu', full_name: 'Sneha Nair', college_id: 'C2K231189', branch: 'TE - Information Technology', bio: 'Editor-in-Chief @ Pictoreal | Creative Writer, Journalist & Layout Artist', pw: stdPwHash },
    { email: 'tanvi.shinde@pict.edu', full_name: 'Tanvi Shinde', college_id: 'C2K231999', branch: 'TE - Information Technology', bio: 'Sponsorship Lead @ PICT EDC | Corporate Relations & Deal Closer', pw: stdPwHash },
    { email: 'opraj8437@gmail.com', full_name: 'Raj Vardhan', college_id: 'C2K231110', branch: 'TE - Computer Engineering', bio: 'Logistics Head @ PICT Robocon | Event Infrastructure & Procurement', pw: stdPwHash },
    { email: 'anant@pict.edu', full_name: 'Prof. Anant Bagade', college_id: 'FAC-COMP-01', branch: 'Faculty - Computer Engineering', bio: 'Faculty Mentor & Staff Advisor @ PICT Robocon', pw: stdPwHash },
    { email: 'kapildev@gmail.com', full_name: 'Kapil Dev', college_id: 'ALUM-2022', branch: 'Alumni - E&TC Engineering', bio: 'Robocon Alum (Batch of 2022) | Senior Robotics Engineer at Boston Dynamics India', pw: stdPwHash },
    { email: 'devendra.j@pict.edu', full_name: 'Devendra Joshi', college_id: 'C2K231205', branch: 'TE - Electronics & Telecommunication', bio: 'Treasurer @ PISB | Financial Audit & IEEE Student Chapter Accounts', pw: stdPwHash },
    { email: 'meera.iyer@pict.edu', full_name: 'Meera Iyer', college_id: 'C2K241310', branch: 'SE - Computer Engineering', bio: 'Public Relations Head @ PASC | Social Media Lead & Pulzion Outreach', pw: stdPwHash },
    { email: 'pranav.k@pict.edu', full_name: 'Pranav Kapse', college_id: 'C2K231502', branch: 'TE - Information Technology', bio: 'System Administrator @ PICT FOSS Club | Homelab & Self-Hosting Advocate', pw: stdPwHash },
    { email: 'sayali.g@pict.edu', full_name: 'Sayali Gokhale', college_id: 'C2K241880', branch: 'SE - Electronics & Telecommunication', bio: 'Creative Director @ PICT Art Circle | Set Designer & Theatre Choreographer', pw: stdPwHash },
    { email: 'harsh.p@pict.edu', full_name: 'Harshwardhan Patil', college_id: 'C2K221650', branch: 'BE - Computer Engineering', bio: 'Vice Captain @ PICT Sports Club | Football Center Midfielder & Coach', pw: stdPwHash },
  ];

  for (const u of baseUsers) {
    await db.query(`
      INSERT INTO users (email, full_name, password, password_hash, college_id, branch, bio)
      VALUES ($1, $2, $3, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE
      SET full_name = $2, password = $3, password_hash = $3, college_id = $4, branch = $5, bio = $6
    `, [u.email, u.full_name, u.pw, u.college_id, u.branch, u.bio]);
  }

  const { rows: users } = await db.query('SELECT id, email, full_name FROM users');
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
  const tanvi = userMap['tanvi.shinde@pict.edu'];
  const raj = userMap['opraj8437@gmail.com'];
  const devendra = userMap['devendra.j@pict.edu'];
  const meera = userMap['meera.iyer@pict.edu'];
  const pranav = userMap['pranav.k@pict.edu'];
  const sayali = userMap['sayali.g@pict.edu'];
  const harsh = userMap['harsh.p@pict.edu'];

  // ------------------------------------------------------------------
  // 2. CONSOLIDATE & UPSERT 8 CANONICAL CLUBS
  // ------------------------------------------------------------------
  console.log('[2/12] Consolidating and updating 8 canonical PICT clubs...');

  const canonicalClubs = [
    {
      id: '9ebe2780-64a1-41c0-a0a1-792aa19cc0ce',
      name: 'PICT Robocon',
      category: 'Technical',
      color: '#6c5ce7',
      description: 'Official collegiate robotics team of PICT Pune competing in ABU Robocon, DD Robocon, and international autonomous robotics challenges. Designing mechanical chassis, embedded firmware, computer vision SLAM, and real-time control algorithms.',
      upi_vpa: 'vedant1442@fam',
      upi_payee_name: 'PICT Robocon Pune',
      created_by: officer.id
    },
    {
      id: '8193deff-f1e2-4277-abd4-a4c294ed7589',
      name: 'PICT ACM Student Chapter (PASC)',
      category: 'Technical',
      color: '#00b894',
      description: 'Pune’s premier computing society hosting Pulzion, national competitive programming contests, algorithmic workshops, hackathons, and global open-source initiatives for high-performance software engineering.',
      upi_vpa: 'vedant1442@fam',
      upi_payee_name: 'PASC PICT Pune',
      created_by: atharva.id
    },
    {
      id: '401870ba-62b2-4d98-acb8-009ea9a02f97',
      name: 'PICT IEEE Student Branch (PISB)',
      category: 'Technical',
      color: '#0984e3',
      description: 'One of the most active IEEE student branches in Maharashtra, organizing the national flagship technical symposium Credenz, technical papers, IoT hardware tracks, and professional development seminars.',
      upi_vpa: 'vedant1442@fam',
      upi_payee_name: 'PISB PICT Pune',
      created_by: rutuja.id
    },
    {
      id: '92d7187a-cf29-4fbc-8103-c1535421d852',
      name: 'PICT FOSS Club',
      category: 'Technical',
      color: '#e67e22',
      description: 'Dedicated to the ethos of Free and Open-Source Software. Hosting Linux kernel bootcamps, homelab self-hosting workshops, Hacktoberfest sprints, and privacy-focused software tooling.',
      upi_vpa: 'vedant1442@fam',
      upi_payee_name: 'PICT FOSS Club',
      created_by: tanmay.id
    },
    {
      id: 'fa920003-5693-4ce7-a151-62b9f49fa9b7',
      name: 'PICT EDC (Entrepreneurship Cell)',
      category: 'Entrepreneurship',
      color: '#fdcb6e',
      description: 'Fostering grassroots student venture incubation, investor pitch sessions, startup incubator connects, and enterprise leadership summits to turn bold engineering ideas into scalable market-ready companies.',
      upi_vpa: 'vedant1442@fam',
      upi_payee_name: 'PICT EDC Pune',
      created_by: ananya.id
    },
    {
      id: 'cb8f7c74-9dfe-4a94-9f15-cd612c92148e',
      name: 'PICT Art Circle',
      category: 'Cultural',
      color: '#e84393',
      description: 'The creative heartbeat of PICT Pune. Producing legendary theatre productions for Firodiya Karandak and Purushottam Karandak, classical Indian music, fusion orchestras, fine arts, and annual cultural fest Udaan.',
      upi_vpa: 'vedant1442@fam',
      upi_payee_name: 'PICT Art Circle',
      created_by: ishita.id
    },
    {
      id: 'dd404f3b-8ee5-4241-934b-dc5475e2b727',
      name: 'Pictoreal',
      category: 'Literary & Media',
      color: '#8e44ad',
      description: 'The official campus literary magazine, journalism, and creative media body of PICT. Chronicling college milestones, publishing annual editorial anthologies, and conducting creative writing masterclasses.',
      upi_vpa: 'vedant1442@fam',
      upi_payee_name: 'Pictoreal Editorial Board',
      created_by: sneha.id
    },
    {
      id: '66a43dee-e796-4287-afbf-00e351a2dd83',
      name: 'PICT Sports Club',
      category: 'Sports',
      color: '#e17055',
      description: 'Powering collegiate athletics, inter-department box cricket leagues, football championships, basketball tournaments, annual sports week, and student physical fitness initiatives at the PICT Gymkhana.',
      upi_vpa: 'vedant1442@fam',
      upi_payee_name: 'PICT Gymkhana Sports',
      created_by: rohan.id
    }
  ];

  // Upsert canonical clubs
  for (const c of canonicalClubs) {
    await db.query(`
      INSERT INTO clubs (id, name, category, color, description, upi_vpa, upi_payee_name, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE
      SET name = $2, category = $3, color = $4, description = $5, upi_vpa = $6, upi_payee_name = $7, created_by = $8
    `, [c.id, c.name, c.category, c.color, c.description, c.upi_vpa, c.upi_payee_name, c.created_by]);
  }

  const roboconId = '9ebe2780-64a1-41c0-a0a1-792aa19cc0ce';
  const pascId = '8193deff-f1e2-4277-abd4-a4c294ed7589';
  const pisbId = '401870ba-62b2-4d98-acb8-009ea9a02f97';
  const fossId = '92d7187a-cf29-4fbc-8103-c1535421d852';
  const edcId = 'fa920003-5693-4ce7-a151-62b9f49fa9b7';
  const artCircleId = 'cb8f7c74-9dfe-4a94-9f15-cd612c92148e';
  const pictorealId = 'dd404f3b-8ee5-4241-934b-dc5475e2b727';
  const sportsId = '66a43dee-e796-4287-afbf-00e351a2dd83';

  // ------------------------------------------------------------------
  // 3. SEED CLUB MEMBERSHIPS ACROSS ALL 8 CLUBS
  // ------------------------------------------------------------------
  console.log('[3/12] Seeding active memberships with realistic roles...');
  await db.query('DELETE FROM club_members');

  const memberships = [
    // PICT Robocon
    { club: roboconId, user: officer, role: 'President' },
    { club: roboconId, user: omkar, role: 'Technical Lead' },
    { club: roboconId, user: raj, role: 'Logistics Head' },
    { club: roboconId, user: rohan, role: 'Mechanical Lead' },
    { club: roboconId, user: member, role: 'Student Member' },
    { club: roboconId, user: tanmay, role: 'Firmware Engineer' },
    { club: roboconId, user: sneha, role: 'Vision Subsystem Lead' },
    { club: roboconId, user: siddharth, role: 'Telemetry Engineer' },
    { club: roboconId, user: ishita, role: 'Sponsorship Coordinator' },
    { club: roboconId, user: ananya, role: 'Executive Member' },
    { club: roboconId, user: atharva, role: 'Senior Technical Advisor' },

    // PASC
    { club: pascId, user: atharva, role: 'President' },
    { club: pascId, user: siddharth, role: 'Vice President' },
    { club: pascId, user: meera, role: 'Public Relations Head' },
    { club: pascId, user: member, role: 'Competitive Programming Lead' },
    { club: pascId, user: tanmay, role: 'Technical Associate' },
    { club: pascId, user: sneha, role: 'Web Team Lead' },
    { club: pascId, user: rutuja, role: 'Student Member' },

    // PISB
    { club: pisbId, user: rutuja, role: 'Chairperson' },
    { club: pisbId, user: devendra, role: 'Treasurer' },
    { club: pisbId, user: ananya, role: 'Vice Chairperson' },
    { club: pisbId, user: member, role: 'Student Member' },
    { club: pisbId, user: siddharth, role: 'Technical Lead' },
    { club: pisbId, user: ishita, role: 'Documentation Head' },

    // FOSS Club
    { club: fossId, user: tanmay, role: 'President' },
    { club: fossId, user: pranav, role: 'Lead System Administrator' },
    { club: fossId, user: member, role: 'Open Source Contributor' },
    { club: fossId, user: siddharth, role: 'DevOps Architect' },
    { club: fossId, user: omkar, role: 'Embedded Linux Head' },

    // EDC
    { club: edcId, user: ananya, role: 'Convener' },
    { club: edcId, user: tanvi, role: 'Sponsorship Lead' },
    { club: edcId, user: member, role: 'Startup Incubator Associate' },
    { club: edcId, user: officer, role: 'Technical Consultant' },
    { club: edcId, user: atharva, role: 'Product Lead' },

    // Art Circle
    { club: artCircleId, user: ishita, role: 'General Secretary' },
    { club: artCircleId, user: sayali, role: 'Creative Director' },
    { club: artCircleId, user: member, role: 'Vocalist & Choir Lead' },
    { club: artCircleId, user: sneha, role: 'Scriptwriter' },
    { club: artCircleId, user: rohan, role: 'Stage Operations Lead' },

    // Pictoreal
    { club: pictorealId, user: sneha, role: 'Editor-in-Chief' },
    { club: pictorealId, user: member, role: 'Associate Editor' },
    { club: pictorealId, user: ishita, role: 'Graphic & Cover Designer' },
    { club: pictorealId, user: ananya, role: 'Features Writer' },

    // Sports Club
    { club: sportsId, user: rohan, role: 'Sports Secretary & Captain' },
    { club: sportsId, user: harsh, role: 'Vice Captain' },
    { club: sportsId, user: member, role: 'Badminton Team Lead' },
    { club: sportsId, user: raj, role: 'Tournament Coordinator' },
    { club: sportsId, user: omkar, role: 'Table Tennis Lead' },
  ];

  for (const m of memberships) {
    if (!m.user) continue;
    await db.query(`
      INSERT INTO club_members (club_id, user_id, role, joined_at)
      VALUES ($1, $2, $3, NOW() - INTERVAL '30 days')
      ON CONFLICT DO NOTHING
    `, [m.club, m.user.id, m.role]);
  }

  // Update members_count on all clubs
  for (const c of canonicalClubs) {
    await db.query(`
      UPDATE clubs SET members_count = (SELECT COUNT(*) FROM club_members WHERE club_id = $1)
      WHERE id = $1
    `, [c.id]);
  }

  // ------------------------------------------------------------------
  // 4. SEED EVENTS ACROSS ALL CLUBS
  // ------------------------------------------------------------------
  console.log('[4/12] Seeding 18 comprehensive events across all 8 clubs...');
  await db.query('DELETE FROM event_qa_upvotes');
  await db.query('DELETE FROM event_qa_questions');
  await db.query('DELETE FROM event_broadcasts');
  await db.query('DELETE FROM event_team_members');
  await db.query('DELETE FROM event_teams');
  await db.query('DELETE FROM event_members');
  await db.query('DELETE FROM events');

  const eventsList = [
    // PICT Robocon
    {
      club_id: roboconId,
      title: 'RoboRave Pune: 2-Day Autonomous Robotics Workshop',
      description: 'Hands-on intensive bootcamp on ROS2 Humble, SLAM navigation algorithms, STM32 HAL motor controller boards, and 3D differential robot chassis assembly. Kits provided on-site.',
      date: new Date(Date.now() + 3 * 24 * 3600000), // In 3 days
      location: 'Workshop Bay & Audi-2, PICT Pune',
      category: 'Technical',
      time: '09:00 AM - 05:30 PM',
      max_attendees: 150,
      price: 150,
      activity_points: 10,
      is_team_event: true,
      min_team_size: 2,
      max_team_size: 4,
      created_by: officer.id
    },
    {
      club_id: roboconId,
      title: 'Bot Hockey Championship 2026',
      description: 'Annual inter-collegiate combat and puck-handling robotics arena showdown! Teams battle head-to-head in wireless radio frequency and Bluetooth controlled robotics soccer and hockey matches.',
      date: new Date(Date.now() + 25 * 24 * 3600000), // In 25 days
      location: 'PICT Basketball Court Arena',
      category: 'Technical',
      time: '10:00 AM - 06:00 PM',
      max_attendees: 80,
      price: 200,
      activity_points: 5,
      is_team_event: true,
      min_team_size: 3,
      max_team_size: 5,
      created_by: officer.id
    },
    {
      club_id: roboconId,
      title: 'DD-Robocon National Arena Trials & Telemetry Showcase',
      description: 'Comprehensive trials of the 2026 Robocon autonomous harvesting robot, showcasing pneumatic actuator accuracy and LiDAR localization in the full-scale simulation arena.',
      date: new Date(Date.now() - 40 * 24 * 3600000), // 40 days ago
      location: 'Robotics Bay 3, PICT Pune',
      category: 'Technical',
      time: '02:00 PM - 06:00 PM',
      max_attendees: 100,
      price: 0,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: officer.id
    },

    // PASC
    {
      club_id: pascId,
      title: "Pulzion '26 - 24-Hour National Hackathon & CodeSprint",
      description: 'The flagship annual technical fest by PASC PICT! Featuring Just Coding, Bug Off, Code Buddy, Web & App Development Hackathon tracks with industry mentors and cash prizes worth ₹1,50,000.',
      date: new Date(Date.now() + 15 * 24 * 3600000), // In 15 days
      location: 'Central Computing Facility (CCF), PICT Pune',
      category: 'Technical',
      time: '09:00 AM (24 Hours)',
      max_attendees: 300,
      price: 250,
      activity_points: 15,
      is_team_event: true,
      min_team_size: 2,
      max_team_size: 4,
      created_by: atharva.id
    },
    {
      club_id: pascId,
      title: 'CodeSprint: Algorithmic Problem Solving Bootcamp',
      description: 'Master dynamic programming, segment trees, and graph traversal algorithms with Codeforces Grandmaster alumni. Solve live problem sets with instant leaderboard scoring.',
      date: new Date(Date.now() + 8 * 24 * 3600000),
      location: 'Lab 101, Computer Dept',
      category: 'Technical',
      time: '04:30 PM - 07:00 PM',
      max_attendees: 120,
      price: 0,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: atharva.id
    },
    {
      club_id: pascId,
      title: 'Open Source Saturday: Git Internals & GitHub PR Workshop',
      description: 'Beginner-friendly hands-on session on Git plumbing commands, rebase workflows, signing commits with GPG, and raising production PRs for Google Summer of Code (GSoC).',
      date: new Date(Date.now() - 20 * 24 * 3600000),
      location: 'Audi-1 Foyer',
      category: 'Technical',
      time: '10:00 AM - 01:00 PM',
      max_attendees: 180,
      price: 0,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: siddharth.id
    },

    // PISB
    {
      club_id: pisbId,
      title: "Credenz '26 - Annual National Technical Symposium",
      description: 'PISB’s national symposium featuring Paper Presentation, RoboLiga, Network Treks, Web-Weaver, and Clash of Coders. Attracting over 1,500 participants across India.',
      date: new Date(Date.now() + 10 * 24 * 3600000),
      location: 'Main Campus & E&TC Dept, PICT Pune',
      category: 'Technical',
      time: '09:30 AM - 06:00 PM',
      max_attendees: 500,
      price: 100,
      activity_points: 10,
      is_team_event: true,
      min_team_size: 1,
      max_team_size: 3,
      created_by: rutuja.id
    },
    {
      club_id: pisbId,
      title: 'Pixelate: UI/UX & Design Systems Hackathon',
      description: 'Design interactive, accessible, and high-fidelity mobile and web product prototypes in Figma adhering to modern design tokens, auto-layout, and micro-interactions.',
      date: new Date(Date.now() + 28 * 24 * 3600000),
      location: 'Seminar Hall 2, IT Dept',
      category: 'Technical',
      time: '10:00 AM - 04:30 PM',
      max_attendees: 90,
      price: 100,
      activity_points: 5,
      is_team_event: true,
      min_team_size: 2,
      max_team_size: 2,
      created_by: devendra.id
    },

    // FOSS Club
    {
      club_id: fossId,
      title: 'Linux Kernel Compilation & eBPF Observability Lab',
      description: 'Step-by-step kernel customization on Ubuntu 24.04, writing custom kernel modules, debugging system calls with strace, and writing real-time eBPF packet monitors.',
      date: new Date(Date.now() + 18 * 24 * 3600000),
      location: 'Room 304, Computer Dept',
      category: 'Technical',
      time: '02:00 PM - 06:00 PM',
      max_attendees: 60,
      price: 0,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: tanmay.id
    },
    {
      club_id: fossId,
      title: 'Hacktoberfest 2026: PICT Open Source Sprint',
      description: 'Celebration of open-source software! Maintainers from Apache, Mozilla, and Linux Foundation review student pull requests live. Free swags and stickers.',
      date: new Date(Date.now() - 15 * 24 * 3600000),
      location: 'CCF Lab 4',
      category: 'Technical',
      time: '11:00 AM - 05:00 PM',
      max_attendees: 140,
      price: 0,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: tanmay.id
    },

    // EDC
    {
      club_id: edcId,
      title: "PICT Startup Pitch & Angel Investor Summit '26",
      description: 'Top 15 collegiate founder teams pitch their MVP solutions to seasoned venture capitalists, angel investors, and Pune tech executives for pre-seed grants and incubation.',
      date: new Date(Date.now() + 22 * 24 * 3600000),
      location: 'Auditorium 1, PICT Campus',
      category: 'Entrepreneurship',
      time: '10:00 AM - 05:00 PM',
      max_attendees: 250,
      price: 0,
      activity_points: 10,
      is_team_event: true,
      min_team_size: 2,
      max_team_size: 4,
      created_by: ananya.id
    },
    {
      club_id: edcId,
      title: 'Zero to One: SaaS Product Ideathon & Business Model Canvas',
      description: 'Interactive workshop on defining unit economics, customer acquisition CAC, lifetime value LTV, and building pitch decks that get venture funding.',
      date: new Date(Date.now() - 30 * 24 * 3600000),
      location: 'Seminar Hall 1',
      category: 'Entrepreneurship',
      time: '03:00 PM - 06:30 PM',
      max_attendees: 110,
      price: 50,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: ananya.id
    },

    // Art Circle
    {
      club_id: artCircleId,
      title: 'Firodiya Karandak 2026 Inter-College Theatre Auditions',
      description: 'Annual auditions for actors, musicians, scriptwriters, dancers, and set engineers representing PICT at the prestigious Firodiya Karandak theatre festival.',
      date: new Date(Date.now() + 12 * 24 * 3600000),
      location: 'Audi-1 Stage & Amphitheatre',
      category: 'Cultural',
      time: '04:00 PM - 09:00 PM',
      max_attendees: 200,
      price: 0,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: ishita.id
    },
    {
      club_id: artCircleId,
      title: 'Swaranjali: Classical & Fusion Night',
      description: 'An evening of Hindustani classical ragas, jugalbandi, sitar, and contemporary fusion orchestra performed by PICT’s student musicians.',
      date: new Date(Date.now() - 25 * 24 * 3600000),
      location: 'Auditorium 1, PICT',
      category: 'Cultural',
      time: '06:00 PM - 09:30 PM',
      max_attendees: 350,
      price: 0,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: sayali.id
    },

    // Pictoreal
    {
      club_id: pictorealId,
      title: 'Campus Chronicles: Annual Magazine Editorial Launch & Creative Masterclass',
      description: 'Unveiling the 2026 print edition of Pictoreal! Includes interactive workshops on investigative journalism, podcast recording, and typography design.',
      date: new Date(Date.now() + 35 * 24 * 3600000),
      location: 'Audi-2 Foyer & Conference Room',
      category: 'Literary & Media',
      time: '03:00 PM - 06:00 PM',
      max_attendees: 120,
      price: 0,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 1,
      created_by: sneha.id
    },

    // Sports Club
    {
      club_id: sportsId,
      title: 'PICT Inter-Department Box Cricket League (IBCL 2026)',
      description: '16 department squads battle in a 6-over floodlit box cricket tournament. Comp, IT, E&TC, AI&DS, and Faculty teams compete for the rolling trophy.',
      date: new Date(Date.now() + 19 * 24 * 3600000),
      location: 'PICT College Ground & Nets',
      category: 'Sports',
      time: '04:30 PM - 09:00 PM',
      max_attendees: 180,
      price: 500,
      activity_points: 5,
      is_team_event: true,
      min_team_size: 6,
      max_team_size: 8,
      created_by: rohan.id
    },
    {
      club_id: sportsId,
      title: 'Annual Badminton & Table Tennis Gymkhana Open',
      description: 'Singles and doubles knockout tournament across men’s and women’s categories. Certified SPPU ref officials and medal ceremonies.',
      date: new Date(Date.now() - 10 * 24 * 3600000),
      location: 'PICT Indoor Sports Complex',
      category: 'Sports',
      time: '09:00 AM - 05:00 PM',
      max_attendees: 90,
      price: 100,
      activity_points: 5,
      is_team_event: false,
      min_team_size: 1,
      max_team_size: 2,
      created_by: harsh.id
    }
  ];

  const createdEvents = [];
  for (const e of eventsList) {
    const { rows } = await db.query(`
      INSERT INTO events (club_id, title, description, date, location, category, time, max_attendees, price, activity_points, is_team_event, min_team_size, max_team_size, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [e.club_id, e.title, e.description, e.date, e.location, e.category, e.time, e.max_attendees, e.price, e.activity_points, e.is_team_event, e.min_team_size, e.max_team_size, e.created_by]);
    createdEvents.push(rows[0]);
  }

  const roboRaveEvent = createdEvents.find(e => e.title.includes('RoboRave'));
  const pulzionEvent = createdEvents.find(e => e.title.includes('Pulzion'));
  const credenzEvent = createdEvents.find(e => e.title.includes('Credenz'));
  const summitEvent = createdEvents.find(e => e.title.includes('Startup'));
  const cricketEvent = createdEvents.find(e => e.title.includes('Cricket'));

  // ------------------------------------------------------------------
  // 5. SEED EVENT ATTENDEES & VERIFIABLE CERTIFICATES
  // ------------------------------------------------------------------
  console.log('[5/12] Seeding attendees with QR tickets & verifiable credentials...');

  const attendeesToSeed = [
    // RoboRave
    { event: roboRaveEvent, user: officer, checkedIn: true, ticket: 'TK-RB001', cert: 'PICT-CERT-2026-X89' }, // The famous verified credential
    { event: roboRaveEvent, user: member, checkedIn: true, ticket: 'TK-RB002', cert: 'PICT-CERT-2026-K92' },
    { event: roboRaveEvent, user: omkar, checkedIn: true, ticket: 'TK-RB003', cert: 'PICT-CERT-2026-O44' },
    { event: roboRaveEvent, user: rutuja, checkedIn: true, ticket: 'TK-RB004', cert: 'PICT-CERT-2026-R19' },
    { event: roboRaveEvent, user: atharva, checkedIn: false, ticket: 'TK-RB005', cert: null }, // Ready for live demo check-in!
    { event: roboRaveEvent, user: siddharth, checkedIn: false, ticket: 'TK-RB006', cert: null },
    { event: roboRaveEvent, user: ishita, checkedIn: false, ticket: 'TK-RB007', cert: null },
    { event: roboRaveEvent, user: rohan, checkedIn: false, ticket: 'TK-RB008', cert: null },
    { event: roboRaveEvent, user: sneha, checkedIn: false, ticket: 'TK-RB009', cert: null },
    { event: roboRaveEvent, user: tanmay, checkedIn: false, ticket: 'TK-RB010', cert: null },

    // Pulzion
    { event: pulzionEvent, user: member, checkedIn: true, ticket: 'TK-PZ101', cert: 'PICT-CERT-2026-P01' },
    { event: pulzionEvent, user: siddharth, checkedIn: true, ticket: 'TK-PZ102', cert: 'PICT-CERT-2026-P02' },
    { event: pulzionEvent, user: tanmay, checkedIn: false, ticket: 'TK-PZ103', cert: null },
    { event: pulzionEvent, user: sneha, checkedIn: false, ticket: 'TK-PZ104', cert: null },
    { event: pulzionEvent, user: ananya, checkedIn: false, ticket: 'TK-PZ105', cert: null },

    // Credenz
    { event: credenzEvent, user: officer, checkedIn: true, ticket: 'TK-CR201', cert: 'PICT-CERT-2026-C01' },
    { event: credenzEvent, user: member, checkedIn: false, ticket: 'TK-CR202', cert: null },
    { event: credenzEvent, user: devendra, checkedIn: true, ticket: 'TK-CR203', cert: 'PICT-CERT-2026-C03' },
    { event: credenzEvent, user: ishita, checkedIn: false, ticket: 'TK-CR204', cert: null },

    // Sports Cricket
    { event: cricketEvent, user: member, checkedIn: true, ticket: 'TK-SP301', cert: 'PICT-CERT-2026-S10' },
    { event: cricketEvent, user: rohan, checkedIn: true, ticket: 'TK-SP302', cert: 'PICT-CERT-2026-S11' },
    { event: cricketEvent, user: harsh, checkedIn: true, ticket: 'TK-SP303', cert: 'PICT-CERT-2026-S12' },
  ];

  for (const a of attendeesToSeed) {
    if (!a.event || !a.user) continue;
    await db.query(`
      INSERT INTO event_members (event_id, user_id, status, ticket_code, checked_in, checked_in_at, certificate_id)
      VALUES ($1, $2, 'registered', $3, $4, $5, $6)
      ON CONFLICT (event_id, user_id) DO UPDATE
      SET ticket_code = $3, checked_in = $4, checked_in_at = $5, certificate_id = $6
    `, [a.event.id, a.user.id, a.ticket, a.checkedIn, a.checkedIn ? new Date(Date.now() - 3600000) : null, a.cert]);
  }

  // ------------------------------------------------------------------
  // 6. SEED EVENT BROADCASTS, Q&A, AND SQUADS
  // ------------------------------------------------------------------
  console.log('[6/12] Seeding live broadcasts, Q&A boards, and squads...');

  if (roboRaveEvent) {
    await db.query(`
      INSERT INTO event_broadcasts (event_id, club_id, author_id, author_name, title, message, priority, created_at)
      VALUES 
      ($1, $2, $3, 'Aditya Deshmukh', '🚨 Spot Desk Check-In is LIVE at Audi-2 Foyer', 'Please present your ClubSync Digital Gate Pass or QR code at Desk 3 for badge verification and kit collection.', 'high', NOW() - INTERVAL '45 minutes'),
      ($1, $2, $3, 'Aditya Deshmukh', '🔧 Hardware Toolkits Ready for Pickup', 'LiDAR sensors (RPLidar A1M8) and STM32 microcontroller developer boards can be checked out from Workshop Bay 2 with your student ID.', 'normal', NOW() - INTERVAL '2 hours'),
      ($1, $2, $3, 'Aditya Deshmukh', '📄 Rules Packet & Arena Track Layout Released', 'Arena obstacle course dimensions and scoring rubrics have been uploaded to the Documents tab.', 'normal', NOW() - INTERVAL '1 day')
    `, [roboRaveEvent.id, roboconId, officer.id]);

    const q1 = await db.query(`
      INSERT INTO event_qa_questions (event_id, user_id, author_name, author_branch, content, upvotes_count, is_pinned, is_answered, answer_text, created_at)
      VALUES (
        $1, $2, 'Omkar Patil', 'TE E&TC',
        'Will ROS2 Humble environments be pre-installed on the lab systems, or should we dual boot our personal laptops?',
        18, true, true,
        'All desktop systems in Room 304 are pre-configured with Ubuntu 22.04 LTS and ROS2 Humble. Dual-booting personal laptops is also welcome; setup guides are available in the Documents tab.',
        NOW() - INTERVAL '3 hours'
      ) RETURNING id
    `, [roboRaveEvent.id, omkar.id]);

    const q2 = await db.query(`
      INSERT INTO event_qa_questions (event_id, user_id, author_name, author_branch, content, upvotes_count, is_pinned, is_answered, answer_text, created_at)
      VALUES (
        $1, $2, 'Kavya Kulkarni', 'TE IT',
        'Are AICTE activity points granted for attending the full 2-day session?',
        25, true, true,
        'Yes! +10 AICTE activity points and an SPPU-endorsed verifiable collegiate certificate (verifiable via ClubSync public ledger) are issued upon completion.',
        NOW() - INTERVAL '2 hours'
      ) RETURNING id
    `, [roboRaveEvent.id, member.id]);

    const q3 = await db.query(`
      INSERT INTO event_qa_questions (event_id, user_id, author_name, author_branch, content, upvotes_count, is_pinned, is_answered, answer_text, created_at)
      VALUES (
        $1, $2, 'Sneha Nair', 'SE Comp',
        'Can first-year (FE) and second-year (SE) students form cross-branch teams for the autonomous maze solver?',
        12, false, true,
        'Yes, inter-departmental and cross-year squads (Comp, IT, E&TC, AI&DS) are encouraged. You can use the Squad feature to link teammates.',
        NOW() - INTERVAL '90 minutes'
      ) RETURNING id
    `, [roboRaveEvent.id, sneha.id]);

    await db.query('INSERT INTO event_qa_upvotes VALUES ($1, $2) ON CONFLICT DO NOTHING', [q1.rows[0].id, officer.id]);
    await db.query('INSERT INTO event_qa_upvotes VALUES ($1, $2) ON CONFLICT DO NOTHING', [q1.rows[0].id, member.id]);
    await db.query('INSERT INTO event_qa_upvotes VALUES ($1, $2) ON CONFLICT DO NOTHING', [q2.rows[0].id, officer.id]);
    await db.query('INSERT INTO event_qa_upvotes VALUES ($1, $2) ON CONFLICT DO NOTHING', [q2.rows[0].id, omkar.id]);

    // Squads
    const tRobo = await db.query(`
      INSERT INTO event_teams (event_id, name, invite_code, leader_id, leader_name)
      VALUES ($1, 'BotBusters', 'BOT101', $2, 'Omkar Patil')
      RETURNING id
    `, [roboRaveEvent.id, omkar.id]);
    await db.query(`
      INSERT INTO event_team_members (team_id, event_id, user_id, user_name, user_email, college_id, branch)
      VALUES 
      ($1, $2, $3, 'Omkar Patil', 'omkar@pict.edu', 'C2K241199', 'SE - Computer Engineering'),
      ($1, $2, $4, 'Rohan Sawant', 'rohan@pict.edu', 'C2K221142', 'BE - Computer Engineering')
    `, [tRobo.rows[0].id, roboRaveEvent.id, omkar.id, rohan.id]);
  }

  if (pulzionEvent) {
    await db.query(`
      INSERT INTO event_broadcasts (event_id, club_id, author_id, author_name, title, message, priority, created_at)
      VALUES 
      ($1, $2, $3, 'Atharva Joshi', '⚡ Hackathon Problem Statements Unlocked!', 'Problem statements across AI/ML, Web3, and Systems tracks are live on the squad portal. 24-hour timer starts at 9:00 AM.', 'high', NOW() - INTERVAL '3 hours'),
      ($1, $2, $3, 'Siddharth Menon', '☕ Midnight Refreshments & Red Bull Station', 'Catering counter open at Central Computing Facility (CCF) foyer throughout the night.', 'normal', NOW() - INTERVAL '5 hours')
    `, [pulzionEvent.id, pascId, atharva.id]);

    const t1Res = await db.query(`
      INSERT INTO event_teams (event_id, name, invite_code, leader_id, leader_name)
      VALUES ($1, 'AlgoKnights', 'ALG001', $2, 'Siddharth Menon')
      RETURNING id
    `, [pulzionEvent.id, siddharth.id]);
    await db.query(`
      INSERT INTO event_team_members (team_id, event_id, user_id, user_name, user_email, college_id, branch)
      VALUES 
      ($1, $2, $3, 'Siddharth Menon', 'siddharth@pict.edu', 'C2K251020', 'FE - First Year Engineering'),
      ($1, $2, $4, 'Sneha Nair', 'sneha@pict.edu', 'C2K231189', 'TE - Information Technology'),
      ($1, $2, $5, 'Tanmay Kulkarni', 'tanmay@pict.edu', 'C2K221142', 'BE - Computer Engineering')
    `, [t1Res.rows[0].id, pulzionEvent.id, siddharth.id, sneha.id, tanmay.id]);
  }

  // ------------------------------------------------------------------
  // 7. SEED KANBAN TASKS (30+ Realistic Indian Club Tasks)
  // ------------------------------------------------------------------
  console.log('[7/12] Seeding Kanban tasks across all clubs...');
  await db.query('DELETE FROM tasks');

  const tasksToSeed = [
    // Robocon
    { club: roboconId, title: 'Finalize LiDAR calibration on RPLidar A1M8', desc: 'Mount LiDAR on primary robot chassis and measure distance offset accuracy at 10 Hz.', status: 'in_progress', assignee: omkar, creator: officer, due: 2 },
    { club: roboconId, title: 'Procure 4x 5000mAh 4S LiPo battery packs', desc: 'Collect quotation from Pune Electronics Market and submit voucher to College Accounts.', status: 'todo', assignee: raj, creator: officer, due: 5 },
    { club: roboconId, title: 'Draft Sponsorship deck for Persistent Systems', desc: 'Include team roster, DD-Robocon budget sheet, and branding tiers on robot panels.', status: 'done', assignee: ishita, creator: officer, due: -2 },
    { club: roboconId, title: 'Pneumatic piston pressure regulator testing', desc: 'Test 8-bar pneumatic solenoid valves for autonomous ball-throwing mechanism.', status: 'in_progress', assignee: rohan, creator: officer, due: 4 },
    { club: roboconId, title: 'Deploy Web Telemetry Dashboard on AWS EC2', desc: 'Connect WebSocket bridge for streaming live wheel RPM and battery telemetry.', status: 'todo', assignee: siddharth, creator: officer, due: 7 },
    { club: roboconId, title: 'Submit Audi-2 and Gymkhana venue sanction letter', desc: 'Get approval signature from Gymkhana Staff Advisor and Estates Office.', status: 'done', assignee: raj, creator: officer, due: -4 },

    // PASC
    { club: pascId, title: 'Review Pulzion 2026 problem statements', desc: 'Set test cases, time limits (1.0s), and memory bounds (256MB) on HackerEarth arena.', status: 'in_progress', assignee: atharva, creator: atharva, due: 3 },
    { club: pascId, title: 'Design social media posters for CodeSprint', desc: 'Follow PASC typography guidelines and share on Instagram & LinkedIn.', status: 'done', assignee: meera, creator: atharva, due: -1 },
    { club: pascId, title: 'Coordinate CCF lab internet bandwidth with IT dept', desc: 'Ensure 1 Gbps dedicated pipe for 300 hackathon participants.', status: 'todo', assignee: siddharth, creator: atharva, due: 6 },
    { club: pascId, title: 'Print participant ID badges and lanyard tags', desc: 'Export attendee roster from ClubSync and send to college print store.', status: 'todo', assignee: member, creator: atharva, due: 8 },

    // PISB
    { club: pisbId, title: 'Submit IEEE Student Chapter Annual Audit Report', desc: 'Consolidate 12 months financial statements and technical workshop records.', status: 'in_progress', assignee: devendra, creator: rutuja, due: 5 },
    { club: pisbId, title: 'Invited Keynote Speaker outreach for Credenz', desc: 'Confirm flight bookings and honorarium for Dr. Vijay Bhatkar key lecture.', status: 'done', assignee: rutuja, creator: rutuja, due: -3 },
    { club: pisbId, title: 'Configure Pixelate UI/UX prototype judge rubrics', desc: 'Setup judging rubric on design tokens, mobile responsiveness, and usability.', status: 'todo', assignee: ananya, creator: rutuja, due: 10 },

    // FOSS Club
    { club: fossId, title: 'Flash Raspberry Pi 5 cluster with Ubuntu Server', desc: 'Setup Ansible playbooks for lab server automation and local DNS.', status: 'done', assignee: pranav, creator: tanmay, due: -2 },
    { club: fossId, title: 'Write curriculum for eBPF kernel tracing lab', desc: 'Prepare BCC Python scripts and tracepoint examples for students.', status: 'in_progress', assignee: tanmay, creator: tanmay, due: 4 },
    { club: fossId, title: 'Package ClubSync PWA for Debian / Flatpak', desc: 'Build Linux desktop distribution packages for campus deployment.', status: 'todo', assignee: siddharth, creator: tanmay, due: 9 },

    // EDC
    { club: edcId, title: 'Finalize Angel Investor Panel for Summit 2026', desc: 'Confirm attendance of 5 Pune Tech Angel Network investors.', status: 'in_progress', assignee: tanvi, creator: ananya, due: 6 },
    { club: edcId, title: 'Release shortlisted startup pitches roster', desc: 'Score 42 startup applications and notify top 15 teams.', status: 'done', assignee: ananya, creator: ananya, due: -5 },
    { club: edcId, title: 'Arrange catering for VC networking high-tea', desc: 'Book VIP guest refreshments at PICT Guest House lounge.', status: 'todo', assignee: member, creator: ananya, due: 12 },

    // Art Circle
    { club: artCircleId, title: 'Complete Firodiya Karandak script revision', desc: 'Refine Marathi dialogue delivery and blocking for Act 2 climax.', status: 'done', assignee: ishita, creator: ishita, due: -1 },
    { club: artCircleId, title: 'Construct modular rotating stage backdrop', desc: 'Fabricate plywood flats and acrylic stage lights in College Workshop.', status: 'in_progress', assignee: sayali, creator: ishita, due: 7 },
    { club: artCircleId, title: 'Rent sound mixer and 8 lapel wireless mics', desc: 'Submit quotation to College Gymkhana for cultural grant sanction.', status: 'todo', assignee: rohan, creator: ishita, due: 9 },

    // Pictoreal
    { club: pictorealId, title: 'Editorial review of Principal interview article', desc: 'Finalize proofs and photograph layouts with Dr. P. T. Kulkarni.', status: 'done', assignee: sneha, creator: sneha, due: -6 },
    { club: pictorealId, title: 'Color grading and CMYK proofing of magazine cover', desc: 'Inspect digital test prints with Saraswati Press Narayan Peth.', status: 'in_progress', assignee: member, creator: sneha, due: 5 },

    // Sports Club
    { club: sportsId, title: 'Mark cricket pitch boundaries and bowling crease', desc: 'Roll pitch and whitewash boundary lines on PICT ground.', status: 'todo', assignee: rohan, creator: rohan, due: 3 },
    { club: sportsId, title: 'Order 60 SG Tournament leather and tennis balls', desc: 'Collect delivery from Deccan Gymkhana sports depot.', status: 'done', assignee: harsh, creator: rohan, due: -2 },
  ];

  for (const t of tasksToSeed) {
    await db.query(`
      INSERT INTO tasks (club_id, title, description, status, assignee_id, created_by, due_date, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($7 || ' days')::INTERVAL, NOW() - INTERVAL '3 days')
    `, [t.club, t.title, t.desc, t.status, t.assignee?.id, t.creator?.id, t.due]);
  }

  // ------------------------------------------------------------------
  // 8. SEED MEETINGS & MINUTES ACROSS CLUBS
  // ------------------------------------------------------------------
  console.log('[8/12] Seeding club committee meetings and minutes...');
  await db.query('DELETE FROM meetings');

  const meetingsToSeed = [
    {
      club: roboconId,
      title: 'Robocon 2026 Core Chassis & Sensor Review',
      date: new Date(Date.now() + 2 * 24 * 3600000),
      time: '05:00 PM - 06:30 PM',
      location: 'Robotics Bay 304, PICT Pune',
      desc: 'Critical review of the secondary autonomous bot steering geometry, optical encoders, and ROS2 navigation stack.',
      minutes: 'Discussed LiDAR field of view obstructions caused by aluminum extrusion brackets. Team agreed to mill a 15mm elevated delrin riser.',
      summary: 'Action Items: Omkar to order delrin plate; Rohan to update SolidWorks CAD; Aditya to verify clearance envelope with rulebook.',
      creator: officer
    },
    {
      club: roboconId,
      title: 'Weekly Standup & Budget Ledger Audit',
      date: new Date(Date.now() - 5 * 24 * 3600000),
      time: '04:30 PM - 05:30 PM',
      location: 'Audi-2 Green Room',
      desc: 'Weekly sprint check-in covering procurement invoices and Persistent Systems sponsorship allocation.',
      minutes: 'Treasury reported ₹75,000 remaining in active operating grant. Approved ₹14,200 expenditure for battery packs.',
      summary: 'Budget status healthy. All invoices filed in ClubSync Documents folder.',
      creator: officer
    },
    {
      club: pascId,
      title: 'Pulzion 2026 Sponsor & PR Sync',
      date: new Date(Date.now() + 4 * 24 * 3600000),
      time: '05:30 PM - 07:00 PM',
      location: 'Lab 101, Computer Dept',
      desc: 'Finalizing corporate deliverables for title sponsor and hackathon swag distribution.',
      minutes: 'Red Bull energy drink sampling approved for midnight desk. Verified hacker registration tally at 280.',
      summary: 'Action Items: Meera to dispatch press releases; Siddharth to load API keys on test runner.',
      creator: atharva
    },
    {
      club: pisbId,
      title: 'Credenz Technical Committee Review',
      date: new Date(Date.now() + 3 * 24 * 3600000),
      time: '04:00 PM - 05:30 PM',
      location: 'Seminar Hall 2, IT Dept',
      desc: 'Reviewing 48 submitted research papers across AI, Blockchain, and Embedded Systems.',
      minutes: 'Shortlisted 24 papers for final presentation before external SPPU evaluators.',
      summary: 'Evaluator roster finalized. Certificates and trophies verified.',
      creator: rutuja
    },
    {
      club: edcId,
      title: 'Startup Summit Investor Panel Prep',
      date: new Date(Date.now() + 6 * 24 * 3600000),
      time: '03:30 PM - 05:00 PM',
      location: 'Auditorium 1 VIP Lounge',
      desc: 'Reviewing pitch formats (5 min pitch + 3 min Q&A) and scoring sheets for student founder teams.',
      minutes: 'Demo Day schedule confirmed. Projector and dual microphones reserved with Audi staff.',
      summary: 'All 15 shortlisted startups submitted revised financial models.',
      creator: ananya
    },
    {
      club: artCircleId,
      title: 'Firodiya Karandak Script Reading & Music Jam',
      date: new Date(Date.now() - 2 * 24 * 3600000),
      time: '06:00 PM - 09:00 PM',
      location: 'Amphitheatre, PICT Pune',
      desc: 'Full-cast run-through of the 60-minute Marathi social drama play.',
      minutes: 'Orchestra timing adjusted to match light cues in scene 4. Vocal harmonium track finalized.',
      summary: 'Costume measurements completed. Rehearsal schedule distributed.',
      creator: ishita
    },
    {
      club: sportsId,
      title: 'IBCL Cricket Captains Meeting & Toss Draw',
      date: new Date(Date.now() + 5 * 24 * 3600000),
      time: '05:00 PM - 06:00 PM',
      location: 'PICT Gymkhana Office',
      desc: 'Drawing match fixtures, pool allocation (Pool A and B), and reviewing rain-out rules.',
      minutes: '16 captains signed off on 6-over match rules, supersub rule, and umpire finality clause.',
      summary: 'Fixtures matrix printed and posted on Gymkhana notice board.',
      creator: rohan
    }
  ];

  for (const m of meetingsToSeed) {
    await db.query(`
      INSERT INTO meetings (club_id, title, date, time, location, description, minutes, ai_summary, created_by, meeting_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'https://meet.google.com/xyz-pict-sync')
    `, [m.club, m.title, m.date, m.time, m.location, m.desc, m.minutes, m.summary, m.creator.id]);
  }

  // ------------------------------------------------------------------
  // 9. SEED CONSTITUTIONS & OFFICIAL DOCUMENTS
  // ------------------------------------------------------------------
  console.log('[9/12] Seeding club constitutions and official documents...');
  await db.query('DELETE FROM documents');
  await db.query('DELETE FROM constitutions');

  for (const c of canonicalClubs) {
    const title = `Official Constitution and Operational Bylaws of ${c.name}`;
    const content = `# Constitution of ${c.name}
**Pune Institute of Computer Technology (PICT), Pune**
*Affiliated with Savitribai Phule Pune University (SPPU)*

## Article I: Name & Objective
1. The official collegiate organization shall be designated as **${c.name}**.
2. Its mission is to advance student technical excellence, leadership, and ethical collegiate sportsmanship across campus.

## Article II: Membership & Rights
1. Any registered undergraduate or postgraduate student of PICT is eligible for general membership.
2. Members enjoy the right to attend general body meetings, vote in annual leadership elections, checkout club inventory, and receive academic On-Duty (OD) recommendation letters.

## Article III: Executive Officer Council
1. The council consists of President, Vice President, Secretary, Treasurer, and Domain Technical Leads.
2. Officers are elected via verifiable democratic ballots annually in May.

## Article IV: Financial Transparency & Audits
1. All sponsorship revenues and membership dues must be processed via verifiable institutional UPI VPAs (\`${c.upi_vpa}\`).
2. Monthly transactions ledger is public to all verified members on ClubSync.

## Article V: Code of Conduct & Anti-Ragging
1. Zero tolerance for discrimination, harassment, or ragging in accordance with UGC guidelines. Violations result in immediate revocation of membership and disciplinary referral.`;

    await db.query(`
      INSERT INTO constitutions (club_id, title, content, version, created_by, updated_by, updated_at)
      VALUES ($1, $2, $3, 'v2.4 (2026)', $4, $4, NOW() - INTERVAL '15 days')
    `, [c.id, title, content, c.created_by]);
  }

  const docsToSeed = [
    { club: roboconId, title: 'PICT Robocon Sponsorship Prospectus FY26', name: 'Robocon_Sponsorship_Deck_2026.pdf', path: '/sponsorships', size: '4.8 MB', user: officer },
    { club: roboconId, title: 'Gymkhana Audi-2 Venue Sanction Letter', name: 'Audi2_Booking_Sanction_Signed.pdf', path: '/permissions', size: '820 KB', user: officer },
    { club: roboconId, title: 'RPLidar A1M8 Pinout & Hardware Datasheet', name: 'RPLidar_A1M8_Manual_V2.pdf', path: '/technical', size: '2.4 MB', user: omkar },
    { club: roboconId, title: 'ABU Robocon 2026 Official Rulebook & Arena Dimensions', name: 'ABU_Robocon_Rulebook_2026.pdf', path: '/rules', size: '6.1 MB', user: officer },

    { club: pascId, title: 'Pulzion 2026 Problem Statements Track Rubrics', name: 'Pulzion26_Hackathon_Rubrics.pdf', path: '/pulzion', size: '1.2 MB', user: atharva },
    { club: pascId, title: 'PASC Annual Financial Statement 2025-26', name: 'PASC_Annual_Accounts_Audit.pdf', path: '/finance', size: '940 KB', user: atharva },

    { club: pisbId, title: 'Credenz 2026 National Technical Paper Submission Guidelines', name: 'Credenz26_Paper_Format_IEEE.pdf', path: '/credenz', size: '1.5 MB', user: rutuja },
    { club: pisbId, title: 'IEEE Student Branch Certificate of Recognition', name: 'IEEE_Branch_Charter_Certificate.pdf', path: '/governance', size: '750 KB', user: rutuja },

    { club: edcId, title: 'Startup Pitch Deck Template for Investors', name: 'PICT_EDC_PitchDeck_Template.pptx', path: '/templates', size: '3.6 MB', user: ananya },
    { club: sportsId, title: 'IBCL 2026 Box Cricket Tournament Rulebook & Roster Form', name: 'IBCL_Cricket_Rules_2026.pdf', path: '/rules', size: '680 KB', user: rohan },
  ];

  for (const d of docsToSeed) {
    await db.query(`
      INSERT INTO documents (club_id, title, name, file_url, folder_path, file_size, uploaded_by, created_at)
      VALUES ($1, $2, $3, 'https://clubsync-cdn.pict.edu/docs/' || $3, $4, $5, $6, NOW() - INTERVAL '10 days')
    `, [d.club, d.title, d.name, d.path, d.size, d.user.id]);
  }

  // ------------------------------------------------------------------
  // 10. SEED ELECTIONS, CANDIDATES, VOTES & RESOLUTIONS
  // ------------------------------------------------------------------
  console.log('[10/12] Seeding democratic elections, candidates, and resolutions...');
  await db.query('DELETE FROM election_votes');
  await db.query('DELETE FROM election_candidates');
  await db.query('DELETE FROM elections');

  const elec1 = await db.query(`
    INSERT INTO elections (club_id, title, description, start_date, end_date, status, created_at)
    VALUES (
      $1,
      'PICT Robocon Technical Head Election (Term 2026-27)',
      'Annual election for electing the primary Technical Head responsible for embedded architecture, motor tuning, and national arena competition drive.',
      NOW() - INTERVAL '2 days',
      NOW() + INTERVAL '4 days',
      'active',
      NOW() - INTERVAL '3 days'
    ) RETURNING id
  `, [roboconId]);
  const elec1Id = elec1.rows[0].id;

  const cand1 = await db.query(`
    INSERT INTO election_candidates (election_id, user_id, manifesto)
    VALUES ($1, $2, 'Committed to establishing an automated hardware testing bench, weekly ROS2 workshops for FE/SE juniors, and securing top 3 podium at National Robocon.')
    RETURNING id
  `, [elec1Id, omkar.id]);

  const cand2 = await db.query(`
    INSERT INTO election_candidates (election_id, user_id, manifesto)
    VALUES ($1, $2, 'Focus on modular mechanical chassis design, 100% lightweight carbon-fiber and delrin fabrication, and zero-latency wireless tele-operation.')
    RETURNING id
  `, [elec1Id, rohan.id]);

  // Votes
  await db.query(`
    INSERT INTO election_votes (election_id, candidate_id, voter_id)
    VALUES 
    ($1, $2, $3),
    ($1, $2, $4),
    ($1, $5, $6),
    ($1, $2, $7)
  `, [elec1Id, cand1.rows[0].id, officer.id, member.id, cand2.rows[0].id, tanmay.id, siddharth.id]);

  // Resolutions
  await db.query('DELETE FROM club_resolution_votes');
  await db.query('DELETE FROM club_resolutions');

  const res1 = await db.query(`
    INSERT INTO club_resolutions (
      club_id, title, proposed_by, clause_affected, existing_text,
      proposed_amendment, rationale, status, voting_deadline, quorum_required
    ) VALUES (
      $1,
      'Resolution to Mandate Open-Source Public Telemetry Logs for Arena Runs',
      $2,
      'Article IV: Section 2 (Telemetry Access)',
      'Telemetry logs and sensor data packages were restricted to core driving officers.',
      'All high-speed wheel encoder RPM, motor current draw, and LiDAR point clouds shall be published to the public club GitHub repo within 48 hours of arena trials.',
      'Promotes algorithmic transparency, peer review by PICT computer vision researchers, and accelerates debugging for junior team members.',
      'OPEN',
      NOW() + INTERVAL '5 days',
      10
    ) RETURNING id
  `, [roboconId, officer.id]);

  await db.query(`
    INSERT INTO club_resolution_votes (resolution_id, user_id, vote, comment)
    VALUES 
    ($1, $2, 'FOR', 'Essential for junior member learning!'),
    ($1, $3, 'FOR', 'Agreed. Will make team debugging 3x faster.'),
    ($1, $4, 'FOR', 'Full support from software sub-team.')
  `, [res1.rows[0].id, officer.id, member.id, omkar.id]);

  // ------------------------------------------------------------------
  // 11. SEED INVENTORY, RECRUITMENT, MENTORSHIP & SPONSORSHIPS
  // ------------------------------------------------------------------
  console.log('[11/12] Seeding inventory, recruitment drives, mentors & sponsorships...');

  // Inventory
  await db.query('DELETE FROM club_inventory_requests');
  await db.query('DELETE FROM club_inventory_items');

  const invItemsToSeed = [
    { club: roboconId, name: 'RPLidar A1M8 360-degree Laser Scanner', cat: 'Sensors', sn: 'SN-LIDAR-0921', total: 4, avail: 3, loc: 'Cabinet A-2, Bay 304', cond: 'Excellent' },
    { club: roboconId, name: 'STM32F407G-DISC1 Discovery Board', cat: 'Microcontrollers', sn: 'SN-STM32-4412', total: 8, avail: 6, loc: 'Drawer B-1, Bay 304', cond: 'Good' },
    { club: roboconId, name: 'Zippy Flightmax 5000mAh 4S 30C LiPo Battery', cat: 'Power & Batteries', sn: 'SN-LIPO-8820', total: 6, avail: 4, loc: 'Fireproof Lipo Safe Box', cond: 'Good' },
    { club: roboconId, name: 'Cytron MDDS30 30A Dual Channel DC Motor Driver', cat: 'Motor Drivers', sn: 'SN-CYTRON-1049', total: 5, avail: 5, loc: 'Cabinet A-3, Bay 304', cond: 'New' },
    { club: roboconId, name: 'Ender 3 V2 Pro 3D Printer (Marlin 2.0)', cat: 'Fabrication', sn: 'SN-3DPRN-0019', total: 2, avail: 1, loc: 'Workshop Bay 2 Bench', cond: 'Excellent' },

    { club: fossId, name: 'Raspberry Pi 5 (8GB RAM) Lab Nodes', cat: 'Compute', sn: 'SN-RPI5-9901', total: 10, avail: 8, loc: 'Server Rack 2, CCF', cond: 'Excellent' },
    { club: artCircleId, name: 'Yamaha MG16XU 16-Channel Audio Mixing Console', cat: 'Audio & Stage', sn: 'SN-YAM-5502', total: 1, avail: 1, loc: 'Amphitheatre Tech Store', cond: 'Good' },
    { club: sportsId, name: 'SS Gladiator English Willow Cricket Bats', cat: 'Sports Gear', sn: 'SN-BAT-0312', total: 6, avail: 5, loc: 'Gymkhana Sports Locker', cond: 'Good' }
  ];

  const createdInv = [];
  for (const item of invItemsToSeed) {
    const { rows } = await db.query(`
      INSERT INTO club_inventory_items (club_id, name, category, serial_number, total_quantity, available_quantity, storage_location, condition)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [item.club, item.name, item.cat, item.sn, item.total, item.avail, item.loc, item.cond]);
    createdInv.push(rows[0]);
  }

  // Inventory requests
  const lipoItem = createdInv.find(i => i.name.includes('LiPo'));
  const lidarItem = createdInv.find(i => i.name.includes('Lidar'));
  const stmItem = createdInv.find(i => i.name.includes('STM32'));

  if (lipoItem && officer) {
    await db.query(`
      INSERT INTO club_inventory_requests (
        item_id, club_id, user_id, user_name, user_email, college_id, branch,
        quantity, purpose, return_date, status, approved_by, approved_at, created_at
      ) VALUES 
      (
        $1, $2, $3, 'Atharva Joshi', 'atharva@pict.edu', 'C2K231012', 'TE - Computer Engineering',
        1, 'Autonomous Arena Speed Run and ESC current draw bench testing.',
        CURRENT_DATE + INTERVAL '3 days', 'approved', $4, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days'
      ),
      (
        $5, $2, $6, 'Omkar Patil', 'omkar@pict.edu', 'C2K241199', 'SE - Computer Engineering',
        1, 'Bench tuning of quadrature optical encoders with ROS2 hardware interface.',
        CURRENT_DATE + INTERVAL '5 days', 'approved', $4, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '1 day'
      ),
      (
        $7, $2, $8, 'Kavya Kulkarni', 'member@clubsync.app', 'C2K231189', 'TE - Information Technology',
        1, 'LiDAR SLAM mapping test in Audi-2 hallway corridor.',
        CURRENT_DATE + INTERVAL '7 days', 'pending', NULL, NULL, NOW() - INTERVAL '2 hours'
      )
    `, [lipoItem.id, roboconId, atharva.id, officer.id, stmItem?.id || lipoItem.id, omkar.id, lidarItem?.id || lipoItem.id, member.id]);
  }

  // Recruitment drives & applications
  await db.query('DELETE FROM club_applications');
  await db.query('DELETE FROM club_recruitment_drives');

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
  `, [roboconId, ['Embedded Systems & ROS2', 'Computer Vision & SLAM', 'Mechanical CAD & 3D Fabrication', 'Web & Telemetry Dashboard', 'Public Relations & Corporate Sponsorship']]);
  const driveId = driveRes.rows[0].id;

  await db.query(`
    INSERT INTO club_applications (
      drive_id, club_id, user_id, full_name, email, college_id, branch,
      domain, portfolio_url, statement_of_purpose, status, interview_slot, notes, created_at
    ) VALUES 
    (
      $1, $2, $3, 'Tanmay Kulkarni', 'tanmay@pict.edu', 'C2K221142', 'BE - Computer Engineering',
      'Embedded Systems & ROS2', 'https://github.com/tanmay-k/stm32-ros2-bridge',
      'Passionate about bare-metal STM32 HAL drivers and real-time microcontroller interfaces. Built an autonomous differential line follower bot in FE that won 2nd prize at Credenz.',
      'shortlisted', 'Wednesday, 4:30 PM (Robotics Lab 304)', 'Strong grasp of UART, DMA, and timer interrupts. Recommended for round 2 technical viva.', NOW() - INTERVAL '2 days'
    ),
    (
      $1, $2, $4, 'Sneha Nair', 'sneha@pict.edu', 'C2K231189', 'TE - Information Technology',
      'Computer Vision & SLAM', 'https://github.com/sneha-nair/arena-detector-yolo',
      'Proficient in OpenCV, C++ STL, and PyTorch. Implemented real-time ball detection at 60 FPS using TensorRT on Jetson Nano. Excited to build the arena camera tracking pipeline.',
      'interviewed', 'Completed (Score: 9.2/10)', 'Outstanding algorithmic clarity. Can independently lead secondary bot ball localization stack.', NOW() - INTERVAL '1 day'
    ),
    (
      $1, $2, $5, 'Ishita Kulkarni', 'ishita@pict.edu', 'C2K231450', 'TE - Electronics & Telecommunication',
      'Public Relations & Corporate Sponsorship', 'https://linkedin.com/in/ishita-k-pict',
      'Led corporate sponsorship outreach for Department Tech Week raising ₹18,000 from local tech firms. Fluent communication, pitch deck design, and event anchoring experience.',
      'offered', 'Offer Letter Dispatched', 'Confirmed selection for Assistant Sponsorship Lead role.', NOW() - INTERVAL '3 days'
    ),
    (
      $1, $2, $6, 'Kavya Kulkarni', 'member@clubsync.app', 'C2K231189', 'TE - Information Technology',
      'Web & Telemetry Dashboard', 'https://github.com/kavya-k/pict-telemetry-ui',
      'Experienced in React, Tailwind CSS, WebSockets, and three.js. Eager to build the live robot telemetry visualization HUD for driver stations.',
      'shortlisted', 'Thursday, 5:00 PM (CCF Lab 2)', 'Portfolio UI is clean and responsive. Good knowledge of state management.', NOW() - INTERVAL '18 hours'
    )
  `, [driveId, roboconId, tanmay.id, sneha.id, ishita.id, member.id]);

  // Mentorship
  await db.query('DELETE FROM club_mentorship_sessions');
  await db.query('DELETE FROM club_mentors');

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

  // Sponsorships CRM
  await db.query('DELETE FROM club_sponsorship_deals');

  const dealsToSeed = [
    {
      club: roboconId,
      company: 'Persistent Systems Ltd.',
      contact: 'Rajesh Kulkarni (CSR Director)',
      email: 'csr@persistentsys.com',
      phone: '+91 98220 11223',
      stage: 'Signed',
      tier: 'Title Sponsor',
      amount: 75000,
      deliverables: ['Logo on primary & secondary robot panels', 'Keynote address at RoboRave inaugural session', 'Direct resume book of all core committee members'],
      notes: 'First tranche of ₹25,000 received. Balance ₹50,000 to be disbursed upon national finals qualifier.'
    },
    {
      club: roboconId,
      company: 'Dassault Systèmes India',
      contact: 'Amit Deshpande (University Relations)',
      email: 'amit.deshpande@3ds.com',
      phone: '+91 94220 98765',
      stage: 'In Negotiation',
      tier: 'Gold Sponsor',
      amount: 40000,
      deliverables: ['SOLIDWORKS Academic licenses for all 25 team members', 'Workshop stall at RoboRave Pune'],
      notes: 'MOU legal review in progress with College Estates office.'
    },
    {
      club: pascId,
      company: 'Red Bull India',
      contact: 'Vikram Joshi (Brand Specialist)',
      email: 'vikram.j@redbull.in',
      phone: '+91 99230 44556',
      stage: 'Signed',
      tier: 'Official Energy Partner',
      amount: 25000,
      deliverables: ['300 chilled cans during Pulzion 24-hr hackathon', 'Branded gaming lounge in CCF'],
      notes: 'Delivery scheduled on event eve at 6:00 PM.'
    },
    {
      club: pascId,
      company: 'GitHub Education',
      contact: 'Suhas Motwani (Campus Field Manager)',
      email: 'smotwani@github.com',
      phone: '+91 98111 23456',
      stage: 'Signed',
      tier: 'Developer Tools Partner',
      amount: 30000,
      deliverables: ['GitHub Copilot for all hackathon squads', 'GitHub Octocat swag stickers for 300 students'],
      notes: 'Coupon codes dispatched.'
    },
    {
      club: edcId,
      company: 'Pune Tech Angel Network',
      contact: 'Shruti Gupte (Partner)',
      email: 'partners@puneangels.in',
      phone: '+91 98900 11990',
      stage: 'Signed',
      tier: 'Ecosystem Partner',
      amount: 50000,
      deliverables: ['Prizepool grant for top 3 startup pitches', 'Fast-track incubation interviews'],
      notes: 'Agreement executed.'
    }
  ];

  for (const d of dealsToSeed) {
    await db.query(`
      INSERT INTO club_sponsorship_deals (
        club_id, company_name, contact_person, contact_email, contact_phone,
        stage, tier, committed_amount, currency, deliverables, notes, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'INR', $9, $10, $11, NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day')
    `, [d.club, d.company, d.contact, d.email, d.phone, d.stage, d.tier, d.amount, JSON.stringify(d.deliverables), d.notes, officer.id]);
  }

  // ------------------------------------------------------------------
  // 12. SEED FINANCIAL TRANSACTIONS, CHAT, NOTIFICATIONS & PAYMENTS
  // ------------------------------------------------------------------
  console.log('[12/12] Seeding financial ledger, chat, notifications & verified UPI receipts...');

  // Transactions
  await db.query('DELETE FROM club_transactions');

  const txnsToSeed = [
    { club: roboconId, desc: 'Persistent Systems CSR Sponsorship (Tranche 1)', amt: 25000, type: 'income', user: officer },
    { club: roboconId, desc: 'Purchase of 4x RPLidar A1M8 Sensors (Robu.in Invoice #9021)', amt: 18400, type: 'expense', user: officer },
    { club: roboconId, desc: 'Aluminium Extrusion 2020 Profiles & T-Nuts (Bhosari MIDC)', amt: 6200, type: 'expense', user: raj },
    { club: roboconId, desc: 'Student Membership Annual Dues Collection (11 members)', amt: 5500, type: 'income', user: officer },
    { club: roboconId, desc: 'Workshop Bay 304 High-Speed Soldering Station & Consumables', amt: 3450, type: 'expense', user: omkar },

    { club: pascId, desc: 'Red Bull Partnership Sponsorship Grant', amt: 25000, type: 'income', user: atharva },
    { club: pascId, desc: 'Pulzion 2026 Ticket Bookings (50 Registrations)', amt: 12500, type: 'income', user: atharva },
    { club: pascId, desc: 'HackerEarth Online Contest Arena Platform Hosting Fee', amt: 8000, type: 'expense', user: siddharth },

    { club: pisbId, desc: 'Credenz 2026 Participant Registration Inflows', amt: 18000, type: 'income', user: devendra },
    { club: pisbId, desc: 'Seminar Hall 2 Projector Cable & Wireless Mic Battery Replacement', amt: 1200, type: 'expense', user: devendra },

    { club: edcId, desc: 'Startup Summit Investor Panel Honorarium & Refreshments', amt: 4500, type: 'expense', user: ananya },
    { club: sportsId, desc: 'PICT Gymkhana Annual Athletic Equipment Grant', amt: 20000, type: 'income', user: rohan },
    { club: sportsId, desc: 'Purchase of 30 SG Tournament Leather Balls & Stumps', amt: 7800, type: 'expense', user: rohan },
  ];

  for (const t of txnsToSeed) {
    await db.query(`
      INSERT INTO club_transactions (club_id, amount, description, type, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '10 days')
    `, [t.club, t.amt, t.desc, t.type, t.user.id]);
  }

  // Club Chat Messages
  await db.query('DELETE FROM club_messages');

  const messagesToSeed = [
    { club: roboconId, user: officer, text: 'Welcome everyone to the PICT Robocon core operations channel! Please check the Kanban board for this week’s action items.' },
    { club: roboconId, user: omkar, text: 'STM32 motor control firmware is now pushed to branch `feat/can-bus-encoder`. Please pull and test on the bench setup.' },
    { club: roboconId, user: member, text: 'Reviewing the ROS2 Humble SLAM node right now. Odometry data looks stable with less than 2% drift over 10 meters.' },
    { club: roboconId, user: raj, text: 'Audi-2 booking letter has been physically stamped by the Estates Officer. Keys will be handed over on Thursday morning.' },
    { club: roboconId, user: rohan, text: 'Delrin laser-cut plates for the secondary launcher arrived from Bhosari. Fitting them today in Bay 304.' },

    { club: pascId, user: atharva, text: 'Pulzion website registrations crossed 250 teams! Great job by the web development squad.' },
    { club: pascId, user: siddharth, text: 'HackerEarth webhook integration is fully tested. Scoreboard will update with zero lag.' },
    { club: pascId, user: meera, text: 'Instagram reels reached 12,000 views across SPPU colleges today!' },

    { club: pisbId, user: rutuja, text: 'Credenz paper submissions have closed. Evaluators will receive their grading sheets by tonight.' },
    { club: edcId, user: ananya, text: '5 VCs have confirmed their presence on the judging panel for Startup Summit 2026!' },
    { club: sportsId, user: rohan, text: 'Cricket pitch rolling is done. First pool match starts Friday at 4:30 PM sharp.' },
  ];

  for (const m of messagesToSeed) {
    await db.query(`
      INSERT INTO club_messages (club_id, user_id, content, created_at)
      VALUES ($1, $2, $3, NOW() - INTERVAL '4 hours')
    `, [m.club, m.user.id, m.text]);
  }

  // Notifications
  await db.query('DELETE FROM notifications');

  const officerNotifs = [
    { title: '🎉 Persistent Systems Grant Tranche Credited', msg: '₹25,000 has been received into the PICT Robocon bank ledger.', type: 'treasury', read: false },
    { title: '📦 Equipment Checkout Request', msg: 'Kavya Kulkarni requested checkout for RPLidar A1M8 Scanner.', type: 'inventory', read: false },
    { title: '🏛️ Audi-2 Booking Sanctioned', msg: 'Estates Office confirmed Audi-2 booking for RoboRave Pune 2026.', type: 'event', read: true },
    { title: '🗳️ Technical Head Election Voting Active', msg: '4 votes recorded so far. Voting closes in 4 days.', type: 'election', read: true },
  ];

  for (const n of officerNotifs) {
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, read, time, created_at)
      VALUES ($1, $2, $3, $4, $5, '10m ago', NOW() - INTERVAL '10 minutes')
    `, [officer.id, n.title, n.msg, n.type, n.read]);
  }

  const memberNotifs = [
    { title: '🎟️ Registration Confirmed: RoboRave Pune', msg: 'Your digital gate pass (TK-RB002) is ready in your wallet with QR verification.', type: 'event', read: false },
    { title: '📜 On-Duty (OD) Letter Ready for Download', msg: 'Official Duty letter for RoboRave Pune is approved for academic attendance sanction.', type: 'od_letter', read: false },
    { title: '🎓 Mentorship Session Confirmed', msg: 'Siddharth Menon accepted your 1-on-1 session on ROS2 Humble Architecture.', type: 'mentorship', read: true },
    { title: '🏆 Verifiable Certificate Issued', msg: 'Credential PICT-CERT-2026-X89 is permanently verified on the collegiate ledger.', type: 'certificate', read: true },
    { title: '⚡ Pulzion Hackathon Squad Created', msg: 'You have been added to team AlgoKnights for Pulzion 2026.', type: 'event', read: true },
  ];

  for (const n of memberNotifs) {
    await db.query(`
      INSERT INTO notifications (user_id, title, message, type, read, time, created_at)
      VALUES ($1, $2, $3, $4, $5, '25m ago', NOW() - INTERVAL '25 minutes')
    `, [member.id, n.title, n.msg, n.type, n.read]);
  }

  // Payments
  await db.query('DELETE FROM payments');

  const paymentsToSeed = [
    {
      club: roboconId,
      user: member,
      event: roboRaveEvent,
      type: 'event_ticket',
      amt: 150,
      vpa: 'vedant1442@fam',
      payee: 'PICT Robocon Pune',
      note: 'RoboRave Pune 2-Day Workshop Registration',
      ref: 'REF-RB-2026-0091',
      utr: 'UTR429188201948',
      status: 'VERIFIED',
      verified_by: officer.id
    },
    {
      club: roboconId,
      user: omkar,
      event: null,
      type: 'club_membership',
      amt: 500,
      vpa: 'vedant1442@fam',
      payee: 'PICT Robocon Pune',
      note: 'Annual Core Committee Member Dues 2026',
      ref: 'REF-MB-2026-0012',
      utr: 'UTR429188201999',
      status: 'VERIFIED',
      verified_by: officer.id
    },
    {
      club: pascId,
      user: member,
      event: pulzionEvent,
      type: 'event_ticket',
      amt: 250,
      vpa: 'vedant1442@fam',
      payee: 'PASC PICT Pune',
      note: 'Pulzion 2026 24-Hour Hackathon Ticket',
      ref: 'REF-PZ-2026-0419',
      utr: 'UTR429188202111',
      status: 'VERIFIED',
      verified_by: atharva.id
    },
    {
      club: sportsId,
      user: member,
      event: cricketEvent,
      type: 'event_ticket',
      amt: 500,
      vpa: 'vedant1442@fam',
      payee: 'PICT Gymkhana Sports',
      note: 'IBCL Box Cricket Squad Entry Fee',
      ref: 'REF-SP-2026-0812',
      utr: 'UTR429188203344',
      status: 'VERIFIED',
      verified_by: rohan.id
    }
  ];

  for (const p of paymentsToSeed) {
    await db.query(`
      INSERT INTO payments (
        club_id, user_id, event_id, type, amount, currency, vpa, payee_name,
        transaction_note, ref_id, utr, status, verified_at, verified_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'INR', $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '1 day', $12, NOW() - INTERVAL '2 days')
    `, [p.club, p.user.id, p.event?.id, p.type, p.amt, p.vpa, p.payee, p.note, p.ref, p.utr, p.status, p.verified_by]);
  }

  // Webhooks
  await db.query(`
    INSERT INTO club_webhooks (
      club_id, platform, channel_name, telegram_bot_token, telegram_chat_id,
      is_active, events_enabled, last_status, last_triggered_at, created_by
    ) VALUES (
      $1, 'TELEGRAM', '@clubsync_pictbot',
      '8878960881:AAF9rbEp2s__hxLFiyZGGed9KmTei0iCa-U', '8312645411',
      true, '{"on_event_created": true, "on_broadcast": true, "on_recruitment_open": true}',
      'SUCCESS', NOW() - INTERVAL '30 minutes', $2
    ) ON CONFLICT DO NOTHING
  `, [roboconId, officer.id]);

  console.log('✅ ========================================================');
  console.log('✅ ALL MOCK DATA SEEDED SUCCESSFULLY WITH 0 BLANKS!');
  console.log('✅ ========================================================');
}

seedMaster()
  .catch(err => {
    console.error('Fatal error during seedMaster:', err);
    process.exit(1);
  })
  .finally(() => db.pool.end());
