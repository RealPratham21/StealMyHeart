# StealMyHeart Backend

FastAPI service for authentication, profiles, photo uploads, and swipe discovery.

## Stack

- **API:** FastAPI + Uvicorn
- **Database:** PostgreSQL (Docker locally)
- **Auth:** JWT in HTTP-only cookie + bcrypt password hashing
- **Media:** Cloudinary (signed uploads from frontend)

## Project Layout

```
backend/
  app/
    main.py       # API routes
    auth.py       # JWT + password helpers
    config.py     # env loading
    db.py         # Postgres connection pool
    schemas.py    # request/response models
  scripts/
    seed_fake_users.py
  requirements.txt
  .env.example
```

## Environment

Copy root `.env` or `backend/.env.example`. Required keys:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Signs auth cookies |
| `FRONTEND_ORIGIN` | CORS origin (default `http://localhost:3000`) |
| `CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Photo uploads |

## Run Locally

```bash
# from repo root
docker compose up -d postgres

cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

API base URL: `http://localhost:8001/api`

---

## Database

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Primary key |
| `email` | TEXT | Unique |
| `password_hash` | TEXT | bcrypt |
| `full_name`, `first_name` | TEXT | Display |
| `age` | INT | 18–100 |
| `gender` | TEXT | `man`, `woman`, `other` |
| `bio` | TEXT | |
| `city`, `state`, `country` | TEXT | Location |
| `dob` | DATE | |
| `phone` | TEXT | |
| `interests` | TEXT[] | 3–5 tags |
| `photo_urls` | TEXT[] | Cloudinary URLs, index 0 = main |
| `created_at`, `updated_at` | TIMESTAMPTZ | |

Init SQL: `db/init/001_create_users.sql`, `002_alter_users_add_profile_fields.sql`

### `swipes`

| Column | Type | Notes |
|--------|------|-------|
| `swiper_id` | UUID | Who swiped |
| `swiped_id` | UUID | Target profile |
| `direction` | BOOLEAN | `true` = like, `false` = pass |
| `created_at` | TIMESTAMPTZ | |

Unique on `(swiper_id, swiped_id)` — one decision per pair.

Init SQL: `db/init/003_create_swipes.sql`

---

## API Endpoints

All routes are prefixed with `/api`. Auth routes set an `auth_token` HTTP-only cookie.

### Auth

#### `POST /auth/signup`

**Body:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123"
}
```

**Response (201):**
```json
{
  "message": "Signup successful.",
  "user": { "id": "uuid", "email": "jane@example.com", "fullName": "Jane Doe" }
}
```

**Errors:** `409` if email exists.

---

#### `POST /auth/login`

**Body:**
```json
{ "email": "jane@example.com", "password": "Password123" }
```

**Response (200):** Same shape as signup; sets cookie.

**Errors:** `401` invalid credentials.

---

#### `GET /auth/me`

**Auth:** Cookie required.

**Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "...",
    "full_name": "...",
    "first_name": "...",
    "age": 25,
    "gender": "woman",
    "bio": "...",
    "city": "Pune",
    "state": "Maharashtra",
    "country": "India",
    "dob": "1998-05-12",
    "phone": "+91...",
    "interests": ["Travel", "Music"],
    "photo_urls": ["https://res.cloudinary.com/..."]
  }
}
```

---

#### `POST /auth/logout`

Clears `auth_token` cookie.

---

### Profile

#### `PATCH /profile/onboarding` and `PATCH /profile`

**Auth:** Cookie required.

**Body:**
```json
{
  "firstName": "Jane",
  "age": 25,
  "gender": "woman",
  "bio": "At least ten characters...",
  "city": "Pune",
  "state": "Maharashtra",
  "country": "India",
  "phone": "+919876543210",
  "dob": "1998-05-12",
  "interests": ["Travel", "Music", "Coffee"],
  "photoUrls": ["https://res.cloudinary.com/..."]
}
```

