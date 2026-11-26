import { useOutletContext } from 'react-router-dom'

import type { EventDetail } from '@/shared/types'
import type { ParticipantAuthInfo } from '@/features/participants/types'

/** Dữ liệu `EventLayout` truyền xuống các màn con qua `<Outlet context>` */
export interface EventOutletContext {
  shortCode: string
  auth: ParticipantAuthInfo
  event: EventDetail
}

export const useEventOutlet = () => useOutletContext<EventOutletContext>()
