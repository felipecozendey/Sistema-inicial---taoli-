ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tag_ids TEXT[] DEFAULT '{}';

UPDATE public.tasks
SET tag_ids = ARRAY[tag_id]
WHERE tag_id IS NOT NULL
  AND tag_id != ''
  AND COALESCE(array_length(tag_ids, 1), 0) = 0;

ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '📝';
ALTER TABLE public.notes ADD COLUMN IF NOT EXISTS tag_ids TEXT[] DEFAULT '{}';
