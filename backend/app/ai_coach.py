import google.generativeai as genai
from typing import List, Optional, Dict, Any
import json
import asyncio
from .db import db_pool
from .config import GEMINI_API_KEY
from .recommendation import get_embedding

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Tool implementation functions
def get_own_profile(user_id: str):
    """Retrieves the user's own profile data including bio, interests, and basic stats."""
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT first_name, age, gender, bio, city, interests, likes_received_count FROM users WHERE id = %s",
                (user_id,)
            )
            row = cur.fetchone()
            if not row:
                return {"error": "User not found."}
            return {
                "firstName": row[0],
                "age": row[1],
                "gender": row[2],
                "bio": row[3],
                "city": row[4],
                "interests": row[5],
                "likesReceived": row[6]
            }

def analyze_behavior(user_id: str, direction: bool = True, limit: int = 10):
    """Analyzes themes from either Liked (True) or Disliked (False) profiles."""
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT u.first_name, u.bio, u.interests
                FROM users u
                JOIN swipes s ON s.swiped_id = u.id
                WHERE s.swiper_id = %s AND s.direction = %s
                ORDER BY s.created_at DESC
                LIMIT %s
                """,
                (user_id, direction, limit)
            )
            rows = cur.fetchall()
            if not rows:
                return f"No {'likes' if direction else 'dislikes'} recorded yet."
            
            return [{
                "firstName": r[0],
                "bio": r[1],
                "interests": r[2]
            } for r in rows]

def get_comprehensive_stats(user_id: str):
    """Retrieves user's engagement funnel stats (Total swipes, Match %, etc.)."""
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            # Total swipes sent
            cur.execute("SELECT count(*) FROM swipes WHERE swiper_id = %s", (user_id,))
            total_sent = cur.fetchone()[0]
            
            # Likes sent
            cur.execute("SELECT count(*) FROM swipes WHERE swiper_id = %s AND direction = TRUE", (user_id,))
            likes_sent = cur.fetchone()[0]
            
            # Matches
            cur.execute(
                """
                SELECT count(*) 
                FROM swipes s1
                JOIN swipes s2 ON s1.swiped_id = s2.swiper_id AND s1.swiper_id = s2.swiped_id
                WHERE s1.swiper_id = %s AND s1.direction = TRUE AND s2.direction = TRUE
                """,
                (user_id,)
            )
            matches = cur.fetchone()[0]
            
            # Likes received (from users table)
            cur.execute("SELECT likes_received_count FROM users WHERE id = %s", (user_id,))
            likes_received = cur.fetchone()[0]

            return {
                "totalSwipesSent": total_sent,
                "likesSent": likes_sent,
                "likesReceived": likes_received,
                "matches": matches,
                "likeRate": f"{(likes_sent/total_sent*100):.1f}%" if total_sent > 0 else "0%"
            }

def get_compatibility_report(user_id: str, target_id: str):
    """Compares the user's profile with a target profile to find commonalities and differences."""
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT first_name, bio, interests FROM users WHERE id IN (%s, %s)", (user_id, target_id))
            rows = cur.fetchall()
            if len(rows) < 2:
                return "Could not find both profiles for comparison."
            
            u1, u2 = rows[0], rows[1]
            return {
                "user": {"name": u1[0], "bio": u1[1], "interests": u1[2]},
                "target": {"name": u2[0], "bio": u2[1], "interests": u2[2]}
            }

def search_profiles_by_vibe(user_id: str, query: str, limit: int = 5):
    """Searches for profiles on the platform that match a specific 'vibe' or description using vector similarity."""
    query_vec = get_embedding(query)
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT first_name, age, bio, interests, city
                FROM users
                WHERE id != %s
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (user_id, query_vec, limit)
            )
            rows = cur.fetchall()
            return [{
                "firstName": r[0],
                "age": r[1],
                "bio": r[2],
                "interests": r[3],
                "city": r[4]
            } for r in rows]

def get_platform_insights():
    """Gets aggregate insights about common interests and popular cities on the platform."""
    with db_pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT unnest(interests) as interest, count(*) as count FROM users GROUP BY interest ORDER BY count DESC LIMIT 10"
            )
            interests = [{"interest": r[0], "count": r[1]} for r in cur.fetchall()]
            
            cur.execute(
                "SELECT city, count(*) as count FROM users WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 5"
            )
            cities = [{"city": r[0], "count": r[1]} for r in cur.fetchall()]
            
            return {
                "topInterests": interests,
                "topCities": cities
            }

