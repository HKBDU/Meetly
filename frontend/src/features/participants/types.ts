import type { MessageKey } from '@/shared/i18n'

export type PaintMode = 'FREE' | 'BUSY'

/** Khoá dịch tên của chế độ tô, VD "availability" / "busy time" */
export const PAINT_MODE_LABEL = {
  FREE: 'paint.free',
  BUSY: 'paint.busy',
} as const satisfies Record<PaintMode, MessageKey>

/** Phiên đăng nhập của participant trên một event */
export interface ParticipantAuthInfo {
  /** Event mà token này thuộc về */
  shortCode: string
  participantId: string
  username: string
  isAdmin: boolean
  accessToken: string
}
