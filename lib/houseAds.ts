import { BLOG_POSTS } from '@/lib/blog'
import type { BlogPost } from '@/lib/blog/types'

/**
 * Picks a post to feature in an ad slot's house-ad fallback (see
 * components/features/HouseAd.tsx). Only posts with a thumbnail image are
 * eligible — a house ad with no picture reads as a broken ad unit, not
 * promotional content.
 *
 * Deterministic by UTC day rather than random: AdSlot renders this on both
 * the server and the client, and a random pick would disagree between the
 * two and throw a hydration-mismatch error. Rotating daily still gives the
 * rail some variety without that risk.
 *
 * `offset` selects a different post than offset 0 for the same day, so a
 * column of several house ads shows several different posts rather than
 * the same one repeated. Callers just pass 0/1/2/... per slot — as long as
 * the offset spread is smaller than the eligible-post count (it is: three
 * slots against fifteen eligible posts), each offset lands on a distinct
 * post for any given day.
 *
 * `excludeSlug` keeps an in-article house ad from ever promoting the very
 * post the reader is already on.
 */
export function pickHouseAdPost(offset = 0, excludeSlug?: string): BlogPost | undefined {
  const eligible = BLOG_POSTS.filter(p => (p.images?.length ?? 0) > 0 && p.slug !== excludeSlug)
  if (eligible.length === 0) return undefined

  const dayIndex = Math.floor(Date.now() / 86_400_000) // days since epoch, UTC-stable
  return eligible[(dayIndex + offset) % eligible.length]
}
