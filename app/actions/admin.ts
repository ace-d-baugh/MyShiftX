'use server'

import { revalidatePath } from 'next/cache'
import { getActionSession, getUserRole } from '@/lib/auth/session'

async function requireAdminSession() {
  const { supabase, userId } = await getActionSession()
  const role = await getUserRole(supabase, userId)
  if (role !== 'Admin') throw new Error('Not authorized.')
  return { supabase, userId }
}

export async function setBoardActive(boardId: string, isActive: boolean): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdminSession()
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
    const { supabase, userId: adminId } = await requireAdminSession()
    if (userId === adminId) return { error: 'You cannot deactivate your own account here.' }
    const { error } = await supabase.from('users').update({ is_active: isActive }).eq('id', userId)
    if (error) return { error: error.message }
    revalidatePath('/admin')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
