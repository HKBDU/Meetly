import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { EventStatus } from '@/shared/constants'
import type { EditableEvent } from '@/shared/types'
import { AdminSuggestionControls } from '../components/AdminSuggestionControls'
import { EventHeader } from '../components/EventHeader'
import { HeatmapWorkspace } from '../components/HeatmapWorkspace'
import { DEFAULT_MEETING_DURATION } from '../constants'
import { findBestSlots, getSuggestionParams } from '../suggestions'
import { HeatmapPendingAction, type HeatmapPageProps } from '../types'

/**
 * Overview của event: header, bộ lọc gợi ý (admin) và heatmap. Nhận `event` đang sống từ
 * `useEventQuery` (realtime cập nhật thẳng vào cache), nên không giữ bản sao event trong state.
 */
export function HeatmapPage({
  event,
  isAdmin = false,
  onFinalize,
  onUpdateEvent,
  onOpenMySchedule,
}: HeatmapPageProps) {
  const [duration, setDuration] = useState<number | undefined>(DEFAULT_MEETING_DURATION)
  const [keyParticipant, setKeyParticipant] = useState<string | null>(null)
  const [pending, setPending] = useState<HeatmapPendingAction | null>(null)
  const busy = useRef(false)

  const canEdit = isAdmin && event.status === EventStatus.Open
  const params = getSuggestionParams(duration, keyParticipant)

  // Tính ngay trên lưới đang có: lưới đổi (realtime) là gợi ý đổi theo, không cần gọi BE
  const suggestions = useMemo(
    () => (canEdit && params ? findBestSlots(event, params) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params dựng lại từ duration/keyParticipant
    [canEdit, event, duration, keyParticipant],
  )

  async function updateEventDetails(payload: EditableEvent) {
    if (!canEdit || !onUpdateEvent || busy.current) throw new Error('Event editing is not available.')
    busy.current = true
    setPending(HeatmapPendingAction.Update)
    try {
      await onUpdateEvent(payload)
      toast.success('Event updated successfully.')
    } finally {
      busy.current = false
      setPending(null)
    }
  }

  // Đổi cấu hình lưới thì bỏ vùng đang chọn; revision đổi (có người lưu lịch) thì giữ nguyên
  const workspaceKey = [
    event.eventType,
    event.availableDates.join(','),
    event.availableWeekdays.join(','),
    event.dailyStartTime,
    event.dailyEndTime,
    event.status,
  ].join(':')

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8">
      <EventHeader
        event={event}
        canEdit={canEdit}
        duration={duration}
        disabled={pending !== null}
        canUpdate={Boolean(onUpdateEvent)}
        onOpenMySchedule={onOpenMySchedule}
        onDurationChange={setDuration}
        onUpdateEvent={updateEventDetails}
      />

      {canEdit && (
        <AdminSuggestionControls
          participants={event.participants}
          keyParticipant={keyParticipant}
          disabled={pending !== null}
          hasFilters={params !== null}
          suggestionCount={suggestions.length}
          onKeyParticipantChange={setKeyParticipant}
        />
      )}

      <HeatmapWorkspace
        key={workspaceKey}
        event={event}
        canEdit={canEdit}
        suggestions={suggestions}
        keyParticipant={keyParticipant}
        pending={pending}
        onFinalize={onFinalize}
        onPendingChange={setPending}
      />
    </div>
  )
}
