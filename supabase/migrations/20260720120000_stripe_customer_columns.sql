-- Task 7: Stripe checkout. Link a MyShiftX account to its Stripe Customer and
-- Subscription so webhook events can be matched back to the right user.
--
-- Both columns are deliberately NOT added to the client SELECT grant. Since
-- 20260701152710 replaced the table-wide grant on public.users with an explicit
-- column list, any new column is invisible to anon/authenticated by default —
-- which is what we want here. Nothing client-side needs these IDs: the upgrade
-- page reads tier via get_own_membership(), and the billing portal route
-- resolves the customer server-side with the service role.
--
-- (Contrast with 20260718140000, where two new columns DID need client reads
-- and had to be granted explicitly. The rule cuts both ways.)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_customer_id     text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- One Stripe Customer per account. Partial so the many NULLs (every Basic user)
-- don't collide, and it doubles as the lookup index for webhook events that
-- carry only a customer ID.
CREATE UNIQUE INDEX IF NOT EXISTS users_stripe_customer_id_key
  ON public.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- customer.subscription.* events are matched on this first, falling back to
-- customer ID. Partial for the same reason.
CREATE INDEX IF NOT EXISTS users_stripe_subscription_id_idx
  ON public.users (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Belt and braces: make the lockdown explicit rather than relying on the
-- reader to know that the grant in 20260701152710 is a fixed column list.
REVOKE SELECT (stripe_customer_id, stripe_subscription_id)
  ON public.users FROM anon, authenticated;

-- Extend the Task 6 write-protection trigger to cover the billing columns.
-- Previously it reverted authenticated writes to membership/trial_ends_at/
-- trial_used; without this, a user could still point their row at someone
-- else's Stripe customer. Only the service role (the webhook) may write these.
CREATE OR REPLACE FUNCTION public.protect_membership_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF auth.role() = 'authenticated' THEN
    NEW.membership             := OLD.membership;
    NEW.trial_ends_at          := OLD.trial_ends_at;
    NEW.trial_used             := OLD.trial_used;
    NEW.billing_cycle          := OLD.billing_cycle;
    NEW.stripe_customer_id     := OLD.stripe_customer_id;
    NEW.stripe_subscription_id := OLD.stripe_subscription_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- The trigger's WHEN clause has to list the new columns too, or an UPDATE that
-- touches only stripe_customer_id never fires the guard.
DROP TRIGGER IF EXISTS enforce_membership_protection ON public.users;
CREATE TRIGGER enforce_membership_protection
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (
    (NEW.membership             IS DISTINCT FROM OLD.membership) OR
    (NEW.trial_ends_at          IS DISTINCT FROM OLD.trial_ends_at) OR
    (NEW.trial_used             IS DISTINCT FROM OLD.trial_used) OR
    (NEW.billing_cycle          IS DISTINCT FROM OLD.billing_cycle) OR
    (NEW.stripe_customer_id     IS DISTINCT FROM OLD.stripe_customer_id) OR
    (NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id)
  )
  EXECUTE FUNCTION public.protect_membership_fields();
