export type PaintMode = 'FREE' | 'BUSY'

export const PAINT_MODE_LABEL: Record<PaintMode, string> = {
  FREE: 'availability',
  BUSY: 'busy time',
}

/** Phiên đăng nhập của participant trên một event */
export interface ParticipantAuthInfo {
  /** Event mà token này thuộc về */
  shortCode: string
  participantId: string
  username: string
  isAdmin: boolean
  accessToken: string
}
