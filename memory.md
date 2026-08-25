# ClubSync - Project Memory & Context

## 📌 Project Overview
ClubSync is a university club management system designed to handle club directories, event RSVPs, task assignments, secure elections, and AI-powered document/meeting chat. 

## 🛠️ Tech Stack & Architecture
- **Frontend:** React, Vite, Tailwind CSS, Lucide React (Icons).
- **Backend:** Node.js, Express.js.
- **Database:** Neon (Serverless PostgreSQL).
- **AI Provider:** Groq SDK (`llama3-8b-8192` model) for RAG and summarization.
- **Authentication:** 100% custom in-house JWT authentication system. (We ripped out Clerk and Supabase auth).
  - Uses `passport` and `passport-google-oauth20` for Google Login.
  - JWTs are stored in `localStorage` on the client and sent via `Authorization: Bearer <token>` headers.
  - Context (`ClubSyncContext.jsx`) manages the global user state via a `/api/auth/me` route.

## 🗄️ Database Schema (Neon Postgres)
The entire database was migrated from Supabase to Neon. The core tables are:
- `users`: id, email, full_name, google_id, password_hash
- `clubs`: id, name, description, cover_image, color
- `club_members`: club_id, user_id, role (President, Vice President, Member, etc.)
- `events`: id, club_id, title, description, date, time, location, category, max_attendees
- `event_members`: event_id, user_id (Tracks RSVPs)
- `tasks`: id, club_id, title, description, status (todo, in_progress, done), assignee_id, due_date
- `elections`, `election_candidates`, `election_votes`: (Features strict `UNIQUE(election_id, voter_id)` constraint to prevent double voting).
- `meetings`: id, club_id, title, date, minutes, ai_summary
- `constitutions` & `documents`: For RAG and AI chat context.

## 🚀 Key Features Implemented
1. **Single-Trip Sync:** The frontend fetches almost all required data in a single massive `Promise.all` request via `GET /api/sync` on load. This populates `ClubSyncContext`.
2. **Event Management:** Officers can create events via `CreateEventModal.jsx`. Users can RSVP, and the UI dynamically calculates capacity and spots left.
3. **Tasks Board:** Officers can assign tasks to members. Members can update statuses (todo -> in_progress -> done).
4. **Secure Elections:** Officers can start elections. Members vote once (backend strictly prevents double voting via SQL constraints).
5. **AI Assistant (Groq):** 
   - **Summarize:** Officers log meeting minutes, and Llama 3 automatically generates a bulleted summary (`POST /api/ai/summarize`).
   - **Chat:** Users can ask questions in the club dashboard, and Llama 3 answers using the club's constitution and recent meetings as RAG context (`POST /api/ai/chat`).

## 🎯 Next Steps / Immediate TODOs
The user just requested to **"polish"** the application. The backend logic is 100% solid, so the focus should now be strictly on UI/UX improvements:
1. **Animations:** Add `framer-motion` for page transitions, modal pop-ins, and card hover effects.
2. **Loading States:** Replace "Loading..." text with sleek animated Skeleton loaders.
3. **Notifications:** Implement a premium toast library (like `sonner` or `react-hot-toast`) for success/error messages instead of native alerts.
4. **Empty States:** Add beautiful SVG illustrations or styled empty states for when a club has no events, tasks, or documents yet.
5. **Mobile Responsiveness:** Ensure the UI scales perfectly on mobile devices.

## 💻 How to Run
- **Database:** Neon Postgres URI is in `server/.env`.
- **Backend:** `cd server && node index.js` (Runs on port 5000)
- **Frontend:** `npm run dev` (Runs on port 5173)
