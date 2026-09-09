-- Migration: create review_logs table for flashcard reviews telemetry
CREATE TABLE IF NOT EXISTS public.review_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL CHECK (feedback IN ('AGAIN', 'HARD', 'GOOD')),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_review_logs_user_id ON public.review_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_flashcard_id ON public.review_logs(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_review_logs_reviewed_at ON public.review_logs(reviewed_at);

-- Enable Row Level Security
ALTER TABLE public.review_logs ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "review_logs_select" ON public.review_logs;
CREATE POLICY "review_logs_select" ON public.review_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_logs_insert" ON public.review_logs;
CREATE POLICY "review_logs_insert" ON public.review_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_logs_delete" ON public.review_logs;
CREATE POLICY "review_logs_delete" ON public.review_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
