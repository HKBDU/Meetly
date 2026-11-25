/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SIGNALR_HUB_URL?: string
  /** Google Analytics 4, dạng "G-XXXXXXXXXX"; bỏ trống thì không bật */
  readonly VITE_GA_MEASUREMENT_ID?: string
  /** Cloudflare Web Analytics, token của site; bỏ trống thì không bật */
  readonly VITE_CF_ANALYTICS_TOKEN?: string
  /** Trang web Meetly, extension dùng để dựng link chia sẻ */
  readonly VITE_APP_URL?: string
  /** Link Meetly Extension trên Chrome Web Store; bỏ trống thì web hiện "Sắp ra mắt" */
  readonly VITE_EXTENSION_STORE_URL?: string
}
