-- Task 22: schedule-first onboarding + weekly digest email.
--
-- onboarding_dismissed_at — set when the user finishes or skips the /welcome
-- wizard; brand-new users (no boards, no shifts, not dismissed) are routed to
-- /welcome from the Wall until one of those becomes true.
--
-- notify_weekly_digest — per-feature opt-out for the Sunday digest email
-- (independent of notify_via_email, which gates transactional mail).

ALTER TABLE public.users
  ADD COLUMN notify_weekly_digest boolean NOT NULL DEFAULT true,
  ADD COLUMN onboarding_dismissed_at timestamptz;
