-- Migration: 20260920223000_vibecoding_groups_pro.sql
-- Description: Grupos Pro + Histórico Social (Enquetes, Fixar posts, Tags de membros, Eventos de entrada/saída, RLS e Auditoria)

-- 1. Pinned columns in group_posts
ALTER TABLE public.group_posts
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_group_posts_pinned ON public.group_posts (group_id, pinned_at DESC NULLS LAST);

-- 2. group_polls table
CREATE TABLE IF NOT EXISTS public.group_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  question text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  closes_at timestamptz NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_polls_question_check CHECK (char_length(question) >= 1 AND char_length(question) <= 300)
);

CREATE INDEX IF NOT EXISTS idx_group_polls_group_id ON public.group_polls (group_id);
CREATE INDEX IF NOT EXISTS idx_group_polls_created_by ON public.group_polls (created_by);
CREATE INDEX IF NOT EXISTS idx_group_polls_created_at ON public.group_polls (created_at DESC);

ALTER TABLE public.group_polls ENABLE ROW LEVEL SECURITY;

-- 3. group_poll_options table
CREATE TABLE IF NOT EXISTS public.group_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_poll_options_text_check CHECK (char_length(option_text) >= 1 AND char_length(option_text) <= 140)
);

CREATE INDEX IF NOT EXISTS idx_group_poll_options_poll_id ON public.group_poll_options (poll_id);
CREATE INDEX IF NOT EXISTS idx_group_poll_options_position ON public.group_poll_options (poll_id, position ASC);

ALTER TABLE public.group_poll_options ENABLE ROW LEVEL SECURITY;

