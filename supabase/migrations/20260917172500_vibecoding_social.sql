-- Migration: 20260917172500_vibecoding_social.sql
-- Description: VibeCoding Social: Perfil Instagram + Seguir + Feed + Auditoria Master

-- 1. Updates to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS motivational_phrase text,
  ADD COLUMN IF NOT EXISTS is_private boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- Add constraints on username: 3-24 chars, lowercase letters, numbers, dot, underscore
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_format_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_username_format_check
      CHECK (username IS NULL OR (username ~ '^[a-z0-9._]{3,24}$' AND username = lower(username)));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_bio_length_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_bio_length_check
      CHECK (bio IS NULL OR char_length(bio) <= 160);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_motivational_phrase_length_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_motivational_phrase_length_check
      CHECK (motivational_phrase IS NULL OR char_length(motivational_phrase) <= 120);
  END IF;
END $$;

-- Populate default usernames for existing users if null
UPDATE public.profiles
SET username = CASE
  WHEN id = '8ff12ff5-2516-4ff8-9a86-d9b13e5bb876'::uuid THEN 'adafocus'
  WHEN id = '0fe294ad-6f72-4cc4-b5a9-283801069c52'::uuid THEN 'felipecozendey'
  WHEN id = '6945abdd-fc20-487c-a6d8-22dc961e8375'::uuid THEN 'felipe.anselmo'
  ELSE lower(regexp_replace(COALESCE(split_part(email, '@', 1), 'user'), '[^a-z0-9._]', '', 'g'))
END
WHERE username IS NULL;

-- Ensure usernames are unique and not empty
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_unique ON public.profiles (lower(username)) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles (is_banned);

-- 2. User blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_pkey PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT user_blocks_not_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks (blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_blocks_select_own" ON public.user_blocks;
CREATE POLICY "user_blocks_select_own" ON public.user_blocks
  FOR SELECT TO authenticated
  USING (blocker_id = auth.uid() OR is_master());

DROP POLICY IF EXISTS "user_blocks_insert_own" ON public.user_blocks;
CREATE POLICY "user_blocks_insert_own" ON public.user_blocks
  FOR INSERT TO authenticated
  WITH CHECK (blocker_id = auth.uid());

DROP POLICY IF EXISTS "user_blocks_delete_own" ON public.user_blocks;
CREATE POLICY "user_blocks_delete_own" ON public.user_blocks
  FOR DELETE TO authenticated
  USING (blocker_id = auth.uid() OR is_master());

-- Helper function to check if a user is blocked by or blocking another
CREATE OR REPLACE FUNCTION public.is_blocked_mutually(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = user_a AND blocked_id = user_b)
       OR (blocker_id = user_b AND blocked_id = user_a)
  );
$$;

-- 3. Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id),
  CONSTRAINT follows_not_self CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows (following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "follows_select" ON public.follows;
CREATE POLICY "follows_select" ON public.follows
  FOR SELECT TO authenticated
  USING (
    follower_id = auth.uid()
    OR following_id = auth.uid()
    OR is_master()
    OR NOT public.is_blocked_mutually(follower_id, auth.uid())
  );

DROP POLICY IF EXISTS "follows_insert" ON public.follows;
CREATE POLICY "follows_insert" ON public.follows
  FOR INSERT TO authenticated
  WITH CHECK (
    follower_id = auth.uid()
    AND NOT public.is_blocked_mutually(auth.uid(), following_id)
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = following_id AND is_banned = true
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true
    )
  );

DROP POLICY IF EXISTS "follows_delete" ON public.follows;
CREATE POLICY "follows_delete" ON public.follows
  FOR DELETE TO authenticated
  USING (follower_id = auth.uid() OR is_master());

-- 4. Posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photo', 'reminder')),
  content text CHECK (content IS NULL OR char_length(content) <= 500),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_deleted ON public.posts (is_deleted);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select_policy" ON public.posts;
CREATE POLICY "posts_select_policy" ON public.posts
  FOR SELECT TO authenticated
  USING (
    is_master()
    OR (
      is_deleted = false
      AND NOT public.is_blocked_mutually(author_id, auth.uid())
      AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = author_id AND is_banned = true)
    )
  );

DROP POLICY IF EXISTS "posts_insert_policy" ON public.posts;
CREATE POLICY "posts_insert_policy" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

DROP POLICY IF EXISTS "posts_update_policy" ON public.posts;
CREATE POLICY "posts_update_policy" ON public.posts
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR is_master())
  WITH CHECK (author_id = auth.uid() OR is_master());

