from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List

# Load the model globally (singleton-like behavior)
# all-MiniLM-L6-v2 is fast and produces 384-dimensional vectors
_model = None

def get_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def generate_profile_text(gender: str, interests: List[str], bio: str) -> str:
    """
    Constructs a structured string that represents the user's profile
    for semantic embedding.
    """
    interests_str = ", ".join(interests) if interests else "no interests listed"
    bio_str = bio.strip() if bio else "no bio provided"
    
    # We create a descriptive document of the user
    return f"Gender: {gender}. Interests: {interests_str}. Bio: {bio_str}"

def get_embedding(text: str) -> List[float]:
    """
    Generates a 384-dimensional embedding vector for the given text.
    """
    model = get_model()
    embedding = model.encode(text)
    # Convert numpy array to list for database storage
    return embedding.tolist()

def get_profile_embedding(gender: str, interests: List[str], bio: str) -> List[float]:
    """
    Combines profile aspects and generates an embedding.
    """
    profile_text = generate_profile_text(gender, interests, bio)
    return get_embedding(profile_text)

def update_preference_vector(current_pref: List[float], candidate_id_vector: List[float], learning_rate: float = 0.05) -> List[float]:
    """
    Updates the preference vector based on a 'Like' action.
    Moves the preference vector closer to the liked profile's identity vector.
    """
    pref_np = np.array(current_pref)
    candidate_np = np.array(candidate_id_vector)
    
    # Formula: NewPref = (1 - alpha) * OldPref + alpha * Candidate
    new_pref = (1 - learning_rate) * pref_np + learning_rate * candidate_np
    
    # Normalize to keep it a unit vector (good for cosine similarity)
    norm = np.linalg.norm(new_pref)
    if norm > 0:
        new_pref = new_pref / norm
        
    return new_pref.tolist()
