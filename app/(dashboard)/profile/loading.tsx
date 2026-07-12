import { ProfileSkeleton } from '@/components/ui/PageSkeletons'

// Streams instantly on navigation so slow connections see the profile
// taking shape instead of a blank screen or the PWA splash logo.
export default function ProfileLoading() {
  return <ProfileSkeleton />
}
