import { z } from 'zod'
import { isValidTimeRange } from './utils/time.utils'

export const eventFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title cannot be empty.'),
    eventType: z.union([z.literal(1), z.literal(2)]),
    availableDates: z.array(z.string()).min(1, 'Please select at least one available option.'),
    dailyStartTime: z.string().min(1, 'Please select a start time.'),
    dailyEndTime: z.string().min(1, 'Please select an end time.'),
    adminUsername: z.string(),
    adminPassword: z.string(),
  })
  .refine((data) => isValidTimeRange(data.dailyStartTime, data.dailyEndTime), {
    message: 'End time must be later than start time.',
    path: ['dailyEndTime'],
  })
