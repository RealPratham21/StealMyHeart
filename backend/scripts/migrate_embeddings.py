import sys
import os

# Add the app directory to sys.path to allow imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.db import db_pool, open_db_pool, close_db_pool
from app.recommendation import get_profile_embedding

def migrate_users():
    open_db_pool()
    try:
        with db_pool.connection() as conn:
            with conn.cursor() as cur:
                # Find users without embeddings
                cur.execute("SELECT id, gender, interests, bio FROM users WHERE embedding IS NULL")
                users = cur.fetchall()
                
                print(f"Found {len(users)} users needing embeddings.")
                
                for i, (user_id, gender, interests, bio) in enumerate(users):
                    try:
                        embedding = get_profile_embedding(
                            gender=gender or "other",
                            interests=interests or [],
                            bio=bio or ""
                        )
                        
                        cur.execute(
                            "UPDATE users SET embedding = %s WHERE id = %s",
                            (embedding, user_id)
                        )
                        
                        if (i + 1) % 50 == 0:
                            conn.commit()
                            print(f"Processed {i + 1}/{len(users)} users...")
                    except Exception as e:
                        print(f"Error processing user {user_id}: {e}")
                
                conn.commit()
                print("Migration complete!")
    finally:
        close_db_pool()

if __name__ == "__main__":
    migrate_users()
