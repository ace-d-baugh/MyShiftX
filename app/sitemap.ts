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
    ...BLOG_POSTS.map(p => `/blog/${p.slug}`),
    // Showcase mode: the demo is public and served at these canonical URLs
    // (middleware rewrites them to /preview/*, which is itself excluded in
    // robots.ts). Registration and login are dropped — they either 404 or are
    // deliberately unlinked, and a sitemap entry would undo that.
    ...(SHOWCASE_MODE
      ? ['/wall', '/calendar', '/messages']
      : ['/login', '/register']),
  ]

  return routes.map(route => ({
    url: `${base}${route}`,
    lastModified: new Date(),
  }))
}
