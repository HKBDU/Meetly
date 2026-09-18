import { EventInfoBar } from "@/features/participants/components/EventInfoBar"
import { PersonalScheduleGrid } from "@/features/participants/components/PersonalScheduleGrid"
import { ScheduleActionsBar } from "@/features/participants/components/ScheduleActionsBar"
import { useAutoSaveSchedule } from "@/features/participants/hooks/useAutoSaveSchedule"
import { useParticipantStore } from "@/features/participants/store"

/** Màn lịch cá nhân; gọi `useAutoSaveSchedule` 1 lần để mọi nơi sửa lịch dùng chung 1 debounce */
export function PersonalScheduleView() {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const { triggerAutoSave, isSaving } = useAutoSaveSchedule()

  return (
    <div className="flex flex-col">
      {config && <EventInfoBar config={config} />}
      <ScheduleActionsBar triggerAutoSave={triggerAutoSave} isSaving={isSaving} />
      <PersonalScheduleGrid triggerAutoSave={triggerAutoSave} />
    </div>
  )
}
