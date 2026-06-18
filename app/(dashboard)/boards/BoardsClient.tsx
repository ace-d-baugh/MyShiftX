'use client'

import { useState } from 'react'
import {
  Users, Crown, LayoutGrid, ChevronDown, MoreHorizontal,
  Pencil, Trash2, Check, X,
  LogOut, UserMinus, Flag, UserCog,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FlagModal } from '@/components/features/FlagModal'
import { cn } from '@/lib/utils'
import {
  updateUserBoardRole, transferBoardOwnership,
  removeUserFromBoard, leaveBoard,
  updateBoardName, deleteBoard,
} from '@/app/actions/boards'
import type { BoardRole } from '@/lib/database.types'
import type { ManagedBoard, BoardMember } from './types'

const roleVariant: Record<BoardRole, 'user' | 'mod' | 'leader'> = {
  User: 'user', Mod: 'mod', Leader: 'leader',
}

interface UsersClientProps {
  managedBoards: ManagedBoard[]
  currentUserId: string
  isAdmin: boolean
}

type ChangeRoleTarget = { member: BoardMember; boardId: string; myRole: BoardRole }
type Confirm = { boardId: string; boardName: string }
type RemoveTarget = { member: BoardMember; boardId: string }
type FlagTarget = { userId: string; boardId: string }

