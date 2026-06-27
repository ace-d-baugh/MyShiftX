  'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Checkbox } from '@/components/ui/Checkbox'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'
import { OAuthButtons } from '@/components/ui/OAuthButtons'

type FieldErrors = Partial<Record<keyof RegisterInput, string>>

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? ''
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    terms_accepted: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (errors[name as keyof FieldErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const parseResult = registerSchema.safeParse({
      ...form,
      terms_accepted: form.terms_accepted as true,
    })

    if (!parseResult.success) {
      const fieldErrors: FieldErrors = {}
      parseResult.error.errors.forEach(err => {
        const field = err.path[0] as keyof FieldErrors
        fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)
    try {
      // The public.users profile row is created automatically by a DB trigger on auth.users.
      const verifyBase = `${window.location.origin}/verify-email`
      const emailRedirectTo = redirect
        ? `${verifyBase}?redirect=${encodeURIComponent(redirect)}`
        : verifyBase

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo },
      })

      if (error) {
        setServerError(error.message)
        return
      }

      const verifyPath = redirect
        ? `/verify-email?redirect=${encodeURIComponent(redirect)}`
        : '/verify-email'

      if (data.user && !data.session) {
        router.push(verifyPath)
      } else {
        router.push(redirect || '/wall')
      }
    } catch {
      setServerError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card shadow-lg animate-auth-card-in">
      <h1 className="font-accent text-2xl font-bold text-text mb-1">Create Account</h1>
      <p className="text-text/60 text-sm mb-6">Join the MyShiftX community.</p>

      {serverError && (
        <div key={serverError} className="mb-4 p-3 rounded-md bg-warning/10 border border-warning/20 text-warning text-sm animate-shake">
          {serverError}
        </div>
      )}

      <OAuthButtons mode="register" />

      <form onSubmit={onSubmit} className="space-y-4 mt-4" noValidate>
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text mb-1">
            Email Address <span className="text-warning">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`input placeholder:text-text/50 ${errors.email ? 'border-warning' : ''}`}
            placeholder="your@email.com"
            value={form.email}
            onChange={handleChange}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-warning">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
            Password <span className="text-warning">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 placeholder:text-text/50 ${errors.password ? 'border-warning' : ''}`}
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text min-h-0 min-w-0 h-auto w-auto p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-warning">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirm_password" className="block text-sm font-medium text-text mb-1">
            Confirm Password <span className="text-warning">*</span>
          </label>
          <div className="relative">
            <input
              id="confirm_password"
              name="confirm_password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 placeholder:text-text/50 ${errors.confirm_password ? 'border-warning' : ''}`}
              placeholder="Re-enter your password"
              value={form.confirm_password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text/40 hover:text-text min-h-0 min-w-0 h-auto w-auto p-1"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirm_password && (
            <p className="mt-1 text-xs text-warning">{errors.confirm_password}</p>
          )}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms_accepted"
            name="terms_accepted"
            className="mt-1"
            checked={form.terms_accepted}
            onChange={handleChange}
          />
          <label htmlFor="terms_accepted" className="text-sm text-text/70 min-h-0">
            I agree to the{' '}
            <Link href="/terms" target="_blank" className="text-primary hover:underline min-h-0 min-w-0">
              Terms &amp; Conditions
            </Link>
            ,{' '}
            <Link href="/privacy" target="_blank" className="text-primary hover:underline min-h-0 min-w-0">
              Privacy Policy
            </Link>
            , and{' '}
            <Link href="/data-deletion" target="_blank" className="text-primary hover:underline min-h-0 min-w-0">
              Data Deletion Policy
            </Link>
            . I understand how my data is stored and how to request its deletion.
          </label>
        </div>
        {errors.terms_accepted && (
          <p className="text-xs text-warning -mt-2">{errors.terms_accepted}</p>
        )}

        <button
          type="submit"
          disabled={loading || !form.terms_accepted}
          className={`btn btn-primary w-full gap-2 ${!form.terms_accepted ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <UserPlus className="w-4 h-4" />
          )}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-sm text-text/60 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary font-medium hover:underline min-h-0 min-w-0">
          Log in
        </Link>
      </p>
    </div>
  )
}
