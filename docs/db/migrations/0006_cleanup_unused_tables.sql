-- Migration: Remove unused auth tables and old schema
-- Date: 2026-02-01
-- Description: Drop account, verification tables (not used in guest mode) and old conversations/messages

-- =============================================================================
-- Drop unused better-auth tables (not needed for guest mode)
-- =============================================================================

DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS verification CASCADE;

-- =============================================================================
-- Drop old schema tables (replaced by Vercel schema)
-- =============================================================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
