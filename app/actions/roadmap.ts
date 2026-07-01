'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminAction } from '@/lib/auth/session'
import type { RoadmapColumn } from '@/lib/database.types'

export async function reorderRoadmapCards(
  updates: { id: string; column_key: RoadmapColumn; position: number }[]
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdminAction()

    const results = await Promise.all(
      updates.map(u =>
        supabase
          .from('roadmap_cards')
          .update({ column_key: u.column_key, position: u.position })
          .eq('id', u.id)
      )
    )
    const failed = results.find(r => r.error)
    if (failed?.error) return { error: failed.error.message }

    revalidatePath('/kanban')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function createRoadmapCard(
  columnKey: RoadmapColumn,
  title: string,
  description: string
): Promise<{ error?: string; card?: { id: string; title: string; description: string | null; column_key: RoadmapColumn; position: number } }> {
  try {
    const { supabase } = await requireAdminAction()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) return { error: 'Title is required.' }

    const { data: last } = await supabase
      .from('roadmap_cards')
      .select('position')
      .eq('column_key', columnKey)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data, error } = await supabase
      .from('roadmap_cards')
      .insert({
        title: trimmedTitle,
        description: description.trim() || null,
        column_key: columnKey,
        position: (last?.position ?? -1) + 1,
      })
      .select('id, title, description, column_key, position')
      .single()

    if (error) return { error: error.message }

    revalidatePath('/kanban')
    return { card: data }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function updateRoadmapCard(
  id: string,
  title: string,
  description: string
): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdminAction()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) return { error: 'Title is required.' }

    const { error } = await supabase
      .from('roadmap_cards')
      .update({ title: trimmedTitle, description: description.trim() || null })
      .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/kanban')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}

export async function deleteRoadmapCard(id: string): Promise<{ error?: string }> {
  try {
    const { supabase } = await requireAdminAction()

    const { error } = await supabase.from('roadmap_cards').delete().eq('id', id)
    if (error) return { error: error.message }

    revalidatePath('/kanban')
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
