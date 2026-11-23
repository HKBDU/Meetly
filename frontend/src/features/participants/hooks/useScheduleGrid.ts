import { useMemo } from 'react'

import { EventStatus } from '@/shared/constants'
import { buildRows, getColumns, type TimeColumn, type TimeRow } from '@/shared/grid/model'
import type { EventDetail } from '@/shared/types'
import { getAllSlotIds } from '@/features/participants/gridUtils'

export interface ScheduleGrid {
  columns: TimeColumn[]
  rows: TimeRow[]
  /** Giờ bắt đầu của từng ô, VD ["09:15", "09:30", ...]; lấy đúng phút của event, không làm tròn giờ */
  times: string[]
  allSlotIds: string[]
  isLocked: boolean
}

/**
 * Cấu hình lưới cá nhân suy ra từ event trong cache, nên tự đổi theo khi admin sửa event.
 * Chỉ dựng lại khi cấu hình đổi, không phải mỗi lần người khác lưu lịch (heatmap đổi).
 */
export function useScheduleGrid(event: EventDetail): ScheduleGrid {
  const { eventType, availableDates, availableWeekdays, dailyStartTime, dailyEndTime, status } = event
  const datesKey = availableDates.join(',')
  const weekdaysKey = availableWeekdays.join(',')

  return useMemo(() => {
    const columns = getColumns({ eventType, availableDates, availableWeekdays })
    const rows = buildRows(dailyStartTime, dailyEndTime)
    const times = rows.map((row) => row.startTime)
    return {
      columns,
      rows,
      times,
      allSlotIds: getAllSlotIds(columns, times),
      isLocked: status !== EventStatus.Open,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- so sánh mảng theo nội dung qua datesKey/weekdaysKey
  }, [eventType, datesKey, weekdaysKey, dailyStartTime, dailyEndTime, status])
}
