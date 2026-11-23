import { useQuery, type QueryClient } from '@tanstack/react-query'

import { getEvent } from '@/shared/api/events'
import type { EventDetail } from '@/shared/types'

/** Một key duy nhất cho event; shortCode không phân biệt hoa thường */
export const eventQueryKey = (shortCode: string) => ['event', shortCode.toUpperCase()] as const

/**
 * Nguồn dữ liệu duy nhất của một event cho mọi màn (overview, lịch cá nhân).
 * Realtime ghi thẳng vào cache này qua `patchEventCache`, nên không cần poll.
 */
export function useEventQuery(shortCode: string, enabled = true) {
  return useQuery({
    queryKey: eventQueryKey(shortCode),
    queryFn: () => getEvent(shortCode),
    enabled: enabled && Boolean(shortCode),
    staleTime: 30_000,
  })
}

export function patchEventCache(
  queryClient: QueryClient,
  shortCode: string,
  update: (event: EventDetail) => EventDetail,
) {
  queryClient.setQueryData<EventDetail>(eventQueryKey(shortCode), (current) =>
    current ? update(current) : current,
  )
}
