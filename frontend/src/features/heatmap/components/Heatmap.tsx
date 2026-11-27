import { useMemo } from 'react'

import { timeToMinutes } from '@/lib/date-time'
import { EventStatus, SLOT_MINUTES } from '@/shared/constants'
import { buildRows, columnKey, getColumns, type TimeColumn, type TimeRow } from '@/shared/grid/model'
import { TimeGrid } from '@/shared/grid/TimeGrid'
import { useTimeView } from '@/shared/grid/time-view'
import type { ViewerCell, ViewerGrid } from '@/shared/grid/viewer-grid'
import { useLocale, useT } from '@/shared/i18n'
import type { EventDetail, FinalSchedule } from '@/shared/types'
import { AVAILABILITY_LEVELS } from '../constants'
import { getAvailabilityLevelClass } from '../availability'
import { rankedKey, type RankedTime } from '../suggestions'
import type { SelectedCell } from '../types'
import { HeatmapCell, type HeatmapCellHandlers, type RangeEdge } from './HeatmapCell'

export interface HeatmapProps {
  event: EventDetail
  /** Các khung gợi ý đã xếp hạng (vẽ viền nét đứt kèm số thứ hạng) */
  bestTimes: RankedTime[]
  /** Khung đang được hover/chạm trong danh sách Best times */
  highlightedKey: string | null
  /** Đổi `requestId` để lật lưới tới trang chứa khung đang chọn */
  reveal?: { key: string; requestId: number; startTime?: string } | null
  inspected?: SelectedCell
  selected: FinalSchedule | null
  selecting: boolean
  /** Phải là tham chiếu ổn định (xem `HeatmapWorkspace`) để `HeatmapCell` memo được */
  handlers: HeatmapCellHandlers
}

const EMPTY: string[] = []

/** Ô `row` nằm ở đâu trong khoảng `range` của cùng cột */
function edgeOf(range: FinalSchedule | null | undefined, column: TimeColumn, row: TimeRow): RangeEdge {
  if (
    !range ||
    range.specificDate !== column.specificDate ||
    range.dayOfWeek !== column.dayOfWeek ||
    range.startTime > row.startTime ||
    range.endTime < row.endTime
  )
    return null
  const top = range.startTime === row.startTime
  const bottom = range.endTime === row.endTime
  return top && bottom ? 'single' : top ? 'top' : bottom ? 'bottom' : 'middle'
}

/** Split visual borders at midnight and at any empty or reordered rows in the viewer's grid. */
function displayEdge(range: FinalSchedule | null, cell: ViewerCell, grid: ViewerGrid): RangeEdge {
  if (!edgeOf(range, cell.source.column, cell.source.row)) return null
  const index = grid.rowIndexByKey.get(cell.rowKey)!
  const belongs = (rowIndex: number) => {
    const adjacent = grid.cells.get(`${cell.columnKey}|${grid.rows[rowIndex]?.key}`)
    return adjacent && edgeOf(range, adjacent.source.column, adjacent.source.row)
  }
  const top = !belongs(index - 1)
  const bottom = !belongs(index + 1)
  return top && bottom ? 'single' : top ? 'top' : bottom ? 'bottom' : 'middle'
}

