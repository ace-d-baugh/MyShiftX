'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, User, Flag, Pencil, Trash2, Mail, Clock, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FlagModal } from '@/components/features/FlagModal'
import { CommentSection } from '@/components/features/CommentSection'
import { cn } from '@/lib/utils'
import type { PreferredTime } from '@/lib/database.types'

const timeLabels: Record<PreferredTime, string> = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late: 'Late Night',
}

const timeLabelsShort: Record<PreferredTime, string> = {
  morning: 'AM',
  afternoon: 'PM',
  evening: 'Eve',
  late: 'Late',
}

const timeBadgeVariant: Record<PreferredTime, string> = {
  morning: 'bg-accent/20 text-text',
  afternoon: 'bg-info/20 text-info',
  evening: 'bg-primary/20 text-primary',
  late: 'bg-text/10 text-text',
}

export interface RequestData {
  id: string
  created_by: string
  user_id: string | null
  board_id: string | null
  board_name: string
  preferred_times: PreferredTime[]
  requested_date: string
  details: string | null
  is_active: boolean
  expires_at: string
  created_at: string
  comment_count?: number
  interested_count?: number
  contactReady?: boolean
}

interface RequestCardProps {
  request: RequestData
  currentUserId?: string
  currentUserName?: string
  onDeactivate?: (id: string) => void
}

export function RequestCard({ request, currentUserId, currentUserName, onDeactivate }: RequestCardProps) {
  const router = useRouter()
  const [flagOpen, setFlagOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const isOwner = currentUserId && request.user_id === currentUserId

  const mailto = `mailto:?subject=Re: Shift Request on MyShiftX&body=Hi ${request.created_by},%0A%0AI saw your shift request on MyShiftX and I have a shift available!%0A%0A- ${currentUserName ?? 'A User'}`

  return (
    <>
      <div className="card border-l-4 border-l-accent transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
        {/* Title + badge */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-accent font-bold text-text text-lg leading-tight flex-1 min-w-0">
            Shift Wanted
          </h3>
          <span className="badge bg-accent/20 text-text shrink-0">Request</span>
        </div>

        {/* Preferred times row + chevron toggle */}
        <div className="flex items-center gap-1.5 mb-3">
          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {request.preferred_times.map(t => (
              <span key={t} className={cn('badge text-sm', timeBadgeVariant[t])}>
                <span className="sm:hidden">{timeLabelsShort[t]}</span>
                <span className="hidden sm:inline">{timeLabels[t]}</span>
              </span>
            ))}
          </div>
          <button
            onClick={() => setDetailsOpen(o => !o)}
            className="ml-auto p-0.5 text-text/40 hover:text-accent min-h-0 min-w-0"
            aria-label="Toggle details"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', detailsOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Collapsible: details + board/author */}
        <div className={cn(detailsOpen ? 'block' : 'hidden')}>
          {request.details && (
            <p className="text-sm text-text/60 bg-accent/10 rounded-md px-3 py-2 mb-3 italic">
              &ldquo;{request.details}&rdquo;
            </p>
          )}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-text/50 min-w-0">
              <LayoutGrid className="w-3.5 h-3.5 text-accent/70 shrink-0" />
              <span className="truncate">{request.board_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text/50 shrink-0">
              <User className="w-3.5 h-3.5 text-accent/70 shrink-0" />
              <span>{request.created_by}</span>
            </div>
          </div>
        </div>

        <CommentSection
          postType="request"
          postId={request.id}
          isOwner={!!isOwner}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          commentCount={request.comment_count ?? 0}
          interestedCount={request.interested_count ?? 0}
          boardId={request.board_id ?? undefined}
          actions={
            isOwner ? (
              <>
                <button
                  onClick={() => router.push(`/wall/edit-request/${request.id}`)}
                  className="p-1 text-text/40 hover:text-primary min-h-0 min-w-0"
                  aria-label="Edit request"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeactivate?.(request.id)}
                  className="p-1 text-text/40 hover:text-warning min-h-0 min-w-0"
                  aria-label="Remove request"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                {request.contactReady ? (
                  <>
                    <a
                      href={mailto}
                      className="sm:hidden p-1 text-text/40 hover:text-primary min-h-0 min-w-0"
                      aria-label="Contact"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={mailto}
                      className="hidden sm:inline-flex btn btn-primary text-xs px-2 py-1 min-h-0 h-7 gap-1 no-underline items-center rounded-md"
                    >
                      <Mail className="w-3 h-3" /> Contact
                    </a>
                  </>
                ) : (
                  <>
                    <span
                      className="sm:hidden p-1 text-text/30 cursor-not-allowed min-h-0 min-w-0"
                      title="This user hasn't set up a contact method yet"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </span>
                    <span
                      className="hidden sm:inline-flex text-xs px-2 py-1 h-7 gap-1 items-center rounded-md bg-text/8 text-text/30 cursor-not-allowed border border-border"
                      title="This user hasn't set up a contact method yet"
                    >
                      <Mail className="w-3 h-3" /> Contact
                    </span>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFlagOpen(true)}
                  className="text-xs px-1.5 py-1 min-h-0 h-7 text-text/40 hover:text-warning"
                  aria-label="Flag request"
                >
                  <Flag className="w-3 h-3" />
                </Button>
              </>
            )
          }
        />
      </div>

      <FlagModal
        open={flagOpen}
        onClose={() => setFlagOpen(false)}
        targetType="post"
        targetId={request.id}
        boardId={request.board_id ?? undefined}
      />
    </>
  )
}