DROP POLICY IF EXISTS "posts_delete_policy" ON public.posts;
CREATE POLICY "posts_delete_policy" ON public.posts
  FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR is_master());

-- 5. Moderation actions table
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('delete_post', 'restore_post', 'ban_user', 'unban_user')),
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_created ON public.moderation_actions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target_user ON public.moderation_actions (target_user_id);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_actions_master_select" ON public.moderation_actions;
CREATE POLICY "moderation_actions_master_select" ON public.moderation_actions
  FOR SELECT TO authenticated
  USING (is_master());

DROP POLICY IF EXISTS "moderation_actions_master_insert" ON public.moderation_actions;
CREATE POLICY "moderation_actions_master_insert" ON public.moderation_actions
  FOR INSERT TO authenticated
  WITH CHECK (is_master() AND actor_id = auth.uid());

-- 6. Public profiles VIEW (Privacy: NO email, NO role, NO sensitive health/finance data)
CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.banner_url,
    p.bio,
    p.motivational_phrase,
    p.is_private,
    p.is_banned,
    p.created_at
  FROM public.profiles p;

-- 7. Update policies on profiles to allow self-profile update of new social fields and allow users to read profiles for social
DROP POLICY IF EXISTS "profiles_select_self_or_master" ON public.profiles;
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "profiles_update_self_display_name" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self" ON public.profiles;
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR is_master())
  WITH CHECK (id = auth.uid() OR is_master());

-- 8. Storage bucket 'social'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'social',
  'social',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage RLS Policies for 'social' bucket
DROP POLICY IF EXISTS "social_storage_public_select" ON storage.objects;
CREATE POLICY "social_storage_public_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'social');

DROP POLICY IF EXISTS "social_storage_user_insert" ON storage.objects;
CREATE POLICY "social_storage_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'social'
    AND (
      (storage.foldername(name))[1] IN ('avatars', 'banners', 'posts')
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "social_storage_user_update" ON storage.objects;
CREATE POLICY "social_storage_user_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'social'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

DROP POLICY IF EXISTS "social_storage_user_delete" ON storage.objects;
CREATE POLICY "social_storage_user_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'social'
    AND (
      (storage.foldername(name))[2] = auth.uid()::text
      OR is_master()
    )
  );

-- 9. RPC functions for Social actions
-- Ban / Unban user with audit logging
CREATE OR REPLACE FUNCTION public.master_set_user_ban(
  target_id uuid,
  banned boolean,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master pode banir/desbanir usuários';
  END IF;

  UPDATE public.profiles
  SET is_banned = banned,
      updated_at = now()
  WHERE id = target_id;

  INSERT INTO public.moderation_actions (
    actor_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    CASE WHEN banned THEN 'ban_user' ELSE 'unban_user' END,
    target_id,
    jsonb_build_object('reason', COALESCE(reason, 'Moderação Master'), 'timestamp', now())
  );

  RETURN true;
END;
$$;

-- Soft delete / restore post with audit logging
CREATE OR REPLACE FUNCTION public.master_moderate_post(
  target_post_id uuid,
  delete_it boolean,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_author_id uuid;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master pode moderar posts';
  END IF;

  SELECT author_id INTO v_author_id FROM public.posts WHERE id = target_post_id;

  UPDATE public.posts
  SET is_deleted = delete_it
  WHERE id = target_post_id;

  INSERT INTO public.moderation_actions (
    actor_id,
    action,
    target_user_id,
    target_post_id,
    details
  ) VALUES (
    auth.uid(),
    CASE WHEN delete_it THEN 'delete_post' ELSE 'restore_post' END,
    v_author_id,
    target_post_id,
    jsonb_build_object('reason', COALESCE(reason, 'Moderação Master'), 'timestamp', now())
  );

  RETURN true;
END;
$$;

-- Function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_available(target_username text, current_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(username) = lower(trim(target_username))
      AND (current_user_id IS NULL OR id <> current_user_id)
  );
$$;

-- Update handle_new_user_profile trigger to set username automatically
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_username text;
  final_username text;
  counter int := 0;
BEGIN
  base_username := lower(regexp_replace(
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user'),
    '[^a-z0-9._]', '', 'g'
  ));

  IF char_length(base_username) < 3 THEN
    base_username := base_username || 'user';
  END IF;
  base_username := substr(base_username, 1, 20);

  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = final_username) LOOP
    counter := counter + 1;
    final_username := substr(base_username, 1, 19) || counter::text;
  END LOOP;

  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    username,
    role,
    status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    final_username,
    'user',
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    username = COALESCE(public.profiles.username, EXCLUDED.username);

  RETURN NEW;
END;
$$;
