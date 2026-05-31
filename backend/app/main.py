import hashlib
import json
import uuid
from datetime import datetime, timezone
import cloudinary
from fastapi import FastAPI, HTTPException, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from .auth import create_access_token, decode_access_token, hash_password, verify_password
from .config import (
    CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    FRONTEND_ORIGIN,
    JWT_SECRET,
)
from .db import close_db_pool, db_pool, open_db_pool
from .recommendation import get_profile_embedding, update_preference_vector
from .schemas import (
    CloudinarySignatureRequest,
    LoginRequest,
    OnboardingRequest,
    SignupRequest,
    SwipeRequest,
)

if CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
    )

app = FastAPI(title="StealMyHeart Backend")

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

manager = ConnectionManager()

# Configure CORS
origins = [FRONTEND_ORIGIN]
if "," in FRONTEND_ORIGIN:
    origins = [o.strip() for o in FRONTEND_ORIGIN.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.on_event("startup")
def on_startup() -> None:
    if not JWT_SECRET:
        raise RuntimeError("JWT_SECRET is not set.")
    open_db_pool()


@app.on_event("shutdown")
def on_shutdown() -> None:
    close_db_pool()


def _get_token_from_cookie(request: Request) -> str:
    token = request.cookies.get("auth_token")
    if not token:
        raise HTTPException(status_code=401, detail="Unauthorized.")
    return token


def _get_current_user_id(request: Request) -> str:
    token = _get_token_from_cookie(request)
    try:
        payload = decode_access_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized.")
    return str(user_id)


def _target_genders(current_gender: str | None) -> list[str]:
    if current_gender == "man":
        return ["woman"]
    if current_gender == "woman":
        return ["man"]
    return ["man", "woman"]


@app.post("/api/auth/signup")
def signup(payload: SignupRequest, response: Response) -> dict:
    email = payload.email.lower().strip()
    full_name = payload.fullName.strip()
    password_hash = hash_password(payload.password)

    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM users WHERE email = %s LIMIT 1", (email,))
            if cur.fetchone():
                raise HTTPException(status_code=409, detail="An account with this email already exists.")

            cur.execute(
                """
                INSERT INTO users (email, password_hash, full_name)
                VALUES (%s, %s, %s)
                RETURNING id, email, full_name
                """,
                (email, password_hash, full_name),
            )
            row = cur.fetchone()

    token = create_access_token(str(row[0]), str(row[1]))
    # Production-ready cookie settings for cross-domain auth
    is_production = "localhost" not in FRONTEND_ORIGIN
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="none" if is_production else "lax",
        secure=is_production,
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return {"message": "Signup successful.", "user": {"id": str(row[0]), "email": str(row[1]), "fullName": row[2]}}


@app.post("/api/auth/login")
def login(payload: LoginRequest, response: Response) -> dict:
    email = payload.email.lower().strip()
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, password_hash, full_name
                FROM users
                WHERE email = %s
                LIMIT 1
                """,
                (email,),
            )
            row = cur.fetchone()

    if not row or not verify_password(payload.password, str(row[2])):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_access_token(str(row[0]), str(row[1]))
    # Production-ready cookie settings for cross-domain auth
    is_production = "localhost" not in FRONTEND_ORIGIN
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="none" if is_production else "lax",
        secure=is_production,
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    return {"message": "Login successful.", "user": {"id": str(row[0]), "email": str(row[1]), "fullName": row[3]}}


@app.get("/api/auth/me")
def me(request: Request) -> dict:
    user_id = _get_current_user_id(request)
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, email, full_name, first_name, age, gender, bio, city, state, country, dob, phone, interests, photo_urls
                FROM users
                WHERE id = %s
                LIMIT 1
                """,
                (user_id,),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=401, detail="Unauthorized.")

    return {
        "user": {
            "id": str(row[0]),
            "email": row[1],
            "full_name": row[2],
            "first_name": row[3],
            "age": row[4],
            "gender": row[5],
            "bio": row[6],
            "city": row[7],
            "state": row[8],
            "country": row[9],
            "dob": row[10],
            "phone": row[11],
            "interests": row[12],
            "photo_urls": row[13],
        }
    }


