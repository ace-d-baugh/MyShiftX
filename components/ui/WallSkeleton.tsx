'use client'

type Tab = 'offers' | 'requests'

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

function ShiftCardSkeleton() {
  return (
    <div className="card border-l-4 border-l-primary/30 bg-primary-light/20">
      {/* Row 1: title | name + menu */}
      <div className="flex items-start gap-2 mb-2">
        <Skel variant="strong" className="h-6 flex-1 max-w-[58%]" />
        <div className="flex items-center gap-2 shrink-0">
          <Skel className="hidden sm:block h-4 w-24" />
          <Skel className="h-6 w-6" />
        </div>
      </div>
      {/* Mobile: poster name */}
      <div className="sm:hidden flex items-center gap-1.5 mb-2.5">
        <Skel className="h-3 w-3 rounded-full" />
        <Skel className="h-3 w-20" />
      </div>
      {/* Row 2: clock + times + duration */}
      <div className="flex items-center gap-2 mb-4">
        <Skel className="h-3.5 w-3.5 rounded-full shrink-0" />
        <Skel className="h-4 w-16" />
        <Skel variant="soft" className="h-3 w-3 rounded-full" />
        <Skel className="h-4 w-16" />
        <Skel variant="soft" className="h-4 w-10 rounded-full ml-1" />
      </div>
      {/* Row 3: action buttons | type badges */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <Skel variant="soft" className="h-7 w-[4.5rem] rounded-full" />
          <Skel variant="soft" className="h-7 w-[4.5rem] rounded-full" />
          <Skel variant="soft" className="h-7 w-[4.5rem] rounded-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skel className="h-6 w-16 rounded-full" />
          <Skel variant="soft" className="h-6 w-8 rounded-full" />
        </div>
      </div>
    </div>
  )
}

function RequestCardSkeleton() {
  return (
    <div className="card border-l-4 border-l-accent/25 bg-primary-light/20">
      {/* Row 1: title | name + menu */}
      <div className="flex items-start gap-2 mb-2">
        <Skel variant="strong" className="h-6 flex-1 max-w-[52%]" />
        <div className="flex items-center gap-2 shrink-0">
          <Skel className="hidden sm:block h-4 w-20" />
          <Skel className="h-6 w-6" />
        </div>
      </div>
      {/* Mobile: poster name */}
      <div className="sm:hidden flex items-center gap-1.5 mb-2.5">
        <Skel className="h-3 w-3 rounded-full" />
        <Skel className="h-3 w-20" />
      </div>
      {/* Row 2: clock + time preference pills */}
      <div className="flex items-center gap-2 mb-4">
        <Skel className="h-3.5 w-3.5 rounded-full shrink-0" />
        <Skel className="h-6 w-20 rounded-full" />
        <Skel variant="soft" className="h-6 w-24 rounded-full" />
      </div>
      {/* Row 3: action buttons | request badge */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <Skel variant="soft" className="h-7 w-[4.5rem] rounded-full" />
          <Skel variant="soft" className="h-7 w-[4.5rem] rounded-full" />
          <Skel variant="soft" className="h-7 w-[4.5rem] rounded-full" />
        </div>
        <Skel className="h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

function DayGroupSkeleton({ tab, cardCount }: { tab: Tab; cardCount: number }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Day header */}
      <div className="px-4 py-3 bg-primary-light/15 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Skel className="h-4 w-40" />
          <Skel className="h-5 w-6 rounded-full" />
        </div>
        <Skel variant="soft" className="h-4 w-4" />
      </div>
      {/* Cards */}
      <div className="p-4 space-y-4">
        {Array.from({ length: cardCount }).map((_, i) =>
          tab === 'offers'
            ? <ShiftCardSkeleton key={i} />
            : <RequestCardSkeleton key={i} />
        )}
      </div>
    </div>
  )
}

export function WallSkeleton({ tab }: { tab: Tab }) {
  return (
    <div className="space-y-5">
      <DayGroupSkeleton tab={tab} cardCount={3} />
      <DayGroupSkeleton tab={tab} cardCount={2} />
    </div>
  )
}
