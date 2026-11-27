import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { formatDate } from '@/lib/date-time'
import { columnKey, formatDay } from '@/shared/grid/model'
import { useTimeView } from '@/shared/grid/time-view'
import { formatUtcOffset } from '@/shared/grid/viewer-grid'
import { t } from '@/shared/i18n'
import type { FinalSchedule } from '@/shared/types'
import { isValidSchedule, normalizeSelection } from '../selection'
import {
  HeatmapPendingAction,
  HeatmapSelectionMode,
  type HeatmapWorkspaceProps,
  type SelectedCell,
} from '../types'
import { rankedKey, type RankedTime } from '../suggestions'
import { AvailabilityDetails } from './AvailabilityDetails'
import { BestTimesPanel } from './BestTimesPanel'
import { FinalizeDialog } from './FinalizeDialog'
import { Heatmap } from './Heatmap'
import type { HeatmapCellHandlers } from './HeatmapCell'
import { ScheduleControls } from './ScheduleControls'

const DETAILS_HIDE_DELAY_MS = 100

export function HeatmapWorkspace({
  event,
  canEdit,
  bestTimes,
  duration,
  mustInclude,
  onDurationChange,
  onMustIncludeChange,
  pending,
  onFinalize,
  onPendingChange,
}: HeatmapWorkspaceProps) {
  const [highlighted, setHighlighted] = useState<RankedTime | null>(null)
  const [reveal, setReveal] = useState<{ key: string; requestId: number; startTime: string } | null>(null)
  const [inspected, setInspected] = useState<{ point: SelectedCell; availableNames: string[]; count: number } | null>(null)
  const view = useTimeView()
  const pinned = useRef(false)
  const [mode, setMode] = useState<HeatmapSelectionMode>(HeatmapSelectionMode.View)
  const [selected, setSelected] = useState<FinalSchedule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const anchor = useRef<SelectedCell | null>(null)
  const keyboardAnchor = useRef<SelectedCell | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busy = useRef(false)
  const active = useRef(true)

  const selectingFinal = mode === HeatmapSelectionMode.SelectFinal
  const interactive = canEdit && pending === null && !dialogOpen
  // Handler đọc giá trị mới nhất qua ref nên tham chiếu `handlers` không đổi giữa các lần render
  const selectingRef = useRef(selectingFinal)
  useEffect(() => {
    selectingRef.current = selectingFinal
  }, [selectingFinal])

  const cancelHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = null
  }
  const scheduleHide = () => {
    if (pinned.current) return
    cancelHide()
    hideTimer.current = setTimeout(() => {
      setInspected(null)
      hideTimer.current = null
    }, DETAILS_HIDE_DELAY_MS)
  }

  useEffect(() => {
    active.current = true
    const stopDragging = () => {
      anchor.current = null
    }
    const hideNow = () => {
      if (pinned.current) return
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = null
      setInspected(null)
    }
    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('pointercancel', stopDragging)
    window.addEventListener('blur', stopDragging)
    window.addEventListener('scroll', hideNow, true)
    return () => {
      active.current = false
      if (hideTimer.current) clearTimeout(hideTimer.current)
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('pointercancel', stopDragging)
      window.removeEventListener('blur', stopDragging)
      window.removeEventListener('scroll', hideNow, true)
    }
  }, [])

  const handlers = useMemo<HeatmapCellHandlers>(
    () => ({
      inspect: (point, names, count, pin = false) => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = null
        pinned.current = pin
        setInspected((current) =>
          current && current.point === point && current.availableNames === names
            ? current
            : { point, availableNames: names, count },
        )
      },
      inspectEnd: () => {
        if (pinned.current) return
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => {
          setInspected(null)
          hideTimer.current = null
        }, DETAILS_HIDE_DELAY_MS)
      },
      start: (cell) => {
        if (!selectingRef.current) return
        anchor.current = cell
        setSelected(normalizeSelection(cell, cell))
      },
      extend: (cell) => {
        if (!selectingRef.current || !anchor.current) return
        const range = normalizeSelection(anchor.current, cell)
        if (range) setSelected(range)
      },
      keyboardSelect: (cell, extendRange = false) => {
        if (!selectingRef.current) return
        if (!extendRange || !keyboardAnchor.current) keyboardAnchor.current = cell
        const range = normalizeSelection(keyboardAnchor.current, cell)
        if (range) setSelected(range)
      },
    }),
    [],
  )

  function highlight(slot: RankedTime | null) {
    setHighlighted(slot)
    // Lật lưới tới trang chứa khung đang xem
    if (slot) setReveal((current) => ({ key: columnKey(slot), startTime: slot.startTime, requestId: (current?.requestId ?? 0) + 1 }))
  }

  const point = inspected?.point
  const local = point && view?.projected?.firstBySource.get(`${point.column.key}|${point.row.startTime}`)
  const details = inspected && {
    ...inspected,
    dayLabel: local ? formatDate(local.date) : formatDay(inspected.point.column),
    startTime: local
      ? `${local.startTime}${local.repeated ? ` ${formatUtcOffset(local.offsetMinutes)}` : ''}`
      : inspected.point.row.startTime,
    endTime: local
      ? `${local.date === local.endDate ? '' : `${formatDate(local.endDate)} · `}${local.endTime}${local.offsetMinutes === local.endOffsetMinutes ? '' : ` ${formatUtcOffset(local.endOffsetMinutes)}`}`
      : inspected.point.row.endTime,
  }

  /** Chốt nhanh từ Best times: đặt sẵn khung rồi mở hộp xác nhận */
  function pickBestTime(slot: RankedTime) {
    setSelected({ specificDate: slot.specificDate, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime })
    setDialogOpen(true)
  }

  function cancelSelection() {
    anchor.current = null
    keyboardAnchor.current = null
    setSelected(null)
    setMode(HeatmapSelectionMode.View)
  }

  async function confirmSchedule() {
    if (!canEdit || !selected || !dialogOpen || busy.current || !onFinalize) return
    if (!isValidSchedule(event, selected)) {
      toast.error(t('finalize.invalid'))
      return
    }
    busy.current = true
    onPendingChange(HeatmapPendingAction.Finalize)
    try {
      // Link cuộc họp gắn riêng qua nút Thêm/Sửa link (PUT /meeting-url), backend giữ nguyên khi chốt
      const result = await onFinalize(selected)
      if (!active.current) return
      if (result.status !== 2 || !isValidSchedule(event, result.finalSchedule)) {
        throw new Error(t('finalize.badResponse'))
      }
      setDialogOpen(false)
      cancelSelection()
      toast.success(t('finalize.success'))
    } catch (failure) {
      if (active.current) {
        toast.error(failure instanceof Error ? failure.message : t('api.finalize'))
      }
    } finally {
      busy.current = false
      if (active.current) onPendingChange(null)
    }
  }

  return (
    <>
      {/* Mobile: Best times → heatmap → chi tiết; desktop: heatmap bên trái, cột phải là Best times + chi tiết */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {canEdit && (
          <div className="min-w-0 lg:col-start-2 lg:row-start-1">
            <BestTimesPanel
              times={bestTimes}
              participants={event.participants}
              duration={duration}
              mustInclude={mustInclude}
              highlightedKey={highlighted ? rankedKey(highlighted) : null}
              disabled={pending !== null || !onFinalize}
              onDurationChange={onDurationChange}
              onMustIncludeChange={onMustIncludeChange}
              onHighlight={highlight}
              onPick={pickBestTime}
              onChooseManually={() => setMode(HeatmapSelectionMode.SelectFinal)}
            />
          </div>
        )}
        <div className="min-w-0 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Heatmap
            event={event}
            bestTimes={bestTimes}
            highlightedKey={highlighted ? rankedKey(highlighted) : null}
            reveal={reveal}
            inspected={point}
            selected={canEdit ? selected : null}
            selecting={interactive && selectingFinal}
            handlers={handlers}
          />
        </div>
        <div className="min-w-0 space-y-5 lg:col-start-2 lg:row-start-2">
          {canEdit && selectingFinal && (
            <ScheduleControls
              selected={selected}
              selecting
              disabled={pending !== null || !onFinalize}
              onBegin={() => setMode(HeatmapSelectionMode.SelectFinal)}
              onCancel={cancelSelection}
              onConfirm={() => setDialogOpen(true)}
            />
          )}
          <AvailabilityDetails
            details={details}
            participants={event.participants}
            highlighted={mustInclude}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
          />
        </div>
      </div>
      <FinalizeDialog
        open={dialogOpen && canEdit}
        selected={selected}
        timezone={event.timezone}
        pending={pending === HeatmapPendingAction.Finalize}
        onClose={() => {
          setDialogOpen(false)
          if (!selectingFinal) setSelected(null)
        }}
        onConfirm={() => void confirmSchedule()}
      />
    </>
  )
}
