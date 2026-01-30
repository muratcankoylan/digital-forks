-- Forks Database Schema
-- Run this in Supabase SQL Editor or via migrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (minimal for MVP)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  platform_id TEXT UNIQUE, -- Format: "platform:identifier" (e.g., "whatsapp:+1234567890")
  metadata JSONB DEFAULT '{}'
);

-- Forks table
CREATE TABLE IF NOT EXISTS forks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Fork definition (user input)
  fork_description TEXT NOT NULL,
  choice_made TEXT NOT NULL,
  choice_not_made TEXT NOT NULL,
  years_elapsed INTEGER DEFAULT 10,
  user_context TEXT,

  -- Pipeline outputs
  interview_output JSONB,
  research_output JSONB,
  persona_prompt TEXT,

  -- Generated character summary (for UI)
  alternate_self_name TEXT,
  alternate_self_summary TEXT,

  -- State
  status TEXT DEFAULT 'creating' CHECK (status IN ('creating', 'active', 'archived')),
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fork_id UUID REFERENCES forks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  role TEXT NOT NULL CHECK (role IN ('user', 'alternate_self')),
  content TEXT NOT NULL,

  -- Metadata
  platform TEXT CHECK (platform IN ('web', 'whatsapp', 'telegram', 'discord')),
  tokens_used INTEGER,
  latency_ms INTEGER
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_forks_user ON forks(user_id);
CREATE INDEX IF NOT EXISTS idx_forks_status ON forks(status);
CREATE INDEX IF NOT EXISTS idx_forks_last_message ON forks(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_messages_fork ON messages(fork_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform_id);

-- Function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(fork_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE forks
  SET
    message_count = message_count + 1,
    last_message_at = NOW()
  WHERE id = fork_id;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE forks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations via service key
-- In production, you'd add proper policies based on user authentication
CREATE POLICY "Service role can do anything on users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything on forks"
  ON forks FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do anything on messages"
  ON messages FOR ALL
  USING (true)
  WITH CHECK (true);
