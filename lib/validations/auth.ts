import { z } from 'zod'

export const displayNameRegex = /^[A-Z][a-zA-Z]*(?:[-\s][A-Z][a-zA-Z]*)* [A-Z]\.$/

// Letters, spaces, and hyphens only — keeps the derived site display name
// ("First L.") valid under displayNameRegex above.
const nameRegex = /^[A-Za-z]+(?:[-\s][A-Za-z]+)*$/

export const registerSchema = z.object({
  first_name: z.string().trim()
    .min(1, 'First name is required')
    .max(40, 'First name is too long')
    .regex(nameRegex, 'Letters, spaces, and hyphens only'),
  last_name: z.string().trim()
    .min(1, 'Last name is required')
    .max(40, 'Last name is too long')
    .regex(nameRegex, 'Letters, spaces, and hyphens only'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(1, 'Please confirm your password'),
  terms_accepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the Terms & Conditions' }) }),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
