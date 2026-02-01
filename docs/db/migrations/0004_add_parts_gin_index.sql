-- Add GIN index to messages.parts for efficient JSONB queries
-- Enables fast lookups by part type (e.g., finding all visualization parts)
-- Pattern: WHERE parts @> '[{"type": "visualization"}]'::jsonb
-- This migration is idempotent and safe to run multiple times

CREATE INDEX IF NOT EXISTS message_parts_gin_idx ON messages USING gin (parts);

-- Verify index exists
-- Query: SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'messages' AND indexname = 'message_parts_gin_idx';
