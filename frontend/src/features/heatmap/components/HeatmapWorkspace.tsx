import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { columnKey, formatDay } from '@/shared/grid/model'
import type { FinalSchedule } from '@/shared/types'
import { isValidSchedule, normalizeSelection } from '../selection'
import {
  HeatmapPendingAction,
  HeatmapSelectionMode,
  type CellDetails,
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
  const [reveal, setReveal] = useState<{ key: string; requestId: number } | null>(null)
  const [details, setDetails] = useState<CellDetails | null>(null)
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
    cancelHide()
    hideTimer.current = setTimeout(() => {
      setDetails(null)
      hideTimer.current = null
    }, DETAILS_HIDE_DELAY_MS)
  }

  useEffect(() => {
    active.current = true
    const stopDragging = () => {
      anchor.current = null
    }
    const hideNow = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      hideTimer.current = null
      setDetails(null)
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
      inspect: ({ column, row }, names, count) => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = null
        const dayLabel = formatDay(column)
        setDetails((current) =>
          current && current.dayLabel === dayLabel && current.startTime === row.startTime && current.availableNames === names
            ? current
            : { dayLabel, startTime: row.startTime, endTime: row.endTime, availableNames: names, count },
        )
      },
      inspectEnd: () => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        hideTimer.current = setTimeout(() => {
          setDetails(null)
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
    if (slot) setReveal((current) => ({ key: columnKey(slot), requestId: (current?.requestId ?? 0) + 1 }))
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
      toast.error('The selected time range is invalid.')
      return
    }
    busy.current = true
    onPendingChange(HeatmapPendingAction.Finalize)
    try {
      const result = await onFinalize(selected)
      if (!active.current) return
      if (result.status !== 2 || !isValidSchedule(event, result.finalSchedule)) {
        throw new Error('The final schedule response is invalid.')
      }
      setDialogOpen(false)
      cancelSelection()
      toast.success('Meeting finalized. This event is now read-only.')
    } catch (failure) {
      if (active.current) {
        toast.error(failure instanceof Error ? failure.message : 'Unable to finalize the meeting. Please try again.')
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
            bestTimes={canEdit ? bestTimes : []}
            highlightedKey={highlighted ? rankedKey(highlighted) : null}
            reveal={reveal}
            selected={selected}
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
