import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { EventStatus } from '@/shared/constants'
import { t } from '@/shared/i18n'
import type { EditableEvent } from '@/shared/types'
import { EventHeader } from '../components/EventHeader'
import { FinalizedScheduleSummary } from '../components/FinalizedScheduleSummary'
import { GettingStartedBanner } from '../components/GettingStartedBanner'
import { HeatmapWorkspace } from '../components/HeatmapWorkspace'
import { DEFAULT_MEETING_DURATION } from '../constants'
import { rankBestTimes } from '../suggestions'
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
  onInvite,
  currentUsername,
}: HeatmapPageProps) {
  const [duration, setDuration] = useState<number>(DEFAULT_MEETING_DURATION)
  const [mustInclude, setMustInclude] = useState<string[]>([])
  const [pending, setPending] = useState<HeatmapPendingAction | null>(null)
  const busy = useRef(false)

  const canEdit = isAdmin && event.status === EventStatus.Open
  // Tính ngay trên lưới đang có: lưới đổi (realtime) là gợi ý đổi theo, không cần gọi BE.
  // Admin thấy cả bảng xếp hạng; người tham gia chỉ thấy khung tốt nhất được khoanh trên lưới.
  const isOpen = event.status === EventStatus.Open
  const bestTimes = useMemo(
    () =>
      canEdit
        ? rankBestTimes(event, { duration, mustInclude })
        : isOpen
          ? rankBestTimes(event, { duration: DEFAULT_MEETING_DURATION, limit: 1 })
          : [],
    [canEdit, isOpen, event, duration, mustInclude],
  )

  async function updateEventDetails(payload: EditableEvent) {
    if (!canEdit || !onUpdateEvent || busy.current) throw new Error(t('edit.unavailable'))
    busy.current = true
    setPending(HeatmapPendingAction.Update)
    try {
      await onUpdateEvent(payload)
      toast.success(t('edit.success'))
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
  ].join(':')

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8">
      <EventHeader
        event={event}
        canEdit={canEdit}
        disabled={pending !== null}
        canUpdate={Boolean(onUpdateEvent)}
        onOpenMySchedule={onOpenMySchedule}
        onInvite={onInvite}
        onUpdateEvent={updateEventDetails}
        currentUsername={currentUsername}
      />

      {event.status === EventStatus.Open && (
        <GettingStartedBanner
          event={event}
          currentUsername={currentUsername}
          onInvite={onInvite}
          onOpenMySchedule={onOpenMySchedule}
        />
      )}

      <FinalizedScheduleSummary event={event} />

      <HeatmapWorkspace
        key={workspaceKey}
        event={event}
        canEdit={canEdit}
        bestTimes={bestTimes}
        duration={duration}
        mustInclude={mustInclude}
        onDurationChange={setDuration}
        onMustIncludeChange={setMustInclude}
        pending={pending}
        onFinalize={onFinalize}
        onPendingChange={setPending}
      />
    </div>
  )
}
