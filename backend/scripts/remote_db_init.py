import sys
import os
import psycopg

# Add the app directory to sys.path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# External URL from User Input
EXTERNAL_DB_URL = "postgresql://stealmyheart_db_user:j5TFe4XnhLbyKV6yvkH06fo18dNksycJ@dpg-d8du6gp9rddc73ed5o10-a.singapore-postgres.render.com/stealmyheart_db"

def run_remote_init():
    print("Connecting to remote Render DB...")
    try:
        with psycopg.connect(EXTERNAL_DB_URL) as conn:
            with conn.cursor() as cur:
                print("Enabling pgvector...")
                cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
                
                print("Applying schema migrations...")
                
                # 001 - Users table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS users (
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
                        embedding vector(384),
                        pref_embedding vector(384),
                        likes_received_count INTEGER DEFAULT 0,
                        last_active_at TIMESTAMPTZ DEFAULT NOW(),
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
                """)

                # 003 - Swipes table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS swipes (
                        id SERIAL PRIMARY KEY,
                        swiper_id UUID REFERENCES users(id) ON DELETE CASCADE,
                        swiped_id UUID REFERENCES users(id) ON DELETE CASCADE,
                        direction BOOLEAN NOT NULL,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                        UNIQUE(swiper_id, swiped_id)
                    );
                """)

                # 006 - Messages table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS messages (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        content TEXT NOT NULL,
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    );
                """)

                print("Creating indexes...")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_users_embedding ON users USING hnsw (embedding vector_cosine_ops);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_users_pref_embedding ON users USING hnsw (pref_embedding vector_cosine_ops);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (sender_id, receiver_id, created_at);")

                conn.commit()
                print("Remote initialization complete!")
    except Exception as e:
        print(f"Error initializing remote DB: {e}")

if __name__ == "__main__":
    run_remote_init()
