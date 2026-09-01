-- New signups now start with email notifications on (the Welcome page tells
-- them "Email updates are already on" — the column default disagreed).
-- Existing users are untouched; only future INSERTs pick up the new default.
ALTER TABLE public.users ALTER COLUMN notify_via_email SET DEFAULT true;
