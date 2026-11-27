import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { t } from '@/shared/i18n'
import { useEventHubConnection } from '@/shared/hooks/useEventHubConnection'
import { eventQueryKey, patchEventCache } from '@/shared/hooks/useEventQuery'
import { diffActivity, useEventActivity } from '@/shared/lib/eventActivity'
import type {
  DayOfWeek,
  EventDetail,
  EventType,
  FinalSchedule,
  HeatmapCellData,
  Participant,
} from '@/shared/types'

interface RealtimePayload {
  shortCode: string
  revision: number
}

export interface HeatmapUpdatedPayload extends RealtimePayload {
  heatmapGrid: HeatmapCellData[]
  /** Có khi BE gộp broadcast; đổi khi có người mới tham gia */
  participants?: Participant[]
}

export interface EventUpdatedPayload extends RealtimePayload {
  title: string
  eventType: EventType
  availableDates: string[]
  availableWeekdays: DayOfWeek[]
  dailyStartTime: string
  dailyEndTime: string
  heatmapGrid?: HeatmapCellData[]
}

export interface EventFinalizedPayload extends RealtimePayload {
  status: 2
  finalSchedule: FinalSchedule
  meetingUrl: string | null
}

export interface MeetingUrlUpdatedPayload extends RealtimePayload {
  meetingUrl: string | null
}

/** Chỉ nhận payload của đúng event và mới hơn bản đang có (bỏ bản đến trễ/đến lặp) */
export function shouldApplyRealtimePayload(
  currentRevision: number,
  shortCode: string,
  payload: RealtimePayload,
): boolean {
  return (
    payload.shortCode.toUpperCase() === shortCode.toUpperCase() &&
    Number.isFinite(payload.revision) &&
    payload.revision > currentRevision
  )
}

/**
 * Lắng nghe SignalR của event và ghi thẳng vào cache `useEventQuery`, nên mọi
 * màn đang mở (overview, lịch cá nhân) cùng thấy dữ liệu mới. Gọi 1 lần ở layout của event.
 */
export function useEventRealtime(shortCode: string, accessToken: string | undefined) {
  const queryClient = useQueryClient()
  const connection = useEventHubConnection(shortCode, accessToken)

  useEffect(() => {
    if (!connection) return

    function apply(payload: RealtimePayload, update: (event: EventDetail) => EventDetail) {
      const current = queryClient.getQueryData<EventDetail>(eventQueryKey(shortCode))
      if (!current || !shouldApplyRealtimePayload(current.revision, shortCode, payload)) return false
      patchEventCache(queryClient, shortCode, (event) => ({ ...update(event), revision: payload.revision }))
      // Một payload khác có thể đến trước MeetingUrlUpdated; GET khôi phục các trường đã lỡ.
      if (payload.revision > current.revision + 1) {
        void queryClient.invalidateQueries({ queryKey: eventQueryKey(shortCode) })
      }
      return true
    }

    const onHeatmapUpdated = (payload: HeatmapUpdatedPayload) => {
      // Chụp lưới trước khi ghi đè để biết ai vừa đổi lịch (hiện "Minh vừa cập nhật" trên trang)
      const before = queryClient.getQueryData<EventDetail>(eventQueryKey(shortCode))
      const applied = apply(payload, (event) => ({
        ...event,
        heatmapGrid: payload.heatmapGrid,
        participants: payload.participants ?? event.participants,
      }))
      if (applied && before) {
        const activity = diffActivity(before, payload)
        if (activity.length > 0) useEventActivity.getState().push(shortCode, activity)
      }
    }

    const onEventUpdated = (payload: EventUpdatedPayload) => {
      const applied = apply(payload, (event) => ({
        ...event,
        title: payload.title,
        eventType: payload.eventType,
        availableDates: payload.availableDates,
        availableWeekdays: payload.availableWeekdays,
        dailyStartTime: payload.dailyStartTime,
        dailyEndTime: payload.dailyEndTime,
        heatmapGrid: payload.heatmapGrid ?? event.heatmapGrid,
      }))
      // Payload cũ không kèm lưới: tải lại để lưới khớp khung giờ mới
      if (applied && !payload.heatmapGrid) {
        void queryClient.invalidateQueries({ queryKey: eventQueryKey(shortCode) })
      }
    }

    const onEventFinalized = (payload: EventFinalizedPayload) => {
      const applied = apply(payload, (event) => ({
        ...event,
        status: payload.status,
        finalSchedule: payload.finalSchedule,
        meetingUrl: payload.meetingUrl === undefined ? event.meetingUrl : payload.meetingUrl,
      }))
      if (applied) {
        toast.info(t('realtime.finalized'), {
          description: t('realtime.finalizedDesc'),
          duration: 6000,
        })
      }
    }

    const onMeetingUrlUpdated = (payload: MeetingUrlUpdatedPayload) => {
      apply(payload, (event) => ({ ...event, meetingUrl: payload.meetingUrl }))
    }

    connection.on('HeatmapUpdated', onHeatmapUpdated)
    connection.on('EventUpdated', onEventUpdated)
    connection.on('EventFinalized', onEventFinalized)
    connection.on('MeetingUrlUpdated', onMeetingUrlUpdated)
    return () => {
      connection.off('HeatmapUpdated', onHeatmapUpdated)
      connection.off('EventUpdated', onEventUpdated)
      connection.off('EventFinalized', onEventFinalized)
      connection.off('MeetingUrlUpdated', onMeetingUrlUpdated)
    }
  }, [connection, queryClient, shortCode])
}
