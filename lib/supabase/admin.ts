import { createClient } from '@supabase/supabase-js'
import { env, optionalServerEnv } from '@/lib/env'

/**
 * Service-role Supabase client — bypasses RLS. Server-only: never import
 * from client components. Callers should guard on
 * optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY being set before use.
 * (Was duplicated across notifications, cron routes, and the digest
 * unsubscribe endpoint.)
 */
export function createAdminClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    optionalServerEnv.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
