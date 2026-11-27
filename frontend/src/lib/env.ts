function requireEnv(key: string, value: string | undefined): string {
  const url = value?.trim().replace(/\/+$/, '')
  if (!url) {
    throw new Error(
      `Missing environment variable: ${key}\n` +
        `Create frontend/.env (copy from frontend/.env.example) and set ${key}=...`
    )
  }
  return url
}

/** Điểm đọc duy nhất các biến `VITE_*` */
export const env = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL),
  signalRHubUrl: requireEnv("VITE_SIGNALR_HUB_URL", import.meta.env.VITE_SIGNALR_HUB_URL),
  /** Trang extension trên Chrome Web Store; có giá trị thì web đổi "Sắp ra mắt" thành nút "Thêm vào Chrome" */
  extensionStoreUrl: import.meta.env.VITE_EXTENSION_STORE_URL?.trim() || undefined,
  /** OAuth client ID (loại Web) của Google Cloud; bỏ trống thì ẩn mọi tính năng cần đăng nhập Google */
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || undefined,
} as const
