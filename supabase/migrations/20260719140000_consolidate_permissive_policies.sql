-- Code-scan optional improvement #2 (multiple_permissive_policies, 48 findings):
-- comments/requests/shifts/user_boards/users each had several permissive
-- policies per action, so Postgres evaluated every one of them for every row.
-- This merges each action's policies into ONE with the original expressions
-- OR'd verbatim, and scopes everything TO authenticated (no expression here
-- can ever pass for anon: auth.uid() is NULL, auth.role() is 'anon', and
-- get_user_role()/is_board_* all key off auth.uid()).
--
-- Semantics are identical: Postgres ORs permissive policies' USING clauses
-- and (independently) their WITH CHECK clauses, which is exactly what the
-- merged expressions do. Runs in one transaction, so there is no window
-- without coverage. Service role is unaffected (BYPASSRLS).

-- ── comments ──────────────────────────────────────────────────────────────────
-- INSERT + SELECT were already single policies — just scope them.
ALTER POLICY comments_insert_authenticated ON public.comments TO authenticated;
ALTER POLICY comments_select_authenticated ON public.comments TO authenticated;

-- UPDATE: comments_update_own + comments_update_moderator → one policy.
DROP POLICY comments_update_own ON public.comments;
DROP POLICY comments_update_moderator ON public.comments;
CREATE POLICY comments_update ON public.comments
  FOR UPDATE TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR is_any_board_moderator()
    OR (get_user_role() = 'admin'::text)
  );

-- ── requests ──────────────────────────────────────────────────────────────────
ALTER POLICY requests_insert_member ON public.requests TO authenticated;

-- SELECT: member + moderator + admin → one policy.
DROP POLICY requests_select_member ON public.requests;
DROP POLICY requests_select_moderator ON public.requests;
DROP POLICY requests_select_admin ON public.requests;
CREATE POLICY requests_select ON public.requests
  FOR SELECT TO authenticated
  USING (
    ((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now())) AND is_board_member(board_id))
    OR is_board_moderator(board_id)
    OR (get_user_role() = 'admin'::text)
  );

-- UPDATE: own + moderator → one policy.
DROP POLICY requests_update_own ON public.requests;
DROP POLICY requests_update_moderator ON public.requests;
CREATE POLICY requests_update ON public.requests
  FOR UPDATE TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR is_board_moderator(board_id)
    OR (get_user_role() = 'admin'::text)
  );

-- ── shifts ────────────────────────────────────────────────────────────────────
-- (shifts_insert_member is already single and TO authenticated.)

-- SELECT: own + member + moderator + admin → one policy.
DROP POLICY shifts_select_own ON public.shifts;
DROP POLICY shifts_select_member ON public.shifts;
DROP POLICY shifts_select_moderator ON public.shifts;
DROP POLICY shifts_select_admin ON public.shifts;
CREATE POLICY shifts_select ON public.shifts
  FOR SELECT TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR ((is_active = true) AND ((expires_at IS NULL) OR (expires_at > now())) AND is_board_member(board_id) AND ((is_trade = true) OR (is_giveaway = true)))
    OR is_board_moderator(board_id)
    OR (get_user_role() = 'admin'::text)
  );

-- UPDATE: own + moderator → one policy.
DROP POLICY shifts_update_own ON public.shifts;
DROP POLICY shifts_update_moderator ON public.shifts;
CREATE POLICY shifts_update ON public.shifts
  FOR UPDATE TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR is_board_moderator(board_id)
    OR (get_user_role() = 'admin'::text)
  );

-- ── user_boards ───────────────────────────────────────────────────────────────
ALTER POLICY user_boards_insert_own ON public.user_boards TO authenticated;
-- UPDATE is a single policy with a distinct WITH CHECK — keep verbatim, scope only.
ALTER POLICY user_boards_update_moderator ON public.user_boards TO authenticated;

-- SELECT: own + member + moderator + admin → one policy.
DROP POLICY user_boards_select_own ON public.user_boards;
DROP POLICY user_boards_select_member ON public.user_boards;
DROP POLICY user_boards_select_moderator ON public.user_boards;
DROP POLICY user_boards_select_admin ON public.user_boards;
CREATE POLICY user_boards_select ON public.user_boards
  FOR SELECT TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR is_board_member(board_id)
    OR is_board_moderator(board_id)
    OR (get_user_role() = 'admin'::text)
  );

-- DELETE: self + moderator → one policy.
DROP POLICY user_boards_delete_self ON public.user_boards;
DROP POLICY user_boards_delete_moderator ON public.user_boards;
CREATE POLICY user_boards_delete ON public.user_boards
  FOR DELETE TO authenticated
  USING (
    (user_id = (select auth.uid()))
    OR is_board_moderator(board_id)
    OR (get_user_role() = 'admin'::text)
  );

-- ── users ─────────────────────────────────────────────────────────────────────
ALTER POLICY users_select_authenticated ON public.users TO authenticated;

-- UPDATE: own + mod + admin → one policy. USING clauses OR'd; WITH CHECK
-- clauses OR'd independently — exactly how Postgres treated the three
-- separate permissive policies.
DROP POLICY users_update_own ON public.users;
DROP POLICY users_update_mod ON public.users;
DROP POLICY users_update_admin ON public.users;
CREATE POLICY users_update ON public.users
  FOR UPDATE TO authenticated
  USING (
    (id = (select auth.uid()))
    OR ((get_user_role() = 'mod'::text) AND (role = 'Mod'::text) AND (id <> (select auth.uid())))
    OR (get_user_role() = 'admin'::text)
  )
  WITH CHECK (
    (id = (select auth.uid()))
    OR ((get_user_role() = 'mod'::text) AND (role = 'Mod'::text))
    OR (get_user_role() = 'admin'::text)
  );
