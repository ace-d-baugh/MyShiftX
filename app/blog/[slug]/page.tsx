import Link from 'next/link'
import { Children, Fragment, isValidElement, type ComponentType, type ReactElement, type ReactNode } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Footer } from '@/components/landing/Footer'
import { AdRail } from '@/components/features/AdRail'
import { InArticleAd } from '@/components/blog/InArticleAd'
import { Prose } from '@/components/ui/Prose'
import { BLOG_POSTS, getPost, adjacentPosts, formatPostDate } from '@/lib/blog'

// Up to 3 in-article ads per post, spread across the body rather than
// stacked near the top — Google's own tip for multiple in-article units is
// "allow for sufficient content in between ads to minimize disruption".
// The first sits close to the start (their guidance: "2 paragraphs below
// the start"); the second and third are fractions of the post's total
// length rather than fixed block counts, so spacing scales with how long
// the post actually is instead of bunching up on longer posts or, worse,
// landing past the end on shorter ones.
const FIRST_AD_BLOCK = 3
const LATER_AD_FRACTIONS = [0.42, 0.74]
const MIN_BLOCKS_BETWEEN_ADS = 4

/**
 * Picks up to 3 ad-insertion points in a post's top-level body blocks
 * (paragraphs, headings, lists), each one skipped if the post isn't long
 * enough to fit it with real spacing before the end — a short post gets 1
 * or 2 ads, never 3 crammed in or one glued to the closing paragraph.
 */
function computeAdPositions(totalBlocks: number): number[] {
  const positions = [Math.min(FIRST_AD_BLOCK, Math.max(0, totalBlocks - 1))]
  for (const fraction of LATER_AD_FRACTIONS) {
    const prev = positions[positions.length - 1]
    const next = Math.max(prev + MIN_BLOCKS_BETWEEN_ADS, Math.round(totalBlocks * fraction))
    if (next >= totalBlocks - 1) break // not enough content left to justify another ad
    positions.push(next)
  }
  return positions
}

/**
 * Splits a post Body's rendered output into the segments between ad
 * positions, so ads can be spliced in as siblings without touching the
 * post's own JSX. Body is always a plain, hookless `<>[...]</>` of block
 * elements (see any file in lib/blog/posts) — calling it directly as a
 * function rather than through JSX is what makes that Fragment's children
 * inspectable at all; there's no createElement path that exposes them.
 */
function splitBodyForAds(BodyComponent: ComponentType): ReactNode[][] {
  const fragment = (BodyComponent as () => ReactElement<{ children?: React.ReactNode }>)()
  const blocks = isValidElement(fragment) ? Children.toArray(fragment.props.children) : []
  const positions = computeAdPositions(blocks.length)

  const segments: ReactNode[][] = []
  let start = 0
  for (const pos of positions) {
    segments.push(blocks.slice(start, pos))
    start = pos
  }
  segments.push(blocks.slice(start))
  return segments
}

const SITE = 'https://myshiftx.com'

export function generateStaticParams() {
  return BLOG_POSTS.map(p => ({ slug: p.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: `${SITE}/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
    },
  }
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug)
  if (!post) notFound()

  const { newer, older } = adjacentPosts(post.slug)
  const bodySegments = splitBodyForAds(post.Body)
  const adCount = bodySegments.length - 1

  // Article structured data. Google reads this to understand authorship and
  // freshness, both of which the AdSense content review cares about.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { '@type': 'Organization', name: post.author, url: SITE },
    publisher: {
      '@type': 'Organization',
      name: 'MyShiftX',
      url: SITE,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE}/logos/FULL-LOGO-GRADIENT-COLOR.png`,
      },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE}/blog/${post.slug}` },
    keywords: post.tags.join(', '),
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LandingHeader displayName={null} />

      <main className="flex-1">
        <AdRail showAds hasBottomNav={false}>
          <article className="max-w-3xl mx-auto px-4 py-12">

            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-text/60 hover:text-primary mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> All posts
            </Link>

            <header className="mb-10 pb-8 border-b border-border">
              <div className="flex flex-wrap gap-2 mb-3 text-xs text-text/45">
                {post.tags.map(t => (
                  <span key={t} className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
                    {t}
                  </span>
                ))}
              </div>
              <h1 className="font-accent text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">
                {post.title}
              </h1>
              <p className="text-lg text-text/60 leading-relaxed mb-5">{post.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text/45">
                <span>{post.author}</span>
                <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.readingMinutes} min read
                </span>
              </div>
            </header>

            {post.images?.[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.images[0]}
                alt=""
                className="w-full max-h-[420px] object-cover rounded-lg border border-border mb-10"
              />
            )}

            <Prose>
              {bodySegments.map((segment, i) => (
                <Fragment key={i}>
                  {segment}
                  {i < adCount && <InArticleAd postSlug={post.slug} position={i} />}
                </Fragment>
              ))}
            </Prose>

            {/* Prev / next */}
            {(newer || older) && (
              <nav className="grid gap-4 sm:grid-cols-2 mt-14 pt-8 border-t border-border">
                {newer ? (
                  <Link href={`/blog/${newer.slug}`} className="card group hover:shadow-md transition-shadow">
                    <span className="flex items-center gap-1.5 text-xs text-text/45 mb-1.5">
                      <ArrowLeft className="w-3.5 h-3.5" /> Newer
                    </span>
                    <span className="font-accent font-bold text-text group-hover:text-primary transition-colors">
                      {newer.title}
                    </span>
                  </Link>
                ) : <div className="hidden sm:block" />}
                {older && (
                  <Link
                    href={`/blog/${older.slug}`}
                    className="card group hover:shadow-md transition-shadow sm:text-right"
                  >
                    <span className="flex items-center gap-1.5 text-xs text-text/45 mb-1.5 sm:justify-end">
                      Older <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                    <span className="font-accent font-bold text-text group-hover:text-primary transition-colors">
                      {older.title}
                    </span>
                  </Link>
                )}
              </nav>
            )}

            <div className="card bg-primary-light/40 border-none mt-10 text-center">
              <h2 className="font-accent text-xl font-bold text-text mb-2">
                See what a shift board actually looks like
              </h2>
              <p className="text-sm text-text/60 mb-4">
                A walkthrough of the Wall, the calendar, and how a trade gets settled.
              </p>
              <Link href="/wall" className="btn btn-primary gap-2 min-h-0 h-11 px-6 inline-flex">
                Explore the demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </article>
        </AdRail>
      </main>

      <Footer />
    </div>
  )
}
