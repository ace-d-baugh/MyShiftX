import { z } from 'zod'

export const createBoardSchema = z.object({
  name: z.string().min(2, 'Board name must be at least 2 characters').max(60, 'Board name must be 60 characters or fewer').trim(),
})

export const joinBoardSchema = z.object({
  code: z.string().length(7, 'Invite code must be exactly 7 characters').toUpperCase(),
})

export type CreateBoardInput = z.infer<typeof createBoardSchema>
export type JoinBoardInput   = z.infer<typeof joinBoardSchema>
