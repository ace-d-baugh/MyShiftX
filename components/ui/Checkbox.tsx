'use client'

import { forwardRef, InputHTMLAttributes, useEffect, useImperativeHandle, useRef } from 'react'
import { Minus, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Tri-state "some selected" look: shows a dash instead of the star. */
  indeterminate?: boolean
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, disabled, indeterminate = false, ...props }, ref) => {
    const innerRef = useRef<HTMLInputElement>(null)
    useImperativeHandle(ref, () => innerRef.current!, [])

    // indeterminate is a DOM property, not an attribute — set it imperatively.
    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = indeterminate
    }, [indeterminate])

    return (
      <span className={cn('relative inline-flex h-5 w-5 shrink-0 items-center justify-center', disabled && 'opacity-50', className)}>
        <input
          type="checkbox"
          ref={innerRef}
          checked={checked}
          disabled={disabled}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          {...props}
        />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none flex h-5 w-5 items-center justify-center rounded-md border-2 transition-colors',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-1',
            checked || indeterminate ? 'border-primary bg-[hsl(269_35%_20%)]' : 'border-border bg-card'
          )}
        >
          {indeterminate && !checked ? (
            <Minus strokeWidth={3.5} className="h-3.5 w-3.5 text-[#FFEA80]" />
          ) : (
            <Star
              fill="#ffea80"
              strokeWidth={0}
              className={cn(
                'h-3.5 w-3.5 text-[#FFEA80] transition-opacity',
                checked ? 'opacity-100' : 'opacity-0'
              )}
            />
          )}
        </span>
      </span>
    )
  }
)
Checkbox.displayName = 'Checkbox'
export { Checkbox }
