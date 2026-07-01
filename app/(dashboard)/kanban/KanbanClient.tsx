'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GripVertical, LayoutGrid, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { reorderRoadmapCards, createRoadmapCard, updateRoadmapCard, deleteRoadmapCard } from '@/app/actions/roadmap'
import type { RoadmapColumn } from '@/lib/database.types'

interface CardItem {
  id: string
  title: string
  description: string | null
  column_key: RoadmapColumn
  position: number
}

interface KanbanClientProps {
  initialCards: CardItem[]
}

const COLUMNS: {
  key: RoadmapColumn
  label: string
  header: string
  border: string
  count: string
}[] = [
  { key: 'deferred',    label: 'Deferred',    header: 'bg-warning/15 text-warning',        border: 'border-l-warning', count: 'bg-warning/20 text-warning' },
  { key: 'backlog',     label: 'Backlog',     header: 'bg-info/15 text-info',              border: 'border-l-info',    count: 'bg-info/20 text-info' },
  { key: 'next',        label: 'Next Up',     header: 'bg-accent/15 text-accent',          border: 'border-l-accent',  count: 'bg-accent/20 text-accent' },
  { key: 'in_progress', label: 'In Progress', header: 'bg-primary-light text-primary',     border: 'border-l-primary',  count: 'bg-primary-light text-primary' },
  { key: 'done',        label: 'Done',        header: 'bg-success/15 text-success',       border: 'border-l-success',  count: 'bg-success/20 text-success' },
]

function groupByColumn(cards: CardItem[]): Record<RoadmapColumn, CardItem[]> {
  const grouped: Record<RoadmapColumn, CardItem[]> = {
    done: [], in_progress: [], next: [], backlog: [], deferred: [],
  }
  for (const c of cards) grouped[c.column_key].push(c)
  for (const key of Object.keys(grouped) as RoadmapColumn[]) {
    grouped[key].sort((a, b) => a.position - b.position)
  }
  return grouped
}

