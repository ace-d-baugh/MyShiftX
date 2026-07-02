-- Task 19 follow-up: per-user chat delete.
-- Deleting a chat sets hidden_at on YOUR participant row only — the other
-- person keeps the full conversation. Your list hides the thread and your
-- view of the history is cleared; a message newer than hidden_at (from
-- either side) makes the chat reappear showing only messages after that
-- point. Nothing is ever removed from the messages table.

ALTER TABLE public.conversation_participants ADD COLUMN hidden_at timestamptz;

-- last_read_at + hidden_at are the only columns a user may update on their
-- own participant row (policy participants_update_own already scopes rows).
GRANT UPDATE (last_read_at, hidden_at) ON public.conversation_participants TO authenticated;

-- Conversation list: skip chats I've hidden with nothing new since, and
-- scope the preview + unread count to messages after my hidden_at.
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
       AND m.created_at > COALESCE(my.last_read_at, 'epoch'::timestamptz)
       AND m.created_at > COALESCE(my.hidden_at, 'epoch'::timestamptz))
  FROM conversations c
  JOIN conversation_participants my ON my.conversation_id = c.id AND my.user_id = auth.uid()
  JOIN conversation_participants op ON op.conversation_id = c.id AND op.user_id <> auth.uid()
  LEFT JOIN users ou ON ou.id = op.user_id
  LEFT JOIN LATERAL (
    SELECT body, created_at, sender_id
    FROM messages m
    WHERE m.conversation_id = c.id
      AND m.created_at > COALESCE(my.hidden_at, 'epoch'::timestamptz)
    ORDER BY created_at DESC
    LIMIT 1
  ) lm ON true
  WHERE my.hidden_at IS NULL OR lm.created_at IS NOT NULL
  ORDER BY COALESCE(lm.created_at, c.created_at) DESC
$$;

-- Navbar badge: don't count messages from before I deleted the chat.
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
    AND m.created_at > COALESCE(cp.hidden_at, 'epoch'::timestamptz)
$$;
