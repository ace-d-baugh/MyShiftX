import { cn } from '@/lib/utils'
import type { CalendarMonthView } from '@/lib/showcase/render'

/**
 * Static month grid for the demo. The real calendar (CalendarClient) is a
 * client component with month navigation, iCal sync, and photo import — all of
 * which need a session. This renders one month of sample shifts as plain
 * server-side HTML, which is also what a crawler can actually read.
 */
export function ShowcaseCalendar({ month }: { month: CalendarMonthView }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="font-accent text-xl font-bold text-text">{month.monthLabel}</h2>
      </div>

      <div className="grid grid-cols-7 border-b border-border bg-primary-light/30">
        {month.weekdayLabels.map(label => (
          <div
            key={label}
            className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-text/50"
          >
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.charAt(0)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {month.days.map(day => (
          <div
            key={day.isoDate}
            className={cn(
              'min-h-[92px] border-b border-r border-border p-1.5 last:border-r-0',
              !day.inMonth && 'bg-background/50',
              day.isToday && 'bg-primary-light/40'
            )}
          >
            <div
              className={cn(
                'text-xs font-medium mb-1',
                day.inMonth ? 'text-text/70' : 'text-text/25',
                day.isToday && 'text-primary font-bold'
              )}
            >
              {day.dayOfMonth}
            </div>

            <div className="space-y-1">
              {day.shifts.map(s => (
                <div
                  key={s.id}
                  className={cn(
                    'rounded px-1.5 py-1 text-[10px] leading-tight truncate',
                    s.kind === 'giveaway'
                      ? 'bg-success/15 text-success'
                      : 'bg-primary/15 text-primary'
                  )}
                  title={`${s.title} — ${s.startTime}`}
                >
                  <span className="font-semibold">{s.startTime}</span> {s.title}
                </div>
              ))}
              {day.requestCount > 0 && (
                <div className="rounded px-1.5 py-1 text-[10px] leading-tight bg-info/15 text-info truncate">
                  {day.requestCount} request{day.requestCount === 1 ? '' : 's'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 px-4 py-3 text-xs text-text/60">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-primary/30" /> Trade
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-success/30" /> Giveaway
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-info/30" /> Request
        </span>
      </div>
    </div>
  )
}
