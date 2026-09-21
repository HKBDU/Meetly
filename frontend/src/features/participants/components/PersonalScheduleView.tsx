import { useState } from "react"

import { EventInfoBar } from "@/features/participants/components/EventInfoBar"
import { PersonalScheduleGrid } from "@/features/participants/components/PersonalScheduleGrid"
import { ScheduleActionsBar } from "@/features/participants/components/ScheduleActionsBar"
import { useAutoSaveSchedule } from "@/features/participants/hooks/useAutoSaveSchedule"
import { useParticipantStore } from "@/features/participants/store"

/** Màn lịch cá nhân; gọi `useAutoSaveSchedule` 1 lần để mọi nơi sửa lịch dùng chung 1 debounce */
export function PersonalScheduleView() {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const { triggerAutoSave, isSaving } = useAutoSaveSchedule()
  const [manualSelection, setManualSelection] = useState<{ date: string; requestId: number } | null>(
    null
  )

  function revealManualSelection(date: string) {
    setManualSelection((current) => ({ date, requestId: (current?.requestId ?? 0) + 1 }))
  }

  return (
    <div className="flex flex-col">
      {config && <EventInfoBar config={config} />}
      <ScheduleActionsBar
        triggerAutoSave={triggerAutoSave}
        isSaving={isSaving}
        onManualRangeApplied={revealManualSelection}
      />
      <PersonalScheduleGrid
        triggerAutoSave={triggerAutoSave}
        manualSelection={manualSelection}
      />
    </div>
  )
}
