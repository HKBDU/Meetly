import type { ParticipantAuthInfo } from '@/features/participants/types'

/**
 * Chuyển phiên đăng nhập từ extension sang web: extension mở `/e/CODE#handoff=<payload>`,
 * web đọc payload lúc khởi động, đăng nhập rồi xoá khỏi URL. Dùng fragment (#) vì phần này
 * không bao giờ được gửi lên server hay ghi vào log.
 */
export type HandoffSession = Omit<ParticipantAuthInfo, 'shortCode'>

const PARAM = 'handoff'

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)))
}

export function handoffUrl(appUrl: string, shortCode: string, session: HandoffSession, page: '' | 'share' | 'me' = ''): string {
  const path = `/e/${encodeURIComponent(shortCode)}${page ? `/${page}` : ''}`
  return `${appUrl.replace(/\/+$/, '')}${path}#${PARAM}=${toBase64Url(JSON.stringify(session))}`
}

/** Đọc phiên từ URL hiện tại (nếu có) và xoá nó khỏi thanh địa chỉ; trả null nếu không có hoặc sai định dạng */
export function readHandoff(location: Pick<Location, 'pathname' | 'search' | 'hash'>): ParticipantAuthInfo | null {
  const shortCode = /^\/e\/([^/]+)/.exec(location.pathname)?.[1]
  const raw = new URLSearchParams(location.hash.slice(1)).get(PARAM)
  if (!shortCode || !raw) return null
  try {
    const data = JSON.parse(fromBase64Url(raw)) as Partial<HandoffSession>
    if (
      typeof data.participantId !== 'string' ||
      typeof data.username !== 'string' ||
      typeof data.isAdmin !== 'boolean' ||
      typeof data.accessToken !== 'string'
    )
      return null
    return {
      shortCode: decodeURIComponent(shortCode).toUpperCase(),
      participantId: data.participantId,
      username: data.username,
      isAdmin: data.isAdmin,
      accessToken: data.accessToken,
    }
  } catch {
    return null
  }
}

