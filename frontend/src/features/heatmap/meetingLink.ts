export type MeetingLinkError = 'invalid' | 'tooLong'

/** Cùng quy tắc với `EventService.NormalizeMeetingUrl` ở backend */
export function normalizeMeetingLink(value: string): { url: string | null; error: MeetingLinkError | null } {
  const url = value.trim()
  if (!url) return { url: null, error: null }
  if (url.length > 500) return { url: null, error: 'tooLong' }
  if (/\s/.test(url)) return { url: null, error: 'invalid' }
  try {
    const parsed = new URL(url)
    // Không nhận "user@" trước host (https://evil.example@meet.google.com/...), backend cũng chặn
    if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) return { url, error: null }
  } catch {
    // Invalid or relative URL.
  }
  return { url: null, error: 'invalid' }
}

export type MeetingProvider = 'google' | 'jitsi' | 'other'

export function meetingProvider(url: string): MeetingProvider {
  try {
    const host = new URL(url).hostname
    if (host === 'meet.google.com') return 'google'
    if (host === JITSI_HOST) return 'jitsi'
  } catch {
    // Link sai thì coi như link thường
  }
  return 'other'
}

const JITSI_HOST = 'meet.jit.si'
/** Bảng chữ không có ký tự dễ nhầm (0/o, 1/l) để đọc to tên phòng cũng được */
const ROOM_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
const ROOM_SUFFIX_LENGTH = 12

/**
 * Link phòng Jitsi Meet mới, không cần tài khoản hay API key: phòng được tạo khi người đầu tiên vào.
 * meet.jit.si là máy chủ công cộng nên tên phòng phải khó đoán: 12 ký tự ngẫu nhiên (~60 bit) từ
 * `crypto.getRandomValues`, không dùng Math.random.
 */
export function createJitsiRoomUrl(fillRandom: (bytes: Uint8Array<ArrayBuffer>) => void = (bytes) => crypto.getRandomValues(bytes)): string {
  const bytes = new Uint8Array(ROOM_SUFFIX_LENGTH)
  fillRandom(bytes)
  const suffix = Array.from(bytes, (byte) => ROOM_ALPHABET[byte % ROOM_ALPHABET.length]).join('')
  return `https://${JITSI_HOST}/Meetly-${suffix}`
}
