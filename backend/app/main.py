import hashlib
import uuid
from datetime import datetime, timezone
import cloudinary
from fastapi import FastAPI, HTTPException, Request, Response
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    payload = decode_access_token(token)
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
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
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
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
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
    response.delete_cookie("auth_token", path="/")
    return {"message": "Logged out."}


@app.get("/api/swipe/profiles")
def swipe_profiles(request: Request, limit: int = 10) -> dict:
    user_id = _get_current_user_id(request)
    safe_limit = max(1, min(limit, 50))

    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT gender, city
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

            cur.execute(
                """
                SELECT u.id, u.first_name, u.full_name, u.age, u.gender, u.bio, u.city, u.interests, u.photo_urls
                FROM users u
                LEFT JOIN swipes s ON u.id = s.swiped_id AND s.swiper_id = %s
                WHERE u.id <> %s
                  AND u.gender = ANY(%s)
                  AND s.id IS NULL
                ORDER BY
                  CASE
                    WHEN u.city IS NOT NULL AND u.city = %s THEN 0
                    ELSE 1
                  END,
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


@app.post("/api/swipe/action")
def swipe_action(payload: SwipeRequest, request: Request) -> dict:
    user_id = _get_current_user_id(request)
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO swipes (swiper_id, swiped_id, direction)
                VALUES (%s, %s, %s)
                ON CONFLICT (swiper_id, swiped_id) DO NOTHING
                """,
                (user_id, str(payload.swipedId), payload.direction),
            )
    return {"message": "Swipe recorded."}


def _apply_profile_update(user_id: str, payload: OnboardingRequest) -> None:
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
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
                    photo_urls = %s
                WHERE id = %s
                RETURNING id
                """,
                (
                    payload.firstName.strip(),
                    payload.age,
                    payload.gender,
                    payload.bio.strip(),
                    payload.city.strip(),
                    payload.state.strip(),
                    payload.country.strip(),
                    payload.dob,
                    payload.phone.strip(),
                    payload.interests,
                    payload.photoUrls,
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
