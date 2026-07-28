import { Clock, LayoutGrid, User, MessageSquare, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { ShiftView } from '@/lib/showcase/render'

/**
 * Read-only twin of components/features/ShiftCard.
 *
 * Not a reuse of the real card on purpose: that one imports server actions and
 * mounts ClaimSection/CommentSection, both of which query Supabase as soon as
 * they render. A signed-out visitor would get a card full of failed requests.
 * This copies its layout and Tailwind classes and stops at the data layer, so
 * the demo looks right without pretending to be interactive.
 */
export function ShowcaseShiftCard({ shift }: { shift: ShiftView }) {
  const isGiveaway = shift.kind === 'giveaway'
  const typeColor = isGiveaway ? 'text-success' : 'text-primary'
  const borderColor = isGiveaway ? 'border-l-success' : 'border-l-primary'

  return (
    <div className={cn('card border-l-4', borderColor)}>
      {/* Title + poster */}
      <div className="mb-1">
        <div className="flex items-start gap-2">
          <h3 className={cn('font-accent font-bold text-lg leading-snug flex-1 min-w-0 break-words', typeColor)}>
            {shift.title}
          </h3>
          <span className="hidden sm:flex text-xs text-text/50 items-center gap-1.5 whitespace-nowrap shrink-0">
            <User className={cn('w-3 h-3 shrink-0', typeColor)} />
            {shift.poster}
          </span>
        </div>
        <div className="sm:hidden flex items-center gap-1.5 mt-0.5 text-xs text-text/50">
          <User className={cn('w-3 h-3 shrink-0', typeColor)} />
          {shift.poster}
        </div>
      </div>

      {/* Date + times */}
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-base font-medium text-text/80 mb-3">
        <Clock className={cn('w-3.5 h-3.5 shrink-0', typeColor)} />
        {shift.startTime}
        <span className="text-text/40 mx-0.5">→</span>
        {shift.endTime}
        <span className="text-text/40 font-normal text-xs ml-1">({shift.duration})</span>
        <span className="text-text/50 font-normal text-xs ml-auto">
          {shift.dateLabel} · {shift.relativeLabel}
        </span>
      </div>

      {shift.details && (
        <p className="text-sm text-text/60 bg-primary-light/50 rounded-md px-3 py-2 mb-3 italic">
          &ldquo;{shift.details}&rdquo;
        </p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-text/50 mb-3 min-w-0">
        <LayoutGrid className={cn('w-3.5 h-3.5 shrink-0 opacity-70', typeColor)} />
        <span className="truncate">{shift.boardName}</span>
      </div>

      {/* Counts + badges */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
        <div className="flex items-center gap-3 text-xs text-text/50">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {shift.interestedCount} interested
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" />
            {shift.commentCount}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {shift.overtimeApproved && <Badge variant="ot">OT</Badge>}
          <Badge variant={isGiveaway ? 'giveaway' : 'trade'}>
            {isGiveaway ? 'Giveaway' : 'Trade'}
          </Badge>
        </div>
      </div>
    </div>
  )
}
