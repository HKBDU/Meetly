import { useMemo } from 'react'

import { timeSteps } from '@/lib/date-time'
import { EventStatus, SLOT_MINUTES } from '@/shared/constants'
import { getColumns, type TimeColumn } from '@/shared/grid/model'
import type { EventDetail } from '@/shared/types'
import { getAllSlotIds } from '@/features/participants/gridUtils'

export interface ScheduleGrid {
  columns: TimeColumn[]
  /** Giờ bắt đầu của từng ô, VD ["09:15", "09:30", ...]; lấy đúng phút của event, không làm tròn giờ */
  times: string[]
  allSlotIds: string[]
  isLocked: boolean
}

/** Cấu hình lưới cá nhân suy ra từ event trong cache, nên tự đổi theo khi admin sửa event */
export function useScheduleGrid(event: EventDetail | undefined): ScheduleGrid | null {
  return useMemo(() => {
    if (!event) return null
    const columns = getColumns(event)
    const times = timeSteps(event.dailyStartTime, event.dailyEndTime, SLOT_MINUTES)
    return {
      columns,
      times,
      allSlotIds: getAllSlotIds(columns, times),
      isLocked: event.status !== EventStatus.Open,
    }
  }, [event])
}
