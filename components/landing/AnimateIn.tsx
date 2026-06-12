'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  delay?: number
  animation?: 'fade-in-up' | 'fade-in'
}

export function AnimateIn({ children, className = '', delay = 0, animation = 'fade-in-up' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`${className} ${visible ? `animate-${animation}` : 'opacity-0'}`}
      style={visible && delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
