import os
import sys
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

BASE_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = BASE_DIR / "docs"
DOCS_DIR.mkdir(exist_ok=True)

PRIMARY = colors.HexColor("#1E3A8A")     # Blue 900
SECONDARY = colors.HexColor("#3B82F6")   # Blue 500
ACCENT = colors.HexColor("#4F46E5")      # Indigo 600
DARK_TEXT = colors.HexColor("#0F172A")   # Slate 900
MUTED_TEXT = colors.HexColor("#475569")  # Slate 600
LIGHT_BG = colors.HexColor("#F8FAFC")    # Slate 50
BORDER_COLOR = colors.HexColor("#CBD5E1") # Slate 300
HIGHLIGHT_BG = colors.HexColor("#EEF2FF") # Indigo 50

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(MUTED_TEXT)
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 810, "ClubSync — Collegiate Operations Platform | SCTR's PICT Pune")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(40, 804, 555, 804)

        # Footer (all pages)
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(40, 42, 555, 42)
        
        self.drawString(40, 30, "Confidential — For Academic Evaluation & Defense")
        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.drawRightString(555, 30, page_str)
        self.restoreState()

def setup_styles():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=6
    ))
    
    styles.add(ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=MUTED_TEXT,
        spaceAfter=14
    ))

    styles.add(ParagraphStyle(
        'SecHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=PRIMARY,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'SubSecHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=ACCENT,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT,
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        'BodyMuted',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=MUTED_TEXT,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        'BulletItem',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=DARK_TEXT,
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        'TableHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=0
    ))

    styles.add(ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=DARK_TEXT
    ))

    styles.add(ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=PRIMARY
    ))

    styles.add(ParagraphStyle(
        'ScriptSpoken',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=DARK_TEXT
    ))

    styles.add(ParagraphStyle(
        'CueLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=ACCENT
    ))

    return styles

