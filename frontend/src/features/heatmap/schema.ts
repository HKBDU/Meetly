import { format, isBefore, startOfDay } from 'date-fns';
import { timeToMinutes } from '@/lib/date-time';
import { z } from 'zod';

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a valid 24-hour time.');
const dayOfWeekSchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export function isBlockedPastDate(
  date: Date,
  existingDates: readonly string[],
  today = new Date(),
): boolean {
  const dateKey = format(date, 'yyyy-MM-dd');
  return isBefore(startOfDay(date), startOfDay(today)) && !existingDates.includes(dateKey);
}

export function createEditEventSchema() {
  return z
    .object({
      title: z.string().trim().min(1, 'Event name is required.'),
      eventType: z.union([z.literal(1), z.literal(2)]),
      availableDates: z.array(z.string()),
      availableWeekdays: z.array(dayOfWeekSchema),
      dailyStartTime: timeSchema,
      dailyEndTime: timeSchema,
    })
    .superRefine((values, context) => {
      if (timeToMinutes(values.dailyStartTime) >= timeToMinutes(values.dailyEndTime)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['dailyEndTime'],
          message: 'End time must be later than start time.',
        });
      }
      if (values.eventType === 1 && values.availableDates.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availableDates'],
          message: 'Select at least one date.',
        });
      }
      if (values.eventType === 2 && values.availableWeekdays.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availableWeekdays'],
          message: 'Select at least one weekday.',
        });
      }
    });
}

export const editEventSchema = createEditEventSchema();

export type EditEventFormValues = z.infer<typeof editEventSchema>;
