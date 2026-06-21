'use client'

import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { MessageSquare, Star, ChevronDown, User, Edit, Trash2, Flag, X, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { FlagModal } from '@/components/features/FlagModal'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { CommentPostType } from '@/lib/database.types'
import { notifyInterest } from '@/app/actions/notifications'

const QUICK_INTEREST_BODY = "I'm interested!"

interface CommentData {
  id: string
  user_id: string | null
  display_name: string
  body: string
  is_interested: boolean
  created_at: string
  updated_at: string
}

interface CommentSectionProps {
  postType: CommentPostType
  postId: string
  isOwner: boolean
  currentUserId?: string
  currentUserName?: string
  commentCount: number
  interestedCount: number
  boardId?: string
  actions?: React.ReactNode
  showContactDisabled?: boolean
  openCommentsTick?: number
  interestTick?: number
}

export function CommentSection({
  postType,
  postId,
  isOwner,
  currentUserId,
  commentCount,
  interestedCount,
  boardId,
  actions,
  showContactDisabled,
  openCommentsTick,
  interestTick,
}: CommentSectionProps) {
  const supabase = useMemo(() => createClient(), [])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [interestedOpen, setInterestedOpen] = useState(false)
  const [comments, setComments] = useState<CommentData[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [body, setBody] = useState('')
  const [isInterested, setIsInterested] = useState(false)
  const [replyToName, setReplyToName] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [flagCommentId, setFlagCommentId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  const fetchComments = useCallback(async (): Promise<CommentData[]> => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('id, user_id, body, is_interested, created_at, updated_at, users(display_name)')
        .eq('post_type', postType)
        .eq('post_id', postId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
      if (error) throw error
      const mapped = (data ?? []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        user_id: c.user_id as string | null,
        display_name: (c.users as { display_name: string } | null)?.display_name ?? 'Former User',
        body: c.body as string,
        is_interested: c.is_interested as boolean,
        created_at: c.created_at as string,
        updated_at: c.updated_at as string,
      }))
      setComments(mapped)
      return mapped
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load comments.')
      return comments ?? []
    } finally {
      setLoading(false)
    }
  }, [supabase, postType, postId, comments])

  // External triggers from the three-dot card menu
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (openCommentsTick) { setCommentsOpen(true); if (comments === null) fetchComments() } }, [openCommentsTick])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (interestTick && !isOwner && currentUserId && !posting) handleInterestedPillClick() }, [interestTick])

  const toggleComments = () => {
    setCommentsOpen(prev => {
      const next = !prev
      if (next && comments === null) fetchComments()
      return next
    })
  }

  const toggleInterestedList = () => {
    setInterestedOpen(prev => {
      const next = !prev
      if (next && comments === null) fetchComments()
      return next
    })
  }

  // Non-owner quick action: one click registers interest via an auto-generated
  // comment, so the bottom pill is a real action and not just a duplicate of
  // the composer's "Interested?" toggle. Clicking again asks for confirmation
  // since un-marking deletes that comment.
  const handleInterestedPillClick = async () => {
    if (isOwner) {
      toggleInterestedList()
      return
    }
    if (!currentUserId || posting) return
    setPosting(true)
    setError(null)
    try {
      const list = comments ?? (await fetchComments())
      const existing = list.find(
        c => c.user_id === currentUserId && c.is_interested && c.body === QUICK_INTEREST_BODY
      )
      if (existing) {
        setConfirmRemoveId(existing.id)
        return
      }
      const { error } = await (supabase as any).from('comments').insert({
        post_type: postType,
        post_id: postId,
        user_id: currentUserId,
        body: QUICK_INTEREST_BODY,
        is_interested: true,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      if (error) throw error
      await fetchComments()
      // Fire-and-forget — notify the post owner without blocking the UI
      notifyInterest({ postId, postType, commenterName: currentUserName ?? 'Someone' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to mark interested.')
    } finally {
      setPosting(false)
    }
  }

  const handleConfirmRemoveInterest = async () => {
    if (!confirmRemoveId) return
    await handleDelete(confirmRemoveId)
    setConfirmRemoveId(null)
  }

  const startReply = (c: CommentData) => {
    setReplyToName(c.display_name)
    setBody(`@${c.display_name} `)
    textareaRef.current?.focus()
  }

  const startEdit = (c: CommentData) => {
    setEditingId(c.id)
    setEditBody(c.body)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUserId || !body.trim()) return
    setPosting(true)
    setError(null)
    try {
      const { error } = await (supabase as any).from('comments').insert({
        post_type: postType,
        post_id: postId,
        user_id: currentUserId,
        body: body.trim(),
        is_interested: isOwner ? false : isInterested,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      if (error) throw error
      const wasInterested = !isOwner && isInterested
      setBody('')
      setIsInterested(false)
      setReplyToName(null)
      await fetchComments()
      // Fire-and-forget — notify the post owner if this comment marked interest
      if (wasInterested && currentUserName) {
        notifyInterest({ postId, postType, commenterName: currentUserName })
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post comment.')
    } finally {
      setPosting(false)
    }
  }

  const handleSaveEdit = async (id: string) => {
    if (!editBody.trim()) return
    setPosting(true)
    setError(null)
    try {
      const { error } = await (supabase as any).from('comments').update({ body: editBody.trim() } as any).eq('id', id)
      if (error) throw error
      setEditingId(null)
      await fetchComments()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save comment.')
    } finally {
      setPosting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setPosting(true)
    try {
      await (supabase as any).from('comments').update({ is_active: false } as any).eq('id', id)
      await fetchComments()
    } finally {
      setPosting(false)
    }
  }

  const interestedUsers = useMemo(() => {
    const map = new Map<string, CommentData>()
    ;(comments ?? [])
      .filter(c => c.is_interested && c.user_id)
      .forEach(c => map.set(c.user_id as string, c))
    return [...map.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
  }, [comments])

  const displayCommentCount = comments ? comments.length : commentCount
  const displayInterestedCount = comments
    ? new Set(comments.filter(c => c.is_interested && c.user_id).map(c => c.user_id)).size
    : interestedCount

  const myInterest = !!currentUserId && (comments ?? []).some(
    c => c.user_id === currentUserId && c.is_interested && c.body === QUICK_INTEREST_BODY
  )

  return (
    <>
      <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={toggleComments}
            className="badge bg-text/10 text-text/70 hover:bg-primary-light cursor-pointer inline-flex items-center gap-1 transition-colors shrink-0"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Comments </span>({displayCommentCount})
            <ChevronDown className={cn('w-3 h-3 transition-transform', commentsOpen && 'rotate-180')} />
          </button>
          <button
            type="button"
            onClick={handleInterestedPillClick}
            disabled={isOwner ? false : !currentUserId || posting}
            className={cn(
              'badge inline-flex items-center gap-1 transition-colors shrink-0',
              isOwner
                ? 'bg-secondary-accent/20 text-text hover:bg-secondary-accent/30 cursor-pointer'
                : myInterest
                  ? 'bg-secondary-accent/20 text-text cursor-default'
                  : currentUserId
                    ? 'bg-text/10 text-text/60 hover:bg-primary-light cursor-pointer'
                    : 'bg-text/10 text-text/50 cursor-default'
            )}
          >
            {(displayInterestedCount > 0 || myInterest)
              ? <Star className="w-3.5 h-3.5 rotate-[-30deg] text-secondary-accent" fill="#ffea80" strokeWidth={0} />
              : <Star className="w-3.5 h-3.5 rotate-[-30deg]" />}
            <span className="hidden sm:inline">Interested </span>({displayInterestedCount})
            {isOwner && <ChevronDown className={cn('w-3 h-3 transition-transform', interestedOpen && 'rotate-180')} />}
          </button>
          {showContactDisabled && !isOwner && (
            <span
              className="badge bg-text/5 text-text/20 inline-flex items-center gap-1 cursor-not-allowed shrink-0"
              title="Contact — coming soon"
            >
              <Mail className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-1 shrink-0">
            {actions}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-warning mt-1.5">{error}</p>}

      {interestedOpen && isOwner && (
        <div className="mt-3 p-3 bg-primary-light/40 rounded-lg">
          {loading && comments === null ? (
            <div className="flex justify-center py-2"><LoadingSpinner size="sm" /></div>
          ) : interestedUsers.length === 0 ? (
            <p className="text-xs text-text/50">No one has marked interest yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {interestedUsers.map(u => (
                <li key={u.user_id} className="flex items-center gap-2 text-sm text-text">
                  <Star className="w-3.5 h-3.5 rotate-[-30deg] text-secondary-accent shrink-0" fill="#ffea80" strokeWidth={0} />
                  {u.display_name}
                  <span className="text-xs text-text/40">{formatDistanceToNow(parseISO(u.created_at), { addSuffix: true })}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {commentsOpen && (
        <div className="mt-3 space-y-3">
          {currentUserId && (
            <form onSubmit={handleSubmit} className="space-y-2">
              {replyToName && (
                <div className="flex items-center gap-2 text-xs text-text/50">
                  Replying to <span className="font-medium text-text">{replyToName}</span>
                  <button
                    type="button"
                    onClick={() => { setReplyToName(null); setBody('') }}
                    className="text-text/40 hover:text-warning"
                    aria-label="Cancel reply"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <textarea
                ref={textareaRef}
                className="input text-sm resize-none h-16"
                placeholder="Write a comment..."
                value={body}
                onChange={e => setBody(e.target.value)}
                maxLength={500}
              />
              <div className="flex items-center justify-between gap-2">
                {!isOwner ? (
                  <button
                    type="button"
                    onClick={() => setIsInterested(v => !v)}
                    className={cn(
                      'badge inline-flex items-center gap-1 cursor-pointer transition-colors',
                      isInterested ? 'bg-secondary-accent/30 text-text' : 'bg-text/10 text-text/60'
                    )}
                  >
                    {isInterested
                      ? <Star className="w-3 h-3 rotate-[-30deg] text-secondary-accent" fill="#ffea80" strokeWidth={0} />
                      : <Star className="w-3 h-3 rotate-[-30deg]" />} Interested?
                  </button>
                ) : <span />}
                <Button
                  type="submit"
                  size="sm"
                  loading={posting}
                  disabled={!body.trim()}
                  className="text-xs px-3 py-1 min-h-0 h-8"
                >
                  Submit
                </Button>
              </div>
            </form>
          )}

          {loading && comments === null ? (
            <div className="flex justify-center py-4"><LoadingSpinner size="sm" /></div>
          ) : (comments ?? []).length === 0 ? (
            <p className="text-xs text-text/40 text-center py-2">No comments yet.</p>
          ) : (
            <ul className="space-y-3">
              {(comments ?? []).map(c => (
                <li key={c.id} className="text-sm border-t border-border/60 pt-2 first:border-t-0 first:pt-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-text/50 flex-wrap">
                      <User className="w-3 h-3" />
                      <span className="font-medium text-text">{c.display_name}</span>
                      {c.is_interested && (
                        <span className="inline-flex items-center gap-0.5 text-primary">
                          <Star className="w-3 h-3 rotate-[-30deg] text-secondary-accent" fill="#ffea80" strokeWidth={0} /> Interested
                        </span>
                      )}
                      <span>&bull; {formatDistanceToNow(parseISO(c.created_at), { addSuffix: true })}</span>
                      {c.updated_at !== c.created_at && <span>(edited)</span>}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {currentUserId && c.user_id !== currentUserId && (
                        <button
                          type="button"
                          onClick={() => setFlagCommentId(c.id)}
                          className="text-text/30 hover:text-warning"
                          aria-label="Flag comment"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                      {c.user_id === currentUserId && (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
                            className="text-text/30 hover:text-primary"
                            aria-label="Edit comment"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="text-text/30 hover:text-warning"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === c.id ? (
                    <div className="mt-1 space-y-1.5">
                      <textarea
                        className="input text-sm resize-none h-14"
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        maxLength={500}
                      />
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          loading={posting}
                          onClick={() => handleSaveEdit(c.id)}
                          className="text-xs px-2 py-1 min-h-0 h-7"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          className="text-xs px-2 py-1 min-h-0 h-7"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-text/80 mt-1">{c.body}</p>
                  )}

                  {currentUserId && editingId !== c.id && (
                    <button
                      type="button"
                      onClick={() => startReply(c)}
                      className="text-xs text-primary hover:underline mt-1"
                    >
                      Reply
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <FlagModal
        open={flagCommentId !== null}
        onClose={() => setFlagCommentId(null)}
        targetType="comment"
        targetId={flagCommentId ?? ''}
        boardId={boardId}
      />

      <Modal open={confirmRemoveId !== null} onClose={() => setConfirmRemoveId(null)} title="Remove interest?" size="sm">
        <p className="text-sm text-text/70 mb-4">
          This will delete your &quot;{QUICK_INTEREST_BODY}&quot; comment and remove your interest from this post.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmRemoveId(null)} className="flex-1">
            Cancel
          </Button>
          <Button type="button" variant="danger" loading={posting} onClick={handleConfirmRemoveInterest} className="flex-1">
            Remove
          </Button>
        </div>
      </Modal>
    </>
  )
}
