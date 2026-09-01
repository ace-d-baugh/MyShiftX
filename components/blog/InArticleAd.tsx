import { AdSlot } from '@/components/features/AdSlot'

// Up to 3 in-article slots per post — app/blog/[slug]/page.tsx decides how
// many actually get used based on the post's length (see computeAdPositions
// there), so a short post might only render position 0.
const IN_ARTICLE_SLOTS = [
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE,
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_2,
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE_3,
]

interface InArticleAdProps {
  /** The post this renders inside, so a house-ad fallback never promotes
   * the article the reader is already reading. */
  postSlug: string
  /** Which in-article slot on this page, 0-based. Also offsets the house-ad
   * fallback pick so 2-3 ads on the same post don't all land on the same
   * promoted post. */
  position?: number
}

/**
 * Native-blending ad dropped into the middle of a blog post's body (see
 * app/blog/[slug]/page.tsx, which splices this in at a few points through
 * the post — Google's own placement guidance for the in-article format is
 * "2 paragraphs below the start" for the first one, with real spacing
 * before any additional ones, not the sidebar).
 */
export function InArticleAd({ postSlug, position = 0 }: InArticleAdProps) {
  return (
    <div className="not-prose my-8">
      <AdSlot
        slotId={IN_ARTICLE_SLOTS[position]}
        layout="in-article"
        excludeSlug={postSlug}
        offset={position}
      />
    </div>
  )
}
