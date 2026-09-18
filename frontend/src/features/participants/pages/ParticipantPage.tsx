import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"

import { EmailPromptDialog } from "@/features/participants/components/EmailPromptDialog"
import { OverviewView } from "@/features/participants/components/OverviewView"
import { ParticipantAuthForm } from "@/features/participants/components/ParticipantAuthForm"
import { PersonalScheduleView } from "@/features/participants/components/PersonalScheduleView"
import { useParticipantSignalR } from "@/features/participants/hooks/useParticipantSignalR"
import { fetchEventScheduleConfig } from "@/features/participants/services"
import { useParticipantStore } from "@/features/participants/store"

/** Điều phối 3 màn Auth -> Overview -> Personal theo `currentView` trong store */
export function ParticipantPage() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const currentView = useParticipantStore((s) => s.currentView)
  const auth = useParticipantStore((s) => s.auth)
  const scheduleConfig = useParticipantStore((s) => s.scheduleConfig)
  const setScheduleConfig = useParticipantStore((s) => s.setScheduleConfig)
  useParticipantSignalR(shortCode ?? "")

  // `scheduleConfig` không được persist, nên phiên khôi phục phải tải lại
  useEffect(() => {
    if (shortCode && auth && !scheduleConfig) {
      fetchEventScheduleConfig(shortCode)
        .then(setScheduleConfig)
        .catch(() => toast.error("Couldn't load the schedule, please try again"))
    }
  }, [shortCode, auth, scheduleConfig, setScheduleConfig])

  if (!shortCode) return null

  return (
    <>
      {currentView === "AUTH" && <ParticipantAuthForm shortCode={shortCode} />}
      {currentView === "OVERVIEW" && <OverviewView />}
      {currentView === "PERSONAL" && <PersonalScheduleView />}
      <EmailPromptDialog />
    </>
  )
}
