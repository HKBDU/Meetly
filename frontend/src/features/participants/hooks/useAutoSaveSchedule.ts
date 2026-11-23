import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { saveAvailability } from '@/shared/api/events'
import { useDebouncedCallback } from '@/shared/hooks'
import { mergeFreeSlotIdsIntoRanges, resolveFreeSlotIds } from '@/features/participants/gridUtils'
import type { ScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'

/** Gộp nhiều lần nhả chuột liên tiếp thành 1 lần lưu */
const AUTO_SAVE_DEBOUNCE_MS = 600

/** Lịch rảnh hiện tại dạng khoảng, sẵn để gửi BE */
export function currentTimeSlots(grid: ScheduleGrid) {
  const { selectedSlotIds, paintMode } = useParticipantStore.getState()
  return mergeFreeSlotIdsIntoRanges(resolveFreeSlotIds(selectedSlotIds, paintMode, grid.allSlotIds), grid.columns)
}

/**
 * Tự lưu lịch rảnh sau khi người dùng dừng thao tác. Lần lưu thành công đầu tiên
 * mở popup xin email. Gọi 1 lần ở màn lịch cá nhân để mọi nơi sửa lịch dùng chung debounce.
 */
export function useAutoSaveSchedule(shortCode: string, grid: ScheduleGrid | null) {
  const [isSavePending, setIsSavePending] = useState(false)
  // Đọc lưới mới nhất lúc debounce chạy, không phải lưới lúc bắt đầu kéo
  const gridRef = useRef(grid)
  useEffect(() => {
    gridRef.current = grid
  }, [grid])

  const { mutate, isPending } = useMutation({
    mutationFn: (timeSlots: ReturnType<typeof currentTimeSlots>) => saveAvailability(shortCode, { timeSlots }),
    onSuccess: () => {
      const { hasSavedOnce, hasEmailSubscribed, markSavedOnce, openEmailDialog } = useParticipantStore.getState()
      toast.success('Availability saved', { id: 'auto-save-schedule', duration: 1500 })
      if (!hasSavedOnce) {
        markSavedOnce()
        if (!hasEmailSubscribed) openEmailDialog()
      }
    },
    onError: (error) => {
      toast.error(error.message, { id: 'auto-save-schedule' })
    },
  })

  const saveNow = useCallback(() => {
    setIsSavePending(false)
    const current = gridRef.current
    if (!current || current.isLocked) return
    mutate(currentTimeSlots(current))
  }, [mutate])

  const debouncedSaveNow = useDebouncedCallback(saveNow, AUTO_SAVE_DEBOUNCE_MS)

  const triggerAutoSave = useCallback(() => {
    setIsSavePending(true)
    debouncedSaveNow()
  }, [debouncedSaveNow])

  return { triggerAutoSave, isSaving: isSavePending || isPending }
}
