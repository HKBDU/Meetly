import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { formatDay } from '@/shared/grid/model'
import type { FinalSchedule } from '@/shared/types'
import { isValidSchedule, normalizeSelection } from '../selection'
import {
  HeatmapPendingAction,
  HeatmapSelectionMode,
  type CellDetails,
  type HeatmapWorkspaceProps,
  type SelectedCell,
} from '../types'
import { AvailabilityDetails } from './AvailabilityDetails'
import { FinalizeDialog } from './FinalizeDialog'
import { Heatmap } from './Heatmap'
import type { HeatmapCellHandlers } from './HeatmapCell'
import { ScheduleControls } from './ScheduleControls'

const DETAILS_HIDE_DELAY_MS = 100

export function HeatmapWorkspace({
  event,
  canEdit,
  suggestions,
  keyParticipant,
  pending,
  onFinalize,
  onPendingChange,
}: HeatmapWorkspaceProps) {
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
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Heatmap
          event={event}
          suggestions={selectingFinal ? suggestions : []}
          selected={selected}
          selecting={interactive && selectingFinal}
          handlers={handlers}
        />
        <div className="space-y-5">
          {canEdit && (
            <ScheduleControls
              selected={selected}
              selecting={selectingFinal}
              disabled={pending !== null || !onFinalize}
              onBegin={() => setMode(HeatmapSelectionMode.SelectFinal)}
              onCancel={cancelSelection}
              onConfirm={() => setDialogOpen(true)}
            />
          )}
          <AvailabilityDetails
            details={details}
            participants={event.participants}
            keyParticipant={keyParticipant}
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
        onClose={() => setDialogOpen(false)}
        onConfirm={() => void confirmSchedule()}
      />
    </>
  )
}
