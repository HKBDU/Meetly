import { useCallback, useMemo, useSyncExternalStore } from 'react'

import { en, type MessageKey } from './en'
import { vi } from './vi'

/**
 * Song ngữ Anh/Việt không cần thư viện. Lựa chọn lưu ở localStorage; chưa chọn thì theo
 * ngôn ngữ trình duyệt. Component dùng `useT()` để tự vẽ lại khi đổi ngôn ngữ; code ngoài
 * React (schema, toast, API) gọi `t()` để lấy câu theo ngôn ngữ hiện tại.
 */
export type Locale = 'en' | 'vi'
export type { MessageKey }
export type TranslateParams = Record<string, string | number>
export type Translate = (key: MessageKey, params?: TranslateParams) => string

const STORAGE_KEY = 'meetly-locale'
const DICTIONARIES = { en, vi } as Record<Locale, Record<MessageKey, string>>
const INTL_LOCALE: Record<Locale, string> = { en: 'en-US', vi: 'vi-VN' }
const listeners = new Set<() => void>()

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'vi') return stored
  } catch {
    // localStorage bị chặn (chế độ riêng tư): dùng ngôn ngữ trình duyệt
  }
  return window.navigator.language?.toLowerCase().startsWith('vi') ? 'vi' : 'en'
}

let current: Locale = detectLocale()
if (typeof document !== 'undefined') document.documentElement.lang = current

export const getLocale = (): Locale => current
export const intlLocale = (locale: Locale = current): string => INTL_LOCALE[locale]

export function setLocale(locale: Locale) {
  if (locale === current) return
  current = locale
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Không lưu được thì chỉ đổi cho phiên hiện tại
  }
  if (typeof document !== 'undefined') document.documentElement.lang = locale
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** `count === 1` thì ưu tiên khoá `<key>_one` nếu có (số ít tiếng Anh) */
function translate(locale: Locale, key: MessageKey, params?: TranslateParams): string {
  const dictionary = DICTIONARIES[locale]
  const singular = params?.count === 1 ? dictionary[`${key}_one` as MessageKey] : undefined
  const template = singular ?? dictionary[key] ?? en[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

/** Câu theo ngôn ngữ hiện tại, dùng ngoài component */
export const t: Translate = (key, params) => translate(current, key, params)

export function useLocale() {
  const locale = useSyncExternalStore(subscribe, getLocale, getLocale)
  const toggle = useCallback(() => setLocale(locale === 'en' ? 'vi' : 'en'), [locale])
  return { locale, setLocale, toggle }
}

/** Hàm dịch gắn với ngôn ngữ hiện tại; component gọi hook này sẽ vẽ lại khi đổi ngôn ngữ */
export function useT(): Translate {
  const locale = useSyncExternalStore(subscribe, getLocale, getLocale)
  return useMemo<Translate>(() => (key, params) => translate(locale, key, params), [locale])
}
