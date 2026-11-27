import { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { formatHourLabel, timeToMinutes } from '@/lib/date-time'
import { SLOT_MINUTES } from '@/shared/constants'
import { ColumnPager } from '@/shared/components/ColumnPager'
import { useT } from '@/shared/i18n'
import { TimeViewLabel } from './EventTimeView'
import { useTimeView } from './time-view'
import { formatUtcOffset, type ViewerCell } from './viewer-grid'
import { rowBoundaryClass } from './rowBoundary'
import {
  DESKTOP_COLUMNS_PER_PAGE,
  MOBILE_COLUMNS_PER_PAGE,
  columnDetail,
  columnLabel,
  columnShortLabel,
  getColumnPage,
  getPageCount,
  type TimeColumn,
  type TimeRow,
} from '@/shared/grid/model'

const TIME_COLUMN_WIDTH = 56
const MIN_DAY_COLUMN_WIDTH = 72
const MOBILE_MAX_WIDTH = 767
/** Khi chỉ có 1-3 cột trên màn rộng, giới hạn bề rộng để ô không bị kéo quá dài */
const COMPACT_MAX_COLUMNS = 3
const COMPACT_MAX_WIDTH = 1052

/** Số cột hiển thị mỗi trang theo bề rộng thật của lưới (không render 2 bảng mobile/desktop) */
function usePageSize(columnCount: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState<number | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    // Bỏ qua lần đo 0px (lưới đang bị ẩn/khung nhìn đang co tạm), nếu không số cột rơi về 1
    const update = () => {
      if (container.clientWidth > 0) setWidth(container.clientWidth)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Chưa đo được (SSR, lần render đầu): dùng cỡ desktop
  if (width === null) return { containerRef, pageSize: DESKTOP_COLUMNS_PER_PAGE, isMobile: false, columnCount }
  const isMobile = width <= MOBILE_MAX_WIDTH
  const maxPerPage = isMobile ? MOBILE_COLUMNS_PER_PAGE : DESKTOP_COLUMNS_PER_PAGE
  const fits = Math.floor((width - TIME_COLUMN_WIDTH) / MIN_DAY_COLUMN_WIDTH)
  return { containerRef, pageSize: Math.max(1, Math.min(maxPerPage, fits)), isMobile, columnCount }
}

interface TimeGridProps {
  columns: readonly TimeColumn[]
  rows: readonly TimeRow[]
  /** Phải trả về một `<td>` cho ô (cột, hàng) */
  renderCell: (column: TimeColumn, row: TimeRow, rowIndex: number, viewerCell?: ViewerCell) => ReactNode
  caption: string
  pagerLabel: string
  /** Đổi `requestId` để nhảy tới trang chứa cột `key` (VD sau khi chọn khoảng thủ công) */
  revealColumn?: { key: string; requestId: number; startTime?: string } | null
  hideStaticZone?: boolean
  className?: string
}

/**
 * Bảng thời gian dùng chung cho heatmap nhóm và lưới cá nhân: cột giờ cố định bên trái,
 * cột ngày phân trang theo bề rộng, mỗi hàng là 1 ô 15 phút.
 */
export function TimeGrid({ columns, rows, renderCell, caption, pagerLabel, revealColumn, hideStaticZone, className }: TimeGridProps) {
  const t = useT()
  const view = useTimeView()
  const projected = view?.projected
  const displayColumns = projected?.columns ?? columns
  const displayRows = projected?.rows ?? rows.map(({ startTime }) => ({ key: startTime, startTime, offsetMinutes: undefined }))
  const { containerRef, pageSize, isMobile } = usePageSize(displayColumns.length)
  const [page, setPage] = useState(0)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  const pageCount = getPageCount(displayColumns.length, pageSize)

  // Chỉnh state ngay trong render để lần vẽ kế tiếp đã ở đúng trang (không nháy trang cũ)
  const targetKey = revealColumn && projected
    ? projected.firstBySource.get(`${revealColumn.key}|${revealColumn.startTime}`)?.columnKey
      ?? projected.firstBySource.get(revealColumn.key)?.columnKey
      ?? revealColumn.key
    : revealColumn?.key
  const revealKey = revealColumn ? `${revealColumn.requestId}:${targetKey}:${pageSize}` : null
  if (revealColumn && revealKey !== revealedKey) {
    setRevealedKey(revealKey)
    const index = displayColumns.findIndex((column) => column.key === targetKey)
    if (index >= 0) setPage(Math.floor(index / pageSize))
  }

  const currentPage = Math.min(page, pageCount - 1)
  const visibleColumns = getColumnPage(displayColumns, currentPage, pageSize)
  const compact = !isMobile && displayColumns.length <= COMPACT_MAX_COLUMNS

  return (
    <div ref={containerRef} className={cn('min-w-0', className)}>
      <TimeViewLabel hideStaticZone={hideStaticZone} />
      <ColumnPager page={currentPage} pageCount={pageCount} onPageChange={setPage} label={pagerLabel} />
      <div
        className="mx-auto w-full overflow-hidden border border-grid-line bg-card"
        style={compact ? { maxWidth: COMPACT_MAX_WIDTH } : undefined}
      >
        <table className="w-full table-fixed border-collapse select-none">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th
                scope="col"
                style={{ width: TIME_COLUMN_WIDTH }}
                className="border-r border-b border-border p-1 text-xs font-medium text-muted-foreground"
              >
                {t('grid.time')}
              </th>
              {visibleColumns.map((column) => (
                <th
                  scope="col"
                  key={column.key}
                  title={`${columnLabel(column)} ${columnDetail(column)}`}
                  className="border-r border-b border-border px-1 py-2 text-xs font-semibold last:border-r-0 sm:py-3 sm:text-sm"
                >
                  <span className="sm:hidden">{columnShortLabel(column)}</span>
                  <span className="hidden sm:inline">{columnLabel(column)}</span>
                  <span className="mt-1 block truncate text-[10px] font-normal text-muted-foreground sm:text-xs">
                    {columnDetail(column)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr key={row.key}>
                <TimeLabel
                  startTime={row.startTime}
                  offsetMinutes={row.offsetMinutes}
                  show={Boolean(projected && (rowIndex === 0 || row.offsetMinutes !== undefined ||
                    timeToMinutes(row.startTime) - timeToMinutes(displayRows[rowIndex - 1].startTime) !== SLOT_MINUTES))}
                />
                {visibleColumns.map((column) => {
                  if (!projected) return renderCell(column, rows[rowIndex], rowIndex)
                  const cell = projected.cells.get(`${column.key}|${row.key}`)
                  return cell
                    ? renderCell(cell.source.column, cell.source.row, cell.source.rowIndex, cell)
                    : <td key={column.key} className={cn('h-5 border-r border-grid-line/60 bg-muted/50', rowBoundaryClass(row.startTime))} />
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TimeLabel = memo(function TimeLabel({ startTime, offsetMinutes, show }: { startTime: string; offsetMinutes?: number; show: boolean }) {
  useT() // vẽ lại nhãn giờ khi đổi ngôn ngữ (memo chặn render từ cha)
  const isHour = startTime.endsWith(':00')
  return (
    <th
      scope="row"
      aria-label={offsetMinutes === undefined ? startTime : `${startTime} ${formatUtcOffset(offsetMinutes)}`}
      className={cn(
        'border-r border-border bg-card px-1 text-left text-xs font-medium text-muted-foreground sm:px-2',
        isHour ? 'border-t border-t-grid-line pt-1 align-top' : 'border-t border-t-transparent',
      )}
    >
      {isHour || show ? (isHour ? formatHourLabel(startTime) : startTime) : null}
      {offsetMinutes !== undefined && <span className="block text-[9px]">{formatUtcOffset(offsetMinutes)}</span>}
    </th>
  )
})
