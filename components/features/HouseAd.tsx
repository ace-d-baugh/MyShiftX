import Link from 'next/link'
import { pickHouseAdPost } from '@/lib/houseAds'
import { cn } from '@/lib/utils'

interface HouseAdProps {
  /** Fixed pixel footprint, same convention as AdSlot — pass both for the
   * compact mobile banner. Omit for the flexible desktop rail card. */
  width?: number
  height?: number
  className?: string
  /** Distinguishes stacked house ads on the same page — see pickHouseAdPost. */
  offset?: number
}

/**
 * Self-promotional fallback shown in an ad slot before AdSense is fully
 * configured (see AdSlot.tsx). Links to a real blog post rather than
 * rendering an empty "Advertisement" box — normal "house ad" practice,
 * not something that affects AdSense review either way.
 *
 * Deliberately NOT styled to resemble a real ad unit (no "Sponsored"/ad
 * chrome) — it's the site's own content, and looking like a Google ad would
 * just confuse users once real ads are swapped in here.
 */
export function HouseAd({ width, height, className, offset = 0 }: HouseAdProps) {
  const post = pickHouseAdPost(offset)
  if (!post || !post.images?.[0]) return null

  const isBanner = width !== undefined && height !== undefined

  if (isBanner) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        style={{ width, height }}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-border bg-card px-2 overflow-hidden hover:bg-primary-light/40 transition-colors',
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.images[0]} alt="" className="h-9 w-9 rounded object-cover shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] font-medium uppercase tracking-wide text-text/40 leading-none mb-0.5">
            From the blog
          </p>
          <p className="text-xs font-medium text-text truncate leading-tight">{post.title}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        'flex flex-col rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={post.images[0]} alt="" className="w-full h-32 object-cover" />
      <div className="p-3">
        <p className="text-[10px] font-medium uppercase tracking-wide text-text/40 mb-1">
          From the blog
        </p>
        <p className="text-sm font-accent font-bold text-text leading-snug mb-1 line-clamp-2">
          {post.title}
        </p>
        <p className="text-xs text-text/60 leading-snug line-clamp-2">{post.description}</p>
      </div>
    </Link>
  )
}
