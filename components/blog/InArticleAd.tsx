import { AdSlot } from '@/components/features/AdSlot'

const IN_ARTICLE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE

interface InArticleAdProps {
  /** The post this renders inside, so a house-ad fallback never promotes
   * the article the reader is already reading. */
  postSlug: string
}

/**
 * Native-blending ad dropped into the middle of a blog post's body (see
 * app/blog/[slug]/page.tsx, which splices this in after the post's first
 * few blocks — Google's own placement guidance for the in-article format is
 * "2 paragraphs below the start", not the sidebar).
 */
export function InArticleAd({ postSlug }: InArticleAdProps) {
  return (
    <div className="not-prose my-8">
      <AdSlot slotId={IN_ARTICLE_SLOT} layout="in-article" excludeSlug={postSlug} />
    </div>
  )
}
