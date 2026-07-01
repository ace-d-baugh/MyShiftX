-- The previous migration's column-level REVOKE had no effect: Supabase grants
-- table-wide SELECT to anon/authenticated by default, and a table-level grant
-- always takes precedence over a column-level REVOKE. To actually hide
-- membership/trial_ends_at/trial_used from cross-user reads, the table-level
-- grant must be revoked and replaced with an explicit column list.

REVOKE SELECT ON public.users FROM anon, authenticated;

GRANT SELECT (
  id, display_name, email, email_verified, phone_number,
  notify_via_email, notify_via_sms, is_active, last_login_at,
  created_at, updated_at, role
) ON public.users TO anon, authenticated;
