-- Migração: adicionar title opcional em professional_notes
ALTER TABLE public.professional_notes
  ADD COLUMN IF NOT EXISTS title TEXT;
