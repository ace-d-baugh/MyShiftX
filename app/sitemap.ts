import type { MetadataRoute } from 'next'
import { BLOG_POSTS } from '@/lib/blog'
import { SHOWCASE_MODE } from '@/lib/showcase/mode'

// Only the pages that are actually public (no login required) — everything
// else in the app sits behind an auth wall that Googlebot can't get past
// anyway, so listing those would just be noise.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://myshiftx.com'

  const routes = [
    '',
    '/about', '/blog', '/faq', '/contact', '/upgrade', '/terms', '/privacy', '/data-deletion',
    '/for',
    // Showcase mode: the demo is public and served at these canonical URLs
    // (middleware rewrites them to /preview/*, which is itself excluded in
    // robots.ts). Registration and login are dropped — they either 404 or are
    // deliberately unlinked, and a sitemap entry would undo that.
    ...(SHOWCASE_MODE
      ? ['/wall', '/calendar', '/messages']
      : ['/login', '/register']),
  ]

  // lastModified is deliberately OMITTED for these. It used to be `new Date()`,
  // which stamped every URL with the build timestamp — so all 26 entries
  // claimed to have changed at the same millisecond on every single deploy.
  // Google discounts lastmod it can tell is unreliable, and that pattern is the
  // textbook example, so it was costing us the signal on the pages where we do
  // have a real date. No lastmod is strictly better than a false one.
  const staticEntries: MetadataRoute.Sitemap = routes.map(route => ({
    url: `${base}${route}`,
  }))

  // Posts carry a genuine edit date, so they get a real, stable lastmod that
  // only moves when the post actually changes.
  const postEntries: MetadataRoute.Sitemap = BLOG_POSTS.map(p => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(`${p.updatedAt}T12:00:00Z`),
  }))

  return [...staticEntries, ...postEntries]
}
