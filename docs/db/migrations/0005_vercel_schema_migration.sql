-- Migration: Replace conversations/messages schema with Vercel ai-chatbot schema
-- Date: 2026-02-01
-- Description: Create chat/message/document/suggestion/vote tables with UUID primary keys, migrate existing data

-- =============================================================================
-- PART 1: Create new tables (Vercel ai-chatbot schema)
-- =============================================================================

-- Create chat table (replacement for conversations)
CREATE TABLE IF NOT EXISTS chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  visibility VARCHAR(20) NOT NULL DEFAULT 'private'
);

CREATE INDEX IF NOT EXISTS chat_user_idx ON chat(user_id);
CREATE INDEX IF NOT EXISTS chat_created_idx ON chat(created_at);

-- Create message table with UUID and attachments
CREATE TABLE IF NOT EXISTS message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  parts JSONB NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_chat_idx ON message(chat_id);
CREATE INDEX IF NOT EXISTS message_created_idx ON message(created_at);
CREATE INDEX IF NOT EXISTS message_parts_gin_idx ON message USING gin(parts);

-- Create document table for artifacts/canvas
CREATE TABLE IF NOT EXISTS document (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('text', 'code')),
  content TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_user_idx ON document(user_id);
CREATE INDEX IF NOT EXISTS document_created_idx ON document(created_at);

-- Create suggestion table for chat suggestions
CREATE TABLE IF NOT EXISTS suggestion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES document(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  suggested_text TEXT NOT NULL,
  description TEXT,
  is_resolved VARCHAR(10) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS suggestion_document_idx ON suggestion(document_id);
CREATE INDEX IF NOT EXISTS suggestion_user_idx ON suggestion(user_id);

-- Create vote table for message feedback
CREATE TABLE IF NOT EXISTS vote (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES chat(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES message(id) ON DELETE CASCADE,
  is_upvoted VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vote_chat_idx ON vote(chat_id);
CREATE INDEX IF NOT EXISTS vote_message_idx ON vote(message_id);

-- =============================================================================
-- PART 2: Migrate existing data (if tables exist)
-- =============================================================================

-- Check if old tables exist before attempting migration
DO $$
BEGIN
  -- Migrate conversations to chat (preserving data via mapping)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    INSERT INTO chat (id, user_id, title, created_at, visibility)
    SELECT
      gen_random_uuid() as id,
      user_id,
      COALESCE(title, 'Conversation ' || id::text) as title,
      created_at,
      'private' as visibility
    FROM conversations
    WHERE NOT EXISTS (
      SELECT 1 FROM chat
      WHERE chat.user_id = conversations.user_id
      AND chat.created_at = conversations.created_at
    );
  END IF;

  -- Migrate messages to message table
  -- Strategy: Use conversation created_at + user_id to link to new chat UUID
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    WITH conversation_mapping AS (
      SELECT
        c_old.id as old_id,
        c_new.id as new_id
      FROM conversations c_old
      JOIN chat c_new ON c_new.user_id = c_old.user_id AND c_new.created_at = c_old.created_at
    )
    INSERT INTO message (id, chat_id, role, parts, attachments, created_at)
    SELECT
      gen_random_uuid() as id,
      cm.new_id as chat_id,
      m.role,
      m.parts,
      '[]'::jsonb as attachments,
      m.created_at
    FROM messages m
    JOIN conversation_mapping cm ON m.conversation_id = cm.old_id
    WHERE NOT EXISTS (
      SELECT 1 FROM message msg
      WHERE msg.chat_id = cm.new_id
      AND msg.created_at = m.created_at
      AND msg.role = m.role
    );
  END IF;
END $$;

-- =============================================================================
-- PART 3: Cleanup (optional - commented out for safety)
-- =============================================================================
-- Uncomment after verifying migration success and backing up data:

-- DROP TABLE IF EXISTS messages;
-- DROP TABLE IF EXISTS conversations;

-- To verify migration:
-- SELECT COUNT(*) FROM chat;
-- SELECT COUNT(*) FROM message;
-- SELECT COUNT(*) FROM document;
