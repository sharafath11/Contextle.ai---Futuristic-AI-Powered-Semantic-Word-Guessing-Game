-- ==============================================================================
--  Contextle.ai Database Migrations
--  Run this in your Supabase SQL Editor to finalize production readiness
-- ==============================================================================

-- 1. Create the user_rate_limits table for serverless-safe DB rate limiting
CREATE TABLE IF NOT EXISTS public.user_rate_limits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Create the played_words table to track historically solved words per user
CREATE TABLE IF NOT EXISTS public.played_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index to quickly query a user's past words for the anti-repetition filter
CREATE INDEX IF NOT EXISTS idx_played_words_user_id ON public.played_words(user_id);
