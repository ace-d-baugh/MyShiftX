import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// Moved to /boards — redirect for any saved links
export default function LeaderUsersPage() {
  redirect('/boards')
}
