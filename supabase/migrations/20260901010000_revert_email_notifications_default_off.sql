-- Reverting 20260901000000: defaulting new signups to email-on drove up
-- Resend send volume for no clear benefit. Back to opt-in. Welcome page copy
-- updated to match ("You may also receive email notifications...").
ALTER TABLE public.users ALTER COLUMN notify_via_email SET DEFAULT false;
