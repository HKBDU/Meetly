import { EventInfoBar } from "@/features/participants/components/EventInfoBar"
import { PersonalScheduleGrid } from "@/features/participants/components/PersonalScheduleGrid"
import { ScheduleActionsBar } from "@/features/participants/components/ScheduleActionsBar"
import { useAutoSaveSchedule } from "@/features/participants/hooks/useAutoSaveSchedule"
import { useParticipantStore } from "@/features/participants/store"

/**
 * Gộp toàn bộ màn "Lịch cá nhân": thông tin sự kiện (tên/ngày/link mời/nút
 * quay về Tổng quan - tất cả 1 hàng, xem EventInfoBar) + khung lịch (grid +
 * hàng điều khiển bên dưới) - theo đúng bố cục ảnh mẫu, chỉ 1 đường kẻ duy
 * nhất phân cách AppHeader với phần nội dung này. `h-full` (không phải
 * h-dvh) vì component cha (App) đã cấp đúng phần chiều cao còn lại sau
 * header/footer, xem App.tsx.
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
    <div className="flex h-full flex-col bg-background">
      {config && <EventInfoBar config={config} />}
      <PersonalScheduleGrid triggerAutoSave={triggerAutoSave} isSaving={isSaving} />
      <ScheduleActionsBar triggerAutoSave={triggerAutoSave} />
    </div>
  )
}
