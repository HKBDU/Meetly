import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { trackEvent } from '@/lib/analytics'
import { GoogleAuthError, invalidateGoogleToken, preloadGoogleIdentity } from '@/lib/google'
import { t, type MessageKey } from '@/shared/i18n'
import type { EventDetail } from '@/shared/types'
import {
  FREEBUSY_SCOPE,
  GoogleBusyError,
  fetchGoogleFreeSlotIds,
  type GoogleBusyErrorKind,
  type GoogleTokenProvider,
} from '@/features/participants/googleFreeBusy'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'

const ERROR_MESSAGE: Record<GoogleBusyErrorKind | 'permission' | 'popup', MessageKey> = {
  permission: 'import.error.permission',
  popup: 'import.error.popup',
  unauthorized: 'import.error.unauthorized',
  forbidden: 'import.error.forbidden',
  calendar: 'import.error.calendar',
  network: 'import.error.network',
  unknown: 'import.error.unknown',
}

/** Thông báo khi xin quyền thất bại; `null` = người dùng tự đóng cửa sổ, không cần báo */
function tokenErrorMessage(error: unknown): MessageKey | null {
  if (!(error instanceof GoogleAuthError)) return ERROR_MESSAGE.permission
  switch (error.kind) {
    case 'popup_closed':
      return null
    case 'popup_blocked':
      return ERROR_MESSAGE.popup
    case 'script_failed':
      return ERROR_MESSAGE.network
    case 'access_denied':
      return ERROR_MESSAGE.permission
    default:
      return ERROR_MESSAGE.unknown
  }
}

interface UseGoogleBusyImportOptions {
  event: EventDetail
  grid: ScheduleGrid
  /** `null` thì chưa cấu hình Google, nút nhập bị ẩn */
  getAccessToken: GoogleTokenProvider | null
}

/**
 * Luồng "Nhập từ Google Calendar": xin quyền xem giờ bận, hỏi Google rồi mở bản nháp trên lưới.
 * Không gửi gì lên Meetly; người dùng bấm Áp dụng trên bản nháp mới lưu.
 */
export function useGoogleBusyImport({ event, grid, getAccessToken }: UseGoogleBusyImportOptions) {
  const [isImporting, setIsImporting] = useState(false)
  const latestRef = useRef({ event, grid })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    latestRef.current = { event, grid }
  }, [event, grid])

  // Rời màn lịch giữa chừng thì bỏ kết quả, không mở bản nháp cho màn đã đóng
  useEffect(() => () => abortRef.current?.abort(), [])

  const importFromGoogle = useCallback(async () => {
    if (!getAccessToken || abortRef.current) return
    const controller = new AbortController()
    abortRef.current = controller
    setIsImporting(true)
    try {
      let accessToken: string
      try {
        accessToken = await getAccessToken(FREEBUSY_SCOPE)
      } catch (error) {
        const message = tokenErrorMessage(error)
        if (message && !controller.signal.aborted) toast.error(t(message))
        return
      }

      const freeSlotIds = await fetchGoogleFreeSlotIds({
        event: latestRef.current.event,
        grid: latestRef.current.grid,
        accessToken,
        signal: controller.signal,
      })

      // Trong lúc chờ Google, event có thể đã bị chốt và lịch bị khoá
      const current = latestRef.current.grid
      if (controller.signal.aborted || current.isLocked) return
      useParticipantStore.getState().startDraft(freeSlotIds, current.allSlotIds)
      trackEvent('import_google_busy')
    } catch (error) {
      if (controller.signal.aborted) return
      const kind = error instanceof GoogleBusyError ? error.kind : 'unknown'
      // Token bị Google từ chối (hết hạn, bị thu hồi): bỏ đi để lần bấm sau xin token mới
      if (kind === 'unauthorized') invalidateGoogleToken(FREEBUSY_SCOPE)
      toast.error(t(ERROR_MESSAGE[kind]))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setIsImporting(false)
      }
    }
  }, [getAccessToken])

  /** Gọi khi người dùng sắp bấm (hover/focus) để script Google sẵn sàng, tránh popup bị chặn */
  const prepareImport = useCallback(() => {
    if (getAccessToken) preloadGoogleIdentity()
  }, [getAccessToken])

  return { canImport: getAccessToken !== null, isImporting, importFromGoogle, prepareImport }
}