@app.post("/api/auth/logout")
def logout(response: Response) -> dict:
    is_production = "localhost" not in FRONTEND_ORIGIN
    response.delete_cookie(
        "auth_token", 
        path="/",
        samesite="none" if is_production else "lax",
        secure=is_production
    )
    return {"message": "Logged out."}


@app.get("/api/swipe/profiles")
def swipe_profiles(request: Request, limit: int = 10) -> dict:
    user_id = _get_current_user_id(request)
    safe_limit = max(1, min(limit, 50))

    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            # Update user's last active status
            cur.execute("UPDATE users SET last_active_at = NOW() WHERE id = %s", (user_id,))

            cur.execute(
                """
                SELECT gender, city, pref_embedding
                FROM users
                WHERE id = %s
                LIMIT 1
                """,
                (user_id,),
            )
            current_user = cur.fetchone()

            if not current_user:
                raise HTTPException(status_code=401, detail="Unauthorized.")

            genders = _target_genders(current_user[0])
            city = current_user[1]
            user_pref_embedding = current_user[2]

            # Advanced Scoring Logic:
            # 1. Similarity: (1 - (embedding <=> pref_embedding)) - Closer is better
            # 2. Reciprocal: Did they already like me? (Bonus)
            # 3. Popularity: Normalized likes_received_count
            # 4. Freshness: Recently active boost

            if user_pref_embedding:
                cur.execute(
                    """
                    SELECT 
                        u.id, u.first_name, u.full_name, u.age, u.gender, u.bio, u.city, u.interests, u.photo_urls,
                        (1 - (u.embedding <=> %s)) AS similarity_score,
                        EXISTS(SELECT 1 FROM swipes s2 WHERE s2.swiper_id = u.id AND s2.swiped_id = %s AND s2.direction = TRUE) AS liked_me
                    FROM users u
                    LEFT JOIN swipes s ON u.id = s.swiped_id AND s.swiper_id = %s
                    WHERE u.id <> %s
                      AND u.gender = ANY(%s)
                      AND s.id IS NULL
                    ORDER BY
                      -- Weighted score calculation:
                      -- 50%% Similarity + 40%% Reciprocal + 10%% Popularity
                      ((1 - (u.embedding <=> %s)) * 0.5) + 
                      (CASE WHEN EXISTS(SELECT 1 FROM swipes s2 WHERE s2.swiper_id = u.id AND s2.swiped_id = %s AND s2.direction = TRUE) THEN 0.4 ELSE 0 END) +
                      (LEAST(u.likes_received_count, 100) / 100.0 * 0.1) DESC,
                      -- Fallback to city
                      CASE WHEN u.city = %s THEN 0 ELSE 1 END ASC
                    LIMIT %s
                    """,
                    (user_pref_embedding, user_id, user_id, user_id, genders, user_pref_embedding, user_id, city, safe_limit),
                )
            else:
                # Fallback to random/city if no preference vector exists
                cur.execute(
                    """
                    SELECT u.id, u.first_name, u.full_name, u.age, u.gender, u.bio, u.city, u.interests, u.photo_urls
                    FROM users u
                    LEFT JOIN swipes s ON u.id = s.swiped_id AND s.swiper_id = %s
                    WHERE u.id <> %s
                      AND u.gender = ANY(%s)
                      AND s.id IS NULL
                    ORDER BY
                      CASE WHEN u.city = %s THEN 0 ELSE 1 END ASC,
                      random()
                    LIMIT %s
                    """,
                    (user_id, user_id, genders, city, safe_limit),
                )
            rows = cur.fetchall()

    profiles = []
    for row in rows:
        profiles.append(
            {
                "id": str(row[0]) if isinstance(row[0], uuid.UUID) else row[0],
                "first_name": row[1],
                "full_name": row[2],
                "age": row[3],
                "gender": row[4],
                "bio": row[5],
                "city": row[6],
                "interests": row[7] or [],
                "photo_urls": row[8] or [],
            }
        )

    return {"profiles": profiles}


