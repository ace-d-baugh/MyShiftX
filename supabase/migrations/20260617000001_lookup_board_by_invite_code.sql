-- The boards SELECT policy only allows members / creator / admin to see rows.
-- A prospective member looking up a board by invite code is none of those,
-- so the direct .eq('invite_code', code) query returns nothing and the app
-- incorrectly shows "Invalid invite code."
--
-- This SECURITY DEFINER function runs as the DB owner, bypasses RLS, and
-- returns only the columns needed for the join flow. It is safe because the
-- caller must supply the exact invite code to get any result back.

CREATE OR REPLACE FUNCTION public.lookup_board_by_invite_code(p_code TEXT)
RETURNS TABLE (
  id                  UUID,
  name                TEXT,
  is_active           BOOLEAN,
  invite_code_enabled BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, is_active, invite_code_enabled
  FROM   public.boards
  WHERE  invite_code = UPPER(p_code)
  LIMIT  1;
$$;
