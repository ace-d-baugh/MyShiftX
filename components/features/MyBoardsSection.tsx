'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  lookupBoardByCode, confirmJoinBoard, createBoard,
  updateBoardName, toggleInviteCode, regenerateInviteCode,
  deleteBoard, leaveBoard,
} from '@/app/actions/boards'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  LayoutGrid, Plus, X, Pencil, Key, Trash2, Check, Copy,
  RefreshCw, Users, MoreVertical,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BoardRole } from '@/lib/database.types'

interface BoardEntry {
  userBoardId: string
  board_id: string
  name: string
  role: BoardRole
  is_approved: boolean
  invite_code: string
  invite_code_enabled: boolean
}


interface MyBoardsSectionProps {
  userId: string
  displayNameReady: boolean
  createOpen: boolean
  onCreateOpenChange: (open: boolean) => void
}

const roleVariant: Record<BoardRole, 'user' | 'mod' | 'leader'> = {
  User: 'user', Mod: 'mod', Leader: 'leader',
}

export function MyBoardsSection({ userId, displayNameReady, createOpen, onCreateOpenChange }: MyBoardsSectionProps) {
  const supabase = createClient()
  const [boards, setBoards] = useState<BoardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Join flow
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null)
  const [pendingJoin, setPendingJoin] = useState<{ id: string; name: string } | null>(null)
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Create flow
  const [createName, setCreateName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  // Code modal
  const [codeBoard, setCodeBoard] = useState<BoardEntry | null>(null)
  const [codeToggleLoading, setCodeToggleLoading] = useState(false)
  const [regenLoading, setRegenLoading] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  // Delete confirm
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Leave confirm
  const [leaveId, setLeaveId] = useState<string | null>(null)
  const [leaveLoading, setLeaveLoading] = useState(false)

  // Mobile board action menu
  const [menuBoard, setMenuBoard] = useState<BoardEntry | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null)

  const loadBoards = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('user_boards')
      .select('id, board_id, role, is_approved, boards(id, name, invite_code, invite_code_enabled)')
      .eq('user_id', userId)
      .eq('is_hidden', false)
      .order('requested_at', { ascending: true })

    const list = (data ?? []).map((row: {
      id: string; board_id: string; role: BoardRole; is_approved: boolean;
      boards: { id: string; name: string; invite_code: string; invite_code_enabled: boolean } | null
    }) => ({
      userBoardId: row.id,
      board_id: row.board_id,
      name: row.boards?.name ?? '',
      role: row.role,
      is_approved: row.is_approved,
      invite_code: row.boards?.invite_code ?? '',
      invite_code_enabled: row.boards?.invite_code_enabled ?? false,
    }))
    setBoards(list)
    setLoading(false)
  }, [supabase, userId])

  useEffect(() => { loadBoards() }, [loadBoards])

  useEffect(() => {
    if (createOpen) { setCreateName(''); setCreateError(null) }
  }, [createOpen])

  // ── Join ──────────────────────────────────────────────────────────────────

  const handleLookup = async () => {
    if (joinCode.length !== 7) {
      setJoinError('Invite code must be exactly 7 characters.')
      return
    }
    setJoinError(null)
    setJoinLoading(true)
    const result = await lookupBoardByCode(joinCode)
    setJoinLoading(false)
    if (result.error) { setJoinError(result.error); return }
    if (result.board) setPendingJoin(result.board)
  }

  const handleConfirmJoin = async (confirmed: boolean) => {
    if (!pendingJoin) return
    setConfirmLoading(true)
    const result = await confirmJoinBoard(pendingJoin.id, confirmed)
    setConfirmLoading(false)
    setPendingJoin(null)
    setJoinCode('')
    if (result.error) {
      setJoinError(result.error)
    } else if (confirmed) {
      setJoinSuccess(`Your request to join "${pendingJoin.name}" has been sent. A moderator will review it shortly.`)
      setTimeout(() => setJoinSuccess(null), 8000)
      await loadBoards()
    }
  }

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!createName.trim()) { setCreateError('Board name is required.'); return }
    setCreateLoading(true)
    setCreateError(null)
    const result = await createBoard(createName)
    setCreateLoading(false)
    if (result.error) { setCreateError(result.error); return }
    onCreateOpenChange(false)
    setCreateName('')
    await loadBoards()
  }

  // ── Inline rename ─────────────────────────────────────────────────────────

  const startEdit = (board: BoardEntry) => {
    setEditingId(board.board_id)
    setEditName(board.name)
  }

  const handleRename = async (boardId: string) => {
    setEditLoading(true)
    const result = await updateBoardName(boardId, editName)
    setEditLoading(false)
    if (result.error) { setError(result.error); return }
    setEditingId(null)
    await loadBoards()
  }

  // ── Code modal ────────────────────────────────────────────────────────────

  const handleToggleCode = async () => {
    if (!codeBoard) return
    setCodeToggleLoading(true)
    const result = await toggleInviteCode(codeBoard.board_id, !codeBoard.invite_code_enabled)
    setCodeToggleLoading(false)
    if (result.error) { setError(result.error); return }
    const updated = { ...codeBoard, invite_code_enabled: !codeBoard.invite_code_enabled }
    setCodeBoard(updated)
    setBoards(prev => prev.map(b => b.board_id === codeBoard.board_id ? { ...b, invite_code_enabled: updated.invite_code_enabled } : b))
  }

  const handleRegen = async () => {
    if (!codeBoard) return
    setRegenLoading(true)
    const result = await regenerateInviteCode(codeBoard.board_id)
    setRegenLoading(false)
    if (result.error) { setError(result.error); return }
    const updated = { ...codeBoard, invite_code: result.code! }
    setCodeBoard(updated)
    setBoards(prev => prev.map(b => b.board_id === codeBoard.board_id ? { ...b, invite_code: result.code! } : b))
  }

  const copyCode = () => {
    if (!codeBoard) return
    navigator.clipboard.writeText(codeBoard.invite_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    const result = await deleteBoard(deleteId)
    setDeleteLoading(false)
    if (result.error) { setError(result.error); return }
    setDeleteId(null)
    await loadBoards()
  }

  // ── Leave ─────────────────────────────────────────────────────────────────

  const handleLeave = async () => {
    if (!leaveId) return
    setLeaveLoading(true)
    const result = await leaveBoard(leaveId)
    setLeaveLoading(false)
    if (result.error) { setError(result.error); return }
    setLeaveId(null)
    await loadBoards()
  }

  const openBoardMenu = (board: BoardEntry, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setMenuBoard(board)
  }
  const closeBoardMenu = () => { setMenuBoard(null); setMenuPos(null) }

  const approvedBoards = boards.filter(b => b.is_approved)
  const pendingBoards  = boards.filter(b => !b.is_approved)

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm">
          {error}
          <button className="ml-2 underline text-xs" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Approved board list */}
      {loading ? (
        <p className="text-sm text-text/50">Loading boards...</p>
      ) : approvedBoards.length === 0 ? (
        <p className="text-sm text-text/50">You haven&apos;t joined any boards yet.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {approvedBoards.map(board => (
                <tr key={board.userBoardId} className="border-b border-border last:border-0 hover:bg-primary-light/10 transition-colors">
                  {/* Board name + role cell */}
                  <td className="px-3 py-2.5">
                    {editingId === board.board_id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          className="input text-sm flex-1 h-8"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') handleRename(board.board_id); if (e.key === 'Escape') setEditingId(null) }}
                          autoFocus
                        />
                        <button onClick={() => handleRename(board.board_id)} disabled={editLoading} className="p-1 text-success hover:text-success/80 min-h-0 min-w-0" aria-label="Save">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-text/40 hover:text-text min-h-0 min-w-0" aria-label="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 min-w-0">
                        <LayoutGrid className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="font-medium text-text flex-1">{board.name}</span>
                        <Badge variant={roleVariant[board.role]} className="text-xs shrink-0">{board.role}</Badge>
                      </div>
                    )}
                  </td>

                  {/* Actions cell */}
                  <td className="px-3 py-2.5 align-top">
                    {/* Desktop: icon row */}
                    <div className="hidden sm:flex items-center justify-end gap-0.5">
                      {/* Members — visible to all roles */}
                      <Link href={`/boards/${board.board_id}`} className="p-1 text-text/40 hover:text-primary min-h-0 min-w-0 inline-flex" title="View members" aria-label="View members">
                        <Users className="w-3.5 h-3.5" />
                      </Link>
                      {editingId !== board.board_id && board.role === 'Leader' && (
                        <>
                          <button onClick={() => startEdit(board)} className="p-1 text-text/40 hover:text-primary min-h-0 min-w-0" title="Rename" aria-label="Rename board">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { setCodeBoard(board); setCodeCopied(false) }} className="p-1 text-text/40 hover:text-primary min-h-0 min-w-0" title="Invite code" aria-label="Manage invite code">
                            <Key className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(board.board_id)} className="p-1 text-text/40 hover:text-warning min-h-0 min-w-0" title="Delete board" aria-label="Delete board">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-px h-4 bg-border mx-1" />
                        </>
                      )}
                      {leaveId === board.board_id ? (
                        <span className="flex items-center gap-1 text-xs whitespace-nowrap">
                          <span className="text-text/50">Leave?</span>
                          <button onClick={handleLeave} disabled={leaveLoading} className="text-warning font-medium hover:underline">Yes</button>
                          <button onClick={() => setLeaveId(null)} className="text-text/40 hover:underline">No</button>
                        </span>
                      ) : (
                        <button onClick={() => setLeaveId(board.board_id)} className="p-1 text-text/40 hover:text-warning min-h-0 min-w-0" title="Leave board" aria-label="Leave board">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Mobile: three-dot menu */}
                    {editingId !== board.board_id && (
                      <div className="sm:hidden flex items-center justify-end">
                        {leaveId === board.board_id ? (
                          <span className="flex items-center gap-1 text-xs whitespace-nowrap">
                            <span className="text-text/50">Leave?</span>
                            <button onClick={handleLeave} disabled={leaveLoading} className="text-warning font-medium hover:underline">Yes</button>
                            <button onClick={() => setLeaveId(null)} className="text-text/40 hover:underline">No</button>
                          </span>
                        ) : (
                          <button
                            onClick={e => openBoardMenu(board, e)}
                            className="p-1 text-text/40 hover:text-primary min-h-0 min-w-0"
                            aria-label="Board actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending requests */}
      {pendingBoards.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-text/50 mb-1.5 uppercase tracking-wide">Pending Requests</p>
          <ul className="space-y-1.5">
            {pendingBoards.map(board => (
              <li key={board.userBoardId} className="flex items-center gap-2 text-sm text-text/60">
                <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 truncate">{board.name}</span>
                <Badge variant="pending" className="text-xs">Pending</Badge>
                <button
                  onClick={() => setLeaveId(board.board_id)}
                  className="p-1 text-text/40 hover:text-warning min-h-0 min-w-0"
                  aria-label="Withdraw request"
                  title="Withdraw request"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {leaveId === board.board_id && (
                  <span className="flex items-center gap-1 text-xs">
                    <button onClick={handleLeave} disabled={leaveLoading} className="text-warning font-medium hover:underline">Withdraw</button>
                    <button onClick={() => setLeaveId(null)} className="text-text/40 hover:underline">Cancel</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Join with invite code */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-medium text-text/50 mb-2 uppercase tracking-wide">Join a Board</p>
        {!displayNameReady ? (
          <p className="text-sm text-text/50 italic">To unlock, please save your display name above.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                className="input placeholder-text/50 text-sm uppercase tracking-widest flex-1 h-9"
                placeholder="XXXXXXX"
                maxLength={7}
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') handleLookup() }}
              />
              <Button
                size="sm"
                loading={joinLoading}
                onClick={handleLookup}
                className="h-9 min-w-[56px]"
              >
                Join
              </Button>
            </div>
            {joinError && <p className="text-xs text-warning">{joinError}</p>}
            {joinSuccess && <p className="text-xs text-success">{joinSuccess}</p>}
          </div>
        )}
      </div>

      {/* ── Mobile Board Actions Dropdown ───────────────────────────────── */}
      {menuBoard && menuPos && (
        <>
          <div className="fixed inset-0 z-10" onClick={closeBoardMenu} />
          <div
            className="fixed z-20 bg-card border border-border rounded-lg shadow-lg min-w-[160px] py-1"
            style={{ top: menuPos.top, right: menuPos.right }}
          >
            {menuBoard.role === 'Leader' && (
              <>
                <button
                  onClick={() => { startEdit(menuBoard); closeBoardMenu() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-primary-light/20 text-left"
                >
                  <Pencil className="w-3.5 h-3.5 shrink-0" /> Rename
                </button>
                <Link
                  href={`/boards/${menuBoard.board_id}`}
                  onClick={closeBoardMenu}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-primary-light/20"
                >
                  <Users className="w-3.5 h-3.5 shrink-0" /> Members
                </Link>
                <button
                  onClick={() => { setCodeBoard(menuBoard); setCodeCopied(false); closeBoardMenu() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-primary-light/20 text-left"
                >
                  <Key className="w-3.5 h-3.5 shrink-0" /> Invite Code
                </button>
                <button
                  onClick={() => { setDeleteId(menuBoard.board_id); closeBoardMenu() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning hover:bg-warning/10 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" /> Delete Board
                </button>
                <div className="border-t border-border my-1" />
              </>
            )}
            <button
              onClick={() => { setLeaveId(menuBoard.board_id); closeBoardMenu() }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning hover:bg-warning/10 text-left"
            >
              <X className="w-3.5 h-3.5 shrink-0" /> Leave Board
            </button>
          </div>
        </>
      )}

      {/* ── Join Confirmation Modal ──────────────────────────────────────── */}
      {pendingJoin && (
        <Modal onClose={() => handleConfirmJoin(false)}>
          <h3 className="font-accent font-bold text-text text-lg mb-2">Join Board?</h3>
          <p className="text-sm text-text/70 mb-6">
            Do you want to request to join <strong>&ldquo;{pendingJoin.name}&rdquo;</strong>?
            A moderator will review your request.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => handleConfirmJoin(false)} loading={confirmLoading}>
              No
            </Button>
            <Button size="sm" onClick={() => handleConfirmJoin(true)} loading={confirmLoading}>
              Yes, Request to Join
            </Button>
          </div>
        </Modal>
      )}

      {/* ── Create Board Modal ───────────────────────────────────────────── */}
      {createOpen && (
        <Modal onClose={() => onCreateOpenChange(false)}>
          <h3 className="font-accent font-bold text-text text-lg mb-4">Create a Board</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Board Name</label>
              <input
                type="text"
                className="input placeholder:text-text/50 text-sm"
                placeholder="e.g., Night Crew"
                value={createName}
                maxLength={60}
                onChange={e => { setCreateName(e.target.value); setCreateError(null) }}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                autoFocus
              />
              {createError && <p className="mt-1 text-xs text-warning">{createError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onCreateOpenChange(false)}>Cancel</Button>
              <Button size="sm" loading={createLoading} onClick={handleCreate} className="gap-1.5">
                <Plus className="w-4 h-4" /> Create
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Code Modal (Leader) ──────────────────────────────────────────── */}
      {codeBoard && (
        <Modal onClose={() => setCodeBoard(null)}>
          <h3 className="font-accent font-bold text-text text-lg mb-1">{codeBoard.name}</h3>
          <p className="text-xs text-text/50 mb-4">Invite Code</p>

          <div className="flex items-center gap-2 mb-4">
            <span className="font-mono text-3xl font-bold tracking-[0.3em] text-primary select-all">
              {codeBoard.invite_code}
            </span>
            <button
              onClick={copyCode}
              className="p-1.5 rounded-md text-text/40 hover:text-primary hover:bg-primary-light transition-colors min-h-0 min-w-0"
              aria-label="Copy invite code"
            >
              {codeCopied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-primary-light/30">
            <div>
              <p className="text-sm font-medium text-text">Accept new members</p>
              <p className="text-xs text-text/50">{codeBoard.invite_code_enabled ? 'Code is active' : 'Code is paused'}</p>
            </div>
            <button
              onClick={handleToggleCode}
              disabled={codeToggleLoading}
              role="switch"
              aria-checked={codeBoard.invite_code_enabled}
              aria-label="Toggle invite code"
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0',
                codeBoard.invite_code_enabled ? 'bg-primary' : 'bg-border'
              )}
            >
              <span
                className={cn(
                  'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                  codeBoard.invite_code_enabled ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={handleRegen}
              disabled={regenLoading}
              className="flex items-center gap-1.5 text-xs text-text/50 hover:text-warning transition-colors min-h-0"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', regenLoading && 'animate-spin')} />
              Regenerate Code
            </button>
            <Button variant="outline" size="sm" onClick={() => setCodeBoard(null)}>Close</Button>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {deleteId && (
        <Modal onClose={() => setDeleteId(null)}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h3 className="font-accent font-bold text-text text-lg">Delete Board?</h3>
              <p className="text-sm text-text/60 mt-1">
                This will permanently delete the board, all posts, and all comments.
                Members will not be deleted. This cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" size="sm" loading={deleteLoading} onClick={handleDelete} className="gap-1.5">
              <Trash2 className="w-4 h-4" /> Delete Board
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Simple modal overlay ───────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-sm p-6 z-10">
        {children}
      </div>
    </div>
  )
}
