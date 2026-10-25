# ClubSync: Presentation Report & 15-Minute Multi-Speaker Script 🎓

**Project Title:** ClubSync — The Unified Collegiate Society & Event Operations Platform  
**Target Institution:** SCTR's Pune Institute of Computer Technology (PICT), Pune  
**Session Date:** October 2026  
**Format:** 15-Minute Live Presentation + Live Interactive System Demo + Jury Viva  

---

## Part 1: Comprehensive Presentation Report & Engineering Dossier

### 1.1 Executive Summary & Collegiate Problem Context
Collegiate student bodies, tech clubs (IEEE, ACM, CSI, EDC, Robocon), and academic event committees at premier engineering institutions face acute operational friction. Operations are currently fractured across disparate, unintegrated tools:
- **Event Registrations & Gate Operations:** Handled through Google Forms prone to proxy attendance, chaotic manual check-in desks with long queues, and unverified paper tickets.
- **Financial Integrity & Treasury:** Student transactions occur through personal UPI QR codes, requiring officers to manually cross-reference bank transaction UTR numbers in personal spreadsheets with zero gymkhana audit readiness.
- **Sponsorship & Industry Outreach:** Lost in disorganized personal WhatsApp chats and unmonitored email threads, resulting in dropped brand deliverables and lost corporate funding.
- **Governance & Democratic Integrity:** Constitutional by-law amendments and annual elections are executed informally without verifiable quorum or supermajority tracking.
- **Academic Compliance:** Manually typed Dean On-Duty (OD/DL) leave letters and non-verifiable paper certificates are prone to forgery.

**ClubSync** resolves this systemic fragmentation through a unified, high-concurrency web platform tailored for engineering campus realities.

---

### 1.2 System Architecture & Tech Stack Highlights

```
                           ┌──────────────────────────────────────────────┐
                           │      ClubSync Unified Campus Ecosystem       │
                           └──────────────────────┬───────────────────────┘
                                                  │
         ┌──────────────────┬─────────────────────┼────────────────────┬──────────────────┐
         ▼                  ▼                     ▼                    ▼                  ▼
┌─────────────────┐ ┌───────────────┐ ┌───────────────────────┐ ┌───────────────┐ ┌──────────────┐
│  Gate Kiosk &   │ │ Sponsorship & │ │ Democratic Governance │ │ Multi-Channel │ │ PWA Offline  │
│ Thermal Badges  │ │ YouPI Ledger  │ │  & Senior Mentorship  │ │  Webhooks & AI│ │ & Anti-Fraud │
└─────────────────┘ └───────────────┘ └───────────────────────┘ └───────────────┘ └──────────────┘
```

---

## Part 2: Workload Distribution Matrix (6 Team Members)

To reflect real-world engineering project governance, the project workload is distributed across **6 specialized roles**, with the **Team Leader** spearheading system architecture, product design, security, and database foundations (35% weighted contribution), while each member commands a functional subsystem (13% weighted contribution each).

### Detailed Contribution Profiles

