-- Bug fix: 20260701152710 replaced the table-wide SELECT grant on public.users
-- with an explicit column list (to hide membership/trial columns). Columns
-- added after that migration therefore have NO SELECT grant for
-- anon/authenticated — selecting them fails with "permission denied for table
-- users", which broke the Profile page ("Failed to load profile") and the
-- Wall's user lookup once Task 22 added them to those queries.
--
-- NOTE for future migrations: every new public.users column that clients read
-- needs an explicit GRANT SELECT like this one.

GRANT SELECT (notify_weekly_digest, onboarding_dismissed_at)
  ON public.users TO anon, authenticated;
