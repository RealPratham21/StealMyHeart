import argparse
import base64
import random
from datetime import datetime
from typing import Any

import cloudinary
import cloudinary.uploader
import psycopg
import requests
from faker import Faker
from passlib.context import CryptContext

from app.config import (
    CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    DATABASE_URL,
)

RANDOM_USER_API = "https://randomuser.me/api/"
BATCH_SIZE = 500
INTEREST_POOL = [
    "Travel",
    "Music",
    "Movies",
    "Reading",
    "Cooking",
    "Fitness",
    "Photography",
    "Art",
    "Gaming",
    "Sports",
    "Dancing",
    "Hiking",
    "Yoga",
    "Coffee",
    "Food",
    "Pets",
    "Fashion",
    "Tech",
    "Nature",
]
CITY_STATE_MAP: dict[str, str] = {
    "Pune": "Maharashtra",
    "Mumbai": "Maharashtra",
    "Delhi": "Delhi",
    "Bengaluru": "Karnataka",
    "Kolkata": "West Bengal",
    "Chennai": "Tamil Nadu",
}
REALISTIC_BIOS = [
    "Weekend trekker, weekday product manager. Looking for someone who enjoys chai and long conversations.",
    "Bangalore-based engineer who loves filter coffee, badminton, and Sunday brunches.",
    "Food explorer with a soft spot for old Hindi songs and road trips.",
    "Book lover by night, marketer by day. Always up for trying a new cafe.",
    "Gym regular, dog person, and a fan of spontaneous travel plans.",
    "Work hard, laugh harder. I enjoy stand-up comedy and home-cooked meals.",
    "Artist at heart, analyst at work. I like museums, music gigs, and meaningful talks.",
    "Coffee first, then everything else. Looking for genuine connection and shared values.",
    "Movie buff who never says no to popcorn and late-night drives.",
    "Simple person, ambitious goals. I value honesty, kindness, and consistency.",
    "Into fitness, finance, and finding the best biryani in town.",
    "I can cook a decent pasta and hold a great conversation.",
    "Travel has my heart, but family keeps me grounded.",
    "Designer who loves monsoon weather, poetry, and playlists.",
    "Early riser, long walker, and a big believer in clear communication.",
    "I enjoy board games, beaches, and quiet Sunday mornings.",
    "Startup professional with a calm vibe and a curious mind.",
    "I like street food, live music, and people who are emotionally mature.",
    "Tech consultant who escapes into nature whenever possible.",
    "Learning guitar, improving my cooking, and open to something meaningful.",
    "Optimistic, driven, and always planning the next mini vacation.",
    "I enjoy deep conversations, clean humor, and good coffee.",
    "Balanced between ambition and peace. Looking for a kind partner.",
    "Culture enthusiast who enjoys festivals, films, and family time.",
    "Trying to build a beautiful life one habit at a time.",
]
PASSWORD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed fake user profiles into Postgres.")
    parser.add_argument("--count", type=int, default=2000, help="Total number of users to seed.")
    parser.add_argument(
        "--seed",
        default="stealmyheart-seed",
        help="Seed passed to RandomUser for deterministic batches.",
    )
    parser.add_argument(
        "--upload-folder",
        default="stealmyheart/seeded-users",
        help="Cloudinary folder to upload profile photos into.",
    )
    parser.add_argument(
        "--progress-every",
        type=int,
        default=25,
        help="Print progress after every N processed profiles.",
    )
    return parser.parse_args()


def setup_cloudinary() -> None:
    if not (CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET):
        raise RuntimeError("Cloudinary env vars are missing.")
    cloudinary.config(
        cloud_name=CLOUD_NAME,
        api_key=CLOUDINARY_API_KEY,
        api_secret=CLOUDINARY_API_SECRET,
    )


