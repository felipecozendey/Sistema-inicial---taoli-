ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS recurrence_period TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE;
