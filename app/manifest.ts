import type { MetadataRoute } from 'next'

// Web app manifest — required for iOS Safari push notifications (iOS 16.4+
// only delivers push to sites added to the Home Screen, which needs a
// manifest with standalone display). Also enables install on Android/desktop.
// TODO: swap the wordmark for a square 512x512 icon when one exists — iOS
// falls back to a page screenshot for the Home Screen tile until then.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MyShiftX',
    short_name: 'MyShiftX',
    description: 'The shift swap board for cast members.',
    start_url: '/wall',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/logos/ShiftX-logo-lg.png',
        sizes: '2450x613',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