export function BoardsClient({ managedBoards: initial, currentUserId, isAdmin }: UsersClientProps) {
  const [boards, setBoards] = useState(initial)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [openMenuFor, setOpenMenuFor] = useState<{ id: string; top: number; right: number } | null>(null)

  // Modals / confirmations
  const [changeRoleTarget, setChangeRoleTarget] = useState<ChangeRoleTarget | null>(null)
  const [selectedRole, setSelectedRole] = useState<'User' | 'Mod'>('User')
  const [leaveConfirm, setLeaveConfirm] = useState<Confirm | null>(null)
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null)
  const [flagTarget, setFlagTarget] = useState<FlagTarget | null>(null)
  const [transferTarget, setTransferTarget] = useState<{ member: BoardMember; boardId: string } | null>(null)

  // Admin board management
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null)
  const [editBoardName, setEditBoardName] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Confirm | null>(null)

  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const patchMembers = (boardId: string, fn: (m: BoardMember[]) => BoardMember[]) =>
    setBoards(prev => prev.map(b => b.boardId === boardId ? { ...b, members: fn(b.members) } : b))

  const closeMenu = () => setOpenMenuFor(null)

  const toggleMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuFor?.id === id) { closeMenu(); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setOpenMenuFor({ id, top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openChangeRole = (member: BoardMember, boardId: string, myRole: BoardRole) => {
    closeMenu()
    setSelectedRole(member.role === 'Leader' ? 'Mod' : member.role as 'User' | 'Mod')
    setChangeRoleTarget({ member, boardId, myRole })
  }

  const handleChangeRole = async () => {
    if (!changeRoleTarget) return
    setActionLoading('role')
    setError(null)

    // If promoting to Leader that's a transfer
    if (selectedRole !== 'User' && selectedRole !== 'Mod') {
      // shouldn't happen but guard
      setActionLoading(null); return
    }

    const result = await updateUserBoardRole(changeRoleTarget.member.userBoardId, selectedRole)
    setActionLoading(null)
    if (result.error) { setError(result.error); return }
    patchMembers(changeRoleTarget.boardId, ms =>
      ms.map(m => m.userBoardId === changeRoleTarget.member.userBoardId ? { ...m, role: selectedRole } : m)
    )
    setChangeRoleTarget(null)
  }

  const handleRemoveUser = async () => {
    if (!removeTarget) return
    setActionLoading('remove')
    setError(null)
    const result = await removeUserFromBoard(removeTarget.member.userBoardId)
    setActionLoading(null)
    if (result.error) { setError(result.error); return }
    patchMembers(removeTarget.boardId, ms => ms.filter(m => m.userBoardId !== removeTarget.member.userBoardId))
    setRemoveTarget(null)
  }

  const handleLeaveBoard = async () => {
    if (!leaveConfirm) return
    setActionLoading('leave')
    setError(null)
    const result = await leaveBoard(leaveConfirm.boardId)
    setActionLoading(null)
    if (result.error) { setError(result.error); return }
    setBoards(prev => prev.filter(b => b.boardId !== leaveConfirm.boardId))
    setLeaveConfirm(null)
  }

  const handleTransfer = async () => {
    if (!transferTarget) return
    setActionLoading('transfer')
    setError(null)
    const result = await transferBoardOwnership(transferTarget.boardId, transferTarget.member.userId)
    setActionLoading(null)
    if (result.error) { setError(result.error); return }
    patchMembers(transferTarget.boardId, ms => ms.map(m => {
      if (m.userId === currentUserId) return { ...m, role: 'Mod' as BoardRole }
      if (m.userId === transferTarget.member.userId) return { ...m, role: 'Leader' as BoardRole }
      return m
    }))
    setBoards(prev => prev.map(b =>
      b.boardId === transferTarget.boardId ? { ...b, myRole: 'Mod' as BoardRole } : b
    ))
    setTransferTarget(null)
  }

  const startEditBoard = (boardId: string, name: string) => {
    setEditingBoardId(boardId)
    setEditBoardName(name)
  }

  const handleRenameBoard = async (boardId: string) => {
    setActionLoading('rename-' + boardId)
    const result = await updateBoardName(boardId, editBoardName)
    setActionLoading(null)
    if (result.error) { setError(result.error); return }
    setBoards(prev => prev.map(b => b.boardId === boardId ? { ...b, boardName: editBoardName.trim() } : b))
    setEditingBoardId(null)
  }

  const handleDeleteBoard = async () => {
    if (!deleteConfirm) return
    setActionLoading('delete')
    const result = await deleteBoard(deleteConfirm.boardId)
    setActionLoading(null)
    if (result.error) { setError(result.error); return }
    setBoards(prev => prev.filter(b => b.boardId !== deleteConfirm.boardId))
    setDeleteConfirm(null)
  }

  const toggleCollapsed = (boardId: string) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(boardId)) next.delete(boardId); else next.add(boardId)
      return next
    })

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="font-accent text-2xl font-bold text-text flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> My Boards
        </h1>
        <p className="text-sm text-text/60">
          {isAdmin ? 'All boards — full management access' : 'View and manage members of your boards'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Backdrop — closes the fixed-position menu on outside click */}
      {openMenuFor && (
        <div className="fixed inset-0 z-40" onClick={closeMenu} />
      )}

      {boards.length === 0 ? (
        <p className="text-sm text-text/50 italic">No boards to manage.</p>
      ) : (
        <div className="space-y-6">
          {boards.map(board => {
            const isCollapsed = collapsed.has(board.boardId)
            const isRenaming = editingBoardId === board.boardId

            return (
              <div key={board.boardId} className="rounded-xl border border-border overflow-hidden">

                {/* ── Board header ────────────────────────────────────────── */}
                <div className="flex items-center gap-2.5 px-4 py-3 bg-primary-light/30 border-b border-border">
                  <LayoutGrid className="w-4 h-4 text-primary shrink-0" />

                  {/* Board name / inline rename */}
                  {isRenaming ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <input
                        className="input text-sm h-8 flex-1"
                        value={editBoardName}
                        onChange={e => setEditBoardName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleRenameBoard(board.boardId)
                          if (e.key === 'Escape') setEditingBoardId(null)
                        }}
                        autoFocus
                      />
                      <button onClick={() => handleRenameBoard(board.boardId)} disabled={actionLoading === 'rename-' + board.boardId} className="p-1 text-success hover:text-success/80 min-h-0 min-w-0"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingBoardId(null)} className="p-1 text-text/40 hover:text-text min-h-0 min-w-0"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <span className="font-accent font-bold text-text text-sm truncate flex-1 min-w-0">{board.boardName}</span>
                  )}

                  {/* Member count pill */}
                  {!isRenaming && (
                    <span className="text-[11px] font-semibold bg-primary/15 text-primary px-2 py-0.5 rounded-full shrink-0 leading-none">
                      {board.members.length}
                    </span>
                  )}

                  {/* Right side: role badge (non-admin) or admin controls */}
                  {isAdmin ? (
                    <div className="flex items-center gap-0.5 ml-auto shrink-0">
                      <button onClick={() => startEditBoard(board.boardId, board.boardName)} className="p-1 text-text/40 hover:text-primary min-h-0 min-w-0" title="Rename board"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => setDeleteConfirm({ boardId: board.boardId, boardName: board.boardName })} className="p-1 text-text/40 hover:text-warning min-h-0 min-w-0" title="Delete board"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <Badge variant={roleVariant[board.myRole]} className="text-xs shrink-0 ml-auto">{board.myRole}</Badge>
                  )}

                  {/* Collapse chevron */}
                  <button
                    type="button"
                    onClick={() => toggleCollapsed(board.boardId)}
                    className="p-1 text-text/40 hover:text-text min-h-0 min-w-0 shrink-0"
                    aria-expanded={!isCollapsed}
                  >
                    <ChevronDown className={cn('w-4 h-4 transition-transform duration-300 ease-spring', !isCollapsed && 'rotate-180')} />
                  </button>
                </div>

                {/* ── Animated member table ───────────────────────────────── */}
                <div className={cn(
                  'grid transition-[grid-template-rows] duration-300 ease-spring',
                  isCollapsed ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                )}>
                  <div className="overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {board.members.map((member, rowIdx) => {
                          const isMe = member.userId === currentUserId
                          const myRole = board.myRole
                          const canChangeRole = !isMe && (myRole === 'Leader' || myRole === 'Mod' || isAdmin) && member.role !== 'Leader'
                          const canRemove = !isMe && (myRole === 'Leader' || isAdmin)
                          const canFlag = !isMe && (myRole === 'Mod' || myRole === 'User')
                          const menuId = member.userBoardId
                          const hasMenu = isMe || canFlag || canChangeRole || canRemove || (myRole === 'Leader' && member.role !== 'Leader')

                          return (
                            <tr
                              key={member.userBoardId}
                              className={cn(
                                'border-b border-border last:border-0 hover:bg-primary-light/20 transition-colors',
                                rowIdx % 2 === 0 ? 'bg-card dark:bg-primary-light/5' : 'bg-primary-light/5 dark:bg-card'
                              )}
                            >
                              {/* Name */}
                              <td className="px-4 py-2.5">
                                <span className="font-medium text-text">
                                  {member.displayName ?? <span className="italic text-text/40">No name</span>}
                                </span>
                                {isMe && <span className="ml-1.5 text-xs text-text/40">(you)</span>}
                              </td>

                              {/* Role pill — far right before menu */}
                              <td className="px-3 py-2.5 w-px whitespace-nowrap text-right">
                                <Badge variant={roleVariant[member.role]} className="text-xs">{member.role}</Badge>
                              </td>

                              {/* Three-dots menu */}
                              <td className="pr-3 py-2.5 w-px">
                                {hasMenu && (
                                  <button
                                    onClick={e => toggleMenu(menuId, e)}
                                    className="p-1 rounded text-text/40 hover:text-text hover:bg-primary-light/50 transition-colors min-h-0 min-w-0"
                                    aria-label="Options"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Change Role Modal ────────────────────────────────────────────────── */}
      <Modal
        open={!!changeRoleTarget}
        onClose={() => setChangeRoleTarget(null)}
        title="Change Role"
        size="sm"
      >
        {changeRoleTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text/70">
              Changing role for <strong>{changeRoleTarget.member.displayName ?? 'this member'}</strong>
            </p>
            <div className="space-y-2">
              {(['User', 'Mod'] as const).map(r => (
                <label key={r} className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors min-h-0 select-none" style={{ borderColor: selectedRole === r ? 'hsl(var(--color-primary))' : 'hsl(var(--color-border))' }}>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={selectedRole === r}
                    onChange={() => setSelectedRole(r)}
                    className="min-h-0 min-w-0 h-4 w-4"
                  />
                  <div>
                    <p className="text-sm font-medium text-text">{r}</p>
                    <p className="text-xs text-text/50">
                      {r === 'User' ? 'Can post and interact on the board' : 'Can approve members and manage flags'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setChangeRoleTarget(null)}>Cancel</Button>
              <Button size="sm" className="flex-1" loading={actionLoading === 'role'} onClick={handleChangeRole}>Confirm</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Leave Confirm Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!leaveConfirm}
        onClose={() => setLeaveConfirm(null)}
        title="Leave Board?"
        size="sm"
      >
        {leaveConfirm && (
          <div className="space-y-4">
            <p className="text-sm text-text/70">
              Are you sure you want to leave <strong>{leaveConfirm.boardName}</strong>? If you are the only Leader, you must transfer ownership first.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setLeaveConfirm(null)}>Cancel</Button>
              <Button variant="danger" size="sm" className="flex-1" loading={actionLoading === 'leave'} onClick={handleLeaveBoard}>Leave</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Remove User Confirm ──────────────────────────────────────────────── */}
      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Member?"
        size="sm"
      >
        {removeTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text/70">
              Remove <strong>{removeTarget.member.displayName ?? 'this member'}</strong> from the board? They can rejoin with an invite code.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setRemoveTarget(null)}>Cancel</Button>
              <Button variant="danger" size="sm" className="flex-1" loading={actionLoading === 'remove'} onClick={handleRemoveUser}>Remove</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Transfer Ownership Confirm ───────────────────────────────────────── */}
      <Modal
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        title="Transfer Ownership?"
        size="sm"
      >
        {transferTarget && (
          <div className="space-y-4">
            <p className="text-sm text-text/70">
              Make <strong>{transferTarget.member.displayName ?? 'this member'}</strong> the new Leader? You will become a Mod.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setTransferTarget(null)}>Cancel</Button>
              <Button size="sm" className="flex-1 gap-1 bg-warning text-white hover:bg-warning/90" loading={actionLoading === 'transfer'} onClick={handleTransfer}>
                <Crown className="w-3.5 h-3.5" /> Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Admin: Delete Board Confirm ──────────────────────────────────────── */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Board?"
        size="sm"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-sm text-text/70">
              Permanently delete <strong>{deleteConfirm.boardName}</strong>? All posts and memberships will be removed. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" size="sm" className="flex-1 gap-1" loading={actionLoading === 'delete'} onClick={handleDeleteBoard}>
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Fixed-position three-dots menu (outside overflow-hidden containers) */}
      {openMenuFor && (() => {
        const items = boards.flatMap(b => b.members).find(m => m.userBoardId === openMenuFor.id)
        const board = boards.find(b => b.members.some(m => m.userBoardId === openMenuFor.id))
        if (!items || !board) return null
        const isMe = items.userId === currentUserId
        const myRole = board.myRole
        type MenuItem = { label: string; icon: React.ComponentType<{ className?: string }>; action: () => void; danger?: boolean }
        const menuItems: MenuItem[] = []
        if (isMe) {
          menuItems.push({ label: 'Leave Board', icon: LogOut, danger: true, action: () => { closeMenu(); setLeaveConfirm({ boardId: board.boardId, boardName: board.boardName }) } })
        } else {
          const canFlag = !isMe && (myRole === 'Mod' || myRole === 'User')
          const canChangeRole = !isMe && (myRole === 'Leader' || myRole === 'Mod' || isAdmin) && items.role !== 'Leader'
          const canRemove = !isMe && (myRole === 'Leader' || isAdmin)
          if (canFlag) menuItems.push({ label: 'Flag User', icon: Flag, action: () => { closeMenu(); setFlagTarget({ userId: items.userId, boardId: board.boardId }) } })
          if (canChangeRole) menuItems.push({ label: 'Change Role', icon: UserCog, action: () => openChangeRole(items, board.boardId, myRole) })
          if (canRemove) menuItems.push({ label: 'Remove User', icon: UserMinus, danger: true, action: () => { closeMenu(); setRemoveTarget({ member: items, boardId: board.boardId }) } })
          if (myRole === 'Leader' && items.role !== 'Leader') menuItems.push({ label: 'Transfer Ownership', icon: Crown, action: () => { closeMenu(); setTransferTarget({ member: items, boardId: board.boardId }) } })
        }
        return (
          <div
            style={{ position: 'fixed', top: openMenuFor.top, right: openMenuFor.right }}
            className="w-44 rounded-lg border border-border bg-card shadow-xl z-50 py-1 overflow-hidden"
          >
            {menuItems.map(item => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={cn(
                    'flex items-center gap-2 w-full text-left px-3 py-2 text-sm transition-colors',
                    item.danger
                      ? 'text-warning hover:bg-warning/10'
                      : 'text-text/80 hover:bg-primary-light/50 hover:text-text'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {item.label}
                </button>
              )
            })}
          </div>
        )
      })()}

      {/* ── Flag User Modal ──────────────────────────────────────────────────── */}
      <FlagModal
        open={!!flagTarget}
        onClose={() => setFlagTarget(null)}
        targetType="user"
        targetId={flagTarget?.userId ?? ''}
        boardId={flagTarget?.boardId}
      />
    </div>
  )
}
