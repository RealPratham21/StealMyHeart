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

                # 007 - Notifications table
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        type TEXT NOT NULL,
                        title TEXT,
                        body TEXT,
                        link TEXT,
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        metadata JSONB
                    );
                """)

                # 008 - AI History tables
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS ai_chats (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        title TEXT DEFAULT 'New Conversation',
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
                """)
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS ai_messages (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        chat_id UUID NOT NULL REFERENCES ai_chats(id) ON DELETE CASCADE,
                        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
                        content TEXT NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT NOW()
                    );
                """)

                # 009 - Payments and Premium
                cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;")
                cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;")
                
                cur.execute("""
                    CREATE TABLE IF NOT EXISTS payments (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        order_id TEXT UNIQUE NOT NULL,
                        payment_id TEXT,
                        signature TEXT,
                        amount INTEGER NOT NULL,
                        status TEXT NOT NULL DEFAULT 'PENDING',
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
                """)

                print("Creating triggers...")
                cur.execute("""
                    CREATE OR REPLACE FUNCTION set_updated_at()
                    RETURNS TRIGGER AS $$
                    BEGIN
                      NEW.updated_at = NOW();
                      RETURN NEW;
                    END;
                    $$ LANGUAGE plpgsql;
                """)
                cur.execute("""
                    DO $$
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_set_updated_at') THEN
                            CREATE TRIGGER users_set_updated_at
                            BEFORE UPDATE ON users
                            FOR EACH ROW
                            EXECUTE FUNCTION set_updated_at();
                        END IF;
                    END $$;
                """)

                print("Creating indexes...")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_users_embedding ON users USING hnsw (embedding vector_cosine_ops);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_users_pref_embedding ON users USING hnsw (pref_embedding vector_cosine_ops);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (sender_id, receiver_id, created_at);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_chats_user_id ON ai_chats(user_id);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_ai_messages_chat_id ON ai_messages(chat_id);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);")
                cur.execute("CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);")

                conn.commit()
                print("Remote initialization complete!")
    except Exception as e:
        print(f"Error initializing remote DB: {e}")

if __name__ == "__main__":
    run_remote_init()
