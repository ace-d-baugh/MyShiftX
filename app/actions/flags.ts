'use server'

import { revalidatePath } from 'next/cache'
import { getActionSession, getUserRole } from '@/lib/auth/session'

export async function resolveFlag(
  flagId: string,
  action: 'resolved' | 'dismissed'
): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await getActionSession()

    const [role, { data: isMod }] = await Promise.all([
      getUserRole(supabase, userId),
      supabase.rpc('is_any_board_moderator'),
    ])
    if (role !== 'Admin' && !isMod) return { error: 'Not authorized.' }

    const { data: flag, error: flagErr } = await supabase
      .from('flags')
      .select('target_type, target_id')
      .eq('id', flagId)
      .single()
    if (flagErr || !flag) return { error: 'Flag not found.' }

    if (action === 'resolved' && flag.target_type === 'comment') {
      const { error: commentErr } = await supabase
        .from('comments')
        .update({ is_active: false })
        .eq('id', flag.target_id)
      if (commentErr) return { error: commentErr.message }
    }

    const { error } = await supabase
      .from('flags')
      .update({ status: action, resolved_by_user_id: userId })
      .eq('id', flagId)
    if (error) return { error: error.message }

    revalidatePath('/leader/flags')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
