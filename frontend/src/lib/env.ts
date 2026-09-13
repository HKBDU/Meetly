/**
 * Điểm đọc DUY NHẤT cho các biến môi trường VITE_* trong toàn app.
 * Phần còn lại của app import `env` từ đây (KHÔNG đọc `import.meta.env` trực
 * tiếp ở nơi khác), để có kiểu dữ liệu rõ ràng + fail sớm ngay lúc khởi động
 * nếu thiếu cấu hình, thay vì crash mơ hồ ở đâu đó khi gọi API.
 */

function requireEnv(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable: ${key}\n` +
        `Create frontend/.env (copy from frontend/.env.example) and set ${key}=...`
    )
  }
  return value
}

export const env = {
  apiBaseUrl: requireEnv("VITE_API_BASE_URL", import.meta.env.VITE_API_BASE_URL),
  signalRHubUrl: requireEnv("VITE_SIGNALR_HUB_URL", import.meta.env.VITE_SIGNALR_HUB_URL),
} as const
