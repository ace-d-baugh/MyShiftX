import Link from 'next/link'
import { ArrowRight, Clock } from 'lucide-react'
import { LandingHeader } from '@/components/landing/LandingHeader'
import { Footer } from '@/components/landing/Footer'
import { AdRail } from '@/components/features/AdRail'
import { BLOG_POSTS, formatPostDate } from '@/lib/blog'

export const metadata = {
  title: 'The MyShiftX Blog — Writing for Shift Workers',
  description:
    'Practical writing for people who work shifts: trading etiquette, reading a rotating schedule, what a shift is actually worth, checking your pay, asking for time off, picking up overtime without burning out, and getting coverage approved.',
  alternates: { canonical: '/blog' },
}

export default function BlogIndexPage() {
  const [lead, ...rest] = BLOG_POSTS

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingHeader displayName={null} />

      <main className="flex-1">
        <AdRail showAds hasBottomNav={false}>
          <div className="max-w-4xl mx-auto px-4 py-12">

            <header className="mb-12">
              <h1 className="font-accent text-4xl md:text-5xl font-bold text-text mb-4">
                The MyShiftX Blog
              </h1>
              <p className="text-lg text-text/60 max-w-2xl leading-relaxed">
                Writing for people who work shifts. How to trade well, how to keep track of a
                rotation, what a shift is actually worth, how to check you were paid for it, and
                why the group chat was never going to work.
              </p>
            </header>

            {/* Lead post */}
            <Link
              href={`/blog/${lead.slug}`}
              className="block card overflow-hidden p-0 border-l-4 border-l-primary mb-10 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
            >
              {lead.images?.[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={lead.images[0]}
                  alt=""
                  className="h-48 md:h-64 w-full object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                  <span className="badge bg-primary/15 text-primary">Latest</span>
                  {lead.tags.map(t => (
                    <span key={t} className="text-text/40">{t}</span>
                  ))}
                </div>
                <h2 className="font-accent text-2xl md:text-3xl font-bold text-text mb-3 group-hover:text-primary transition-colors">
                  {lead.title}
                </h2>
                <p className="text-text/65 leading-relaxed mb-4">{lead.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text/45">
                  <time dateTime={lead.publishedAt}>{formatPostDate(lead.publishedAt)}</time>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {lead.readingMinutes} min read
                  </span>
                  <span className="flex items-center gap-1 text-primary font-medium ml-auto">
                    Read
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>

            {/* Everything else */}
            <div className="grid gap-5 sm:grid-cols-2">
              {rest.map(post => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="flex flex-col card overflow-hidden p-0 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
                >
                  {post.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.images[0]}
                      alt=""
                      className="h-40 w-full object-cover"
                    />
                  )}
                  <div className="flex flex-col flex-1 p-5">
                    <div className="flex flex-wrap gap-2 mb-2 text-[11px] text-text/40">
                      {post.tags.map(t => <span key={t}>{t}</span>)}
                    </div>
                    <h2 className="font-accent text-xl font-bold text-text mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-sm text-text/60 leading-relaxed flex-1">{post.description}</p>
                    <div className="flex items-center gap-3 text-xs text-text/45 mt-4 pt-3 border-t border-border">
                      <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {post.readingMinutes} min
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </AdRail>
      </main>

      <Footer />
    </div>
  )
}
