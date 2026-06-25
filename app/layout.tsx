// app/layout.tsx

import type { Metadata } from 'next'
import { Lato, Philosopher } from 'next/font/google'
import './globals.css'

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
  other: {
    'fb:app_id': process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? '',
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('myshiftx-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans text-text" suppressHydrationWarning>{children}</body>
    </html>
  )
}