class AICoach:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.tools = [
            self._wrap_get_own_profile,
            self._wrap_analyze_behavior,
            self._wrap_get_comprehensive_stats,
            self._wrap_get_compatibility_report,
            self._wrap_search_profiles_by_vibe,
            get_platform_insights
        ]
        self.model = genai.GenerativeModel(
            model_name='gemini-2.5-flash',
            tools=self.tools
        )

    def _wrap_get_own_profile(self) -> Dict[str, Any]:
        """Retrieves the user's own profile data including bio, interests, and basic stats."""
        return get_own_profile(self.user_id)

    def _wrap_analyze_behavior(self, direction: bool = True, limit: int = 10) -> List[Dict[str, Any]]:
        """Analyzes themes from either Liked (True) or Disliked (False) profiles."""
        return analyze_behavior(self.user_id, direction, limit)

    def _wrap_get_comprehensive_stats(self) -> Dict[str, Any]:
        """Retrieves user's engagement funnel stats (Total swipes, Match %, etc.)."""
        return get_comprehensive_stats(self.user_id)

    def _wrap_get_compatibility_report(self, target_id: str) -> Dict[str, Any]:
        """Compares the user's profile with a target profile for compatibility."""
        return get_compatibility_report(self.user_id, target_id)

    def _wrap_search_profiles_by_vibe(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Searches for profiles on the platform that match a specific 'vibe'."""
        return search_profiles_by_vibe(self.user_id, query, limit)

    async def ask(self, question: str, chat_id: Optional[str] = None):
        if not GEMINI_API_KEY:
            return "AI Coach is not configured.", None

        print(f"\n--- AI Coach Request Start ---")
        print(f"User ID: {self.user_id}, Chat ID: {chat_id}")

        # Step 1: Manage Chat Thread
        is_new_chat = False
        if not chat_id:
            is_new_chat = True
            with db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO ai_chats (user_id) VALUES (%s) RETURNING id",
                        (self.user_id,)
                    )
                    chat_id = str(cur.fetchone()[0])
                    conn.commit()
        else:
            # Update updated_at
            with db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("UPDATE ai_chats SET updated_at = NOW() WHERE id = %s", (chat_id,))
                    conn.commit()

        # Step 2: Retrieve History
        history = []
        with db_pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT role, content FROM ai_messages WHERE chat_id = %s ORDER BY created_at ASC LIMIT 20",
                    (chat_id,)
                )
                rows = cur.fetchall()
                for r in rows:
                    # Gemini uses 'user' and 'model' as roles. 
                    # Our DB uses 'user' and 'assistant'.
                    gemini_role = "user" if r[0] == "user" else "model"
                    history.append({"role": gemini_role, "parts": [r[1]]})

        # Step 3: Pre-fetch dossier
        print("Pre-fetching core dossier...")
        stats = get_comprehensive_stats(self.user_id)
        likes_sample = analyze_behavior(self.user_id, direction=True, limit=3)
        dislikes_sample = analyze_behavior(self.user_id, direction=False, limit=3)
        own_profile = get_own_profile(self.user_id)
        
        dossier = {
            "stats": stats,
            "own_profile": own_profile,
            "sample_likes": likes_sample,
            "sample_dislikes": dislikes_sample
        }

        system_instruction = f"""
        You are the 'StealMyHeart' AI Dating Coach. You have a deep understanding of the user's dating patterns.
        
        USER DOSSIER (Current State):
        {json.dumps(dossier)}
        
        INSTRUCTIONS:
        1. Use the USER DOSSIER for immediate context.
        2. If you need DEEPER data, use your TOOLS.
        3. Be concise, polite, and data-backed.
        4. Refer to the user by their first name if available in the dossier.
        """
        
        # Step 4: Save User Message
        with db_pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ai_messages (chat_id, role, content) VALUES (%s, %s, %s)",
                    (chat_id, "user", question)
                )
                conn.commit()

        # Step 5: Orchestration
        chat = self.model.start_chat(history=history)
        
        try:
            print("Sending prompt to Gemini...")
            response = chat.send_message(f"{system_instruction}\n\nQuestion: {question}")
            
            # Manual tool orchestration
            for turn in range(2):
                if not response.candidates[0].content.parts:
                    break
                
                tool_calls = [part.function_call for part in response.candidates[0].content.parts if part.function_call]
                if not tool_calls:
                    break
                
                print(f"Turn {turn+1}: AI requested tools.")
                responses = []
                
                for fc in tool_calls:
                    name = fc.name
                    args = fc.args
                    print(f"  -> Executing Tool: {name}")
                    
                    if name == "_wrap_get_own_profile":
                        result = self._wrap_get_own_profile()
                    elif name == "_wrap_analyze_behavior":
                        result = self._wrap_analyze_behavior(**args)
                    elif name == "_wrap_get_comprehensive_stats":
                        result = self._wrap_get_comprehensive_stats()
                    elif name == "_wrap_get_compatibility_report":
                        result = self._wrap_get_compatibility_report(**args)
                    elif name == "_wrap_search_profiles_by_vibe":
                        result = self._wrap_search_profiles_by_vibe(**args)
                    elif name == "get_platform_insights":
                        result = get_platform_insights()
                    else:
                        result = {"error": f"Tool {name} not found"}
                        
                    responses.append(genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=name,
                            response={'result': result}
                        )
                    ))

                await asyncio.sleep(8)
                response = chat.send_message(responses)

            final_text = response.text
            
            # Step 6: Save Assistant Message
            with db_pool.connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO ai_messages (chat_id, role, content) VALUES (%s, %s, %s)",
                        (chat_id, "assistant", final_text)
                    )
                    
                    # Auto-generate title for new chats
                    if is_new_chat:
                        # Simple title: first 30 chars of the question
                        title = question[:30] + "..." if len(question) > 30 else question
                        cur.execute("UPDATE ai_chats SET title = %s WHERE id = %s", (title, chat_id))
                    
                    conn.commit()

            print("--- AI Coach Request Complete ---")
            return final_text, chat_id

        except Exception as e:
            print(f"!! AI Coach Error: {str(e)}")
            return "I'm having trouble thinking. Please try again later.", chat_id 
