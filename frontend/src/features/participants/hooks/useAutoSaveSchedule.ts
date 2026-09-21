import { useCallback, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { getApiErrorMessage } from "@/lib/axios"

import { mergeFreeSlotIdsIntoRanges, resolveFreeSlotIds } from "@/features/participants/gridUtils"
import { saveAvailability } from "@/features/participants/services"
import { useParticipantStore } from "@/features/participants/store"
import { useDebouncedCallback } from "@/shared/hooks"

/** Gộp nhiều lần nhả chuột liên tiếp thành 1 lần lưu */
const AUTO_SAVE_DEBOUNCE_MS = 600

/**
 * Tự lưu lịch rảnh sau khi người dùng dừng kéo thả. Lần lưu thành công đầu
 * tiên sẽ mở popup xin email. Trước khi gửi, tập ô tô được đổi thành slot rảnh
 * theo paintMode rồi gộp thành các khoảng liên tục.
 */
export function useAutoSaveSchedule() {
  const markSavedOnce = useParticipantStore((s) => s.markSavedOnce)
  const openEmailDialog = useParticipantStore((s) => s.openEmailDialog)
  /** true khi đã nhả chuột nhưng chưa tới lúc gọi API */
  const [isSavePending, setIsSavePending] = useState(false)

  const mutation = useMutation({
    mutationFn: (freeSlotIds: string[]) => {
      const { auth, scheduleConfig } = useParticipantStore.getState()
      if (!auth) throw new Error("Participant not authenticated")
      if (!scheduleConfig) throw new Error("Schedule config not loaded")

      const timeSlots = mergeFreeSlotIdsIntoRanges(freeSlotIds, scheduleConfig)
      return saveAvailability(scheduleConfig.shortCode, { timeSlots })
    },
    onSuccess: () => {
      const { hasSavedOnce, hasEmailSubscribed } = useParticipantStore.getState()
      toast.success("Availability saved", { id: "auto-save-schedule", duration: 1500 })

      if (!hasSavedOnce) {
        markSavedOnce()
        if (!hasEmailSubscribed) openEmailDialog()
      }
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Failed to save, please try again"), {
        id: "auto-save-schedule",
      })
    },
  })

  const { mutate } = mutation

  const saveNow = useCallback(() => {
    const { selectedSlotIds, paintMode, scheduleConfig, isFinalized } =
      useParticipantStore.getState()
    setIsSavePending(false)
    if (isFinalized || !scheduleConfig) return

    mutate(resolveFreeSlotIds(selectedSlotIds, paintMode, scheduleConfig))
  }, [mutate])

  const debouncedSaveNow = useDebouncedCallback(saveNow, AUTO_SAVE_DEBOUNCE_MS)

  const triggerAutoSave = useCallback(() => {
    setIsSavePending(true)
    debouncedSaveNow()
  }, [debouncedSaveNow])

  return {
    triggerAutoSave,
    isSaving: isSavePending || mutation.isPending,
  }
}
