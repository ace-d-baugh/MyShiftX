-- S6: Stripe does not guarantee delivery order, and a 500 requeues an event
-- that may land after a newer one. syncSubscription() applied whatever state
-- the received event carried, unconditionally, so a delayed "active" arriving
-- after a "canceled" restored Pro indefinitely and unpaid -- and the inverse
-- stripped a paying customer.
--
-- Record when the applied event was created at Stripe, so the webhook can drop
-- anything older than what it has already applied. Nullable: existing rows
-- have no recorded event, and a null must not block the first real update.
--
-- MyShiftX only. WDWShiftX removed billing entirely and has no webhook.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS stripe_event_at timestamptz;

COMMENT ON COLUMN public.users.stripe_event_at IS
  'Stripe event.created of the last subscription event applied to this row. Used by the webhook to discard out-of-order or replayed events. Service-role only, like the other billing columns.';

-- Same lockdown as the other billing columns: clients must never write it.
REVOKE UPDATE (stripe_event_at) ON public.users FROM anon, authenticated;
REVOKE SELECT (stripe_event_at) ON public.users FROM anon, authenticated;