export function KanbanClient({ initialCards }: KanbanClientProps) {
  const router = useRouter()
  const [columns, setColumns] = useState<Record<RoadmapColumn, CardItem[]>>(() => groupByColumn(initialCards))
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<RoadmapColumn | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<RoadmapColumn>>(new Set())

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSaving, setEditSaving] = useState(false)

  const [addingColumn, setAddingColumn] = useState<RoadmapColumn | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [addSaving, setAddSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<CardItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const toggleCollapse = (key: RoadmapColumn) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Resync local state whenever the server gives us fresh data (e.g. after
  // router.refresh() following a failed save).
  useEffect(() => {
    setColumns(groupByColumn(initialCards))
  }, [initialCards])

  const findCard = (id: string): { columnKey: RoadmapColumn; index: number } | null => {
    for (const key of Object.keys(columns) as RoadmapColumn[]) {
      const index = columns[key].findIndex(c => c.id === id)
      if (index !== -1) return { columnKey: key, index }
    }
    return null
  }

  const persist = async (next: Record<RoadmapColumn, CardItem[]>, touchedColumns: RoadmapColumn[]) => {
    const updates = touchedColumns.flatMap(key =>
      next[key].map((c, index) => ({ id: c.id, column_key: key, position: index }))
    )
    const { error: e } = await reorderRoadmapCards(updates)
    if (e) {
      setError(e)
      router.refresh()
    }
  }

  const moveCard = (cardId: string, toColumn: RoadmapColumn, toIndex: number) => {
    const from = findCard(cardId)
    if (!from) return
    if (from.columnKey === toColumn && from.index === toIndex) return

    setColumns(prev => {
      const next = { ...prev, [from.columnKey]: [...prev[from.columnKey]], [toColumn]: from.columnKey === toColumn ? prev[from.columnKey] : [...prev[toColumn]] }
      const [moved] = next[from.columnKey].splice(from.index, 1)
      const destination = from.columnKey === toColumn ? next[from.columnKey] : next[toColumn]
      const insertAt = Math.min(toIndex, destination.length)
      destination.splice(insertAt, 0, { ...moved, column_key: toColumn })

      const touched = from.columnKey === toColumn ? [toColumn] : [from.columnKey, toColumn]
      persist(next, touched)
      return next
    })
  }

  const onDragStart = (e: React.DragEvent, cardId: string) => {
    setDraggingId(cardId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', cardId)
  }

  const onDragEnd = () => {
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const onCardDragOver = (e: React.DragEvent, columnKey: RoadmapColumn) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverColumn(columnKey)
  }

  const onDropOnCard = (e: React.DragEvent, columnKey: RoadmapColumn, targetCard: CardItem) => {
    e.preventDefault()
    e.stopPropagation()
    const cardId = draggingId ?? e.dataTransfer.getData('text/plain')
    if (!cardId || cardId === targetCard.id) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const isBelowMidpoint = e.clientY - rect.top > rect.height / 2
    const targetIndex = columns[columnKey].findIndex(c => c.id === targetCard.id)
    moveCard(cardId, columnKey, isBelowMidpoint ? targetIndex + 1 : targetIndex)
    setDraggingId(null)
    setDragOverColumn(null)
  }

  const onDropOnColumn = (e: React.DragEvent, columnKey: RoadmapColumn) => {
    e.preventDefault()
    const cardId = draggingId ?? e.dataTransfer.getData('text/plain')
    if (!cardId) return
    moveCard(cardId, columnKey, columns[columnKey].length)
    setDraggingId(null)
    setDragOverColumn(null)
  }

  // ── Create ───────────────────────────────────────────────────────────────

  const startAdd = (columnKey: RoadmapColumn) => {
    setAddingColumn(columnKey)
    setNewTitle('')
    setNewDescription('')
  }

  const cancelAdd = () => {
    setAddingColumn(null)
    setNewTitle('')
    setNewDescription('')
  }

  const saveAdd = async () => {
    if (!addingColumn || !newTitle.trim()) return
    setAddSaving(true)
    setError(null)
    const { error: e, card } = await createRoadmapCard(addingColumn, newTitle, newDescription)
    setAddSaving(false)
    if (e || !card) {
      setError(e ?? 'Failed to create card.')
      return
    }
    setColumns(prev => ({ ...prev, [addingColumn]: [...prev[addingColumn], card] }))
    cancelAdd()
  }

  // ── Update ───────────────────────────────────────────────────────────────

  const startEdit = (card: CardItem) => {
    setEditingId(card.id)
    setEditTitle(card.title)
    setEditDescription(card.description ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const saveEdit = async () => {
    if (!editingId || !editTitle.trim()) return
    setEditSaving(true)
    setError(null)
    const { error: e } = await updateRoadmapCard(editingId, editTitle, editDescription)
    setEditSaving(false)
    if (e) {
      setError(e)
      return
    }
    const trimmedTitle = editTitle.trim()
    const trimmedDescription = editDescription.trim() || null
    setColumns(prev => {
      const next = { ...prev }
      for (const key of Object.keys(next) as RoadmapColumn[]) {
        next[key] = next[key].map(c => c.id === editingId ? { ...c, title: trimmedTitle, description: trimmedDescription } : c)
      }
      return next
    })
    cancelEdit()
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    setError(null)
    const { error: e } = await deleteRoadmapCard(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
    if (e) {
      setError(e)
      return
    }
    setColumns(prev => ({
      ...prev,
      [deleteTarget.column_key]: prev[deleteTarget.column_key].filter(c => c.id !== deleteTarget.id),
    }))
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-accent text-2xl font-bold text-text flex items-center gap-2">
          <LayoutGrid className="w-6 h-6 text-primary" /> Roadmap
        </h1>
        <p className="text-sm text-text/60">
          Drag cards between columns to update the plan. Admin only.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
          {error}
          <button className="ml-2 underline text-xs" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 items-stretch">
        {COLUMNS.map(col => {
          const isCollapsed = collapsed.has(col.key)
          return (
            <div
              key={col.key}
              style={{ width: isCollapsed ? '3rem' : '18rem' }}
              className={cn(
                'flex flex-col shrink-0 rounded-lg border border-border bg-card/50 overflow-hidden transition-[width] duration-300 ease-spring',
                dragOverColumn === col.key && 'ring-2 ring-primary/40'
              )}
              onDragOver={e => { e.preventDefault(); setDragOverColumn(col.key) }}
              onDrop={e => onDropOnColumn(e, col.key)}
            >
              <button
                type="button"
                onClick={() => toggleCollapse(col.key)}
                title={isCollapsed ? `Expand ${col.label}` : `Collapse ${col.label}`}
                className={cn(
                  'flex font-medium text-sm shrink-0 transition-colors hover:brightness-95 cursor-pointer',
                  col.header,
                  isCollapsed
                    ? 'flex-1 flex-col items-center justify-start gap-2 py-3'
                    : 'items-center justify-between px-3 py-2.5 rounded-t-lg'
                )}
              >
                {isCollapsed ? (
                  <>
                    <span className={cn('text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0', col.count)}>
                      {columns[col.key].length}
                    </span>
                    <span
                      className="text-sm font-semibold whitespace-nowrap animate-fade-in"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      {col.label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="animate-fade-in">{col.label}</span>
                    <span className={cn('text-xs font-bold rounded-full px-2 py-0.5', col.count)}>
                      {columns[col.key].length}
                    </span>
                  </>
                )}
              </button>

              {!isCollapsed && (
                <div className="flex-1 p-2 space-y-2 min-h-[120px] animate-fade-in">
                  {columns[col.key].map(card => {
                    const isEditing = editingId === card.id
                    return (
                      <div
                        key={card.id}
                        draggable={!isEditing}
                        onDragStart={e => onDragStart(e, card.id)}
                        onDragEnd={onDragEnd}
                        onDragOver={e => onCardDragOver(e, col.key)}
                        onDrop={e => onDropOnCard(e, col.key, card)}
                        className={cn(
                          'card border-l-4 select-none',
                          col.border,
                          !isEditing && 'cursor-grab active:cursor-grabbing',
                          draggingId === card.id && 'opacity-40'
                        )}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              autoFocus
                              className="input text-sm h-8"
                              value={editTitle}
                              onChange={e => setEditTitle(e.target.value)}
                              placeholder="Title"
                            />
                            <textarea
                              className="input text-xs min-h-[60px] py-1.5"
                              value={editDescription}
                              onChange={e => setEditDescription(e.target.value)}
                              placeholder="Description (optional)"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-md text-text/40 hover:text-text hover:bg-primary-light/50 transition-colors min-h-0 min-w-0"
                                aria-label="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={saveEdit}
                                disabled={editSaving || !editTitle.trim()}
                                className="p-1.5 rounded-md text-success hover:bg-success/10 transition-colors min-h-0 min-w-0 disabled:opacity-40"
                                aria-label="Save"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-4 h-4 text-text/30 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-text leading-snug">{card.title}</p>
                              {card.description && (
                                <p className="text-xs text-text/50 mt-1 leading-relaxed">{card.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                onClick={() => startEdit(card)}
                                className="p-1 rounded-md text-text/30 hover:text-primary hover:bg-primary-light/50 transition-colors min-h-0 min-w-0"
                                aria-label={`Edit ${card.title}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(card)}
                                className="p-1 rounded-md text-text/30 hover:text-warning hover:bg-warning/10 transition-colors min-h-0 min-w-0"
                                aria-label={`Delete ${card.title}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {addingColumn === col.key ? (
                    <div className="card border-l-4 border-l-border space-y-2">
                      <input
                        autoFocus
                        className="input text-sm h-8"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="Title"
                      />
                      <textarea
                        className="input text-xs min-h-[60px] py-1.5"
                        value={newDescription}
                        onChange={e => setNewDescription(e.target.value)}
                        placeholder="Description (optional)"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={cancelAdd}
                          className="p-1.5 rounded-md text-text/40 hover:text-text hover:bg-primary-light/50 transition-colors min-h-0 min-w-0"
                          aria-label="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={saveAdd}
                          disabled={addSaving || !newTitle.trim()}
                          className="p-1.5 rounded-md text-success hover:bg-success/10 transition-colors min-h-0 min-w-0 disabled:opacity-40"
                          aria-label="Add card"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startAdd(col.key)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium text-text/40 hover:text-text hover:bg-primary-light/40 transition-colors min-h-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add card
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Modal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Delete card" size="sm">
        <p className="text-sm text-text/70 mb-4">
          Delete &ldquo;{deleteTarget?.title}&rdquo;? This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={doDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
