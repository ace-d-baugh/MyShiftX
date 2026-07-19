-- Code-scan optional improvement: 32 SECURITY DEFINER functions were
-- executable by anon. The Task 6 hardening pass revoked from anon/authenticated
-- on four of them, but PUBLIC retained EXECUTE (functions get EXECUTE TO
-- PUBLIC by default), so every role still inherited it — same grant-precedence
-- gotcha as the membership-column lockdown. This pass revokes from PUBLIC and
-- re-grants exactly what each group needs.
--
-- DELIBERATELY UNCHANGED — RLS predicate helpers (is_board_member,
-- is_board_moderator, is_board_leader, is_board_applicant,
-- is_any_board_moderator, is_conversation_participant, shares_board_with,
-- get_user_role, post_is_active, has_approved_proficiency): these execute as
-- the querying role inside policy expressions, so revoking anon would make
-- any remaining TO-public policy ERROR for anonymous queries instead of
-- returning empty. They are pure predicates keyed off auth.uid() (harmless
-- for anon: always false/null).
--
-- Verified before writing: the iCal feed route uses the service-role client,
-- and getPublicShowAds() returns before calling get_own_membership for
-- anonymous visitors — no anon caller of any function below exists.

-- ── Trigger-only: no role calls these directly (triggers don't need EXECUTE
--    at fire time — it's checked at trigger creation) ─────────────────────────
REVOKE ALL ON FUNCTION public.auto_add_admins_to_board()       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_email_verified()          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user()                FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_membership_fields()      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_schedule_import_fields() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_conversation()             FROM PUBLIC, anon, authenticated;

-- ── Cron-only: called by /api/cron/expirations with the service key ──────────
REVOKE ALL ON FUNCTION public.expire_requests() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.expire_shifts()   FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_requests() TO service_role;
GRANT EXECUTE ON FUNCTION public.expire_shifts()   TO service_role;

-- ── Signed-in-user RPCs: every app caller goes through an authenticated
--    session (server actions / dashboard pages) ───────────────────────────────
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'consume_schedule_import()',
    'deactivate_own_request(uuid)',
    'deactivate_own_shift(uuid)',
    'get_conversations()',
    'get_messageable_users()',
    'get_or_create_conversation(uuid)',
    'get_or_create_ical_token()',
    'get_own_membership()',
    'get_pending_board_requests()',
    'get_schedule_import_status()',
    'get_unread_message_count()',
    'get_users_admin()',
    'lookup_board_by_invite_code(text)',
    'reset_ical_token()'
  ] LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', fn);
  END LOOP;
END $$;
