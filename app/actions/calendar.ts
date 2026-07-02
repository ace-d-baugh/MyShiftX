'use server'

import { getActionSession } from '@/lib/auth/session'

// Both RPCs are SECURITY DEFINER, scoped to auth.uid(), and return NULL for
// Basic members — the server actions just relay them for the Profile UI.

export async function getIcalFeedToken(): Promise<{ token: string | null; error?: string }> {
  try {
    const { supabase } = await getActionSession()
    const { data, error } = await supabase.rpc('get_or_create_ical_token')
    if (error) throw new Error(error.message)
    return { token: data ?? null }
  } catch (e) {
    return { token: null, error: e instanceof Error ? e.message : 'Could not load your feed URL.' }
  }
}

export async function resetIcalFeedToken(): Promise<{ token: string | null; error?: string }> {
  try {
    const { supabase } = await getActionSession()
    const { data, error } = await supabase.rpc('reset_ical_token')
    if (error) throw new Error(error.message)
    return { token: data ?? null }
  } catch (e) {
    return { token: null, error: e instanceof Error ? e.message : 'Could not reset your feed URL.' }
  }
}
