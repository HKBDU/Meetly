import { useEffect } from "react"

import { EmailPromptDialog } from "@/features/participants/components/EmailPromptDialog"
import { OverviewMockup } from "@/features/participants/components/OverviewMockup"
import { ParticipantAuthForm } from "@/features/participants/components/ParticipantAuthForm"
import { PersonalScheduleView } from "@/features/participants/components/PersonalScheduleView"
import { useParticipantSignalR } from "@/features/participants/hooks/useParticipantSignalR"
import { fetchEventScheduleConfig } from "@/features/participants/services"
import { useParticipantStore } from "@/features/participants/store"

/**
 * Container chính của feature Participants.
 * Điều phối 3 màn hình (Auth -> Overview -> Personal) hoàn toàn dựa vào
 * `currentView` trong store - không dùng router riêng cho luồng này.
 */
export function ParticipantPage() {
  const currentView = useParticipantStore((s) => s.currentView)
  const auth = useParticipantStore((s) => s.auth)
  const scheduleConfig = useParticipantStore((s) => s.scheduleConfig)
  const dateMode = useParticipantStore((s) => s.dateMode)
  const setScheduleConfig = useParticipantStore((s) => s.setScheduleConfig)
  const { simulateEventFinalized } = useParticipantSignalR()

  // Phiên cũ khôi phục từ localStorage (F5, mở lại tab) chỉ giữ `auth` +
  // `dateMode`, KHÔNG giữ `scheduleConfig` (xem comment ở store.ts vì sao) -
  // nên mỗi khi có `auth` mà chưa có `scheduleConfig`, tải lại nó ngay để
  // luôn hiển thị đúng cấu hình lịch MỚI NHẤT của event, không dùng bản cache
  // cũ có thể đã lỗi thời.
  useEffect(() => {
    if (auth && !scheduleConfig) {
      fetchEventScheduleConfig(dateMode ?? undefined).then(setScheduleConfig)
    }
  }, [auth, scheduleConfig, dateMode, setScheduleConfig])

  return (
    <>
      {currentView === "AUTH" && <ParticipantAuthForm />}

      {currentView === "OVERVIEW" && (
        <OverviewMockup onSimulateFinalize={simulateEventFinalized} />
      )}

      {currentView === "PERSONAL" && <PersonalScheduleView />}

      {/* Điều khiển hoàn toàn bởi store (isEmailDialogOpen) nên mount cố định ở đây */}
      <EmailPromptDialog />
    </>
  )
}
