CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE users ADD COLUMN IF NOT EXISTS embedding vector(384);

-- Create an index for faster similarity search (HNSW)
-- We'll use cosine distance (vector_cosine_ops)
CREATE INDEX IF NOT EXISTS idx_users_embedding ON users USING hnsw (embedding vector_cosine_ops);
