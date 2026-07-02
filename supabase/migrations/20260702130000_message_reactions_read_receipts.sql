-- Task 19 follow-up: message reactions, read receipts, and the
-- "start a chat" user directory.

-- ── 1. Reactions ────────────────────────────────────────────

-- One reaction per message, set by the recipient (1:1 chats — the only
-- non-sender participant). Choosing again replaces it.
ALTER TABLE public.messages ADD COLUMN reaction text
  CHECK (reaction IS NULL OR reaction IN ('thumbs_up', 'laugh', 'surprise', 'sad', 'mad', 'star'));

-- Recipient may update messages in their conversations that they did NOT
-- send; the column-level grant limits the update to `reaction` only, so the
-- body/sender/timestamps stay immutable.
CREATE POLICY messages_update_reaction ON public.messages
  FOR UPDATE TO authenticated
  USING (is_conversation_participant(conversation_id) AND sender_id IS DISTINCT FROM auth.uid())
  WITH CHECK (is_conversation_participant(conversation_id) AND sender_id IS DISTINCT FROM auth.uid());

REVOKE UPDATE ON public.messages FROM anon, authenticated;
GRANT UPDATE (reaction) ON public.messages TO authenticated;

-- ── 2. Read receipts ────────────────────────────────────────

-- Realtime on participant rows so an open thread sees the other side's
-- last_read_at move (RLS-filtered: only participants receive these events).
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- ── 3. "Start a chat" directory ─────────────────────────────

-- All active users who share at least one approved board with the caller —
-- exactly the set the get_or_create_conversation() rule allows messaging.
CREATE OR REPLACE FUNCTION public.get_messageable_users()
RETURNS TABLE (user_id uuid, display_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT u.id, u.display_name
  FROM user_boards mine
  JOIN user_boards theirs ON theirs.board_id = mine.board_id AND theirs.is_approved = true
  JOIN users u ON u.id = theirs.user_id AND u.is_active = true
  WHERE mine.user_id = auth.uid()
    AND mine.is_approved = true
    AND theirs.user_id <> auth.uid()
  ORDER BY u.display_name
$$;
