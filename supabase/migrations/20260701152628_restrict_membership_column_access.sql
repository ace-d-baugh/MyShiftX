-- The users_select_authenticated RLS policy is row-level and intentionally broad
-- (any authenticated user can read another user's display_name/role — needed for
-- comment authorship, board member lists, and moderation views). Postgres RLS
-- can't restrict individual columns per-row, so instead we revoke column-level
-- SELECT on the membership fields from anon/authenticated entirely and expose a
-- narrow function that only ever returns the CALLER's own membership status.
-- This satisfies "membership is readable by owner only" without breaking the
-- existing cross-user display_name reads other features depend on.

REVOKE SELECT (membership, trial_ends_at, trial_used) ON public.users FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_own_membership()
RETURNS TABLE (membership text, trial_ends_at timestamptz, trial_used boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT membership, trial_ends_at, trial_used
  FROM public.users
  WHERE id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_own_membership() TO authenticated;
