export type MeetingLinkError = 'invalid' | 'tooLong'

export function normalizeMeetingLink(value: string): { url: string | null; error: MeetingLinkError | null } {
  const url = value.trim()
  if (!url) return { url: null, error: null }
  if (url.length > 500) return { url: null, error: 'tooLong' }
  if (/\s/.test(url)) return { url: null, error: 'invalid' }
  try {
    if (new URL(url).protocol === 'https:') return { url, error: null }
  } catch {
    // Invalid or relative URL.
  }
  return { url: null, error: 'invalid' }
}
