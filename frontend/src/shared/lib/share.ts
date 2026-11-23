import { toast } from 'sonner'

/** Link tuyệt đối người tham gia mở để điền lịch */
export function eventShareUrl(shortCode: string): string {
  const path = `/e/${encodeURIComponent(shortCode)}`
  return typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString()
}

/** Nhận cả mã ("abc123") lẫn link dán vào ("https://.../e/ABC123/me") */
export function parseEventCode(input: string): string {
  const trimmed = input.trim()
  const fromLink = /\/e\/([^/?#\s]+)/i.exec(trimmed)?.[1]
  let code = fromLink ?? trimmed
  try {
    code = decodeURIComponent(code)
  } catch {
    // Chuỗi % sai định dạng: giữ nguyên để báo không tìm thấy event
  }
  return code.replace(/\s+/g, '').toUpperCase()
}

/** Tin nhắn mời viết sẵn để dán thẳng vào chat */
export function inviteMessage(title: string, url: string): string {
  return `Hi! Please mark when you're free for "${title}" so we can pick a time: ${url}`
}

/** Có share sheet của hệ điều hành (chủ yếu trên điện thoại) không */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

export async function copyToClipboard(text: string, successMessage: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMessage)
    return true
  } catch {
    toast.error('Unable to copy. Select the text and copy it manually.')
    return false
  }
}

/** Mở share sheet; người dùng bấm huỷ thì im lặng, lỗi khác thì quay về copy */
export async function nativeShare(data: { title: string; text: string; url: string }): Promise<void> {
  try {
    await navigator.share(data)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    await copyToClipboard(`${data.text}`, 'Invite message copied.')
  }
}
