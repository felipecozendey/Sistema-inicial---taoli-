-- Migration: 20260920171500_vibecoding_groups.sql
-- Description: Grupos + Moderação de Grupos no Master (VibeCoding Social)

-- 1. Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_url text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_closed boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT groups_name_length_check CHECK (char_length(name) >= 1 AND char_length(name) <= 60),
  CONSTRAINT groups_description_length_check CHECK (description IS NULL OR char_length(description) <= 300)
);

CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups (created_by);
CREATE INDEX IF NOT EXISTS idx_groups_is_deleted ON public.groups (is_deleted);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups (created_at DESC);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 2. Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('member', 'pending')),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_members_pkey PRIMARY KEY (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members (status);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 3. Create group_posts table
CREATE TABLE IF NOT EXISTS public.group_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('photo', 'reminder')),
  content text CHECK (content IS NULL OR char_length(content) <= 500),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_group_posts_group_id ON public.group_posts (group_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_author_id ON public.group_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_created_at ON public.group_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_posts_is_deleted ON public.group_posts (is_deleted);

ALTER TABLE public.group_posts ENABLE ROW LEVEL SECURITY;

-- 4. Extend moderation_actions
-- Relax action check or add new actions: delete_group_post, restore_group_post, delete_group
ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_action_check;
ALTER TABLE public.moderation_actions ADD CONSTRAINT moderation_actions_action_check
  CHECK (action IN ('delete_post', 'restore_post', 'ban_user', 'unban_user', 'delete_group_post', 'restore_group_post', 'delete_group'));

-- Drop target_post_id FK if it prevents group_post or group target id, or keep it nullable.
-- Note: moderation_actions.target_post_id has FK to posts(id). To avoid FK errors when referencing group_posts or groups,
-- we make target_post_id drop the strict FK to posts(id) so it can store any target post / entity id, or leave target_post_id nullable.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'moderation_actions_target_post_id_fkey'
  ) THEN
    ALTER TABLE public.moderation_actions DROP CONSTRAINT moderation_actions_target_post_id_fkey;
  END IF;
END $$;

-- 5. Helper function: is_group_member(group_id, user_id)
CREATE OR REPLACE FUNCTION public.is_group_active_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND user_id = p_user_id
      AND status = 'member'
  );
$$;

-- Helper function: is_group_owner(group_id, user_id)
CREATE OR REPLACE FUNCTION public.is_group_owner(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.groups
    WHERE id = p_group_id
      AND created_by = p_user_id
  );
$$;

-- 6. RLS Policies for groups
DROP POLICY IF EXISTS "groups_select_policy" ON public.groups;
CREATE POLICY "groups_select_policy" ON public.groups
  FOR SELECT TO authenticated
  USING (
    is_master()
    OR (
      is_deleted = false
      AND NOT public.is_blocked_mutually(created_by, auth.uid())
      AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = created_by AND is_banned = true)
    )
  );

DROP POLICY IF EXISTS "groups_insert_policy" ON public.groups;
CREATE POLICY "groups_insert_policy" ON public.groups
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
  );

DROP POLICY IF EXISTS "groups_update_policy" ON public.groups;
CREATE POLICY "groups_update_policy" ON public.groups
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR is_master()
  )
  WITH CHECK (
    created_by = auth.uid() OR is_master()
  );

-- Application cannot directly DELETE groups (soft delete or via RPC master)
DROP POLICY IF EXISTS "groups_delete_policy" ON public.groups;
CREATE POLICY "groups_delete_policy" ON public.groups
  FOR DELETE TO authenticated
  USING (is_master());

-- 7. RLS Policies for group_members
DROP POLICY IF EXISTS "group_members_select_policy" ON public.group_members;
CREATE POLICY "group_members_select_policy" ON public.group_members
  FOR SELECT TO authenticated
  USING (
    is_master()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
        AND (g.is_deleted = false OR is_master())
        AND NOT public.is_blocked_mutually(g.created_by, auth.uid())
        AND NOT public.is_blocked_mutually(group_members.user_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "group_members_insert_policy" ON public.group_members;
CREATE POLICY "group_members_insert_policy" ON public.group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
        AND g.is_deleted = false
        AND NOT public.is_blocked_mutually(g.created_by, auth.uid())
        AND (
          -- If creator/owner inserting itself, role='owner' & status='member'
          (g.created_by = auth.uid() AND group_members.role = 'owner' AND group_members.status = 'member')
          OR
          -- If open group, member can join directly as 'member' with role 'member'
          (g.is_closed = false AND group_members.status = 'member' AND group_members.role = 'member')
          OR
          -- If closed group, member can request as 'pending' with role 'member'
          (g.is_closed = true AND group_members.status = 'pending' AND group_members.role = 'member')
        )
    )
  );