| Member | Title & Focus Area | Key Architectural Modules & Artifacts Built | Key Technologies |
| :--- | :--- | :--- | :--- |
| **Member 1** *(Team Leader)* | **Lead Architect, Database Engineer & Product Designer** | • System Architecture, PRD formulation, and End-to-End Product Design<br>• Neon Serverless PostgreSQL relational schema (18+ normalized tables, foreign keys, triggers)<br>• Express REST API routing foundation, Helmet security headers, compression & rate-limiting<br>• Authentication infrastructure: JWT token lifecycle, bcrypt password hashing, and role-based access control (`requireOfficer`)<br>• Security Hardening: BOLA/IDOR elimination across attendee rosters and financial receipts; 100% Parameterized SQL (`$1, $2`) injection defense; 0 CVEs npm audit compliance | Node.js 20, Express, PostgreSQL, Neon DB, JWT, Helmet, REST Architecture |
| **Member 2** | **Event Day Operations & Hardware Integration Engineer** | • Event Day Desk "Kiosk Mode" (`EventKioskModal.jsx`)<br>• Continuous USB/Bluetooth Barcode & QR scanner wedge listener with hands-free focus retention and audio synthesizer feedback (`playBeep`)<br>• Thermal Receipt & Badge Printing Subsystem (`@media print` 80mm delegate badges with PRN, Branch, Barcode)<br>• Rapid 15-second Spot Walk-In gate registration pipeline (`POST /api/events/:id/walk-in`)<br>• Rotating anti-screenshot digital attendee passes with dynamic SHA tokens | JavaScript Canvas, Web Audio API, DOM Print Subsystem, React Hooks |
| **Member 3** | **Financial Systems & Sponsorship CRM Lead** | • YouPI Zero-Fee Collegiate Payment Gateway (`UPIPaymentModal.jsx`, `PaymentReceiptModal.jsx`)<br>• Direct UPI deep-linking (GPay/PhonePe/Paytm intent strings) with UTR transaction verification<br>• Tamper-proof collegiate treasury ledger and automated e-receipt generation<br>• Corporate Sponsorship & Brand Outreach CRM Kanban Board (`ClubSponsorshipTab.jsx`, `club_sponsorship_deals`)<br>• Tier Milestone Checklist engine (`TITLE`, `POWERED_BY`, `ASSOCIATE`, `IN_KIND`) and 1-Click Gymkhana Audit CSV export | React State, CSV Parsing, UPI Protocol, Kanban UX, SQL Aggregations |
| **Member 4** | **Governance, Mentorship & Academic Compliance Lead** | • Democratic Constitution & By-Law Amendment Referendum Portal (`ClubResolutionAmendments.jsx`)<br>• Side-by-side constitutional red/green diff box comparing existing text with proposed amendments<br>• Quorum validation and 66.6% supermajority calculation engine<br>• Senior-Junior Peer Mentorship Pairing Hub (`ClubMentorshipTab.jsx`) with tech domain matching, Google Meet/campus room assignments, and star rating reviews<br>• Official Dean On-Duty (OD/DL) Leave Letter Generator with dynamic reference codes and advisor seals | Text Diffing Engine, Voting Logic, jsPDF Document Generator |
| **Member 5** | **Communications, Real-Time Systems & AI Lead** | • Multi-Channel Discord & Telegram Webhook Syndicate (`server/services/webhookDispatcher.js`)<br>• Automated rich embed generation for event syndication and Emergency Broadcast Blaster<br>• Dispatch audit logging and webhook health monitoring dashboard (`club_webhook_logs`)<br>• Slido-style Keynote Live Stage Q&A (`EventLiveQAModal.jsx`) with live upvoting, question pinning, and projector view<br>• Groq Llama 3 AI integration for club constitutional RAG query answering and meeting minutes summarization | Discord Webhooks API, Telegram Bot API, Groq AI SDK (Llama 3), Real-Time Polling |
| **Member 6** | **UI/UX Design System, PWA & Public Credential Engineer** | • Responsive UI/UX Design System built with Tailwind CSS and Framer Motion micro-interactions<br>• Progressive Web App (PWA) configuration with Workbox Service Worker caching for offline symposium use<br>• Public Certificate Anti-Fraud Verification Registry (`/verify/:id`, `VerifyCredential.jsx`)<br>• 1-Click **"Add to LinkedIn Profile"** credential URL pre-filling engine<br>• Club Hardware & Robotics Lab Equipment Checkout Inventory Tracker (`ClubInventoryTab.jsx`) | Tailwind CSS, Vite PWA, Framer Motion, Workbox, LinkedIn Org API Specs |

---

## Part 3: Timed 15-Minute Presentation Script (Word-for-Word)

> **Total Time:** 15 Minutes (900 seconds) + 5 Minutes Q&A.  
> **Speaker Order:** Member 1 ➔ Member 2 ➔ Member 3 ➔ Member 4 ➔ Member 5 ➔ Member 6 ➔ Member 1 (Wrap-up).

---

