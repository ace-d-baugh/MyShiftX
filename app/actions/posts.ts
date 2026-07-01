'use server'

import { getActionSession } from '@/lib/auth/session'

export async function deactivateShift(id: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await getActionSession()

    const { data, error } = await supabase
      .rpc('deactivate_own_shift', { p_shift_id: id })

    if (error) return { error: error.message }
    if (!data) return { error: 'Post not found or you do not own it.' }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deactivateRequest(id: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await getActionSession()

    const { data, error } = await supabase
      .rpc('deactivate_own_request', { p_request_id: id })

    if (error) return { error: error.message }
    if (!data) return { error: 'Post not found or you do not own it.' }
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