def build_report_pdf(output_path, styles):
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )
    story = []

    # Title block
    story.append(Paragraph("ClubSync: Comprehensive Project Report & Engineering Dossier", styles['DocTitle']))
    story.append(Paragraph(
        "<b>Target Institution:</b> SCTR's Pune Institute of Computer Technology (PICT), Pune &nbsp;|&nbsp; <b>Date:</b> October 2026<br/>"
        "<b>Platform Scope:</b> Unified Collegiate Society & Event Operations Architecture",
        styles['DocSubTitle']
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceBefore=0, spaceAfter=10))

    # 1. Executive Summary
    story.append(Paragraph("1. Executive Summary & Problem Context", styles['SecHeading']))
    story.append(Paragraph(
        "Collegiate student societies and technical clubs at premier engineering institutions like PICT (e.g. IEEE, ACM, CSI, EDC, Robocon) face acute operational fragmentation across disconnected tools:",
        styles['BodyDark']
    ))
    story.append(Paragraph("• <b>Gate Bottlenecks & Proxy Attendance:</b> Registrations via Google Forms cause long queues, proxy check-ins, and manual ticket verification failures.", styles['BulletItem']))
    story.append(Paragraph("• <b>Treasury & Audit Risk:</b> Student payments bounce between personal UPI accounts, forcing officers to manually trace bank UTRs with zero gymkhana audit readiness.", styles['BulletItem']))
    story.append(Paragraph("• <b>Fragmented Sponsorship Outreach:</b> Corporate sponsorships get lost in personal WhatsApp threads, leading to dropped brand deliverables and lost funding.", styles['BulletItem']))
    story.append(Paragraph("• <b>Governance Breakdown:</b> Constitutional by-laws and annual officer elections are conducted informally without verifiable quorum or democratic supermajority tracking.", styles['BulletItem']))
    story.append(Paragraph("• <b>Academic Compliance:</b> Manual Dean On-Duty (OD/DL) leave letters and paper certificates are slow to approve and prone to fraudulent tampering.", styles['BulletItem']))
    story.append(Paragraph(
        "<b>ClubSync</b> solves this through a unified, high-concurrency collegiate platform engineered specifically for engineering campus operations.",
        styles['BodyDark']
    ))
    story.append(Spacer(1, 6))

    # 2. System Architecture
    story.append(Paragraph("2. System Architecture & Engineering Highlights", styles['SecHeading']))
    story.append(Paragraph(
        "ClubSync employs a modern reactive architecture designed for zero latency and enterprise-grade security compliance:",
        styles['BodyDark']
    ))

    arch_data = [
        [Paragraph("Tier / Layer", styles['TableHead']), Paragraph("Technology Choice", styles['TableHead']), Paragraph("Engineering Capabilities & Guarantees", styles['TableHead'])],
        [
            Paragraph("Frontend Client", styles['TableCellBold']),
            Paragraph("React 18, Vite, Tailwind CSS, Framer Motion", styles['TableCell']),
            Paragraph("Mobile-first tactile UI with dark mode, sub-100ms transitions, and PWA service worker caching for offline auditorium reliability.", styles['TableCell'])
        ],
        [
            Paragraph("Backend Engine", styles['TableCellBold']),
            Paragraph("Node.js 20, Express REST API, Helmet, CORS", styles['TableCell']),
            Paragraph("Hardened endpoints with Helmet security headers, compression, rate-limiting, and strict BOLA/IDOR authorization middleware.", styles['TableCell'])
        ],
        [
            Paragraph("Database & Storage", styles['TableCellBold']),
            Paragraph("Neon Serverless PostgreSQL (pg-pool)", styles['TableCell']),
            Paragraph("18+ normalized tables, composite foreign keys, ACID compliance, and 100% parameterized SQL query defense ($1, $2) with zero injection risk.", styles['TableCell'])
        ],
        [
            Paragraph("Real-Time & AI", styles['TableCellBold']),
            Paragraph("Discord/Telegram Webhooks, Groq Llama 3", styles['TableCell']),
            Paragraph("Multi-channel broadcast syndicator with health telemetry, plus sub-second AI assistant for constitutional queries and meeting summarization.", styles['TableCell'])
        ]
    ]

    t_arch = Table(arch_data, colWidths=[105, 130, 280])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_BG, colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 10))

    # 3. Workload Distribution Matrix
    story.append(Paragraph("3. Workload Distribution Matrix (6 Team Members)", styles['SecHeading']))
    story.append(Paragraph(
        "Workload is distributed across 6 specialized functional domains, with the Team Leader commanding architecture and core security (35% weighted contribution) and 5 members commanding specialized subsystems (13% weighted contribution each):",
        styles['BodyDark']
    ))

    matrix_data = [
        [Paragraph("Role / Member", styles['TableHead']), Paragraph("Subsystem Scope", styles['TableHead']), Paragraph("Key Architectural Modules Built", styles['TableHead']), Paragraph("Tech Stack", styles['TableHead'])],
        [
            Paragraph("<b>Member 1</b><br/>(Team Leader)", styles['TableCellBold']),
            Paragraph("Lead Architect & Database Lead<br/><i>(35% Weight)</i>", styles['TableCell']),
            Paragraph("• System Architecture & PRD formulation<br/>• Neon Serverless PostgreSQL relational schema (18+ tables)<br/>• Express REST API foundation & Helmet security headers<br/>• JWT auth lifecycle & BOLA/IDOR protection<br/>• 100% Parameterized SQL injection defense", styles['TableCell']),
            Paragraph("Node.js 20, Express, PostgreSQL, Neon DB, JWT, Helmet", styles['TableCell'])
        ],
        [
            Paragraph("<b>Member 2</b>", styles['TableCellBold']),
            Paragraph("Event Operations & Hardware<br/><i>(13% Weight)</i>", styles['TableCell']),
            Paragraph("• Event Day Desk Kiosk Mode (EventKioskModal.jsx)<br/>• Continuous USB/Bluetooth scanner wedge listener<br/>• Instant Thermal Receipt & Badge Printing (80mm)<br/>• 15-second Spot Walk-In gate registration pipeline<br/>• Anti-screenshot digital passes with SHA tokens", styles['TableCell']),
            Paragraph("Canvas API, Web Audio API, DOM Print, React Hooks", styles['TableCell'])
        ],
        [
            Paragraph("<b>Member 3</b>", styles['TableCellBold']),
            Paragraph("Financial Systems & CRM Lead<br/><i>(13% Weight)</i>", styles['TableCell']),
            Paragraph("• YouPI Zero-Fee Collegiate Payment Gateway<br/>• Direct UPI deep-linking (GPay/PhonePe/Paytm)<br/>• Tamper-proof collegiate treasury ledger & e-receipts<br/>• Corporate Sponsorship & Outreach CRM Kanban Board<br/>• 1-Click Gymkhana Audit CSV export engine", styles['TableCell']),
            Paragraph("React State, CSV Parsing, UPI Protocol, Kanban UX", styles['TableCell'])
        ],
        [
            Paragraph("<b>Member 4</b>", styles['TableCellBold']),
            Paragraph("Governance & Compliance<br/><i>(13% Weight)</i>", styles['TableCell']),
            Paragraph("• Constitutional By-Law Amendment Portal<br/>• Side-by-side constitutional red/green diff box<br/>• 66.6% supermajority & quorum validation engine<br/>• Senior-Junior Peer Mentorship Pairing Hub<br/>• Automated Dean On-Duty (OD/DL) Leave Generator", styles['TableCell']),
            Paragraph("Text Diffing, Voting Logic, jsPDF, Math Engine", styles['TableCell'])
        ],
        [
            Paragraph("<b>Member 5</b>", styles['TableCellBold']),
            Paragraph("Communications & AI Lead<br/><i>(13% Weight)</i>", styles['TableCell']),
            Paragraph("• Multi-Channel Discord & Telegram Webhook Syndicate<br/>• Automated color-coded embed generation & blast blaster<br/>• Webhook dispatch health logs (club_webhook_logs)<br/>• Slido-style Keynote Live Stage Q&A with upvoting<br/>• Groq Llama 3 AI for constitutional RAG & minutes summary", styles['TableCell']),
            Paragraph("Discord/Telegram APIs, Groq AI SDK, Polling", styles['TableCell'])
        ],
        [
            Paragraph("<b>Member 6</b>", styles['TableCellBold']),
            Paragraph("UI/UX & Public Credentials<br/><i>(13% Weight)</i>", styles['TableCell']),
            Paragraph("• Responsive UI/UX Design System with Tailwind CSS<br/>• Progressive Web App (PWA) Workbox precaching<br/>• Public Certificate Anti-Fraud Verification (/verify/:id)<br/>• 1-Click 'Add to LinkedIn Profile' credential exporter<br/>• Robotics Lab Equipment Inventory Checkout Tracker", styles['TableCell']),
            Paragraph("Tailwind CSS, Vite PWA, Framer Motion, Workbox", styles['TableCell'])
        ]
    ]

    t_matrix = Table(matrix_data, colWidths=[75, 105, 235, 100])
    t_matrix.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [LIGHT_BG, colors.white]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t_matrix)
    story.append(Spacer(1, 10))

    # 4. Evaluator Viva Q&A
    story.append(Paragraph("4. Technical Viva Defense & Evaluator Rehearsal Q&A", styles['SecHeading']))
    
    qa_list = [
        ("Q1: How do you prevent double-voting in an election or referendum?",
         "In our PostgreSQL schema, the `club_resolution_votes` and `election_votes` tables enforce composite unique constraints: `UNIQUE(resolution_id, voter_id)` and `UNIQUE(election_id, voter_id)`. Any duplicate submission is rejected at the database engine level with a 409 Conflict error, guaranteeing mathematical vote integrity."),
        ("Q2: What happens if campus Wi-Fi drops during gate check-in at the auditorium?",
         "ClubSync operates as a Service-Worker powered Progressive Web App (PWA). Kiosk scanner assets and cached registration rosters reside in browser storage. The scanner wedge continues listening to incoming hardware streams and synchronizes state upon network re-establishment."),
        ("Q3: How do you eliminate SQL Injection and Broken Object-Level Authorization (BOLA)?",
         "100% of our database queries strictly use pg parameterized tokens ($1, $2) with zero string concatenation. On the authorization layer, `requireOfficer` and `requireAuth` middlewares verify ownership at the controller level: students cannot inspect attendee rosters or other members' payment receipts by altering URL parameters."),
        ("Q4: Why not simply use Eventbrite or Google Forms?",
         "Eventbrite takes 2-3% commission fees and lacks Indian UPI integration, AICTE credit tracking, and collegiate Dean On-Duty letter generation. Google Forms allows proxy attendance, lacks barcode check-in, provides zero financial reconciliation, and cannot drive live Discord syndication or thermal badges.")
    ]

    for q, a in qa_list:
        story.append(Paragraph(f"<b>{q}</b>", styles['SubSecHeading']))
        story.append(Paragraph(a, styles['BodyDark']))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated: {output_path}")

