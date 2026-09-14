import type { Session } from '@/shared/types'

export const sessionKey = (code: string) => `meetly:session:${code}`

export const readSession = (code: string): Session | null => {
  try {
    return JSON.parse(localStorage.getItem(sessionKey(code)) || 'null') as Session | null
  } catch {
    return null
  }
}

export const saveSession = (code: string, session: Session) =>
  localStorage.setItem(sessionKey(code), JSON.stringify(session))

export const clearSession = (code: string) => localStorage.removeItem(sessionKey(code))

export const eventCodeFromPath = () => {
  const parts = location.pathname.split('/').filter(Boolean)
  const candidate = parts[0]?.toLowerCase() === 'event' ? parts[1] : parts[0]
  return candidate && /^[a-z0-9]{6}$/i.test(candidate) ? candidate.toUpperCase() : null
}

export const go = (path: string) => {
  history.pushState({}, '', path)
  dispatchEvent(new PopStateEvent('popstate'))
}
