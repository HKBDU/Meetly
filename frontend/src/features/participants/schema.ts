import { z } from 'zod';

import { t, type MessageKey, type TranslateParams } from '@/shared/i18n';

/** Câu lỗi tính lúc kiểm tra để theo ngôn ngữ đang chọn */
const msg = (key: MessageKey, params?: TranslateParams) => ({ error: () => t(key, params) });

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, msg('validation.displayNameMin', { min: 2 }))
    .max(50, msg('validation.displayNameMax', { max: 50 })),
  // Không trim: BE so khớp mật khẩu nguyên văn
  password: z
    .string()
    .min(4, msg('validation.loginPasswordMin', { min: 4 }))
    .max(100, msg('validation.loginPasswordMax', { max: 100 }))
    .optional()
    .or(z.literal('')),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const emailSchema = z.object({
  email: z.string().trim().min(1, msg('validation.emailRequired')).email(msg('validation.emailInvalid')),
});

export type EmailFormValues = z.infer<typeof emailSchema>;

// Slider đã đảm bảo start < end nhờ `minStepsBetweenThumbs`
export const manualRangeSchema = z.object({
  date: z.string().min(1, msg('validation.dateRequired')),
  range: z.tuple([z.number(), z.number()]),
});

export type ManualRangeFormValues = z.infer<typeof manualRangeSchema>;
