import { EventInfoBar } from "@/features/participants/components/EventInfoBar"
import { PersonalScheduleGrid } from "@/features/participants/components/PersonalScheduleGrid"
import { ScheduleActionsBar } from "@/features/participants/components/ScheduleActionsBar"
import { useAutoSaveSchedule } from "@/features/participants/hooks/useAutoSaveSchedule"
import { useParticipantStore } from "@/features/participants/store"

/**
 * Gộp toàn bộ màn "Lịch cá nhân": thông tin sự kiện (tên/ngày/link mời/nút
 * quay về Tổng quan - tất cả 1 hàng, xem EventInfoBar) + hàng điều khiển
 * (Select Manual/Reset dates/Record Busy-Available/Synced, xem
 * ScheduleActionsBar) + khung lịch - theo đúng bố cục ảnh mẫu, chỉ 1 đường
 * kẻ duy nhất phân cách AppHeader với phần nội dung này. KHÔNG còn ép
 * `h-full` - chiều cao giờ hoàn toàn tự nhiên theo nội dung (xem App.tsx:
 * `main` chỉ đảm bảo TỐI THIỂU bằng phần còn lại của viewport, còn lại tự do
 * giãn theo grid nếu lưới dài hơn 1 màn hình, cả trang tự cuộn).
 *
 * `useAutoSaveSchedule` gọi 1 LẦN DUY NHẤT ở đây rồi truyền `triggerAutoSave`
 * xuống MỌI nơi có thể làm thay đổi lịch (kéo chuột trên lưới, "Select
 * Manual", "Reset dates") - để cả 3 nơi dùng CHUNG 1 đồng hồ debounce + 1
 * trạng thái "Đang lưu" duy nhất, không bị lệch nhau hay gọi API trùng lặp.
 */
export function PersonalScheduleView() {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const { triggerAutoSave, isSaving } = useAutoSaveSchedule()

  return (
    <div className="flex flex-col bg-background">
      {config && <EventInfoBar config={config} />}
      <ScheduleActionsBar triggerAutoSave={triggerAutoSave} isSaving={isSaving} />
      <PersonalScheduleGrid triggerAutoSave={triggerAutoSave} />
    </div>
  )
}
