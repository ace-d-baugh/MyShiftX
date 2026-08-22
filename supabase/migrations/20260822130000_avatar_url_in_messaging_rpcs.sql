-- Adds avatar_url to the two messaging RPCs so the conversation list, the
-- "Start a chat" directory, and the chat header can show a real photo. Both
-- are SECURITY DEFINER functions whose output shape is fixed by RETURNS
-- TABLE, so this is a function signature change, not a table GRANT.
--
-- Postgres will not let CREATE OR REPLACE FUNCTION change a RETURNS TABLE
-- column list, so each one has to be DROPped and recreated. The critical
-- part: DROP resets a function's EXECUTE privileges to the Postgres default
-- of PUBLIC. These two were deliberately locked down in
-- 20260719151000_function_execute_lockdown.sql (revoked from PUBLIC/anon,
-- granted only to authenticated + service_role); recreating them without
-- reissuing that would silently hand anon the ability to call them again.
-- The REVOKE/GRANT pair at the bottom restores exactly what that migration
-- set -- verified against the live ACLs before writing this.
--
-- Bodies below are the current live definitions with `avatar_url` added to
-- the RETURNS TABLE and the SELECT list; nothing else about either query
-- changed.

DROP FUNCTION IF EXISTS public.get_conversations();

CREATE FUNCTION public.get_conversations()
RETURNS TABLE(
  conversation_id uuid,
  other_user_id uuid,
  other_display_name text,
  other_avatar_url text,
  last_message_body text,
  last_message_at timestamp with time zone,
  last_message_sender_id uuid,
  unread_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    c.id,
    op.user_id,
    ou.display_name,
    ou.avatar_url,
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
$function$;

DROP FUNCTION IF EXISTS public.get_messageable_users();

CREATE FUNCTION public.get_messageable_users()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  board_ids uuid[]
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT u.id, u.display_name, u.avatar_url, array_agg(DISTINCT mine.board_id)
  FROM user_boards mine
  JOIN user_boards theirs ON theirs.board_id = mine.board_id
    AND theirs.is_approved = true AND theirs.is_hidden = false
  JOIN users u ON u.id = theirs.user_id AND u.is_active = true
  WHERE mine.user_id = auth.uid()
    AND mine.is_approved = true
    AND mine.is_hidden = false
    AND theirs.user_id <> auth.uid()
  GROUP BY u.id, u.display_name, u.avatar_url
  ORDER BY u.display_name
$function$;

-- Reissue the lockdown the DROPs above just reset. Same statements as
-- 20260719151000_function_execute_lockdown.sql.
REVOKE ALL ON FUNCTION public.get_conversations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.get_messageable_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_messageable_users() TO authenticated, service_role;