**Response (200):** `{ "message": "Profile updated." }`

---

### Swipe (current)

#### `GET /swipe/profiles?limit=10`

**Auth:** Cookie required.

**Logic today:**
- Exclude self
- Opposite gender only
- Exclude anyone already in `swipes` for this swiper
- Prefer same `city`, then `ORDER BY random()`
- Return up to `limit` profiles (max 50)

**Response (200):**
```json
{
  "profiles": [
    {
      "id": "uuid",
      "first_name": "Alex",
      "full_name": "Alex Kumar",
      "age": 26,
      "gender": "man",
      "bio": "...",
      "city": "Pune",
      "interests": ["Fitness"],
      "photo_urls": ["https://..."]
    }
  ]
}
```

---

#### `POST /swipe/action`

**Auth:** Cookie required.

**Body:**
```json
{
  "swipedId": "uuid-of-profile",
  "direction": true
}
```

`direction`: `true` = like, `false` = pass.

**Response (200):** `{ "message": "Swipe recorded." }`

---

### Uploads

#### `POST /uploads/signature`

**Body (optional):**
```json
{ "folder": "stealmyheart/profiles" }
```

**Response:** Cloudinary signed upload params (`cloudName`, `apiKey`, `folder`, `timestamp`, `signature`).

Frontend uploads file directly to Cloudinary, then stores returned `secure_url` in profile/onboarding.

---

## How the Backend Works (today)

1. **Signup/login** creates a JWT and stores it in a cookie.
2. **Onboarding** fills `users` with profile fields and Cloudinary photo URLs.
3. **Discover** calls `GET /swipe/profiles` for a batch of candidates.
4. Each swipe calls `POST /swipe/action`, which inserts into `swipes`.
5. Future `GET /swipe/profiles` excludes swiped IDs via SQL `LEFT JOIN swipes ... WHERE s.id IS NULL`.

Postgres is the source of truth for users and swipe history. Ranking is rule-based + random, not ML yet.

---

## Intelligent Recommendation Plan (high level)

Goal: TinVec-style personalized ranking — embed users, store vectors in **Pinecone**, retrieve similar candidates, exclude already-swiped profiles, improve over time from swipe behavior.

### Architecture overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Frontend   │────▶│  FastAPI         │────▶│  Postgres   │
│  /app       │     │  (orchestration) │     │  users      │
└─────────────┘     └────────┬─────────┘     │  swipes     │
                               │               └─────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Embedding service  │
                    │  (profile + taste)  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Pinecone           │
                    │  - profile vectors  │
                    │  - optional taste   │
                    └─────────────────────┘
