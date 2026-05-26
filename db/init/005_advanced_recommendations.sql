ALTER TABLE users ADD COLUMN IF NOT EXISTS pref_embedding vector(384);
ALTER TABLE users ADD COLUMN IF NOT EXISTS likes_received_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Update existing users to have a pref_embedding equal to their identity embedding
UPDATE users SET pref_embedding = embedding WHERE pref_embedding IS NULL AND embedding IS NOT NULL;

-- Index for the preference vector
CREATE INDEX IF NOT EXISTS idx_users_pref_embedding ON users USING hnsw (pref_embedding vector_cosine_ops);
