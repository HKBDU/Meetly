import { useEffect } from "react"
import { useParams } from "react-router-dom"

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
 * `currentView` trong store; CHỈ có route param `shortCode` (`/e/:shortCode`,
 * xem `app/router.tsx`) là đến từ router thật - việc chuyển màn nội bộ vẫn
 * không cần route riêng.
 */
export function ParticipantPage() {
  // Router luôn khớp path `/e/:shortCode` mới render component này (xem
  // app/router.tsx) nên param này chắc chắn có mặt.
  const { shortCode } = useParams<{ shortCode: string }>()
  const currentView = useParticipantStore((s) => s.currentView)
  const auth = useParticipantStore((s) => s.auth)
  const scheduleConfig = useParticipantStore((s) => s.scheduleConfig)
  const setScheduleConfig = useParticipantStore((s) => s.setScheduleConfig)
  const { simulateEventFinalized } = useParticipantSignalR()

  // Phiên cũ khôi phục từ localStorage (F5, mở lại tab) chỉ giữ `auth`,
  // KHÔNG giữ `scheduleConfig` (xem comment ở store.ts vì sao) - nên mỗi khi
  // có `auth` mà chưa có `scheduleConfig`, tải lại nó ngay để luôn hiển thị
  // đúng cấu hình lịch MỚI NHẤT của event, không dùng bản cache cũ có thể đã lỗi thời.
  useEffect(() => {
    if (shortCode && auth && !scheduleConfig) {
      fetchEventScheduleConfig(shortCode).then(setScheduleConfig)
    }
  }, [shortCode, auth, scheduleConfig, setScheduleConfig])

  if (!shortCode) return null

  return (
    <>
      {currentView === "AUTH" && <ParticipantAuthForm shortCode={shortCode} />}

      {currentView === "OVERVIEW" && (
        <OverviewMockup onSimulateFinalize={simulateEventFinalized} />
      )}

      {currentView === "PERSONAL" && <PersonalScheduleView />}

      {/* Điều khiển hoàn toàn bởi store (isEmailDialogOpen) nên mount cố định ở đây */}
      <EmailPromptDialog />
    </>
  )
}
