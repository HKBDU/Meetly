import { useCallback, useSyncExternalStore } from 'react'

/**
 * Chế độ sáng/tối. Lựa chọn lưu ở localStorage; chưa chọn thì theo hệ điều hành.
 * Class `dark` trên <html> được đặt sẵn bởi script trong index.html để không nháy trắng khi tải.
 */
export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'meetly-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'
const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' ? stored : 'system'
}

function resolve(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference
  return typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

function apply() {
  const theme = resolve(readPreference())
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const media = window.matchMedia(DARK_QUERY)
  media.addEventListener('change', apply)
  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', apply)
  }
}

export function setThemePreference(preference: ThemePreference) {
  if (preference === 'system') window.localStorage.removeItem(STORAGE_KEY)
  else window.localStorage.setItem(STORAGE_KEY, preference)
  apply()
}

/** Theme đang hiển thị ('light' | 'dark') và hàm đổi qua lại */
export function useTheme() {
  const theme = useSyncExternalStore(
    subscribe,
    () => resolve(readPreference()),
    () => 'light' as const,
  )
  const toggle = useCallback(() => setThemePreference(theme === 'dark' ? 'light' : 'dark'), [theme])
  return { theme, toggle }
}
