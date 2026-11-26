/**
 * Thống kê truy cập: Google Analytics 4 và Cloudflare Web Analytics. Mỗi công cụ chỉ bật
 * trên bản build production và khi có biến môi trường tương ứng, nên chạy local, chạy test
 * hay trong extension đều không gửi số liệu.
 *
 * Cả hai đều tự đếm lượt xem trang khi URL đổi (React Router dùng history.pushState),
 * nên ở đây không gửi page_view thủ công để tránh đếm trùng.
 */

type GtagArgs = [command: string, ...params: unknown[]]

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: GtagArgs) => void
  }
}

const isBrowserProduction = import.meta.env.PROD && typeof window !== 'undefined'
/** GA4, dạng "G-XXXXXXXXXX" */
const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()
/** Token site trong Cloudflare → Web Analytics (công khai, không phải bí mật) */
const cloudflareToken = import.meta.env.VITE_CF_ANALYTICS_TOKEN?.trim()

const gaEnabled = isBrowserProduction && Boolean(measurementId)

export function initAnalytics() {
  if (!isBrowserProduction) return
  if (gaEnabled) initGoogleAnalytics(measurementId!)
  if (cloudflareToken) initCloudflareAnalytics(cloudflareToken)
}

function initGoogleAnalytics(id: string) {
  if (window.gtag) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js yêu cầu đẩy đúng đối tượng `arguments`
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id)
}

/** Không dùng cookie; beacon đọc cấu hình từ thuộc tính `data-cf-beacon` của chính thẻ script */
function initCloudflareAnalytics(token: string) {
  if (document.querySelector('script[data-cf-beacon]')) return
  const script = document.createElement('script')
  script.defer = true
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  script.dataset.cfBeacon = JSON.stringify({ token })
  document.head.appendChild(script)
}

/** Các hành động chính, để xem người dùng đi tới bước nào (chỉ GA4 nhận) */
export type AnalyticsEvent =
  | 'create_event'
  | 'join_event'
  | 'save_availability'
  | 'import_google_busy'
  | 'subscribe_email'
  | 'finalize_event'
  | 'share_invite'

export function trackEvent(name: AnalyticsEvent, params?: Record<string, string | number | boolean>) {
  if (!gaEnabled) return
  window.gtag?.('event', name, params)
}
