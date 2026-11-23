import { memo, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { formatHourLabel } from '@/lib/date-time'
import { ColumnPager } from '@/shared/components/ColumnPager'
import {
  DESKTOP_COLUMNS_PER_PAGE,
  MOBILE_COLUMNS_PER_PAGE,
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
  renderCell: (column: TimeColumn, row: TimeRow, rowIndex: number) => ReactNode
  caption: string
  pagerLabel: string
  /** Đổi `requestId` để nhảy tới trang chứa cột `key` (VD sau khi chọn khoảng thủ công) */
  revealColumn?: { key: string; requestId: number } | null
  className?: string
}

/**
 * Bảng thời gian dùng chung cho heatmap nhóm và lưới cá nhân: cột giờ cố định bên trái,
 * cột ngày phân trang theo bề rộng, mỗi hàng là 1 ô 15 phút.
 */
export function TimeGrid({ columns, rows, renderCell, caption, pagerLabel, revealColumn, className }: TimeGridProps) {
  const { containerRef, pageSize, isMobile } = usePageSize(columns.length)
  const [page, setPage] = useState(0)
  const [revealedKey, setRevealedKey] = useState<string | null>(null)

  const pageCount = getPageCount(columns.length, pageSize)

  // Chỉnh state ngay trong render để lần vẽ kế tiếp đã ở đúng trang (không nháy trang cũ)
  const revealKey = revealColumn ? `${revealColumn.requestId}:${revealColumn.key}:${pageSize}` : null
  if (revealColumn && revealKey !== revealedKey) {
    setRevealedKey(revealKey)
    const index = columns.findIndex((column) => column.key === revealColumn.key)
    if (index >= 0) setPage(Math.floor(index / pageSize))
  }

  const currentPage = Math.min(page, pageCount - 1)
  const visibleColumns = getColumnPage(columns, currentPage, pageSize)
  const compact = !isMobile && columns.length <= COMPACT_MAX_COLUMNS

  return (
    <div ref={containerRef} className={cn('min-w-0', className)}>
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
                Time
              </th>
              {visibleColumns.map((column) => (
                <th
                  scope="col"
                  key={column.key}
                  title={`${column.label} ${column.detail}`}
                  className="border-r border-b border-border px-1 py-2 text-xs font-semibold last:border-r-0 sm:py-3 sm:text-sm"
                >
                  <span className="sm:hidden">{column.label.slice(0, 3)}</span>
                  <span className="hidden sm:inline">{column.label}</span>
                  <span className="mt-1 block truncate text-[10px] font-normal text-muted-foreground sm:text-xs">
                    {column.detail}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.startTime}>
                <TimeLabel startTime={row.startTime} />
                {visibleColumns.map((column) => renderCell(column, row, rowIndex))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TimeLabel = memo(function TimeLabel({ startTime }: { startTime: string }) {
  const isHour = startTime.endsWith(':00')
  return (
    <th
      scope="row"
      aria-label={startTime}
      className={cn(
        'border-r border-border bg-card px-1 text-left text-xs font-medium text-muted-foreground sm:px-2',
        isHour ? 'border-t border-t-grid-line pt-1 align-top' : 'border-t border-t-transparent',
      )}
    >
      {isHour ? formatHourLabel(startTime) : null}
    </th>
  )
})
