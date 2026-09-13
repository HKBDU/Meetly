import { useCallback, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { mergeFreeSlotIdsIntoRanges, resolveFreeSlotIds } from "@/features/participants/gridUtils"
import { saveAvailability } from "@/features/participants/services"
import { useParticipantStore } from "@/features/participants/store"
import { useDebouncedCallback } from "@/shared/hooks"

/**
 * Người dùng có thể kéo thả nhiều vùng liên tiếp chỉ trong vài trăm ms
 * (VD: tô 1 vùng, nhả chuột, tô tiếp vùng khác ngay). Nếu lưu + hiện toast
 * ngay mỗi lần nhả chuột, toast sẽ hiện dồn dập chồng lên nhau rất rối mắt.
 * Chờ AUTO_SAVE_DEBOUNCE_MS sau lần nhả chuột CUỐI CÙNG rồi mới thật sự lưu
 * 1 LẦN, gộp mọi thay đổi trong khoảng đó lại - y hệt debounce ô tìm kiếm.
 */
const AUTO_SAVE_DEBOUNCE_MS = 600

/**
 * Auto-save lịch rảnh: gọi API sau khi người dùng dừng kéo thả 1 khoảng ngắn
 * (không có nút Lưu). Nếu đây là lần lưu THÀNH CÔNG đầu tiên, bật popup xin
 * email 1 lần duy nhất.
 *
 * `selectedSlotIds` trong store chỉ là tập ô đang được TÔ - chưa chắc là
 * "rảnh". Trước khi gửi API phải qua 2 bước diễn giải:
 *   1. mode FREE: tô = rảnh -> lấy thẳng. mode BUSY: tô = bận -> rảnh là
 *      PHẦN BÙ (toàn bộ slot của lưới trừ đi các slot đang bị tô).
 *   2. Gộp các ô 15 phút RỜI RẠC liền kề nhau (cùng ngày/thứ, không hở)
 *      thành từng khoảng start-end DUY NHẤT - xem `mergeFreeSlotIdsIntoRanges`
 *      trong gridUtils.ts - vì BE nhận theo khoảng thời gian, không nhận
 *      từng ô rời rạc.
 */
export function useAutoSaveSchedule() {
  const markSavedOnce = useParticipantStore((s) => s.markSavedOnce)
  const openEmailDialog = useParticipantStore((s) => s.openEmailDialog)
  // true trong khoảng thời gian đang "chờ debounce" (đã nhả chuột nhưng chưa
  // tới lúc thật sự gọi API) - cộng với mutation.isPending để status hiển thị
  // "Đang lưu..." luôn khớp thực tế, không báo "Đã đồng bộ" nhầm khi vẫn còn
  // 1 lần lưu đang xếp hàng chờ.
  const [isSavePending, setIsSavePending] = useState(false)

  const mutation = useMutation({
    mutationFn: (freeSlotIds: string[]) => {
      const { auth, scheduleConfig } = useParticipantStore.getState()
      if (!auth) throw new Error("Participant not authenticated")
      if (!scheduleConfig) throw new Error("Schedule config not loaded")

      // BE cần các KHOẢNG start-end liên tục, không nhận từng ô rời rạc.
      const timeSlots = mergeFreeSlotIdsIntoRanges(freeSlotIds, scheduleConfig)
      return saveAvailability(scheduleConfig.eventId, { timeSlots })
    },
    onSuccess: () => {
      const { hasSavedOnce, hasEmailSubscribed } = useParticipantStore.getState()
      // id cố định: nếu vì lý do nào đó có 2 lần lưu thành công gần nhau, toast
      // MỚI thay thế toast CŨ thay vì chồng thêm 1 cái - không bao giờ bị duplicate.
      toast.success("Availability saved", { id: "auto-save-schedule", duration: 1500 })

      if (!hasSavedOnce) {
        markSavedOnce()
        if (!hasEmailSubscribed) openEmailDialog()
      }
    },
    onError: () => {
      toast.error("Failed to save, please try again", { id: "auto-save-schedule" })
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

  // Đây là hàm được gọi mỗi khi nhả chuột (xem PersonalScheduleGrid -> useOptimizedDrag).
  // Đánh dấu "đang chờ lưu" NGAY để UI phản hồi tức thì, còn việc gọi API thật
  // thì đợi debounce ở trên.
  const triggerAutoSave = useCallback(() => {
    setIsSavePending(true)
    debouncedSaveNow()
  }, [debouncedSaveNow])

  return {
    triggerAutoSave,
    isSaving: isSavePending || mutation.isPending,
  }
}
