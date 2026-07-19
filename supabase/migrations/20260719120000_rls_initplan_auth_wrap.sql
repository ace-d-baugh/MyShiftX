-- Code-scan optional improvement #1 (auth_rls_initplan, 27 findings):
-- direct auth.uid()/auth.role() calls in RLS policies are re-evaluated for
-- EVERY row scanned; wrapping them as (select auth.uid()) makes Postgres
-- evaluate once per query as an InitPlan. Semantics are identical.
--
-- ALTER POLICY (not DROP/CREATE) so cmd/roles/permissive are untouched and
-- there is no window without the policy. Expressions below are the live
-- pg_policies definitions verbatim, with only the auth.* calls wrapped.
-- (get_user_role()/is_board_member() calls are left as-is — the linter scopes
-- to auth.* and current_setting only.)

ALTER POLICY "Service role can read all responses" ON public.beta_survey_responses
  USING ((select auth.role()) = 'service_role'::text);

ALTER POLICY join_attempts_insert_own ON public.board_join_attempts
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY boards_select_member ON public.boards
  USING ((created_by = (select auth.uid())) OR is_board_member(id) OR is_board_applicant(id) OR (get_user_role() = 'admin'::text));

ALTER POLICY comments_insert_authenticated ON public.comments
  WITH CHECK (((select auth.role()) = 'authenticated'::text) AND (user_id = (select auth.uid())));

ALTER POLICY comments_select_authenticated ON public.comments
  USING ((select auth.role()) = 'authenticated'::text);

ALTER POLICY comments_update_own ON public.comments
  USING (user_id = (select auth.uid()));

ALTER POLICY participants_update_own ON public.conversation_participants
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY flags_insert_authenticated ON public.flags
  WITH CHECK ((select auth.role()) = 'authenticated'::text);

ALTER POLICY messages_insert_own ON public.messages
  WITH CHECK ((sender_id = (select auth.uid())) AND is_conversation_participant(conversation_id));

ALTER POLICY messages_update_reaction ON public.messages
  USING (is_conversation_participant(conversation_id) AND (sender_id IS DISTINCT FROM (select auth.uid())))
  WITH CHECK (is_conversation_participant(conversation_id) AND (sender_id IS DISTINCT FROM (select auth.uid())));

ALTER POLICY push_subscriptions_delete_own ON public.push_subscriptions
  USING (user_id = (select auth.uid()));

ALTER POLICY push_subscriptions_insert_own ON public.push_subscriptions
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY push_subscriptions_select_own ON public.push_subscriptions
  USING (user_id = (select auth.uid()));

ALTER POLICY push_subscriptions_update_own ON public.push_subscriptions
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

ALTER POLICY requests_insert_member ON public.requests
  WITH CHECK ((user_id = (select auth.uid())) AND is_board_member(board_id));

ALTER POLICY requests_update_own ON public.requests
  USING (user_id = (select auth.uid()));

ALTER POLICY shift_claims_select_parties ON public.shift_claims
  USING ((claimant_id = (select auth.uid())) OR (owner_id = (select auth.uid())));

ALTER POLICY shifts_insert_member ON public.shifts
  WITH CHECK ((user_id = (select auth.uid())) AND ((board_id IS NULL) OR is_board_member(board_id) OR is_board_applicant(board_id)));

ALTER POLICY shifts_select_own ON public.shifts
  USING (user_id = (select auth.uid()));

ALTER POLICY shifts_update_own ON public.shifts
  USING (user_id = (select auth.uid()));

ALTER POLICY user_boards_delete_self ON public.user_boards
  USING (user_id = (select auth.uid()));

ALTER POLICY user_boards_insert_own ON public.user_boards
  WITH CHECK ((user_id = (select auth.uid())) AND (get_user_role() = ANY (ARRAY['user'::text, 'admin'::text])));

ALTER POLICY user_boards_select_own ON public.user_boards
  USING (user_id = (select auth.uid()));

ALTER POLICY "Users manage own preferences" ON public.user_preferences
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY users_select_authenticated ON public.users
  USING ((select auth.role()) = 'authenticated'::text);

ALTER POLICY users_update_mod ON public.users
  USING ((get_user_role() = 'mod'::text) AND (role = 'Mod'::text) AND (id <> (select auth.uid())));

ALTER POLICY users_update_own ON public.users
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));