```

### Two vectors per user (TinVec-inspired)

| Vector | What it represents | Built from |
|--------|-------------------|------------|
| **Profile vector** | Who this person *is* | Bio + interests (text embedding), optional photo embedding, structured features (age bucket, city, gender) |
| **Taste vector** | Who this person *wants* | Moving average of profile vectors they **liked**, minus weak repulsion from **passed** profiles |

At serve time: query Pinecone with the swiper’s **taste vector** (fallback: their own profile vector if new user).

### What goes into the embedding

**Text (semantic):**
```text
Bio: {bio}. Interests: {interest1, interest2, ...}. City: {city}. Age: {age}.
```
Use a sentence embedding model (e.g. `text-embedding-3-small`, or open-source `sentence-transformers/all-MiniLM-L6-v2`).

**Structured (metadata in Pinecone, not necessarily in the vector):**
- `gender`, `city`, `age`, `country`
- Used for **pre-filtering** before/after vector search

**Photos (phase 2):**
- CLIP embedding on `photo_urls[0]`
- Fuse with text vector: `concat` or weighted average

**Behavior (updates taste vector):**
- On **like:** `taste = (1 - α) * taste + α * liked_user_profile_vector` (e.g. α = 0.15)
- On **pass:** small push away: `taste -= β * passed_user_profile_vector` (small β)
- Cold start: taste = profile vector until ≥ N likes

### Pinecone layout

**Index:** `stealmyheart-users` (cosine similarity, dim = embedding size)

**Vector ID:** `user_id` (UUID string)

**Namespaces (optional):** `profile` and `taste`, or single namespace with metadata `vector_type`

**Metadata (for filters):**
```json
{
  "gender": "woman",
  "city": "Pune",
  "age": 26,
  "country": "India",
  "updated_at": 1710000000
}
```

### Retrieval flow (replaces random ORDER BY)

1. Load swiper: `gender`, `city`, `taste_vector` (or compute on the fly).
2. **Pinecone query:**
   - Vector = taste vector
   - `top_k` = 50–100
   - Metadata filter: opposite gender, optionally same city
3. **Postgres filter:** Remove IDs in `swipes` for this swiper (and blocked users later).
4. **Re-rank:** Boost same city, slight randomness for exploration, diversity (don’t show 10 clones).
5. Return top 10 to frontend.

This is **vector similarity search** (ANN), not keyword search. Text embeddings make it *semantic* (similar bios/interests score higher).

### Keeping feeds fresh (no repeats)

| Mechanism | Status |
|-----------|--------|
| `swipes` table + SQL exclude | ✅ Already implemented |
| Pinecone returns more than needed; filter in API | Planned |
| Exploration slot (~10–20% random eligible profiles) | Planned |
| `last_served_at` column or Redis set for session dedupe | Optional |

### When vectors update

| Event | Action |
|-------|--------|
| Onboarding / profile edit | Recompute **profile vector** → upsert Pinecone |
| User likes someone | Update **taste vector** → upsert Pinecone |
| User passes | Small taste adjustment (optional) |
| Nightly job | Re-embed users with stale `updated_at` |
| New seeded users | Embed on seed script completion |

Run embedding work async (Celery, RQ, or background task) so API stays fast.

### New backend modules (planned)

```
backend/
  app/
    recommendations/
      embedder.py      # text (+ photo) → vector
      pinecone_client.py
      ranker.py        # filters + re-rank
      taste.py         # update taste from swipe
  workers/
    embed_user.py      # async job
```

### API changes (planned)

| Endpoint | Change |
|----------|--------|
| `GET /swipe/profiles` | Call recommendation service instead of `ORDER BY random()` |
| `POST /swipe/action` | After insert, enqueue taste-vector update |
| `POST /internal/users/{id}/reindex` | Admin/dev: rebuild embeddings |

### Roadmap

| Phase | Scope | Outcome |
|-------|--------|---------|
| **0** | Current | Rules + random, swipe exclusion in SQL |
| **1** | Profile embeddings only | Pinecone + bio/interests; metadata filters (gender, city) |
| **2** | Taste vector from likes/passes | Personalized ranking for active users |
| **3** | Re-ranking + exploration | Fresh deck, not repetitive; 10–20% explore |
| **4** | Photo embeddings (CLIP) | Visual taste similarity |
| **5** | Matches + notifications | Mutual like detection, messaging prep |

### Dependencies to add (phase 1+)

- `pinecone-client`
- Embedding provider SDK or `sentence-transformers`
- Task queue (optional): `celery` + Redis

### Env vars (planned)

```
PINECONE_API_KEY=
PINECONE_INDEX=stealmyheart-users
OPENAI_API_KEY=          # if using OpenAI embeddings
EMBEDDING_MODEL=text-embedding-3-small
```

---

## Scripts

### Seed fake users

```bash
python -m scripts.seed_fake_users --count 2000 --progress-every 25
```

Resets `users` table, fetches RandomUser (balanced gender), uploads photos to Cloudinary, inserts rows.

---

## Frontend integration

Frontend uses `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:8001/api`) with `credentials: "include"` for cookie auth. See `frontend/lib/api.ts`.