@app.get("/api/matches")
def get_matches(request: Request) -> list:
    user_id = _get_current_user_id(request)
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            # Mutual matches: A liked B and B liked A
            cur.execute(
                """
                SELECT u.id, u.first_name, u.full_name, u.age, u.gender, u.city, u.interests, u.photo_urls
                FROM users u
                JOIN swipes s1 ON s1.swiped_id = u.id AND s1.swiper_id = %s AND s1.direction = TRUE
                JOIN swipes s2 ON s2.swiper_id = u.id AND s2.swiped_id = %s AND s2.direction = TRUE
                ORDER BY s1.created_at DESC
                LIMIT 20
                """,
                (user_id, user_id),
            )
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "firstName": r[1],
                    "fullName": r[2],
                    "age": r[3],
                    "gender": r[4],
                    "city": r[5],
                    "interests": r[6],
                    "photoUrls": r[7],
                }
                for r in rows
            ]

@app.get("/api/conversations")
def get_conversations(request: Request) -> list:
    user_id = _get_current_user_id(request)
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            # Get all mutual matches and their latest message if it exists
            cur.execute(
                """
                WITH mutual_matches AS (
                    SELECT u.id, u.first_name, u.photo_urls, u.age
                    FROM users u
                    JOIN swipes s1 ON s1.swiped_id = u.id AND s1.swiper_id = %s AND s1.direction = TRUE
                    JOIN swipes s2 ON s2.swiper_id = u.id AND s2.swiped_id = %s AND s2.direction = TRUE
                ),
                latest_msgs AS (
                    SELECT 
                        CASE WHEN sender_id = %s THEN receiver_id ELSE sender_id END as other_user_id,
                        content,
                        created_at,
                        ROW_NUMBER() OVER(PARTITION BY CASE WHEN sender_id = %s THEN receiver_id ELSE sender_id END ORDER BY created_at DESC) as rn
                    FROM messages
                    WHERE sender_id = %s OR receiver_id = %s
                )
                SELECT 
                    mm.id, mm.first_name, mm.photo_urls, mm.age,
                    lm.content, lm.created_at
                FROM mutual_matches mm
                LEFT JOIN latest_msgs lm ON lm.other_user_id = mm.id AND lm.rn = 1
                ORDER BY COALESCE(lm.created_at, '1970-01-01') DESC, mm.first_name ASC
                """,
                (user_id, user_id, user_id, user_id, user_id, user_id),
            )
            rows = cur.fetchall()
            return [
                {
                    "id": r[0],
                    "firstName": r[1],
                    "photoUrls": r[2],
                    "age": r[3],
                    "lastMessage": r[4],
                    "lastMessageAt": r[5].isoformat() if r[5] else None,
                }
                for r in rows
            ]

@app.get("/api/messages/{other_user_id}")
def get_messages(other_user_id: str, request: Request) -> list:
    user_id = _get_current_user_id(request)
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT sender_id, content, created_at
                FROM messages
                WHERE (sender_id = %s AND receiver_id = %s)
                   OR (sender_id = %s AND receiver_id = %s)
                ORDER BY created_at ASC
                """,
                (user_id, other_user_id, other_user_id, user_id),
            )
            rows = cur.fetchall()
            return [
                {
                    "senderId": r[0],
                    "content": r[1],
                    "createdAt": r[2].isoformat(),
                }
                for r in rows
            ]

@app.post("/api/swipe/action")
def swipe_action(payload: SwipeRequest, request: Request) -> dict:
    user_id = _get_current_user_id(request)
    try:
        with db_pool.connection() as conn:
            with conn.cursor() as cur:
                # 1. Record the swipe (Upsert: update if already exists)
                cur.execute(
                    """
                    INSERT INTO swipes (swiper_id, swiped_id, direction)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (swiper_id, swiped_id) 
                    DO UPDATE SET direction = EXCLUDED.direction, created_at = NOW()
                    """,
                    (user_id, str(payload.swipedId), payload.direction),
                )

                # 2. Update stats and learn taste if it's a LIKE
                if payload.direction:
                    # Increment target's popularity
                    cur.execute(
                        "UPDATE users SET likes_received_count = likes_received_count + 1 WHERE id = %s",
                        (str(payload.swipedId),)
                    )

                    # Get swiper's current preference
                    cur.execute("SELECT pref_embedding FROM users WHERE id = %s", (user_id,))
                    swiper_row = cur.fetchone()
                    swiper_pref = swiper_row[0] if swiper_row else None
                    
                    # Get target's identity embedding
                    cur.execute("SELECT embedding FROM users WHERE id = %s", (str(payload.swipedId),))
                    target_row = cur.fetchone()
                    target_id_vec = target_row[0] if target_row else None

                    if swiper_pref and target_id_vec:
                        new_pref = update_preference_vector(swiper_pref, target_id_vec)
                        cur.execute(
                            "UPDATE users SET pref_embedding = %s WHERE id = %s",
                            (new_pref, user_id)
                        )
        return {"message": "Swipe recorded."}
    except Exception as e:
        print(f"Error recording swipe: {e}")
        raise HTTPException(status_code=500, detail="Internal server error while recording swipe.")


@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            receiver_id = message_data.get("receiver_id")
            content = message_data.get("content")
            
            if receiver_id and content:
                # Save to database
                with db_pool.connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            INSERT INTO messages (sender_id, receiver_id, content)
                            VALUES (%s, %s, %s)
                            RETURNING id, created_at
                            """,
                            (user_id, receiver_id, content)
                        )
                        row = cur.fetchone()
                        msg_id, created_at = row[0], row[1]
                        conn.commit()

                # Push to receiver if online
                push_data = {
                    "id": str(msg_id),
                    "sender_id": user_id,
                    "receiver_id": receiver_id,
                    "content": content,
                    "created_at": created_at.isoformat()
                }
                await manager.send_personal_message(push_data, receiver_id)
                # Echo back to sender to confirm delivery/update UI
                await manager.send_personal_message(push_data, user_id)

    except WebSocketDisconnect:
        manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user_id)


