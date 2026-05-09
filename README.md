# StealMyHeart

Swipe-based dating app prototype with a separate frontend and backend.

## Current Stack

- Frontend: Next.js App Router + TypeScript
- Backend: FastAPI + PostgreSQL
- Authentication: JWT (HTTP-only cookie) + bcrypt
- Database: PostgreSQL in Docker
- File storage: Cloudinary (signed uploads)

## Database Schema

The Postgres container runs SQL from `db/init/001_create_users.sql` on first boot:

- `users` table with auth + onboarding fields
- `pgcrypto` extension for `gen_random_uuid()`
- `updated_at` trigger

## Local Setup

1) Start database:

```bash
docker compose up -d postgres
```

2) Configure backend env: copy `.env.example` to `.env` in the **project root** and fill in secrets (never commit `.env`).

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5433/stealmyheart`
- `JWT_SECRET=<long-random-secret>`
- `FRONTEND_ORIGIN=http://localhost:3000` (optional)
- `CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

3) Configure frontend env:

```bash
cd frontend
cp .env.example .env.local
```

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api`

4) Run backend:

```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

5) Run frontend:

```bash
cd frontend
npm install
npm run dev
```

## Backend Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `PATCH /api/profile/onboarding`
- `PATCH /api/profile`
- `POST /api/uploads/signature`

## Pushing to GitHub

- Only **example** env files are tracked (`.env.example`, `backend/.env.example`, `frontend/.env.example`). Real `.env` / `.env.local` files are listed in `.gitignore`.
- Before `git add`, run `git status` and confirm no secrets or local-only files (e.g. `node_modules/`, `.next/`, `__pycache__/`).
- If API keys or `JWT_SECRET` were ever committed, rotate them in Cloudinary and regenerate `JWT_SECRET` before going public.

## If Postgres Password Fails

If you see `password authentication failed for user "postgres"`:

```bash
docker exec stealmyheart-postgres psql -U postgres -d stealmyheart -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

If needed, fully reset local DB data:

```bash
docker compose down -v
docker compose up -d postgres
```