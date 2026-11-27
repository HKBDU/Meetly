import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { HeatmapPage } from '@/features/heatmap'
import { trackEvent } from '@/lib/analytics'
import { finalizeEvent, updateEvent, updateMeetingUrl } from '@/shared/api/events'
import { patchEventCache } from '@/shared/hooks'
import { useEventOutlet } from './eventOutlet'

export function OverviewPage() {
  const { shortCode, auth, event } = useEventOutlet()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return (
    <HeatmapPage
      event={event}
      isAdmin={auth.isAdmin}
      currentUsername={auth.username}
      onOpenMySchedule={() => navigate('me')}
      onInvite={() => navigate('share')}
      onUpdateEvent={async (payload) => {
        await updateEvent(shortCode, payload)
        // Hiện ngay; lưới và revision mới sẽ tới qua realtime `EventUpdated`
        patchEventCache(queryClient, shortCode, (current) => ({ ...current, ...payload }))
      }}
      onUpdateMeetingUrl={async (meetingUrl) => {
        const result = await updateMeetingUrl(shortCode, meetingUrl)
        patchEventCache(queryClient, shortCode, (current) =>
          result.revision >= current.revision
            ? { ...current, meetingUrl: result.meetingUrl, revision: result.revision }
            : current,
        )
      }}
      onFinalize={async (slot) => {
        const result = await finalizeEvent(shortCode, slot)
        trackEvent('finalize_event', { participants: event.participants.length })
        patchEventCache(queryClient, shortCode, (current) =>
          result.revision >= current.revision
            ? { ...current, ...result, meetingUrl: result.meetingUrl ?? current.meetingUrl }
            : current,
        )
        return result
      }}
    />
  )
}
