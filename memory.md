# ClubSync — Project Memory & Context Transfer Dossier 🧠

*Last Updated: October 2026*  
*Purpose: Comprehensive context snapshot to seamlessly transition between conversation sessions without context rot.*

---

## 📌 1. Project Identity & Collegiate Context

- **Platform:** **ClubSync** (Collegiate Society & Event Operations Platform).
- **Domain Context:** SCTR's Pune Institute of Computer Technology (PICT), Pune — designed specifically for student societies (IEEE, ACM / PASC, CSI, EDC, DebSoc, PICT Robotics / Robocon).
- **Core Value Proposition:** Replaces scattered Google Forms, WhatsApp broadcast lists, and offline spreadsheets with an integrated, secure campus platform supporting gate access control, sponsorship CRMs, webhook syndication, mentorship, democratic governance, and academic compliance.

---

## 🛠️ 2. Tech Stack & Environment

| Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React 18, Vite 8 (PWA ready), Tailwind CSS, Framer Motion, Lucide Icons, Sonner (Toasts), Canvas / jsPDF |
| **Backend** | Node.js 20+, Express.js, Helmet, CORS, Compression, Express-Rate-Limit, JWT, Passport, Multer |
| **Database** | **Neon Serverless PostgreSQL** (`pg` connection pool with SSL), 100% Parameterized SQL (`$1, $2...`) |
| **Integrations**| Discord Webhooks (Embeds), Telegram Bot API, Groq AI (`llama3-8b-8192` for club RAG & meeting summaries) |
| **DevOps & CI/CD** | GitHub Actions (`.github/workflows/ci.yml`), MIT License |

---

## 🔑 3. Seeded Accounts & Personas (Always Use in Testing)

| Role | Email | Password | Persona & Privileges |
| :--- | :--- | :--- | :--- |
| **Club Officer** | `officer@clubsync.app` | `Password123!` | **Aditya Deshmukh** (PRN: `C2K221142`, `BE - Computer Engineering`). Club President / Officer in PASC & Robocon. Has full access to Kiosk mode, Sponsorship CRM, Discord/Telegram relays, Rosters, and By-Law ratifications. |
| **Student Member** | `member@clubsync.app` | `Password123!` | **Kavya Kulkarni** (PRN: `C2K231189`, `TE - Information Technology`). General student member. RSVPs to events, earns certificates, books peer mentorship, and votes on constitutional resolutions. |

---

## 🚀 4. Full Feature Directory & Implementation Status (20+ Modules)

Every single feature below is implemented end-to-end (Database ➔ Express API ➔ React Frontend ➔ Production Build Passing ➔ Pushed to `origin/main`):