def build_script_pdf(output_path, styles):
    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )
    story = []

    # Title block
    story.append(Paragraph("ClubSync: 15-Minute Multi-Speaker Presentation Script", styles['DocTitle']))
    story.append(Paragraph(
        "<b>Format:</b> 15-Minute Word-for-Word Live Script (900s) + 5-Minute Evaluator Viva<br/>"
        "<b>Order:</b> Member 1 ➔ Member 2 ➔ Member 3 ➔ Member 4 ➔ Member 5 ➔ Member 6 ➔ Member 1 (Wrap-Up)",
        styles['DocSubTitle']
    ))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceBefore=0, spaceAfter=8))

    segments = [
        {
            "num": "Segment 1",
            "speaker": "Member 1 (Team Leader — Architecture & Product Design)",
            "time": "00:00 - 02:30 (2 mins 30 secs)",
            "visual": "Presentation Title Slide ➔ Live System Architecture Diagram ➔ Database Schema ERD",
            "script": (
                "\"Respected panel, professors, and fellow colleagues. Good morning/afternoon.<br/><br/>"
                "I am <b>[Leader Name]</b>, leader of Team ClubSync. Today, our team is proud to present <b>ClubSync</b> — "
                "the Unified Collegiate Society and Event Operations Platform, architected specifically for high-density engineering environments like PICT.<br/><br/>"
                "Every semester, campus societies like IEEE, ACM, CSI, and Robocon host flagship hackathons, symposia, and workshops. "
                "Yet, behind the scenes, student officers face operational chaos: registrations rely on fragile Google Forms; payments bounce "
                "between personal UPI QR codes with zero financial auditability; attendance desks struggle with chaotic physical queues; "
                "and club governance happens informally over WhatsApp.<br/><br/>"
                "As the lead architect and product designer, my objective was to engineer a robust, enterprise-grade web ecosystem capable "
                "of eliminating these pain points entirely.<br/><br/>"
                "Our architecture combines a reactive <b>Vite and React 18</b> client with a hardened <b>Node.js 20 Express</b> REST engine, "
                "backed by <b>Neon Serverless PostgreSQL</b>. On the database tier, we designed a normalized relational schema of 18 tables "
                "with strict foreign key constraints and ACID guarantees. Crucially, we enforce a strict 100% parameterized SQL query model "
                "with zero string interpolation, neutralizing SQL injection vectors.<br/><br/>"
                "On the security perimeter, our endpoints are protected by Helmet security headers, rate limiters, bcrypt-hashed credentials, "
                "and custom Broken Object-Level Authorization (BOLA) middleware that strictly fences sensitive student data and financial ledgers to authorized club officers.<br/><br/>"
                "I will now hand over to <b>[Member 2]</b> to demonstrate our revolutionary Event Day Kiosk and gate check-in pipeline.\""
            )
        },
        {
            "num": "Segment 2",
            "speaker": "Member 2 (Event Operations & Hardware Integration)",
            "time": "02:30 - 05:00 (2 mins 30 secs)",
            "visual": "Live Demo on localhost:5173 ➔ Log in as officer@clubsync.app ➔ Event Detail ➔ 'Desk Kiosk Mode' ➔ Scan Barcode",
            "script": (
                "\"Thank you, [Leader Name]. Good morning everyone. I am <b>[Member 2]</b>, and I led the Event Day Operations and Hardware Integration modules.<br/><br/>"
                "On event morning at any major college auditorium, registration desks become bottlenecks. Volunteer laptops struggle with slow network forms, leading to 45-minute queues.<br/><br/>"
                "To solve this, I built the <b>ClubSync Event Day Desk Kiosk</b> [pointing to screen]. This is a high-throughput, hands-free operational terminal.<br/><br/>"
                "Notice three key technical innovations:<br/>"
                "1. First, the <b>Continuous Scanner Wedge Listener</b>: Built directly into the DOM lifecycle, it automatically recaptures focus on any incoming USB or Bluetooth barcode/QR scanner stream in milliseconds. As an attendee presents their digital pass, the scanner triggers an instant lookup, plays an audio synthesizer chime, and logs check-in in under 400 milliseconds.<br/>"
                "2. Second, <b>Instant Thermal Badge Printing</b>: Integrated using CSS @media print rules calibrated specifically for 80-millimeter thermal receipt printers. With one tap or upon auto-scan, it prints a physical delegate badge complete with student name, PRN, branch, team name, and a scannable verification barcode.<br/>"
                "3. Third, <b>Spot Walk-In Registration</b>: For students who show up unregistered at the auditorium doors, officers can register them in less than 15 seconds through our walk-in pipeline, which simultaneously registers the record, generates their credential ID, and prints their badge.<br/><br/>"
                "Next, <b>[Member 3]</b> will showcase how we overhauled financial compliance and corporate sponsorships.\""
            )
        },
        {
            "num": "Segment 3",
            "speaker": "Member 3 (Financial Systems & Sponsorship CRM)",
            "time": "05:00 - 07:30 (2 mins 30 secs)",
            "visual": "Click 'Register / Pay ₹100' ➔ Open YouPI Payment Modal ➔ Club Detail ➔ Sponsorships CRM Kanban Board",
            "script": (
                "\"Thank you, [Member 2]. I am <b>[Member 3]</b>, responsible for ClubSync's Financial Systems and Sponsorship CRM.<br/><br/>"
                "Commercial payment gateways charge 2 to 3 percent per transaction and require complex institutional GST registrations, "
                "which student clubs do not possess. Most clubs resort to unofficial student Google Pay numbers, creating major accounting discrepancies during annual Gymkhana audits.<br/><br/>"
                "To eliminate gateway fees entirely, I developed the <b>YouPI Zero-Fee Gateway</b> [pointing to modal]. It dynamically generates deep-linked UPI intents for GPay, PhonePe, and Paytm pointing directly to the club's designated account. When a student pays, they input their 12-digit Bank UTR reference. The transaction is logged into a tamper-evident audit ledger, and the officer verifies it with one click, issuing an official collegiate e-receipt.<br/><br/>"
                "Next, moving beyond payments, collegiate symposia survive on corporate sponsorships. Traditionally, brand outreach is tracked across fragmented personal spreadsheets.<br/><br/>"
                "We implemented the <b>Corporate Sponsorship & Brand Outreach CRM</b> [pointing to Kanban board]. Built as a 5-stage Kanban pipeline—from initial Lead to Funds Received—it tracks active deal values, signed MOUs, and tier milestones. When an officer selects a sponsorship tier—such as Title or Associate Sponsor—our engine automatically activates the required contractual deliverables: auditorium standee placements, logo on banners, keynote speaking slots, and resume disclosures.<br/><br/>"
                "I now invite <b>[Member 4]</b> to present our Democratic Governance and Mentorship framework.\""
            )
        },
        {
            "num": "Segment 4",
            "speaker": "Member 4 (Governance, Mentorship & Academic Compliance)",
            "time": "07:30 - 10:00 (2 mins 30 secs)",
            "visual": "Switch to 'By-Laws & Resolutions' Tab ➔ Side-by-side red/green diff ➔ Mentorship Tab ➔ OD Letter Modal",
            "script": (
                "\"Thank you, [Member 3]. Good day everyone, I am <b>[Member 4]</b>, and I engineered ClubSync's Governance, Peer Mentorship, and Academic Compliance infrastructure.<br/><br/>"
                "Student societies are democratic institutions, yet their constitutions often sit as static, forgotten PDF files, with amendments passed informally.<br/><br/>"
                "In ClubSync, we pioneered the <b>Constitutional By-Law Amendment Portal</b> [pointing to screen]. Officers can formally table amendments to club constitutions. The interface displays an automated side-by-side red and green diff comparing the existing constitutional clause with the proposed revision.<br/><br/>"
                "More importantly, our backend enforces mathematical democratic thresholds: amendments require a strict 66.6% supermajority and valid quorum calculation before they can be ratified into club law. Every vote is recorded with mandatory rationale comments for institutional transparency.<br/><br/>"
                "Next is our <b>Senior-Junior Mentorship Pairing Hub</b>: Senior students in Third and Final Year publish mentor profiles tagged with technical competencies like DSA, Web3, and Robotics. Junior students can book 1-on-1 pairing slots with automatic campus venue or Google Meet routing, and leave verified star ratings that reward mentors with AICTE activity hours.<br/><br/>"
                "Finally, addressing academic compliance: we built the <b>Automated On-Duty (OD/DL) Leave Letter Generator</b>. Rather than students manually writing applications, ClubSync auto-generates formal leave sanction letters for attendees, pre-formatted for department heads and faculty advisors with unique verification references.<br/><br/>"
                "I will now pass the stage to <b>[Member 5]</b> to present our Webhook syndication and AI systems.\""
            )
        },
        {
            "num": "Segment 5",
            "speaker": "Member 5 (Communications, Real-Time Systems & AI)",
            "time": "10:00 - 12:30 (2 mins 30 secs)",
            "visual": "Open Club 'Webhooks & Syndication' Tab ➔ Send Test Ping ➔ Live Q&A Projector View ➔ Club AI Assistant",
            "script": (
                "\"Thank you, [Member 4]. I am <b>[Member 5]</b>, and I led our Communications, Real-Time Interaction, and AI subsystems.<br/><br/>"
                "Students rarely check emails for club updates; their attention lives on Discord and Telegram. Previously, publicity teams manually copied and pasted announcements across dozens of groups.<br/><br/>"
                "We built the <b>Multi-Channel Webhook Syndicate</b> [pointing to Webhooks tab]. The moment an officer publishes an event or urgent room change in ClubSync, our backend dispatcher translates the event payload into rich, color-coded Discord Embeds and formatted Telegram HTML posts, broadcasting them across connected channels simultaneously. We also included an emergency blast broadcaster with full delivery health logging.<br/><br/>"
                "Next, for symposium keynote sessions, we built the <b>Slido-Style Live Stage Q&A</b> [pointing to Q&A modal]. In an auditorium, passing around microphones is inefficient. With our live projector view, audience members submit and upvote questions in real-time. Speakers can pin highlighted questions and mark them answered live on stage.<br/><br/>"
                "Lastly, we integrated <b>Groq Llama 3 AI</b> into our backend. Operating over club meeting minutes and constitutional documents, it provides an intelligent conversational assistant that lets members ask natural language questions about club policies, past decisions, and event guidelines in sub-second response times.<br/><br/>"
                "I now invite <b>[Member 6]</b> to cover our Frontend Design System, PWA offline capabilities, and Public Verification Registry.\""
            )
        },
        {
            "num": "Segment 6",
            "speaker": "Member 6 (Frontend UI/UX, PWA & Public Credential Registry)",
            "time": "12:30 - 14:15 (1 min 45 secs)",
            "visual": "Toggle Mobile View ➔ Show PWA offline behavior ➔ Navigate to /verify/PICT-CERT-2026-X89 ➔ Click 'Add to LinkedIn'",
            "script": (
                "\"Thank you, [Member 5]. I am <b>[Member 6]</b>, and I focused on our Frontend Architecture, Progressive Web App engineering, and the Public Verification Registry.<br/><br/>"
                "From day one, our design philosophy was mobile-first, tactile, and zero-latency. Using <b>Tailwind CSS</b> and <b>Framer Motion</b>, we crafted an intuitive, dark-mode native interface with micro-interactions, responsive sidebars, and fluid drawer states.<br/><br/>"
                "Campus Wi-Fi in college auditoriums and basements is notoriously unreliable. To guarantee zero operational interruption, we configured ClubSync as a full <b>Progressive Web App (PWA)</b> using modern service worker precaching. Essential UI shells and cached registration tables remain interactive even when connection drops.<br/><br/>"
                "A major innovation is our <b>Public Certificate Verification Registry</b> [pointing to /verify/:id]. Certificate forgery is a widespread problem on campus resumes. In ClubSync, every event certificate carries a cryptographic ID and a QR code pointing to a public verification endpoint. Anyone—recruiters or faculty—can verify the attendee's name, PRN, event date, and digital institutional seal.<br/><br/>"
                "With our 1-click <b>'Add to LinkedIn'</b> integration, students can immediately export and embed their verified ClubSync credentials onto their professional LinkedIn profiles with pre-filled certification metadata.<br/><br/>"
                "I now hand back to our team lead, <b>[Member 1]</b>, for our project summary and closing remarks.\""
            )
        },
        {
            "num": "Segment 7",
            "speaker": "Member 1 (Team Leader — Project Summary & Closing)",
            "time": "14:15 - 15:00 (45 secs)",
            "visual": "GitHub Repository / Project Metrics Summary Slide ➔ Thank You & Q&A Slide",
            "script": (
                "\"Thank you, [Member 6].<br/><br/>"
                "To summarize: in ClubSync, our team has built a production-ready, security-audited, full-stack campus platform spanning 20+ fully realized modules:<br/>"
                "• Desk Kiosk check-in with continuous barcode scanning & thermal badge printing,<br/>"
                "• Zero-fee UPI payments and corporate sponsorship CRMs,<br/>"
                "• Democratic constitutional governance and peer mentorship pairing,<br/>"
                "• Multi-channel Discord/Telegram webhooks and AI summarization,<br/>"
                "• All backed by a secure PostgreSQL database with zero dependency vulnerabilities.<br/><br/>"
                "ClubSync modernizes the collegiate student society experience, setting a new standard for campus technology operations.<br/><br/>"
                "Thank you for your time. The floor is now open, and our team would be pleased to answer your questions.\""
            )
        }
    ]

    for seg in segments:
        card_content = []
        card_content.append(Paragraph(f"<b>{seg['num']}: {seg['speaker']}</b>", styles['SecHeading']))
        card_content.append(Paragraph(f"<b>Time Allocation:</b> {seg['time']}", styles['CueLabel']))
        card_content.append(Paragraph(f"<b>Visual / Screen Cue:</b> <i>{seg['visual']}</i>", styles['BodyMuted']))
        card_content.append(Spacer(1, 4))
        card_content.append(Paragraph(seg['script'], styles['ScriptSpoken']))
        card_content.append(Spacer(1, 10))

        story.append(KeepTogether(card_content))
        story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER_COLOR, spaceBefore=4, spaceAfter=8))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated: {output_path}")

def main():
    styles = setup_styles()
    
    report_pdf = DOCS_DIR / "ClubSync_Project_Report.pdf"
    script_pdf = DOCS_DIR / "ClubSync_Presentation_Script.pdf"

    build_report_pdf(report_pdf, styles)
    build_script_pdf(script_pdf, styles)

    print("\nBoth PDFs generated successfully!")
    print(f"1. {report_pdf}")
    print(f"2. {script_pdf}")

if __name__ == "__main__":
    main()
