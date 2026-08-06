# AGENTS.md — ArtifactsInejoma

## Architecture

Monorepo: Rust/Axum backend + React/Vite frontend + PostgreSQL.

- `backend/` — Axum server (entry: `backend/src/main.rs`)
- `frontend/` — Vite SPA (entry: `frontend/src/main.jsx`)
- Backend serves `frontend/dist/` as static files in production (`ServeDir` in `main.rs:85`)

## Commands

```bash
# Backend (from repo root)
cd backend && cargo run                          # Starts on :8000

# Frontend dev (from repo root)
cd frontend && npm install && npm run dev        # Starts on :5173

# Run migrations manually (dev without Docker, needs DATABASE_URL in .env)
cd backend && sqlx migrate run

# Install sqlx CLI
cargo install sqlx-cli --no-default-features --features postgres

# Docker
docker compose up --build -d
docker compose down
```

There are no tests, linters, or formatters configured in this repo.

## Environment

- `.env` file goes at repo **root** (gitignored). Copy from `.env.example`.
- `dotenvy` loads from working directory upward, so running `cargo run` from `backend/` pulls root `.env`.
- All backend config has hardcoded defaults in `backend/src/config.rs:14`; the app will start without `.env` but may use wrong DB credentials.

## Database

- Migrations embedded at compile time via `sqlx::migrate!("./migrations")` — the `migrations/` dir must exist relative to `Cargo.toml` at build time.
- Migrations run **automatically** on backend boot (`db/mod.rs:17`). No separate migration step needed at runtime.
- Admin user is seeded on first boot from `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`ADMIN_NAME` env vars. On subsequent boots, only the **name** is updated — the password is never re-hashed from `.env` after initial creation (`db/seeder.rs:12-33`).

## Auth

- JWT stored in client's `localStorage` under key `inejoma_admin_token`.
- Dev backdoor: sending Bearer token `"mock_jwt_token_admin_inejoma"` bypasses real JWT validation and authenticates as admin (`backend/src/auth.rs:82-88`).
- All mutating endpoints require `AuthenticatedUser` extractor (Bearer JWT). GET endpoints are public.

## WebSockets

- Endpoint: `/ws?pin=XXXX&role=STUDENT|PROFESSOR`
- Sessions are **in-memory only** (`Arc<Mutex<HashMap>>` in `ws.rs`) — no persistence. Server restart loses all active sessions.
- Teacher sends `{"action": "END_SESSION"}` over WS to terminate a session; server broadcasts `SESSION_ENDED` to all connected students.

## Frontend quirks

- **localStorage fallback**: Every API call has a graceful degradation path. If the backend is unreachable, CRUD operations persist to localStorage under keys `inejoma_v2_grades`, `inejoma_v2_subjects`, `inejoma_v2_artifacts`, `inejoma_v2_sessions`. The app is usable without a running backend (`frontend/src/services/api.js`).
- WebSocket URL auto-detection: in dev (port 5173) → `ws://hostname:8000/ws`; in production → relative to `window.location` (`frontend/src/services/websocket.js:14-24`).

## Docker / Production

- Nginx reverse proxy routes: `/` → static files, `/api/` → `backend:8000`, `/ws` → `backend:8000` with WebSocket upgrade headers (`frontend/nginx.conf`).
- Backend Dockerfile copies migrations at build time (for `sqlx::migrate!` macro) AND at runtime (the binary reads `migrations/` directory relative to its working directory).

## API Routes

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | No |
| GET/POST | `/api/grades` | GET: No, POST: Yes |
| PUT/DELETE | `/api/grades/:id` | Yes |
| GET/POST | `/api/subjects` | GET: No, POST: Yes |
| PUT/DELETE | `/api/subjects/:id` | Yes |
| GET/POST | `/api/artifacts` | GET: No, POST: Yes |
| GET/PUT/DELETE | `/api/artifacts/:id` | GET: No, PUT/DELETE: Yes |
| POST | `/api/sessions` | Yes |
| GET | `/api/sessions/validate/:pin` | No |
| DELETE | `/api/sessions/:pin` | Yes |
| GET | `/ws?pin=X&role=Y` | No |
