import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Explicitly grant the AdSense crawler access to everything
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        // Showcase mode serves the demo at /wall, /calendar and /messages via
        // an internal rewrite to these paths. They work directly too, so
        // excluding them keeps the same content from being indexed twice under
        // two different URLs.
        disallow: ['/preview/'],
      },
    ],
    sitemap: 'https://myshiftx.com/sitemap.xml',
  }
}
