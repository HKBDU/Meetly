import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { getMyParticipant } from '@/shared/api/events'
import { BusyImportDraftBar } from '@/features/participants/components/BusyImportDraftBar'
import { EventInfoBar } from '@/features/participants/components/EventInfoBar'
import { PersonalScheduleGrid } from '@/features/participants/components/PersonalScheduleGrid'
import { ScheduleActionsBar } from '@/features/participants/components/ScheduleActionsBar'
import { googleCalendarTokenProvider } from '@/features/participants/googleFreeBusy'
import { expandRangesToSlotIds } from '@/features/participants/gridUtils'
import { useAutoSaveSchedule } from '@/features/participants/hooks/useAutoSaveSchedule'
import { useGoogleBusyImport } from '@/features/participants/hooks/useGoogleBusyImport'
import { useScheduleGrid } from '@/features/participants/hooks/useScheduleGrid'
import { useParticipantStore } from '@/features/participants/store'
import { PageLoader } from '@/shared/components/MeetlyLoader'
import { useT } from '@/shared/i18n'
import { useEventOutlet } from './eventOutlet'

/** Màn lịch cá nhân `/e/:shortCode/me` */
export function MySchedulePage() {
  const t = useT()
  const { shortCode, event } = useEventOutlet()
  const grid = useScheduleGrid(event)
  const loadedSlotsFor = useParticipantStore((s) => s.loadedSlotsFor)
  const loadSlots = useParticipantStore((s) => s.loadSlots)
  const { triggerAutoSave, isSaving } = useAutoSaveSchedule(shortCode, grid)
  const googleImport = useGoogleBusyImport({ event, grid, getAccessToken: googleCalendarTokenProvider })
  const [manualSelection, setManualSelection] = useState<{ columnKey: string; requestId: number } | null>(null)

  // Lịch đã lưu luôn lấy từ server (không tin bản trong máy), mỗi phiên chỉ nạp 1 lần
  const needsSlots = loadedSlotsFor !== shortCode
  const me = useQuery({
    queryKey: ['participant-me', shortCode],
    queryFn: () => getMyParticipant(shortCode),
    enabled: needsSlots,
    gcTime: 0,
  })

  useEffect(() => {
    if (needsSlots && me.data && grid) {
      loadSlots(shortCode, expandRangesToSlotIds(me.data.timeSlots, grid.columns, grid.times))
    }
  }, [needsSlots, me.data, grid, loadSlots, shortCode])

  if (!grid) return null

  return (
    <div className="flex flex-col">
      <EventInfoBar event={event} locked={grid.isLocked} />
      {needsSlots && me.error ? (
        <p role="alert" className="p-8 text-center text-sm text-muted-foreground">
          {me.error.message}
        </p>
      ) : needsSlots ? (
        <PageLoader label={t('schedule.loading')} className="min-h-[45dvh]" />
      ) : (
        <>
          <ScheduleActionsBar
            grid={grid}
            triggerAutoSave={triggerAutoSave}
            isSaving={isSaving}
            googleImport={googleImport}
            onManualRangeApplied={(columnKey) =>
              setManualSelection((current) => ({ columnKey, requestId: (current?.requestId ?? 0) + 1 }))
            }
          />
          <BusyImportDraftBar grid={grid} triggerAutoSave={triggerAutoSave} />
          <PersonalScheduleGrid grid={grid} triggerAutoSave={triggerAutoSave} manualSelection={manualSelection} />
        </>
      )}
    </div>
  )
}