### Segment 1: Introduction, Problem Scope & System Architecture
**Speaker:** **Member 1 (Team Leader — Architecture & Product Design)**  
**Time Allocation:** `00:00 - 02:30` (2 mins 30 secs)  
**Visual Cue / On Screen:** Presentation Title Slide ➔ Live System Architecture Diagram ➔ Database Schema ERD.

> *"Respected panel, professors, and fellow colleagues. Good morning/afternoon.*
>
> *I am **[Leader Name]**, leader of Team ClubSync. Today, our team is proud to present **ClubSync** — the Unified Collegiate Society and Event Operations Platform, architected specifically for high-density engineering environments like PICT.*
>
> *Every semester, campus societies like IEEE, ACM, CSI, and Robocon host flagship hackathons, symposia, and workshops. Yet, behind the scenes, student officers face operational chaos: registrations rely on fragile Google Forms; payments bounce between personal UPI QR codes with zero financial auditability; attendance desks struggle with chaotic physical queues; and club governance happens informally over WhatsApp.*
>
> *As the lead architect and product designer, my objective was to engineer a robust, enterprise-grade web ecosystem capable of eliminating these pain points entirely.*
>
> *Our architecture combines a reactive **Vite and React 18** client with a hardened **Node.js 20 Express** REST engine, backed by **Neon Serverless PostgreSQL**. On the database tier, we designed a normalized relational schema of 18 tables with strict foreign key constraints and ACID guarantees. Crucially, we enforce a strict 100% parameterized SQL query model with zero string interpolation, neutralizing SQL injection vectors.*
>
> *On the security perimeter, our endpoints are protected by Helmet security headers, rate limiters, bcrypt-hashed credentials, and custom Broken Object-Level Authorization (BOLA) middleware that strictly fences sensitive student data and financial ledgers to authorized club officers.*
>
> *I will now hand over to **[Member 2]** to demonstrate our revolutionary Event Day Kiosk and gate check-in pipeline."*

---

### Segment 2: Event Day Desk Operations & Kiosk Scanner
**Speaker:** **Member 2 (Event Operations & Hardware Integration)**  
**Time Allocation:** `02:30 - 05:00` (2 mins 30 secs)  
**Visual Cue / On Screen:** Live Demo on `http://localhost:5173` ➔ Log in as `officer@clubsync.app` ➔ Navigate to Event Detail ➔ Click **"Desk Kiosk Mode"** ➔ Scan a barcode / demo walk-in.

> *"Thank you, [Leader Name]. Good morning everyone. I am **[Member 2]**, and I led the Event Day Operations and Hardware Integration modules.*
>
> *On event morning at any major college auditorium, registration desks become bottlenecks. Volunteer laptops struggle with slow network forms, leading to 45-minute queues.*
>
> *To solve this, I built the **ClubSync Event Day Desk Kiosk** [pointing to screen]. This is a high-throughput, hands-free operational terminal.*
>
> *Notice three key technical innovations:*
> 1. *First, the **Continuous Scanner Wedge Listener**: Built directly into the DOM lifecycle, it automatically recaptures focus on any incoming USB or Bluetooth barcode/QR scanner stream in milliseconds. As an attendee presents their digital pass, the scanner triggers an instant attendee lookup, plays an audio synthesizer chime, and logs check-in in under 400 milliseconds.*
> 2. *Second, **Instant Thermal Badge Printing**: Integrated using CSS `@media print` rules calibrated specifically for 80-millimeter thermal receipt printers. With one tap or upon auto-scan, it prints a physical delegate badge complete with student name, PRN, branch, team name, and a scannable verification barcode.*
> 3. *Third, **Spot Walk-In Registration**: For students who show up unregistered at the auditorium doors, officers can register them in less than 15 seconds through our walk-in pipeline, which simultaneously registers the record, generates their credential ID, and prints their badge.*
>
> *Next, **[Member 3]** will showcase how we overhauled financial compliance and corporate sponsorships."*

---

