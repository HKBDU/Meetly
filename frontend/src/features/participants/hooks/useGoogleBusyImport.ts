import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { trackEvent } from '@/lib/analytics'
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

const ERROR_MESSAGE: Record<GoogleBusyErrorKind | 'permission', MessageKey> = {
  permission: 'import.error.permission',
  unauthorized: 'import.error.unauthorized',
  forbidden: 'import.error.forbidden',
  calendar: 'import.error.calendar',
  network: 'import.error.network',
  unknown: 'import.error.unknown',
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
      } catch {
        if (!controller.signal.aborted) toast.error(t(ERROR_MESSAGE.permission))
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
      toast.error(t(ERROR_MESSAGE[kind]))
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null
        setIsImporting(false)
      }
    }
  }, [getAccessToken])

  return { canImport: getAccessToken !== null, isImporting, importFromGoogle }
}
