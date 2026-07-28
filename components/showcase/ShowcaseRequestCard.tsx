import { CalendarDays, LayoutGrid, User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RequestView } from '@/lib/showcase/render'

/** Read-only twin of components/features/RequestCard — see ShowcaseShiftCard. */
export function ShowcaseRequestCard({ request }: { request: RequestView }) {
  return (
    <div className="card border-l-4 border-l-info">
      <div className="mb-1">
        <div className="flex items-start gap-2">
          <h3 className="font-accent font-bold text-lg leading-snug flex-1 min-w-0 break-words text-info">
            {request.title}
          </h3>
          <span className="hidden sm:flex text-xs text-text/50 items-center gap-1.5 whitespace-nowrap shrink-0">
            <User className="w-3 h-3 shrink-0 text-info" />
            {request.poster}
          </span>
        </div>
        <div className="sm:hidden flex items-center gap-1.5 mt-0.5 text-xs text-text/50">
          <User className="w-3 h-3 shrink-0 text-info" />
          {request.poster}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-base font-medium text-text/80 mb-3">
        <CalendarDays className="w-3.5 h-3.5 shrink-0 text-info" />
        {request.dateLabel}
        <span className="text-text/50 font-normal text-xs ml-auto">{request.relativeLabel}</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {request.preferredTimes.map(t => (
          <span
            key={t}
            className={cn(
              'inline-block text-[11px] font-medium rounded-full px-2.5 py-0.5',
              'bg-info/10 text-info'
            )}
          >
            {t}
          </span>
        ))}
      </div>

      {request.details && (
        <p className="text-sm text-text/60 bg-primary-light/50 rounded-md px-3 py-2 mb-3 italic">
          &ldquo;{request.details}&rdquo;
        </p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-text/50 mb-3 min-w-0">
        <LayoutGrid className="w-3.5 h-3.5 shrink-0 opacity-70 text-info" />
        <span className="truncate">{request.boardName}</span>
      </div>

      <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
        <span className="flex items-center gap-1 text-xs text-text/50">
          <Users className="w-3.5 h-3.5" />
          {request.interestedCount} offered to help
        </span>
        <span className="badge bg-info/20 text-info">Request</span>
      </div>
    </div>
  )
}