### Segment 3: YouPI Zero-Fee Payments & Sponsorship Outreach CRM
**Speaker:** **Member 3 (Financial Systems & Sponsorship CRM)**  
**Time Allocation:** `05:00 - 07:30` (2 mins 30 secs)  
**Visual Cue / On Screen:** Click **"Register / Pay ₹100"** ➔ Open **YouPI Payment Modal** ➔ Switch to Club Detail ➔ Click **"Sponsorships CRM"** Kanban Board.

> *"Thank you, [Member 2]. I am **[Member 3]**, responsible for ClubSync's Financial Systems and Sponsorship CRM.*
>
> *Commercial payment gateways like Razorpay or Stripe charge 2 to 3 percent per transaction and require complex institutional GST registrations, which student clubs do not possess. Most clubs resort to unofficial student Google Pay numbers, creating major accounting discrepancies during annual Gymkhana audits.*
>
> *To eliminate gateway fees entirely, I developed the **YouPI Zero-Fee Gateway** [pointing to modal]. It dynamically generates deep-linked UPI intents for GPay, PhonePe, and Paytm pointing directly to the club's designated account. When a student pays, they input their 12-digit Bank UTR reference. The transaction is logged into a tamper-evident audit ledger, and the officer verifies it with one click, issuing an official collegiate e-receipt.*
>
> *Next, moving beyond payments, collegiate symposia survive on corporate sponsorships. Traditionally, brand outreach is tracked across fragmented personal spreadsheets.*
>
> *We implemented the **Corporate Sponsorship & Brand Outreach CRM** [pointing to Kanban board]. Built as a 5-stage Kanban pipeline—from initial Lead to Funds Received—it tracks active deal values, signed MOUs, and tier milestones.*
>
> *When an officer selects a sponsorship tier—such as Title or Associate Sponsor—our engine automatically activates the required contractual deliverables: auditorium standee placements, logo on banners, keynote speaking slots, and resume disclosures. Officers can check off deliverables as they are executed and export an audit-ready CSV dossier with one click for the college accounts department.*
>
> *I now invite **[Member 4]** to present our Democratic Governance and Mentorship framework."*

---

### Segment 4: Democratic Governance, Mentorship & Academic Integrity
**Speaker:** **Member 4 (Governance, Mentorship & Academic Compliance)**  
**Time Allocation:** `07:30 - 10:00` (2 mins 30 secs)  
**Visual Cue / On Screen:** Switch to **"By-Laws & Resolutions"** Tab ➔ Show red/green side-by-side diff ➔ Open **Mentorship Tab** ➔ Open **OD Letter Modal**.

> *"Thank you, [Member 3]. Good day everyone, I am **[Member 4]**, and I engineered ClubSync's Governance, Peer Mentorship, and Academic Compliance infrastructure.*
>
> *Student societies are democratic institutions, yet their constitutions often sit as static, forgotten PDF files, with amendments passed informally.*
>
> *In ClubSync, we pioneered the **Constitutional By-Law Amendment Portal** [pointing to screen]. Officers can formally table amendments to club constitutions. The interface displays an automated side-by-side red and green diff comparing the existing constitutional clause with the proposed revision.*
>
> *More importantly, our backend enforces mathematical democratic thresholds: amendments require a strict 66.6% supermajority and valid quorum calculation before they can be ratified into club law. Every vote is recorded with mandatory rationale comments for institutional transparency.*
>
> *Next is our **Senior-Junior Mentorship Pairing Hub**: Senior students in Third and Final Year publish mentor profiles tagged with technical competencies like DSA, Web3, and Robotics. Junior students can book 1-on-1 pairing slots with automatic campus venue or Google Meet routing, and leave verified star ratings that reward mentors with AICTE activity hours.*
>
> *Finally, addressing academic compliance: we built the **Automated On-Duty (OD/DL) Leave Letter Generator**. Rather than students manually writing applications, ClubSync auto-generates formal leave sanction letters for attendees, pre-formatted for department heads and faculty advisors with unique verification references.*
>
> *I will now pass the stage to **[Member 5]** to present our Webhook syndication and AI systems."*

---

