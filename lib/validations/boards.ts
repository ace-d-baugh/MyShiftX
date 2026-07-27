import { z } from 'zod'

export const createBoardSchema = z.object({
  name: z.string().min(2, 'Board name must be at least 2 characters').max(32, 'Board name must be 32 characters or fewer').trim(),
})

// Codes minted before the CSPRNG change are 7 characters; new ones are 10.
// Both stay valid, so accept the range rather than a fixed length.
export const INVITE_CODE_MIN = 7
export const INVITE_CODE_MAX = 10

export const joinBoardSchema = z.object({
  code: z.string()
    .min(INVITE_CODE_MIN, 'Invite code must be at least 7 characters')
    .max(INVITE_CODE_MAX, 'Invite code must be 10 characters or fewer')
    .toUpperCase(),
})

export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type JoinBoardInput   = z.infer<typeof joinBoardSchema>
