'use server'

import { revalidatePath } from 'next/cache'
import { getActionSession, getUserRole } from '@/lib/auth/session'
import type { RoadmapColumn } from '@/lib/database.types'

export async function reorderRoadmapCards(
  updates: { id: string; column_key: RoadmapColumn; position: number }[]
): Promise<{ error?: string }> {
  try {
    const { supabase, userId } = await getActionSession()
    const role = await getUserRole(supabase, userId)
    if (role !== 'Admin') return { error: 'Not authorized.' }

    for (const u of updates) {
      const { error } = await supabase
        .from('roadmap_cards')
        .update({ column_key: u.column_key, position: u.position })
        .eq('id', u.id)
      if (error) return { error: error.message }
    }

    revalidatePath('/kanban')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
