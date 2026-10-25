# Contributing to ClubSync 🤝

Thank you for your interest in contributing to ClubSync! Whether you are fixing a bug, adding support for a new student society feature, improving documentation, or optimizing database queries, your contributions are welcome.

---

## 🚀 Quick Development Setup

1. **Fork and Clone the Repository:**
   ```bash
   git clone https://github.com/<your-username>/ClubSync.git
   cd ClubSync
   ```

2. **Install Client & Backend Dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. **Configure Environment Variables:**
   - Copy `.env.example` to `.env` in the root directory.
   - Copy `server/.env.example` to `server/.env` and provide your Neon PostgreSQL connection string.

4. **Start the Development Servers:**
   - **Frontend:** `npm run dev` (Runs Vite on `http://localhost:5173`)
   - **Backend:** `cd server && node index.js` (Runs Express on `http://localhost:5000`)

---

## 🌿 Git Branching & Commit Guidelines

- **Branch Naming:**
  - `feat/<short-feature-name>` for new features (e.g. `feat/event-kiosk-mode`)
  - `fix/<bug-description>` for bug patches (e.g. `fix/attendance-counter`)
  - `docs/<change>` for documentation updates (e.g. `docs/api-routes`)
- **Conventional Commits:**
  We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
  - `feat(scope): add new feature`
  - `fix(scope): patch issue`
  - `refactor(scope): code improvements without behavior change`
  - `docs(scope): documentation update`
  - `test(scope): add or modify test suites`

---

## 🧪 Testing & Quality Standards

Before submitting a Pull Request, verify:
1. `npm run build` runs cleanly with 0 TypeScript/JSX compiler errors or missing assets.
2. The UI adheres strictly to Tailwind design tokens (`bg-surface`, `bg-surface-dim`, `text-text`, `text-text-secondary`, `border-border`).
3. All SQL queries use parameterized queries (`$1, $2, ...`) without direct string interpolation.
4. All new routes verify authenticated officer permissions using `requireOfficer()`.

---

## 📬 Submitting a Pull Request (PR)

1. Push your branch to your forked repository.
2. Open a Pull Request against `origin/main`.
3. Provide a clear summary of what changed, screenshots of UI updates (if applicable), and verification steps.
4. A maintainer will review your PR and provide feedback.