-- 4. group_poll_votes table (Composite PK: 1 vote per user per poll, changeable)
CREATE TABLE IF NOT EXISTS public.group_poll_votes (
  poll_id uuid NOT NULL REFERENCES public.group_polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.group_poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_poll_votes_pkey PRIMARY KEY (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_poll_votes_poll_id ON public.group_poll_votes (poll_id);
CREATE INDEX IF NOT EXISTS idx_group_poll_votes_user_id ON public.group_poll_votes (user_id);
CREATE INDEX IF NOT EXISTS idx_group_poll_votes_option_id ON public.group_poll_votes (option_id);

ALTER TABLE public.group_poll_votes ENABLE ROW LEVEL SECURITY;

-- 5. group_member_tags table
CREATE TABLE IF NOT EXISTS public.group_member_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#58CC02',
  expires_at timestamptz NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT group_member_tags_label_check CHECK (char_length(label) >= 1 AND char_length(label) <= 40)
);

CREATE INDEX IF NOT EXISTS idx_group_member_tags_group_user ON public.group_member_tags (group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_group_member_tags_expires ON public.group_member_tags (expires_at);

ALTER TABLE public.group_member_tags ENABLE ROW LEVEL SECURITY;

-- 6. group_member_events table (Audit of membership lifecycle)
CREATE TABLE IF NOT EXISTS public.group_member_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event text NOT NULL CHECK (event IN ('joined', 'left', 'removed', 'approved', 'rejected', 'request_sent')),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_member_events_group ON public.group_member_events (group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_member_events_user ON public.group_member_events (user_id, created_at DESC);

ALTER TABLE public.group_member_events ENABLE ROW LEVEL SECURITY;

-- 7. Relax or extend moderation_actions check
ALTER TABLE public.moderation_actions DROP CONSTRAINT IF EXISTS moderation_actions_action_check;
-- Set broad text or check with all actions
ALTER TABLE public.moderation_actions ADD CONSTRAINT moderation_actions_action_check
  CHECK (action IN (
    'delete_post', 'restore_post', 'ban_user', 'unban_user',
    'delete_group_post', 'restore_group_post', 'delete_group',
    'pin_group_post', 'unpin_group_post',
    'create_group_poll', 'delete_group_poll',
    'tag_member', 'remove_member_tag', 'remove_group_member'
  ));

-- Allow group creator / professional and actors to insert moderation actions for their groups/actions
DROP POLICY IF EXISTS "moderation_actions_insert_policy" ON public.moderation_actions;
CREATE POLICY "moderation_actions_insert_policy" ON public.moderation_actions
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    OR is_master()
  );

DROP POLICY IF EXISTS "moderation_actions_select_policy" ON public.moderation_actions;
CREATE POLICY "moderation_actions_select_policy" ON public.moderation_actions
  FOR SELECT TO authenticated
  USING (
    is_master()
    OR actor_id = auth.uid()
    OR target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.created_by = auth.uid()
        AND (details->>'group_id')::text = g.id::text
    )
  );

-- 8. Triggers on group_members to populate group_member_events
CREATE OR REPLACE FUNCTION public.handle_group_member_lifecycle()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'pending' THEN
      INSERT INTO public.group_member_events (group_id, user_id, event, actor_id, created_at)
      VALUES (NEW.group_id, NEW.user_id, 'request_sent', NEW.user_id, now());
    ELSIF NEW.status = 'member' THEN
      INSERT INTO public.group_member_events (group_id, user_id, event, actor_id, created_at)
      VALUES (NEW.group_id, NEW.user_id, 'joined', NEW.user_id, now());
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'pending' AND NEW.status = 'member' THEN
      INSERT INTO public.group_member_events (group_id, user_id, event, actor_id, created_at)
      VALUES (NEW.group_id, NEW.user_id, 'approved', auth.uid(), now());
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'pending' THEN
      -- Was rejected or cancelled
      IF auth.uid() IS NOT NULL AND auth.uid() != OLD.user_id THEN
        INSERT INTO public.group_member_events (group_id, user_id, event, actor_id, created_at)
        VALUES (OLD.group_id, OLD.user_id, 'rejected', auth.uid(), now());
      ELSE
        -- Cancelled by user themselves or deleted
        INSERT INTO public.group_member_events (group_id, user_id, event, actor_id, created_at)
        VALUES (OLD.group_id, OLD.user_id, 'left', OLD.user_id, now());
      END IF;
    ELSIF OLD.status = 'member' THEN
      IF auth.uid() IS NOT NULL AND auth.uid() != OLD.user_id THEN
        -- Removed by group owner / admin
        INSERT INTO public.group_member_events (group_id, user_id, event, actor_id, created_at)
        VALUES (OLD.group_id, OLD.user_id, 'removed', auth.uid(), now());
      ELSE
        -- Left on their own
        INSERT INTO public.group_member_events (group_id, user_id, event, actor_id, created_at)
        VALUES (OLD.group_id, OLD.user_id, 'left', OLD.user_id, now());
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_group_member_lifecycle ON public.group_members;
CREATE TRIGGER trg_group_member_lifecycle
  AFTER INSERT OR UPDATE OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_group_member_lifecycle();

-- 9. RLS Policies for group_polls
DROP POLICY IF EXISTS "group_polls_select" ON public.group_polls;
CREATE POLICY "group_polls_select" ON public.group_polls
  FOR SELECT TO authenticated
  USING (
    is_master()
    OR (
      is_deleted = false
      AND public.is_group_active_member(group_id, auth.uid())
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.groups g
        WHERE g.id = group_polls.group_id
          AND g.created_by = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "group_polls_insert" ON public.group_polls;
CREATE POLICY "group_polls_insert" ON public.group_polls
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_group_owner(group_id, auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND (p.is_professional = true OR p.role = 'master')
    )
  );

DROP POLICY IF EXISTS "group_polls_update" ON public.group_polls;
CREATE POLICY "group_polls_update" ON public.group_polls
  FOR UPDATE TO authenticated
  USING (
    is_master()
    OR public.is_group_owner(group_id, auth.uid())
  )
  WITH CHECK (
    is_master()
    OR public.is_group_owner(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_polls_delete" ON public.group_polls;
CREATE POLICY "group_polls_delete" ON public.group_polls
  FOR DELETE TO authenticated
  USING (
    is_master()
    OR public.is_group_owner(group_id, auth.uid())
  );

-- 10. RLS Policies for group_poll_options
DROP POLICY IF EXISTS "group_poll_options_select" ON public.group_poll_options;
CREATE POLICY "group_poll_options_select" ON public.group_poll_options
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_options.poll_id
        AND (
          is_master()
          OR (p.is_deleted = false AND public.is_group_active_member(p.group_id, auth.uid()))
          OR public.is_group_owner(p.group_id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "group_poll_options_insert" ON public.group_poll_options;
CREATE POLICY "group_poll_options_insert" ON public.group_poll_options
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_options.poll_id
        AND (is_master() OR public.is_group_owner(p.group_id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS "group_poll_options_update" ON public.group_poll_options;
CREATE POLICY "group_poll_options_update" ON public.group_poll_options
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_options.poll_id
        AND (is_master() OR public.is_group_owner(p.group_id, auth.uid()))
    )
  );

DROP POLICY IF EXISTS "group_poll_options_delete" ON public.group_poll_options;
CREATE POLICY "group_poll_options_delete" ON public.group_poll_options
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_options.poll_id
        AND (is_master() OR public.is_group_owner(p.group_id, auth.uid()))
    )
  );

-- 11. RLS Policies for group_poll_votes
-- Only group owner (pro) or master can see identity of voters. Members can only read their own vote!
DROP POLICY IF EXISTS "group_poll_votes_select" ON public.group_poll_votes;
CREATE POLICY "group_poll_votes_select" ON public.group_poll_votes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_master()
    OR EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_votes.poll_id
        AND public.is_group_owner(p.group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "group_poll_votes_insert" ON public.group_poll_votes;
CREATE POLICY "group_poll_votes_insert" ON public.group_poll_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_votes.poll_id
        AND p.is_deleted = false
        AND (p.closes_at IS NULL OR p.closes_at > now())
        AND public.is_group_active_member(p.group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "group_poll_votes_update" ON public.group_poll_votes;
CREATE POLICY "group_poll_votes_update" ON public.group_poll_votes
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_votes.poll_id
        AND p.is_deleted = false
        AND (p.closes_at IS NULL OR p.closes_at > now())
        AND public.is_group_active_member(p.group_id, auth.uid())
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_votes.poll_id
        AND p.is_deleted = false
        AND (p.closes_at IS NULL OR p.closes_at > now())
        AND public.is_group_active_member(p.group_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "group_poll_votes_delete" ON public.group_poll_votes;
CREATE POLICY "group_poll_votes_delete" ON public.group_poll_votes
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR is_master()
    OR EXISTS (
      SELECT 1 FROM public.group_polls p
      WHERE p.id = group_poll_votes.poll_id
        AND public.is_group_owner(p.group_id, auth.uid())
    )
  );

-- Aggregated vote counts for members without leaking voter identity
CREATE OR REPLACE FUNCTION public.get_group_poll_results(p_poll_id uuid)
RETURNS TABLE (
  option_id uuid,
  vote_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT o.id AS option_id, COUNT(v.user_id) AS vote_count
  FROM public.group_poll_options o
  JOIN public.group_polls p ON p.id = o.poll_id
  LEFT JOIN public.group_poll_votes v ON v.option_id = o.id
  WHERE o.poll_id = p_poll_id
    AND (
      is_master()
      OR public.is_group_active_member(p.group_id, auth.uid())
      OR public.is_group_owner(p.group_id, auth.uid())
    )
  GROUP BY o.id;
$$;

-- 12. RLS Policies for group_member_tags
DROP POLICY IF EXISTS "group_member_tags_select" ON public.group_member_tags;
CREATE POLICY "group_member_tags_select" ON public.group_member_tags
  FOR SELECT TO authenticated
  USING (
    is_master()
    OR public.is_group_active_member(group_id, auth.uid())
    OR public.is_group_owner(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_member_tags_insert" ON public.group_member_tags;
CREATE POLICY "group_member_tags_insert" ON public.group_member_tags
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      is_master()
      OR (
        public.is_group_owner(group_id, auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND (p.is_professional = true OR p.role = 'master')
        )
      )
    )
  );

DROP POLICY IF EXISTS "group_member_tags_delete" ON public.group_member_tags;
CREATE POLICY "group_member_tags_delete" ON public.group_member_tags
  FOR DELETE TO authenticated
  USING (
    is_master()
    OR public.is_group_owner(group_id, auth.uid())
  );

-- 13. RLS Policies for group_member_events
DROP POLICY IF EXISTS "group_member_events_select" ON public.group_member_events;
CREATE POLICY "group_member_events_select" ON public.group_member_events
  FOR SELECT TO authenticated
  USING (
    is_master()
    OR public.is_group_owner(group_id, auth.uid())
  );

DROP POLICY IF EXISTS "group_member_events_insert" ON public.group_member_events;
CREATE POLICY "group_member_events_insert" ON public.group_member_events
  FOR INSERT TO authenticated
  WITH CHECK (
    is_master()
    OR public.is_group_owner(group_id, auth.uid())
    OR actor_id = auth.uid()
  );

-- 14. Pinning RPC / Helper to guarantee only 1 pinned post per group
CREATE OR REPLACE FUNCTION public.pin_group_post(
  p_group_id uuid,
  p_post_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller is owner of group and is professional (or master)
  IF NOT (
    public.is_master()
    OR (
      public.is_group_owner(p_group_id, auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND (p.is_professional = true OR p.role = 'master')
      )
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas o profissional dono do grupo pode fixar postagens';
  END IF;

  -- 1. Unpin any currently pinned post in this group
  UPDATE public.group_posts
  SET pinned_at = NULL, pinned_by = NULL
  WHERE group_id = p_group_id AND pinned_at IS NOT NULL;

  -- 2. Pin the selected post
  UPDATE public.group_posts
  SET pinned_at = now(), pinned_by = auth.uid()
  WHERE id = p_post_id AND group_id = p_group_id;

  -- 3. Audit log in moderation_actions
  INSERT INTO public.moderation_actions (
    actor_id,
    action,
    target_post_id,
    details
  ) VALUES (
    auth.uid(),
    'pin_group_post',
    p_post_id,
    jsonb_build_object(
      'group_id', p_group_id,
      'timestamp', now()
    )
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.unpin_group_post(
  p_group_id uuid,
  p_post_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (
    public.is_master()
    OR (
      public.is_group_owner(p_group_id, auth.uid())
      AND EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND (p.is_professional = true OR p.role = 'master')
      )
    )
  ) THEN
    RAISE EXCEPTION 'Acesso negado: apenas o profissional dono do grupo pode desafixar postagens';
  END IF;

  UPDATE public.group_posts
  SET pinned_at = NULL, pinned_by = NULL
  WHERE id = p_post_id AND group_id = p_group_id;

  INSERT INTO public.moderation_actions (
    actor_id,
    action,
    target_post_id,
    details
  ) VALUES (
    auth.uid(),
    'unpin_group_post',
    p_post_id,
    jsonb_build_object(
      'group_id', p_group_id,
      'timestamp', now()
    )
  );

  RETURN true;
END;
$$;
