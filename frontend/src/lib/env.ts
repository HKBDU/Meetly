function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}\n` +
        `Create frontend/.env (copy from frontend/.env.example) and set ${key}=...`
    )
  }
  return value
}

/** Điểm đọc duy nhất các biến `VITE_*` */
export const env = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL),
  signalRHubUrl: requireEnv("VITE_SIGNALR_HUB_URL", import.meta.env.VITE_SIGNALR_HUB_URL),
} as const
