-- One-time data backfill (not a schema/behavior change):

-- Grandfather all current users onto Pro so they keep access to upcoming
-- Pro-only features and don't see ads once the ad system ships. Only affects
-- existing rows; new signups still default to 'Basic' per the users table default.
UPDATE public.users SET membership = 'Pro';

-- Legacy shifts/requests deactivated before removed_reason existed have no way
-- to know their true removal cause — the only mechanism that existed at the
-- time was auto-expiration, so backfill them as 'expired' with no specific
-- remover (system action, not a user). Only touches already-inactive rows;
-- going forward every deactivation path already sets this correctly.
UPDATE public.shifts
SET removed_reason = 'expired', removed_by_user_id = NULL
WHERE is_active = false AND removed_reason IS NULL;

UPDATE public.requests
SET removed_reason = 'expired', removed_by_user_id = NULL
WHERE is_active = false AND removed_reason IS NULL;