def fetch_random_users(count: int, gender: str, seed: str) -> list[dict[str, Any]]:
    users: list[dict[str, Any]] = []
    page = 1
    while len(users) < count:
        needed = min(BATCH_SIZE, count - len(users))
        response = requests.get(
            RANDOM_USER_API,
            params={
                "results": needed,
                "gender": gender,
                "nat": "IN",
                "seed": seed,
                "page": page,
            },
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
        users.extend(payload.get("results", []))
        page += 1
    return users


def upload_image_to_cloudinary(image_url: str, folder: str) -> str:
    image_response = requests.get(image_url, timeout=30)
    image_response.raise_for_status()
    mime_type = image_response.headers.get("Content-Type", "image/jpeg")
    encoded = base64.b64encode(image_response.content).decode("utf-8")
    data_uri = f"data:{mime_type};base64,{encoded}"
    uploaded = cloudinary.uploader.upload(
        data_uri,
        folder=folder,
        resource_type="image",
        overwrite=False,
    )
    secure_url = uploaded.get("secure_url")
    if not secure_url:
        raise RuntimeError("Cloudinary upload failed to return secure_url.")
    return secure_url


def random_bio() -> str:
    return random.choice(REALISTIC_BIOS)


def random_interests() -> list[str]:
    size = random.randint(3, 6)
    picks = random.sample(INTEREST_POOL, size)
    return picks


def normalize_gender(random_user_gender: str) -> str:
    if random_user_gender.lower() == "male":
        return "man"
    if random_user_gender.lower() == "female":
        return "woman"
    return "other"


def random_city_state() -> tuple[str, str]:
    city = random.choice(list(CITY_STATE_MAP.keys()))
    return city, CITY_STATE_MAP[city]


def to_record(random_user: dict[str, Any], fake: Faker, upload_folder: str) -> dict[str, Any]:
    name = random_user.get("name", {})
    first_name = (name.get("first") or "").strip()
    last_name = (name.get("last") or "").strip()
    full_name = f"{first_name} {last_name}".strip()
    city, state = random_city_state()
    country = "India"
    dob_raw = random_user.get("dob", {}).get("date")
    dob = None
    if dob_raw:
        dob = datetime.fromisoformat(dob_raw.replace("Z", "+00:00")).date()
    age = random_user.get("dob", {}).get("age")
    phone = random_user.get("phone") or random_user.get("cell")
    email = (random_user.get("email") or "").lower().strip()
    picture = random_user.get("picture", {}).get("large")
    photo_url = upload_image_to_cloudinary(picture, upload_folder) if picture else None

    return {
        "email": email,
        "password_hash": PASSWORD_CONTEXT.hash("Password@123"),
        "full_name": full_name,
        "first_name": first_name,
        "age": age,
        "gender": normalize_gender(random_user.get("gender", "")),
        "bio": random_bio(),
        "city": city,
        "state": state,
        "country": country,
        "dob": dob,
        "phone": phone or fake.phone_number(),
        "interests": random_interests(),
        "photo_urls": [photo_url] if photo_url else [],
    }


def reset_users_schema(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
        cur.execute("DROP TABLE IF EXISTS users CASCADE")
        cur.execute(
            """
            CREATE TABLE users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT,
                first_name TEXT,
                age INTEGER,
                gender TEXT CHECK (gender IN ('man', 'woman', 'other')),
                bio TEXT,
                city TEXT,
                state TEXT,
                country TEXT,
                dob DATE,
                phone TEXT,
                interests TEXT[],
                photo_urls TEXT[],
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
            """
        )
        cur.execute(
            """
            CREATE OR REPLACE FUNCTION set_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.updated_at = NOW();
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql
            """
        )
        cur.execute(
            """
            CREATE TRIGGER users_set_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION set_updated_at()
            """
        )
    conn.commit()


def insert_one_user(conn: psycopg.Connection, record: dict[str, Any]) -> int:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (
                email,
                password_hash,
                full_name,
                first_name,
                age,
                gender,
                bio,
                city,
                state,
                country,
                dob,
                phone,
                interests,
                photo_urls
            )
            VALUES (
                %(email)s,
                %(password_hash)s,
                %(full_name)s,
                %(first_name)s,
                %(age)s,
                %(gender)s,
                %(bio)s,
                %(city)s,
                %(state)s,
                %(country)s,
                %(dob)s,
                %(phone)s,
                %(interests)s,
                %(photo_urls)s
            )
            ON CONFLICT (email) DO NOTHING
            """,
            record,
        )
        affected = cur.rowcount
    conn.commit()
    return affected


def main() -> None:
    args = parse_args()
    if args.count < 1:
        raise ValueError("--count must be >= 1")
    if args.progress_every < 1:
        raise ValueError("--progress-every must be >= 1")

    setup_cloudinary()
    fake = Faker("en_IN")
    random.seed(args.seed)

    men_count = args.count // 2
    women_count = args.count - men_count

    men = fetch_random_users(men_count, "male", args.seed)
    women = fetch_random_users(women_count, "female", f"{args.seed}-f")
    combined = men + women
    random.shuffle(combined)

    processed = 0
    inserted = 0
    failed = 0

    with psycopg.connect(DATABASE_URL) as conn:
        print("Resetting users table and recreating schema...")
        reset_users_schema(conn)
        print("Schema ready. Starting profile processing...")

        for user in combined:
            processed += 1
            try:
                record = to_record(user, fake, args.upload_folder)
                inserted += insert_one_user(conn, record)
            except Exception as exc:  # pragma: no cover - operational script safety
                failed += 1
                email = user.get("email", "unknown")
                print(f"[{processed}/{args.count}] FAILED for {email}: {exc}")
                continue

            if processed % args.progress_every == 0 or processed == args.count:
                print(
                    f"[{processed}/{args.count}] processed | "
                    f"inserted={inserted} | failed={failed}"
                )

    print("Seeding complete.")
    print(f"Requested: {args.count}")
    print(f"Processed: {processed}")
    print(f"Inserted: {inserted}")
    print(f"Failed: {failed}")


if __name__ == "__main__":
    main()
