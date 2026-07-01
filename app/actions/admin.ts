'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/lib/auth/session'

export async function setBoardActive(boardId: string, isActive: boolean): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdminAction()
    const { error } = await supabase.from('boards').update({ is_active: isActive }).eq('id', boardId)
    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function setUserActive(userId: string, isActive: boolean): Promise<{ error?: string }> {
  try {
    const { supabase, userId: adminId } = await requireAdminAction()
    if (userId === adminId) return { error: 'You cannot deactivate your own account here.' }
    const { error } = await supabase.from('users').update({ is_active: isActive }).eq('id', userId)
    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
