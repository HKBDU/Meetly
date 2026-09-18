import { EventInfoBar } from "@/features/participants/components/EventInfoBar"
import { PersonalScheduleGrid } from "@/features/participants/components/PersonalScheduleGrid"
import { ScheduleActionsBar } from "@/features/participants/components/ScheduleActionsBar"
import { useAutoSaveSchedule } from "@/features/participants/hooks/useAutoSaveSchedule"
import { useParticipantStore } from "@/features/participants/store"

/**
 * Màn lịch cá nhân, cùng container và bố cục hai cột với heatmap tổng; gọi
 * `useAutoSaveSchedule` 1 lần để mọi nơi sửa lịch dùng chung 1 debounce.
 */
export function PersonalScheduleView() {
  const config = useParticipantStore((s) => s.scheduleConfig)
  const { triggerAutoSave, isSaving } = useAutoSaveSchedule()

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-8">
      {config && <EventInfoBar config={config} />}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <PersonalScheduleGrid triggerAutoSave={triggerAutoSave} />
        <ScheduleActionsBar triggerAutoSave={triggerAutoSave} isSaving={isSaving} />
      </div>
    </div>
  )
}
