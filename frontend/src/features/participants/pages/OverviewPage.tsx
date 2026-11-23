import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'

import { HeatmapPage } from '@/features/heatmap'
import { finalizeEvent, updateEvent } from '@/shared/api/events'
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
      onFinalize={async (slot) => {
        const result = await finalizeEvent(shortCode, slot)
        patchEventCache(queryClient, shortCode, (current) =>
          result.revision >= current.revision ? { ...current, ...result } : current,
        )
        return result
      }}
    />
  )
}
