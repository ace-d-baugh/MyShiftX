import { z } from 'zod'

export const shiftSchema = z.object({
  board_id: z.string().uuid('Please select a board'),
  shift_title: z.string().min(1, 'Shift title is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  is_trade: z.boolean().default(false),
  is_giveaway: z.boolean().default(false),
  is_overtime_approved: z.boolean().default(false),
  details: z.string().optional(),
}).refine(data => new Date(data.end_time) > new Date(data.start_time), {
  message: 'End time must be after start time',
  path: ['end_time'],
})

export const requestSchema = z.object({
  board_id: z.string().uuid('Please select a board'),
  requested_date: z.string().min(1, 'Date is required'),
  preferred_times: z.array(z.enum(['morning', 'afternoon', 'evening', 'late'])).min(1, 'Select at least one time preference'),
  details: z.string().optional(),
})

export type ShiftInput   = z.infer<typeof shiftSchema>
export type RequestInput = z.infer<typeof requestSchema>
