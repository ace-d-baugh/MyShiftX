import { MessagesSkeleton } from '@/components/ui/PageSkeletons'

// Streams instantly on navigation so slow connections see the inbox
// taking shape instead of a blank screen or the PWA splash logo.
export default function MessagesLoading() {
  return <MessagesSkeleton />
}