def _apply_profile_update(user_id: str, payload: OnboardingRequest) -> None:
    # Generate embedding based on the new profile data
    embedding = get_profile_embedding(
        gender=payload.gender,
        interests=payload.interests,
        bio=payload.bio
    )

    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            # Fetch current data to preserve fields not present in payload (partial updates)
            cur.execute(
                "SELECT state, country, dob, phone FROM users WHERE id = %s",
                (user_id,)
            )
            current = cur.fetchone()
            if not current:
                raise HTTPException(status_code=404, detail="User not found.")
            
            # Use payload value if provided, otherwise keep existing
            state = payload.state if payload.state is not None else current[0]
            country = payload.country if payload.country is not None else current[1]
            dob = payload.dob if payload.dob is not None else current[2]
            phone = payload.phone if payload.phone is not None else current[3]

            cur.execute(
                """
                UPDATE users
                SET first_name = %s,
                    age = %s,
                    gender = %s,
                    bio = %s,
                    city = %s,
                    state = %s,
                    country = %s,
                    dob = %s,
                    phone = %s,
                    interests = %s,
                    photo_urls = %s,
                    embedding = %s
                WHERE id = %s
                RETURNING id
                """,
                (
                    payload.firstName.strip(),
                    payload.age,
                    payload.gender,
                    payload.bio.strip(),
                    payload.city.strip(),
                    state.strip() if state else None,
                    country.strip() if country else None,
                    dob,
                    phone.strip() if phone else None,
                    payload.interests,
                    payload.photoUrls,
                    embedding,
                    user_id,
                ),
            )
            row = cur.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User not found.")


@app.patch("/api/profile/onboarding")
def onboarding(payload: OnboardingRequest, request: Request) -> dict:
    user_id = _get_current_user_id(request)
    _apply_profile_update(user_id, payload)
    return {"message": "Profile updated."}


@app.patch("/api/profile")
def update_profile(payload: OnboardingRequest, request: Request) -> dict:
    user_id = _get_current_user_id(request)
    _apply_profile_update(user_id, payload)
    return {"message": "Profile updated."}


@app.post("/api/uploads/signature")
def upload_signature(payload: CloudinarySignatureRequest) -> dict:
    if not (CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET):
        raise HTTPException(status_code=500, detail="Cloudinary environment variables are missing.")

    timestamp = int(datetime.now(timezone.utc).timestamp())
    params = {"folder": payload.folder, "timestamp": timestamp}
    to_sign = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    signature = hashlib.sha1(f"{to_sign}{CLOUDINARY_API_SECRET}".encode("utf-8")).hexdigest()

    return {
        "cloudName": CLOUD_NAME,
        "apiKey": CLOUDINARY_API_KEY,
        "folder": payload.folder,
        "timestamp": str(timestamp),
        "signature": signature,
    }
