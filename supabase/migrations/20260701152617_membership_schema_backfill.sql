-- Backfill migration: records the membership/trial schema that was already applied
-- directly to production (via SQL Editor) so the repo's migration history matches
-- the live database. All statements are idempotent/no-op if already present.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS membership text NOT NULL DEFAULT 'Basic',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_membership_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_membership_check CHECK (membership = ANY (ARRAY['Basic'::text, 'Pro'::text, 'Trial'::text]));
  END IF;
END $$;

-- Only the service role (Stripe webhook) may change membership/trial fields;
-- any request authenticated as a regular user has its changes to these
-- columns silently reverted.
CREATE OR REPLACE FUNCTION public.protect_membership_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.membership    := OLD.membership;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.trial_used    := OLD.trial_used;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS enforce_membership_protection ON public.users;
CREATE TRIGGER enforce_membership_protection
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (
    (NEW.membership IS DISTINCT FROM OLD.membership) OR
    (NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at) OR
    (NEW.trial_used IS DISTINCT FROM OLD.trial_used)
  )
  EXECUTE FUNCTION public.protect_membership_fields();
