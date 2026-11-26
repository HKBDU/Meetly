import { create } from 'zustand'

import { env } from '@/lib/env'

/**
 * Trạng thái máy chủ API. Khi API trả lỗi 5xx hoặc không kết nối được (VD server free bị
 * tạm dừng), app chuyển sang màn "Hệ thống đang bảo trì" thay vì để từng trang báo lỗi riêng.
 */
interface ServerStatusState {
  down: boolean
  markDown: () => void
  markUp: () => void
}

export const useServerStatus = create<ServerStatusState>((set) => ({
  down: false,
  markDown: () => set({ down: true }),
  markUp: () => set({ down: false }),
}))

/** Server free có thể mất gần một phút để khởi động lại sau khi ngủ */
const HEALTH_TIMEOUT_MS = 60_000

/** Ping endpoint liveness của API; true khi server trả lời bình thường */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/health/live`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    })
    return response.ok
  } catch {
    return false
  }
}
