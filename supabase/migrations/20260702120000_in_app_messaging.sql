-- Task 19: In-App Messaging (within boards, all tiers).
-- 1:1 conversation threads between users who share at least one approved
-- board. Conversations are created only through get_or_create_conversation()
-- (SECURITY DEFINER), which enforces the shared-board rule — there are no
-- INSERT policies on conversations/participants for the authenticated role.

-- ── 1. Tables ───────────────────────────────────────────────

CREATE TABLE public.conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at    timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX conversation_participants_user_id_idx
  ON public.conversation_participants (user_id);

CREATE TABLE public.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  body            text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_created_idx
  ON public.messages (conversation_id, created_at);

-- ── 2. Helpers ──────────────────────────────────────────────

-- Used by the RLS policies below; must stay executable by authenticated.
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = auth.uid()
  )
$$;

-- True when the caller and p_other_user_id are both approved members of at
-- least one common board (the messaging eligibility rule).
CREATE OR REPLACE FUNCTION public.shares_board_with(p_other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_boards mine
    JOIN user_boards theirs ON theirs.board_id = mine.board_id
    WHERE mine.user_id   = auth.uid()  AND mine.is_approved   = true
      AND theirs.user_id = p_other_user_id AND theirs.is_approved = true
  )
$$;

-- ── 3. Conversation creation RPC ────────────────────────────

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me   uuid := auth.uid();
  v_conv uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_other_user_id = v_me THEN
    RAISE EXCEPTION 'You cannot message yourself.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_other_user_id AND is_active = true) THEN
    RAISE EXCEPTION 'This user is no longer active.';
  END IF;
  IF NOT shares_board_with(p_other_user_id) THEN
    RAISE EXCEPTION 'You can only message members of your boards.';
  END IF;

  -- Serialize concurrent creates for the same pair so a double-click can't
  -- produce two threads.
  PERFORM pg_advisory_xact_lock(
    hashtext(least(v_me::text, p_other_user_id::text) || greatest(v_me::text, p_other_user_id::text))
  );

  SELECT cp1.conversation_id INTO v_conv
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp2.conversation_id = cp1.conversation_id
  WHERE cp1.user_id = v_me
    AND cp2.user_id = p_other_user_id
  LIMIT 1;

  IF v_conv IS NULL THEN
    INSERT INTO conversations DEFAULT VALUES RETURNING id INTO v_conv;
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (v_conv, v_me), (v_conv, p_other_user_id);
  END IF;

  RETURN v_conv;
END;
$$;

-- ── 4. Read-model RPCs ──────────────────────────────────────

-- Conversation list for /messages: the other participant, last message
-- preview, and unread count, newest activity first.
CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
  conversation_id        uuid,
  other_user_id          uuid,
  other_display_name     text,
  last_message_body      text,
  last_message_at        timestamptz,
  last_message_sender_id uuid,
  unread_count           bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    op.user_id,
    ou.display_name,
    lm.body,
    lm.created_at,
    lm.sender_id,
    (SELECT count(*)
     FROM messages m
     WHERE m.conversation_id = c.id
       AND m.sender_id IS DISTINCT FROM auth.uid()
       AND m.created_at > COALESCE(my.last_read_at, 'epoch'::timestamptz))
  FROM conversations c
  JOIN conversation_participants my ON my.conversation_id = c.id AND my.user_id = auth.uid()
  JOIN conversation_participants op ON op.conversation_id = c.id AND op.user_id <> auth.uid()
  LEFT JOIN users ou ON ou.id = op.user_id
  LEFT JOIN LATERAL (
    SELECT body, created_at, sender_id
    FROM messages m
    WHERE m.conversation_id = c.id
    ORDER BY created_at DESC
    LIMIT 1
  ) lm ON true
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC
$$;

-- Total unread messages across all conversations — Navbar badge.
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)
  FROM messages m
  JOIN conversation_participants cp
    ON cp.conversation_id = m.conversation_id AND cp.user_id = auth.uid()
  WHERE m.sender_id IS DISTINCT FROM auth.uid()
    AND m.created_at > COALESCE(cp.last_read_at, 'epoch'::timestamptz)
$$;

-- ── 5. updated_at bump on new message ───────────────────────

-- SECURITY DEFINER: authenticated has no UPDATE policy on conversations,
-- so the trigger does the bump with owner privileges.
CREATE OR REPLACE FUNCTION public.touch_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE conversations SET updated_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER messages_touch_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.touch_conversation();

-- Trigger-only / internal functions must not be callable via PostgREST RPC
-- (same hardening as 20260701153736_harden_trigger_functions.sql).
REVOKE EXECUTE ON FUNCTION public.touch_conversation()  FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.shares_board_with(uuid) FROM anon;

-- ── 6. RLS ──────────────────────────────────────────────────

ALTER TABLE public.conversations             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                  ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_select_participant
  ON public.conversations FOR SELECT TO authenticated
  USING (is_conversation_participant(id));

-- Both participant rows of your own conversations (needed to show who the
-- other person is).
CREATE POLICY participants_select_own_conversations
  ON public.conversation_participants FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

-- Own row only — for last_read_at. Column-level grant below stops the row
-- from being moved to another conversation/user.
CREATE POLICY participants_update_own
  ON public.conversation_participants FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

REVOKE UPDATE ON public.conversation_participants FROM anon, authenticated;
GRANT UPDATE (last_read_at) ON public.conversation_participants TO authenticated;

CREATE POLICY messages_select_participant
  ON public.messages FOR SELECT TO authenticated
  USING (is_conversation_participant(conversation_id));

CREATE POLICY messages_insert_own
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND is_conversation_participant(conversation_id));

-- ── 7. Realtime ─────────────────────────────────────────────

-- postgres_changes respects RLS, so subscribers only receive messages from
-- conversations they participate in.
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
