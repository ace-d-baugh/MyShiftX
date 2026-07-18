-- The /upgrade page sells a quarterly (3-month) plan, but the billing_cycle
-- CHECK constraint predates it. Widen the constraint to accept 'quarterly'.
ALTER TABLE public.users DROP CONSTRAINT users_billing_cycle_check;
ALTER TABLE public.users ADD CONSTRAINT users_billing_cycle_check
  CHECK (billing_cycle IN ('monthly', 'quarterly', 'semi_annual', 'yearly'));