DROP POLICY IF EXISTS "group_members_update_policy" ON public.group_members;
CREATE POLICY "group_members_update_policy" ON public.group_members
  FOR UPDATE TO authenticated
  USING (
    is_master()
    OR public.is_group_owner(group_members.group_id, auth.uid())
  )
  WITH CHECK (
    is_master()
    OR public.is_group_owner(group_members.group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_members_delete_policy" ON public.group_members;
CREATE POLICY "group_members_delete_policy" ON public.group_members
  FOR DELETE TO authenticated
  USING (
    is_master()
    OR user_id = auth.uid()
    OR public.is_group_owner(group_members.group_id, auth.uid())
  );

-- 8. RLS Policies for group_posts
DROP POLICY IF EXISTS "group_posts_select_policy" ON public.group_posts;
CREATE POLICY "group_posts_select_policy" ON public.group_posts
  FOR SELECT TO authenticated
  USING (
    is_master()
    OR (
      is_deleted = false
      AND public.is_group_active_member(group_posts.group_id, auth.uid())
      AND NOT public.is_blocked_mutually(author_id, auth.uid())
      AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = author_id AND is_banned = true)
      AND EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_posts.group_id AND g.is_deleted = false
      )
    )
  );

DROP POLICY IF EXISTS "group_posts_insert_policy" ON public.group_posts;
CREATE POLICY "group_posts_insert_policy" ON public.group_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = true)
    AND public.is_group_active_member(group_posts.group_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_posts.group_id AND g.is_deleted = false
    )
  );

DROP POLICY IF EXISTS "group_posts_update_policy" ON public.group_posts;
CREATE POLICY "group_posts_update_policy" ON public.group_posts
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_group_owner(group_posts.group_id, auth.uid())
    OR is_master()
  )
  WITH CHECK (
    author_id = auth.uid()
    OR public.is_group_owner(group_posts.group_id, auth.uid())
    OR is_master()
  );

DROP POLICY IF EXISTS "group_posts_delete_policy" ON public.group_posts;
CREATE POLICY "group_posts_delete_policy" ON public.group_posts
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR public.is_group_owner(group_posts.group_id, auth.uid())
    OR is_master()
  );

-- 9. Storage policy: allow groups cover uploads in bucket 'social'
DROP POLICY IF EXISTS "social_storage_user_insert" ON storage.objects;
CREATE POLICY "social_storage_user_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'social'
    AND (
      (storage.foldername(name))[1] IN ('avatars', 'banners', 'posts', 'groups')
      AND (storage.foldername(name))[2] = auth.uid()::text
    )
  );

-- 10. RPCs for Master Moderation
-- Master delete / restore group post
CREATE OR REPLACE FUNCTION public.master_delete_group_post(
  group_post_id uuid,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_author_id uuid;
  v_group_id uuid;
  v_group_name text;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master pode moderar posts de grupo';
  END IF;

  SELECT author_id, group_id INTO v_author_id, v_group_id
  FROM public.group_posts
  WHERE id = group_post_id;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Post de grupo não encontrado';
  END IF;

  SELECT name INTO v_group_name FROM public.groups WHERE id = v_group_id;

  UPDATE public.group_posts
  SET is_deleted = true
  WHERE id = group_post_id;

  INSERT INTO public.moderation_actions (
    actor_id,
    action,
    target_user_id,
    target_post_id,
    details
  ) VALUES (
    auth.uid(),
    'delete_group_post',
    v_author_id,
    group_post_id,
    jsonb_build_object(
      'reason', COALESCE(reason, 'Moderação Master'),
      'group_id', v_group_id,
      'group_name', v_group_name,
      'timestamp', now()
    )
  );

  RETURN true;
END;
$$;

-- Master restore group post
CREATE OR REPLACE FUNCTION public.master_restore_group_post(
  group_post_id uuid,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_author_id uuid;
  v_group_id uuid;
  v_group_name text;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master pode restaurar posts de grupo';
  END IF;

  SELECT author_id, group_id INTO v_author_id, v_group_id
  FROM public.group_posts
  WHERE id = group_post_id;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Post de grupo não encontrado';
  END IF;

  SELECT name INTO v_group_name FROM public.groups WHERE id = v_group_id;

  UPDATE public.group_posts
  SET is_deleted = false
  WHERE id = group_post_id;

  INSERT INTO public.moderation_actions (
    actor_id,
    action,
    target_user_id,
    target_post_id,
    details
  ) VALUES (
    auth.uid(),
    'restore_group_post',
    v_author_id,
    group_post_id,
    jsonb_build_object(
      'reason', COALESCE(reason, 'Moderação Master (restauração)'),
      'group_id', v_group_id,
      'group_name', v_group_name,
      'timestamp', now()
    )
  );

  RETURN true;
END;
$$;

-- Master delete group (soft delete)
CREATE OR REPLACE FUNCTION public.master_delete_group(
  group_id uuid,
  reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id uuid;
  v_group_name text;
BEGIN
  IF NOT public.is_master() THEN
    RAISE EXCEPTION 'Acesso negado: apenas Master pode excluir grupos';
  END IF;

  SELECT created_by, name INTO v_owner_id, v_group_name
  FROM public.groups
  WHERE id = group_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Grupo não encontrado';
  END IF;

  UPDATE public.groups
  SET is_deleted = true
  WHERE id = group_id;

  INSERT INTO public.moderation_actions (
    actor_id,
    action,
    target_user_id,
    target_post_id,
    details
  ) VALUES (
    auth.uid(),
    'delete_group',
    v_owner_id,
    group_id,
    jsonb_build_object(
      'reason', COALESCE(reason, 'Moderação Master'),
      'group_name', v_group_name,
      'timestamp', now()
    )
  );

  RETURN true;
END;
$$;
