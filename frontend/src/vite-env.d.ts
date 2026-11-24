/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_SIGNALR_HUB_URL?: string
  /** Google Analytics 4, dạng "G-XXXXXXXXXX"; bỏ trống thì không bật */
  readonly VITE_GA_MEASUREMENT_ID?: string
}
