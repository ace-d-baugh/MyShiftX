'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'
import { Clock, LayoutGrid, User, Flag, Pencil, Trash2, Mail, ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FlagModal } from '@/components/features/FlagModal'
import { CommentSection } from '@/components/features/CommentSection'
import { cn } from '@/lib/utils'

const ET = 'America/New_York'

export interface ShiftData {
  id: string
  shift_title: string
  created_by: string
  user_id: string | null
  board_id: string | null
  board_name: string
  start_time: string
  end_time: string
  is_trade: boolean
  is_giveaway: boolean
  is_overtime_approved: boolean
  details: string | null
  is_active: boolean
  expires_at: string
  created_at: string
  comment_count?: number
  interested_count?: number
  contactReady?: boolean
}

interface ShiftCardProps {
  shift: ShiftData
  currentUserId?: string
  currentUserName?: string
  onDeactivate?: (id: string) => void
}

export function ShiftCard({ shift, currentUserId, currentUserName, onDeactivate }: ShiftCardProps) {
  const router = useRouter()
  const [flagOpen, setFlagOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const isOwner = currentUserId && shift.user_id === currentUserId

  const duration = () => {
    const start = parseISO(shift.start_time)
    const end = parseISO(shift.end_time)
    const diffMs = end.getTime() - start.getTime()
    const hours = Math.floor(diffMs / 3600000)
    const mins = Math.floor((diffMs % 3600000) / 60000)
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const startTime = formatInTimeZone(parseISO(shift.start_time), ET, 'h:mm a')
  const endTime   = formatInTimeZone(parseISO(shift.end_time),   ET, 'h:mm a zzz')

  return (
    <>
      <div className={cn(
        'card border-l-4 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        shift.is_trade && shift.is_giveaway ? 'border-l-primary' :
        shift.is_trade ? 'border-l-info' : 'border-l-success'
      )}>
        {/* Title + badges */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-accent font-bold text-text text-lg leading-tight truncate flex-1 min-w-0">
            {shift.shift_title}
          </h3>
          <div className="flex flex-wrap gap-1 shrink-0">
            {shift.is_giveaway && (
              <Badge variant="giveaway">
                <span className="sm:hidden">G</span>
                <span className="hidden sm:inline">Giveaway</span>
              </Badge>
            )}
            {shift.is_trade && (
              <Badge variant="trade">
                <span className="sm:hidden">T</span>
                <span className="hidden sm:inline">Trade</span>
              </Badge>
            )}
            {shift.is_overtime_approved && (
              <Badge variant="ot">OT</Badge>
            )}
          </div>
        </div>

        {/* Times row — chevron toggle on mobile */}
        <div className="flex items-center gap-1.5 text-base font-medium text-text/80 mb-3">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
          {startTime}
          <span className="text-text/40 mx-0.5">→</span>
          {endTime}
          <span className="text-text/40 font-normal text-xs ml-1">({duration()})</span>
          <button
            onClick={() => setDetailsOpen(o => !o)}
            className="ml-auto p-0.5 text-text/40 hover:text-primary min-h-0 min-w-0"
            aria-label="Toggle details"
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', detailsOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Collapsible on all screen sizes */}
        <div className={cn(detailsOpen ? 'block' : 'hidden')}>
          {shift.details && (
            <p className="text-sm text-text/60 bg-primary-light/50 rounded-md px-3 py-2 mb-3 italic">
              &ldquo;{shift.details}&rdquo;
            </p>
          )}
          {/* Board (left) · Poster (right) */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-text/50 min-w-0">
              <LayoutGrid className="w-3.5 h-3.5 text-primary/70 shrink-0" />
              <span className="truncate">{shift.board_name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text/50 shrink-0">
              <User className="w-3.5 h-3.5 text-primary/70 shrink-0" />
              <span>{shift.created_by}</span>
            </div>
          </div>
        </div>

        <CommentSection
          postType="shift"
          postId={shift.id}
          isOwner={!!isOwner}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          commentCount={shift.comment_count ?? 0}
          interestedCount={shift.interested_count ?? 0}
          boardId={shift.board_id ?? undefined}
          actions={
            isOwner ? (
              <>
                <button
                  onClick={() => router.push(`/wall/edit-shift/${shift.id}`)}
                  className="p-1 text-text/40 hover:text-primary min-h-0 min-w-0"
                  aria-label="Edit shift"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeactivate?.(shift.id)}
                  className="p-1 text-text/40 hover:text-warning min-h-0 min-w-0"
                  aria-label="Remove shift"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                {shift.contactReady ? (
                  <>
                    <a
                      href={`mailto:?subject=Re: ${encodeURIComponent(shift.shift_title)} on MyShiftX&body=Hi ${shift.created_by},%0A%0AI saw your shift post on MyShiftX and I'm interested!%0A%0A- ${currentUserName ?? 'A User'}`}
                      className="sm:hidden p-1 text-text/40 hover:text-primary min-h-0 min-w-0"
                      aria-label="Contact"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`mailto:?subject=Re: ${encodeURIComponent(shift.shift_title)} on MyShiftX&body=Hi ${shift.created_by},%0A%0AI saw your shift post on MyShiftX and I'm interested!%0A%0A- ${currentUserName ?? 'A User'}`}
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
                  aria-label="Flag post"
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
        targetId={shift.id}
        boardId={shift.board_id ?? undefined}
      />
    </>
  )
}
