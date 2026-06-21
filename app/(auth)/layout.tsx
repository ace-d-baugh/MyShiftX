import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary-light flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Subtle animated blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-20 h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-blob" />
        <div
          className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/25 blur-3xl animate-blob"
          style={{ animationDelay: '5s' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-slide-down">
          <Link href="/" className="inline-flex flex-row items-center justify-center gap-0">
            <Image
              src="/logos/ShiftX-logo.svg"
              alt="MyShiftX"
              width={1560}
              height={500}
              className="h-14 w-auto"
              priority
            />
          </Link>
        </div>

        {children}

        <p
          className="text-center text-xs text-text/40 mt-8 px-4 animate-fade-in"
          style={{ animationDelay: '400ms' }}
        >
          MyShiftX is an independent platform and is not affiliated with, sponsored by, or endorsed by any specific employer.
        </p>
      </div>
    </div>
  )
}
