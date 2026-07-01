// app/layout.tsx

import type { Metadata } from 'next'
import Script from 'next/script'
import { Lato, Philosopher } from 'next/font/google'
import { CookieConsentBanner } from '@/components/features/CookieConsentBanner'
import './globals.css'

const ADSENSE_PUBLISHER_ID = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID

export const metadata: Metadata = {
  title: {
    default: 'MyShiftX',
    template: '%s – MyShiftX',
  },
  description: 'The shift swap board for cast members.',
  metadataBase: new URL('https://myshiftx.com'),
  openGraph: {
    siteName: 'MyShiftX',
    url: 'https://myshiftx.com',
    type: 'website',
    images: [
      {
        url: '/logos/ShiftX-logo-lg.png',
        alt: 'MyShiftX',
      },
    ],
  },
  ...(ADSENSE_PUBLISHER_ID && {
    other: { 'google-adsense-account': ADSENSE_PUBLISHER_ID },
  }),
}

const lato = Lato({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-lato',
})

const philosopher = Philosopher({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-philosopher',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${lato.variable} ${philosopher.variable}`} suppressHydrationWarning>
      <head>
        {process.env.FACEBOOK_APP_ID && (
          <meta property="fb:app_id" content={process.env.FACEBOOK_APP_ID} />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('myshiftx-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        {ADSENSE_PUBLISHER_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="font-sans text-text" suppressHydrationWarning>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  )
}
