// Route-level loading skeletons for the Calendar, Profile, and Messages
// pages, mirroring each page's real shell so navigation feels instant
// (same idea as WallSkeleton — see app/(dashboard)/wall/loading.tsx for why
// these exist: without a loading file the route streams nothing and slow
// connections sit on the PWA splash logo instead).

type SkeletonVariant = 'default' | 'strong' | 'soft'

function Skel({ className = '', variant = 'default' }: {
  className?: string
  variant?: SkeletonVariant
}) {
  const cls =
    variant === 'strong' ? 'skeleton-strong' :
    variant === 'soft'   ? 'skeleton-soft'   :
                           'skeleton'
  return <div className={`${cls} rounded-md ${className}`} />
}

/** Mirrors CalendarClient: header row, month bar, 7-column grid. */
export function CalendarSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header: title + action buttons */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skel variant="strong" className="h-7 w-40 mb-2" />
          <Skel variant="soft" className="h-4 w-56" />
        </div>
        <Skel className="h-10 w-32 rounded-md" />
      </div>
      {/* Month nav bar */}
      <div className="flex items-center justify-between mb-4">
        <Skel className="h-8 w-8" />
        <Skel variant="strong" className="h-6 w-36" />
        <Skel className="h-8 w-8" />
      </div>
      {/* Weekday header + 5 calendar rows */}
      <div className="grid grid-cols-7 gap-px mb-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skel key={i} variant="soft" className="h-8 rounded-none" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="bg-card min-h-[5.5rem] p-1.5">
            <Skel variant="soft" className="h-4 w-5 mb-1.5" />
            {i % 4 === 1 && <Skel className="h-4 w-full" />}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Mirrors ProfileClient: header + badge, then stacked settings cards. */
export function ProfileSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Skel variant="strong" className="h-7 w-36 mb-2" />
          <Skel variant="soft" className="h-4 w-64" />
        </div>
        <Skel className="h-7 w-24 rounded-full" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <Skel className="h-10 w-10 rounded-full" />
            <Skel variant="strong" className="h-5 w-36" />
          </div>
          <div className="space-y-4">
            <Skel variant="soft" className="h-4 w-24" />
            <Skel className="h-10 w-full rounded-md" />
            <Skel variant="soft" className="h-4 w-32" />
            <Skel className="h-10 w-full rounded-md" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Mirrors MessagesClient: header + conversation list rows. */
export function MessagesSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skel variant="strong" className="h-7 w-32 mb-2" />
          <Skel variant="soft" className="h-4 w-48" />
        </div>
        <Skel className="h-10 w-28 rounded-md" />
      </div>
      <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-card">
            <Skel className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <Skel variant="strong" className="h-4 w-32 mb-2" />
              <Skel variant="soft" className="h-3 w-3/4" />
            </div>
            <Skel variant="soft" className="h-3 w-10 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
