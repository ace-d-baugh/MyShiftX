import { CalendarSkeleton } from '@/components/ui/PageSkeletons'

// Streams instantly on navigation so slow connections see the calendar
// taking shape instead of a blank screen or the PWA splash logo.
export default function CalendarLoading() {
  return <CalendarSkeleton />
}
