import { z } from 'zod';
export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
  password: z.string().trim().max(100, 'Password must be at most 100 characters').optional().or(z.literal('')),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const emailSchema = z.object({
  email: z.string().trim().min(1, 'Please enter an email').email('Invalid email address'),
});

export type EmailFormValues = z.infer<typeof emailSchema>;