### Segment 5: Multi-Channel Webhooks, Live Q&A & Groq AI
**Speaker:** **Member 5 (Communications, Real-Time Systems & AI)**  
**Time Allocation:** `10:00 - 12:30` (2 mins 30 secs)  
**Visual Cue / On Screen:** Open Club **"Webhooks & Syndication"** Tab ➔ Send Test Ping / Blast ➔ Open **Live Q&A Projector View** ➔ Ask a question in **Club AI Assistant**.

> *"Thank you, [Member 4]. I am **[Member 5]**, and I led our Communications, Real-Time Interaction, and AI subsystems.*
>
> *Students rarely check emails for club updates; their attention lives on Discord and Telegram. Previously, publicity teams manually copied and pasted announcements across dozens of groups.*
>
> *We built the **Multi-Channel Webhook Syndicate** [pointing to Webhooks tab]. The moment an officer publishes an event or urgent room change in ClubSync, our backend dispatcher translates the event payload into rich, color-coded Discord Embeds and formatted Telegram HTML posts, broadcasting them across connected channels simultaneously. We also included an emergency blast broadcaster with full delivery health logging.*
>
> *Next, for symposium keynote sessions, we built the **Slido-Style Live Stage Q&A** [pointing to Q&A modal]. In an auditorium, passing around microphones is inefficient. With our live projector view, audience members submit and upvote questions in real-time. Speakers can pin highlighted questions and mark them answered live on stage.*
>
> *Lastly, we integrated **Groq Llama 3 AI** into our backend. Operating over club meeting minutes and constitutional documents, it provides an intelligent conversational assistant that lets members ask natural language questions about club policies, past decisions, and event guidelines in sub-second response times.*
>
> *I now invite **[Member 6]** to cover our Frontend Design System, PWA offline capabilities, and Public Verification Registry."*

---

### Segment 6: UI/UX Design System, PWA & Public Verification Registry
**Speaker:** **Member 6 (Frontend UI/UX, PWA & Public Credential Registry)**  
**Time Allocation:** `12:30 - 14:15` (1 min 45 secs)  
**Visual Cue / On Screen:** Toggle Mobile Responsive View ➔ Show PWA install prompt / offline behavior ➔ Navigate to public verification link `http://localhost:5173/verify/PICT-CERT-2026-X89` ➔ Click **"Add to LinkedIn"**.

> *"Thank you, [Member 5]. I am **[Member 6]**, and I focused on our Frontend Architecture, Progressive Web App engineering, and the Public Verification Registry.*
>
> *From day one, our design philosophy was mobile-first, tactile, and zero-latency. Using **Tailwind CSS** and **Framer Motion**, we crafted an intuitive, dark-mode native interface with micro-interactions, responsive sidebars, and fluid drawer states.*
>
> *Campus Wi-Fi in college auditoriums and basements is notoriously unreliable. To guarantee zero operational interruption, we configured ClubSync as a full **Progressive Web App (PWA)** using modern service worker precaching. Essential UI shells and cached registration tables remain interactive even when connection drops.*
>
> *A major innovation is our **Public Certificate Verification Registry** [pointing to `/verify/:id`]. Certificate forgery is a widespread problem on campus resumes. In ClubSync, every event certificate carries a cryptographic ID and a QR code pointing to a public verification endpoint. Anyone—recruiters or faculty—can verify the attendee's name, PRN, event date, and digital institutional seal.*
>
> *With our 1-click **'Add to LinkedIn'** integration, students can immediately export and embed their verified ClubSync credentials onto their professional LinkedIn profiles with pre-filled certification metadata.*
>
> *I now hand back to our team lead, **[Member 1]**, for our project summary and closing remarks."*

---

### Segment 7: Project Summary, Production Metrics & Closing
**Speaker:** **Member 1 (Team Leader)**  
**Time Allocation:** `14:15 - 15:00` (45 secs)  
**Visual Cue / On Screen:** GitHub Repository / Project Metrics Summary Slide ➔ Thank You & Q&A Slide.