export function Heatmap({ event, bestTimes, highlightedKey, reveal, inspected, selected, selecting, handlers }: HeatmapProps) {
  const t = useT()
  const { locale } = useLocale()
  const view = useTimeView()
  const projected = view?.projected
  // Chỉ tính lại khi cấu hình lưới đổi, không phải mỗi lần realtime đổi dữ liệu ô
  const structure = [
    event.eventType,
    event.availableDates.join(','),
    event.availableWeekdays.join(','),
    event.dailyStartTime,
    event.dailyEndTime,
  ].join('|')
  const { columns, rows, points } = useMemo(() => {
    const columns = getColumns(event)
    const rows = buildRows(event.dailyStartTime, event.dailyEndTime)
    // Tạo sẵn `point` cố định cho từng ô để `HeatmapCell` nhận cùng tham chiếu qua các lần render
    const points = new Map<string, SelectedCell>()
    for (const column of columns) for (const row of rows) points.set(`${column.key}|${row.startTime}`, { column, row })
    return { columns, rows, points }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `structure` gom đủ các trường cấu hình
  }, [structure])

  // Tra tên người rảnh của từng ô O(1) thay vì `find` trên cả lưới cho mỗi ô
  const namesByCell = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const cell of event.heatmapGrid) map.set(`${columnKey(cell)}|${cell.startTime.slice(0, 5)}`, cell.participants)
    return map
  }, [event.heatmapGrid])

  const finalSchedule = event.status === EventStatus.Finalized ? event.finalSchedule : null
  const finalizedCellCount = finalSchedule
    ? Math.max(1, Math.ceil((timeToMinutes(finalSchedule.endTime) - timeToMinutes(finalSchedule.startTime)) / SLOT_MINUTES))
    : 0
  const finalizedTime = finalSchedule && view ? view.formatRange(finalSchedule).time : undefined
  const total = event.participants.length

  if (columns.length === 0)
    return <p className="rounded-xl bg-muted p-6 text-muted-foreground">{t('heatmap.noDates')}</p>
  if (rows.length === 0)
    return <p className="rounded-xl bg-muted p-6 text-muted-foreground">{t('heatmap.noSlots')}</p>

  return (
    <section className="min-w-0" aria-labelledby="heatmap-heading">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="heatmap-heading" className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {t('heatmap.title')}
        </h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground" aria-label={t('heatmap.scale')}>
          <span className="mr-1">{t('heatmap.less')}</span>
          {AVAILABILITY_LEVELS.map((level) => (
            <span key={level} className={`h-4 w-4 rounded-sm border border-border ${getAvailabilityLevelClass(level)}`} />
          ))}
          <span className="ml-1">{t('heatmap.more')}</span>
        </div>
      </div>
      {total === 0 && <p className="mb-3 text-sm text-muted-foreground">{t('heatmap.noParticipants')}</p>}
      <TimeGrid
        hideStaticZone
        columns={columns}
        rows={rows}
        caption={t('heatmap.caption')}
        pagerLabel={t('heatmap.pager')}
        revealColumn={reveal}
        renderCell={(column, row, _rowIndex, viewerCell) => {
          const key = `${column.key}|${row.startTime}`
          const edge = (range: FinalSchedule | null) =>
            viewerCell && projected ? displayEdge(range, viewerCell, projected) : edgeOf(range, column, row)
          const finalized = edge(finalSchedule)
          let suggestion: RangeEdge = null
          let suggestionRank: number | undefined
          let suggestionHighlighted = false
          for (let index = 0; index < bestTimes.length && suggestion === null; index++) {
            suggestion = edge(bestTimes[index])
            if (suggestion) {
              suggestionRank = index + 1
              suggestionHighlighted = rankedKey(bestTimes[index]) === highlightedKey
            }
          }
          return (
            <HeatmapCell
              key={viewerCell?.columnKey ?? column.key}
              point={points.get(key)!}
              viewerCell={viewerCell}
              inspected={inspected?.column.key === column.key && inspected.row.startTime === row.startTime}
              names={namesByCell.get(key) ?? EMPTY}
              total={total}
              selecting={selecting}
              selection={edge(selected)}
              suggestion={suggestion}
              suggestionRank={suggestionRank}
              suggestionHighlighted={suggestionHighlighted}
              finalized={finalized}
              finalizedEvent={finalized ? event : undefined}
              finalizedCellCount={viewerCell ? 1 : finalizedCellCount}
              finalizedTime={finalizedTime}
              handlers={handlers}
              locale={locale}
            />
          )
        }}
      />
    </section>
  )
}
