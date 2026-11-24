/**
 * Google Analytics 4. Chỉ bật trên bản build production và khi có `VITE_GA_MEASUREMENT_ID`
 * (dạng "G-XXXXXXXXXX"), nên chạy local hay chạy test không gửi số liệu.
 *
 * Lượt xem trang do "Đo lường nâng cao" của GA4 tự đếm khi URL đổi (React Router dùng
 * history.pushState), nên ở đây không gửi page_view thủ công để tránh đếm trùng.
 */

type GtagArgs = [command: string, ...params: unknown[]]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
const enabled = import.meta.env.PROD && Boolean(measurementId) && typeof window !== 'undefined'

export function initAnalytics() {
  if (!enabled || window.gtag) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId!)}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js yêu cầu đẩy đúng đối tượng `arguments`
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', measurementId)
}

/** Các hành động chính, để xem người dùng đi tới bước nào */
export type AnalyticsEvent =
  | 'create_event'
  | 'join_event'
  | 'save_availability'
  | 'subscribe_email'
  | 'finalize_event'
  | 'share_invite'

export function trackEvent(name: AnalyticsEvent, params?: Record<string, string | number | boolean>) {
  if (!enabled) return
  window.gtag?.('event', name, params)
}