> *"Thank you, [Member 6].*
>
> *To summarize: in ClubSync, our team has built a production-ready, security-audited, full-stack campus platform spanning 20+ fully realized modules:*
> - *Desk Kiosk check-in with thermal printing,*
> - *Zero-fee UPI payments and corporate sponsorship CRMs,*
> - *Democratic constitutional governance and peer mentorship,*
> - *Multi-channel Discord/Telegram webhooks and AI summarization,*
> - *All backed by a secure PostgreSQL database with zero dependency vulnerabilities.*
>
> *ClubSync modernizes the collegiate student society experience, setting a new standard for campus technology operations.*
>
> *Thank you for your time. The floor is now open, and our team would be pleased to answer your questions."*

---

## Part 4: High-Probability Evaluator Q&A & Rehearsal Cheat Sheet

| Likely Evaluator Question | Recommended Answering Member | Golden Answer Strategy & Technical Rebuttal |
| :--- | :--- | :--- |
| **Q1: "How do you prevent a student from voting twice in an election or referendum?"** | **Member 1 (Leader)** or **Member 4** | *"In our PostgreSQL schema, the `club_resolution_votes` and `election_votes` tables enforce a strict composite unique constraint: `UNIQUE(resolution_id, voter_id)` and `UNIQUE(election_id, voter_id)`. Any duplicate submission is rejected at the database engine level with a 409 Conflict error, guaranteeing that double voting is impossible regardless of network retries or client tampering."* |
| **Q2: "What happens if campus Wi-Fi dies during gate check-in at the auditorium?"** | **Member 2** or **Member 6** | *"ClubSync operates as a Service-Worker powered Progressive Web App (PWA). The kiosk scanner UI assets are precached in browser cache storage. For check-in operations, requests are held and synchronized upon reconnection, and the local scanner wedge maintains continuous hardware listener capability without dropping input."* |
| **Q3: "How do you protect against SQL Injection and BOLA (Broken Object-Level Authorization)?"** | **Member 1 (Leader)** | *"First, 100% of our database queries use pg-pool parameterized tokens `$1, $2, ...` with zero string concatenation. Second, our `requireOfficer` and `requireAuth` middlewares verify ownership at the controller level: a student cannot inspect attendee rosters or other students' financial payment receipts simply by manipulating event or receipt IDs in the URL."* |
| **Q4: "Why not use an existing platform like Eventbrite or Google Forms?"** | **Member 3** | *"Eventbrite charges high percentage commissions and lacks Indian UPI integration, AICTE college activity credit tracking, and collegiate Dean On-Duty letter generation. Google Forms lacks barcode verification, leads to duplicate proxies, has zero financial reconciliation, and cannot drive live Discord syndication or thermal badge printing."* |
| **Q5: "How does the webhook system handle Discord or Telegram rate limits during a broadcast?"** | **Member 5** | *"Our `webhookDispatcher.js` utilizes isolated try-catch dispatch blocks with exponential backoff and audit logging. Each webhook execution is recorded in `club_webhook_logs` with HTTP response codes, latency metrics, and failure traces so officers have full visibility into delivery health."* |

---

## Part 5: Practical Pre-Presentation Checklist (Night Before & Morning Of)

1. **Local Test Servers Running:**
   ```bash
   # Terminal 1: Backend
   cd server && node index.js
   # Terminal 2: Frontend
   npm run dev
   ```
2. **Browser Tabs Pre-Opened in Chrome (Full Screen `F11`):**
   - Tab 1: `http://localhost:5173/login` (Seeded Officer: `officer@clubsync.app` / `Password123!`)
   - Tab 2: Event Desk Kiosk (`/events/:id` ➔ Kiosk Modal ready)
   - Tab 3: Corporate Sponsorship Kanban Board (`/clubs/:id` ➔ Sponsorship Tab)
   - Tab 4: Public Verification (`http://localhost:5173/verify/PICT-CERT-2026-X89`)
3. **Hardware / Scanner:**
   - If using a physical barcode scanner: plug into USB port 5 minutes before presentation.
   - If using keyboard simulation: have a sample PRN (e.g. `C2K231189`) copied in clipboard ready to paste into the scanner input.
