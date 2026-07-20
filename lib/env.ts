function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

/**
 * Centralized, validated access to environment variables the app cannot run
 * without. Each getter throws a clear error on first access if unset, instead
 * of failing deep inside unrelated code with a cryptic downstream error
 * (e.g. a Supabase client silently constructed with `undefined`).
 *
 * NEXT_PUBLIC_* values are read via static `process.env.NEXT_PUBLIC_X`
 * property access (not a dynamic lookup) so Next.js can still inline them
 * into the client bundle.
 */
export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  },
}

/**
 * Server-only variables that some features intentionally soft-fail without
 * (email sending, the expirations cron) rather than crashing the request.
 * Returns undefined if unset — callers decide how to degrade.
 */
export const optionalServerEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() { return process.env.SUPABASE_SERVICE_ROLE_KEY },
  get RESEND_API_KEY() { return process.env.RESEND_API_KEY },
  get CRON_SECRET() { return process.env.CRON_SECRET },
  // Photo schedule import (Task 15) — Gemini vision backend. The feature
  // stays fully hidden until the key is set (same pattern as AdSense).
  get GEMINI_API_KEY() { return process.env.GEMINI_API_KEY },
  // Defaults to gemini-2.5-flash in the route if unset.
  get GEMINI_MODEL() { return process.env.GEMINI_MODEL },
  // Stripe (Task 7) — checkout stays in "launching soon" mode until this is
  // set, which also gates the upgrade entry points (nav link, Wall banner).
  get STRIPE_SECRET_KEY() { return process.env.STRIPE_SECRET_KEY },
  // Signing secret for /api/webhooks/stripe. Without it the webhook refuses
  // every request rather than trusting unverified event payloads.
  get STRIPE_WEBHOOK_SECRET() { return process.env.STRIPE_WEBHOOK_SECRET },
  // Per-plan Price IDs are read via lib/stripe.ts `priceIdForPlan()`, keyed off
  // the `priceIdEnv` name each plan carries in lib/pricing.ts:
  //   STRIPE_PRICE_PRO_MONTHLY / _QUARTERLY / _SEMIANNUAL / _ANNUAL
  // Web Push (Task 16) — VAPID key pair. The public key is also read
  // client-side as NEXT_PUBLIC_VAPID_PUBLIC_KEY; push features stay fully
  // hidden until both are set.
  get VAPID_PRIVATE_KEY() { return process.env.VAPID_PRIVATE_KEY },
  get NEXT_PUBLIC_VAPID_PUBLIC_KEY() { return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY },
}