### 🎟️ Category A: Event Day Operations & Gate Access
1. **Event Day Desk "Kiosk Mode" & Rapid Check-In:**
   - **Frontend:** [`src/components/EventKioskModal.jsx`](file:///d:/Club-Sync/ClubSync/src/components/EventKioskModal.jsx)
   - **Backend:** `POST /api/events/:id/check-in` in [`server/routes/events.js`](file:///d:/Club-Sync/ClubSync/server/routes/events.js)
   - **Features:** Fullscreen table mode, continuous barcode/QR scanner wedge listener with hands-free auto-focus, live turnout gauge, audio synthesizer chimes (`playBeep`).
2. **Thermal Badge & Physical Delegate Slip Printing:**
   - **Frontend:** Integrated inside `EventKioskModal.jsx`
   - **Features:** Print-optimized `@media print` 80mm receipt/badge layout with student PRN, class/branch, hackathon team name, and high-res barcode; optional auto-print on scan.
3. **Fast-Lane Spot Walk-In Registration:**
   - **Backend:** `POST /api/events/:id/walk-in` in `server/routes/events.js`
   - **Features:** Registers unregistered gate arrivals in <15 seconds, creates user record, marks attendance, issues certificate ID, and generates printable badge.
4. **Digital Gate Pass & Rotating QR Code:**
   - **Frontend:** [`src/components/EventTicketModal.jsx`](file:///d:/Club-Sync/ClubSync/src/components/EventTicketModal.jsx)
   - **Features:** Anti-screenshot rotating pass with real-time countdown clock and verification hash.

### 💼 Category B: Sponsorship, Finance & External Communications
5. **Corporate Sponsorship & Brand Outreach CRM:**
   - **Frontend:** [`src/components/ClubSponsorshipTab.jsx`](file:///d:/Club-Sync/ClubSync/src/components/ClubSponsorshipTab.jsx)
   - **Backend:** [`server/routes/sponsorships.js`](file:///d:/Club-Sync/ClubSync/server/routes/sponsorships.js) | Table: `club_sponsorship_deals`
   - **Features:** 5-stage Kanban board (`LEAD` ➔ `FUNDS_RECEIVED`), KPI cards (Pipeline Value, Funds Realized, Signed MOUs), tier milestone checklists (`TITLE`, `POWERED_BY`, `ASSOCIATE`, `IN_KIND`), and 1-click Gymkhana Audit CSV export.
6. **Multi-Channel Discord & Telegram Webhook Bridge:**
   - **Frontend:** [`src/components/ClubWebhookTab.jsx`](file:///d:/Club-Sync/ClubSync/src/components/ClubWebhookTab.jsx)
   - **Backend:** [`server/routes/webhooks.js`](file:///d:/Club-Sync/ClubSync/server/routes/webhooks.js) & [`server/services/webhookDispatcher.js`](file:///d:/Club-Sync/ClubSync/server/services/webhookDispatcher.js) | Tables: `club_webhooks`, `club_webhook_logs`
   - **Features:** Auto-relays published events and emergency broadcasts as rich Discord embeds and Telegram HTML; 1-click test ping and instant manual live announcement blast.
7. **YouPI Zero-Fee UPI Payment Checkout & Treasury Ledger:**
   - **Frontend:** [`src/components/UPIPaymentModal.jsx`](file:///d:/Club-Sync/ClubSync/src/components/UPIPaymentModal.jsx) & [`PaymentReceiptModal.jsx`](file:///d:/Club-Sync/ClubSync/src/components/PaymentReceiptModal.jsx)
   - **Backend:** [`server/routes/payments.js`](file:///d:/Club-Sync/ClubSync/server/routes/payments.js) | Tables: `payments`, `club_transactions`
   - **Features:** Direct UPI deep-linking (GPay/PhonePe/Paytm), bank UTR verification workflow, and tamper-proof official collegiate e-receipts.

### 🤝 Category C: Mentorship, Governance & Academic Integrity
8. **Peer Mentorship & Senior-Junior Project Pairing Hub:**
   - **Frontend:** [`src/components/ClubMentorshipTab.jsx`](file:///d:/Club-Sync/ClubSync/src/components/ClubMentorshipTab.jsx)
   - **Backend:** [`server/routes/mentorship.js`](file:///d:/Club-Sync/ClubSync/server/routes/mentorship.js) | Tables: `club_mentors`, `club_mentorship_sessions`
   - **Features:** TE/BE senior mentor directory by tech domain (DSA, Web3, AI/ML, ROS2), 1-on-1 slot booking, Google Meet / campus venue assignment, and post-session star ratings.
9. **Constitution & Resolution Amendment Referendum Portal:**
   - **Frontend:** [`src/components/ClubResolutionAmendments.jsx`](file:///d:/Club-Sync/ClubSync/src/components/ClubResolutionAmendments.jsx)
   - **Backend:** [`server/routes/resolutions.js`](file:///d:/Club-Sync/ClubSync/server/routes/resolutions.js) | Tables: `club_resolutions`, `club_resolution_votes`
   - **Features:** Democratic amendment tabling, side-by-side constitutional diff (current text vs. proposed amendment), 66.6% supermajority tracking, quorum validation, and voter debate comments.
10. **Public Certificate Registry & Anti-Fraud Portal (`/verify/:id`):**
    - **Frontend:** [`src/pages/VerifyCredential.jsx`](file:///d:/Club-Sync/ClubSync/src/pages/VerifyCredential.jsx)
    - **Backend:** `GET /api/events/verify/:id` in `server/routes/events.js`
    - **Features:** Public URL validating attendance legitimacy, student PRN, and official seal; includes a 1-click **"Add to LinkedIn Profile"** button pre-populating license credentials.
11. **Official On-Duty (OD / DL) Attendance Leave Letter Generator:**
    - **Frontend:** [`src/components/EventODLetterModal.jsx`](file:///d:/Club-Sync/ClubSync/src/components/EventODLetterModal.jsx)
    - **Features:** Generates official dean-formatted leave letters with verification reference IDs, student PRN lists, and faculty coordinator sign-off seals.

### ⚡ Category D: Engagement, Hardware & Analytics
12. **Live Keynote Audience Q&A:**
    - **Frontend:** [`src/components/EventLiveQAModal.jsx`](file:///d:/Club-Sync/ClubSync/src/components/EventLiveQAModal.jsx) | Tables: `event_qa_questions`, `event_qa_upvotes`
    - **Features:** Projector stage view, real-time upvoting, pinned moderator questions, and speaker answering.
13. **Club Hardware & Lab Equipment Checkout:**
    - **Frontend:** [`src/components/ClubInventoryTab.jsx`](file:///d:/Club-Sync/ClubSync/src/components/ClubInventoryTab.jsx) | Tables: `club_inventory_items`, `club_inventory_requests`
    - **Features:** Loan duration tracking, return approval workflows, and overdue equipment alerts.
14. **Officer Executive Analytics & Demographics Hub:**
    - **Frontend:** [`src/components/ClubAnalyticsTab.jsx`](file:///d:/Club-Sync/ClubSync/src/components/ClubAnalyticsTab.jsx)
    - **Features:** Demographic breakdown (Gender ratio, Class Year FE/SE/TE/BE, Branch CS/IT/ENTC/AIDS), attendance drop-off curves, and CSV export.
15. **Multi-Round Recruitment & Audition Pipeline:**
    - **Frontend:** [`src/components/ClubRecruitmentTab.jsx`](file:///d:/Club-Sync/ClubSync/src/components/ClubRecruitmentTab.jsx) | Tables: `club_recruitment_drives`, `club_applications`
    - **Features:** Round transitions (Aptitude ➔ GD ➔ Technical ➔ Interview), evaluation scoring, and automated decision emails.
16. **Hackathon Team Formation Hub:**
    - **Frontend:** [`src/components/EventTeamSection.jsx`](file:///d:/Club-Sync/ClubSync/src/components/EventTeamSection.jsx) | Tables: `event_teams`, `event_team_members`
    - **Features:** Looking-for-team board, skill tags, team codes, and member invite management.
17. **AICTE Activity Points & Gamified Leaderboard:**
    - **Frontend:** [`src/components/AICTEPointsTracker.jsx`](file:///d:/Club-Sync/ClubSync/src/components/AICTEPointsTracker.jsx) & [`CampusLeaderboard.jsx`](file:///d:/Club-Sync/ClubSync/src/components/CampusLeaderboard.jsx)
18. **Interactive PICT Campus Map & Direction Guide:**
    - **Frontend:** [`src/components/CampusVenueMapModal.jsx`](file:///d:/Club-Sync/ClubSync/src/components/CampusVenueMapModal.jsx) (Auditorium, F-Building, Computer Center labs).
19. **Club Knowledge AI & Meeting Summarizer (Groq Llama 3):**
    - **Backend:** [`server/routes/ai.js`](file:///d:/Club-Sync/ClubSync/server/routes/ai.js) (RAG over constitutions and meeting minutes).
20. **Annual Officer Elections Booth:**
    - **Backend:** [`server/routes/elections.js`](file:///d:/Club-Sync/ClubSync/server/routes/elections.js) | Tables: `elections`, `election_candidates`, `election_votes` (Strict `UNIQUE(election_id, voter_id)` double-voting block).

---

## 🔒 5. Security Posture & Architecture Rules

- **Zero Dependency CVEs:** Audited across both root and backend trees with `npm audit` reporting 0 vulnerabilities.
- **SQL Injection Defense:** Strict rule: **Never** concatenate strings into SQL queries. Always use `$1, $2, ...` placeholders with pg pool parameters.
- **BOLA / IDOR Scoping:**
  - Route handlers verifying officer permissions use `requireOfficer('clubId')` or verify `events.club_id` before querying.
  - Non-officer students are strictly scoped to their own records:
    - Attendees roster (`GET /api/events/:id/attendees`) is restricted to officers of the event's club.
    - Payment receipts (`GET /api/payments/:id/receipt`) can only be retrieved by the payer or the organizing club's officers.
    - Inventory requests (`GET /api/inventory/clubs/:clubId/requests`) show only personal loans to regular students.

---

## 📁 6. Key File Locations & Entrypoints

- **Frontend Core:**
  - App routing: [`src/App.jsx`](file:///d:/Club-Sync/ClubSync/src/App.jsx)
  - Global Context: [`src/context/ClubSyncContext.jsx`](file:///d:/Club-Sync/ClubSync/src/context/ClubSyncContext.jsx)
  - Club Hub & Tab Navigation: [`src/pages/ClubDetail.jsx`](file:///d:/Club-Sync/ClubSync/src/pages/ClubDetail.jsx)
  - Event Detail & Officer Controls: [`src/pages/EventDetail.jsx`](file:///d:/Club-Sync/ClubSync/src/pages/EventDetail.jsx)
- **Backend Core:**
  - Server entry: [`server/index.js`](file:///d:/Club-Sync/ClubSync/server/index.js)
  - DB connection pool: [`server/db.js`](file:///d:/Club-Sync/ClubSync/server/db.js)
  - Auth middleware: [`server/middleware/auth.js`](file:///d:/Club-Sync/ClubSync/server/middleware/auth.js)
  - Dispatcher: [`server/services/webhookDispatcher.js`](file:///d:/Club-Sync/ClubSync/server/services/webhookDispatcher.js)

---

## 💻 7. How to Launch & Develop in a Fresh Session

```bash
# Terminal 1: Start Backend (Port 5000)
cd server
node index.js

# Terminal 2: Start Frontend (Port 5173)
npm run dev
```

### Windows PowerShell Guidance:
- When executing temporary Node verification scripts, write a temporary `.cjs` file and run `node script.cjs` to avoid PowerShell multiline double-quote string escaping errors.
- Always delete temporary scripts before committing.

---

## 🌿 8. Git History & Current Remote Status

- **Remote Branch:** `https://github.com/Vedant1442/ClubSync.git` (`origin/main`)
- **Recent Clean Commit Series:**
  1. `5285c10`: `fix(security): patch BOLA in attendee roster, receipt IDOR, live QA authorization, and task tampering`
  2. `e6b773e`: `feat(crm): implement Corporate Sponsorship & Brand Outreach CRM with Kanban pipeline, tier deliverables, and financial tracking`
  3. `22d6caf`: `feat(webhooks): implement Discord & Telegram Multi-Channel Webhook Bridge with auto-relay and broadcast blast`
  4. `0bd73c3`: `feat(kiosk): implement Event Day Desk Kiosk Mode with continuous scanning, thermal badge printing, and walk-in registration`
  5. `0ceb3a3`: `feat(mentorship): implement Peer Mentorship & Senior-Junior Project Pairing Hub with domain profiles, slot booking, and star reviews`
  6. `eb09694`: `feat(governance): implement Club Constitution, By-Laws & Resolution Amendment Voting Portal with supermajority tracking and side-by-side diffs`
  7. `02788a2`: `docs: overhaul repository with showcase README, MIT License, CI/CD workflows, issue templates, and git cleanup`

---

*This document contains all architectural context, database structures, seeded credentials, and technical decisions needed for any AI agent or developer to immediately resume work on ClubSync.*
