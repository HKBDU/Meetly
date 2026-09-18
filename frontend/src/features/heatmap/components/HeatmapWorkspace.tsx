import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AvailabilityDetails } from './AvailabilityDetails';
import { FinalizeDialog } from './FinalizeDialog';
import { Heatmap } from './Heatmap';
import { ScheduleControls } from './ScheduleControls';
import { normalizeSelection } from '../selection';
import { getColumns, isValidSchedule } from '../time';
import {
  HeatmapPendingAction,
  HeatmapSelectionMode,
  type CellDetails,
  type FinalSchedule,
  type HeatmapWorkspaceProps,
  type SelectedCell,
} from '../types';

export function HeatmapWorkspace({
  event,
  canEdit,
  suggestions,
  keyParticipant,
  pending,
  onFinalize,
  onFinalized,
  onPendingChange,
}: HeatmapWorkspaceProps) {
  const [details, setDetails] = useState<CellDetails | null>(null);
  const [mode, setMode] = useState<HeatmapSelectionMode>(HeatmapSelectionMode.View);
  const [selected, setSelected] = useState<FinalSchedule | null>(
    event.status === 2 ? event.finalSchedule : null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const anchor = useRef<SelectedCell | null>(null);
  const keyboardAnchor = useRef<SelectedCell | null>(null);
  const detailsHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    const stopDragging = () => {
      anchor.current = null;
    };
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    window.addEventListener('blur', stopDragging);
    return () => {
      active.current = false;
      if (detailsHideTimer.current) clearTimeout(detailsHideTimer.current);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
      window.removeEventListener('blur', stopDragging);
    };
  }, []);

  function cancelDetailsHide() {
    if (!detailsHideTimer.current) return;
    clearTimeout(detailsHideTimer.current);
    detailsHideTimer.current = null;
  }

  function showDetails(nextDetails: CellDetails) {
    cancelDetailsHide();
    setDetails(nextDetails);
  }

  function scheduleDetailsHide() {
    cancelDetailsHide();
    detailsHideTimer.current = setTimeout(() => {
      setDetails(null);
      detailsHideTimer.current = null;
    }, 100);
  }

  function cancelSelection() {
    anchor.current = null;
    keyboardAnchor.current = null;
    setSelected(null);
    setMode(HeatmapSelectionMode.View);
  }

  function startSelection(cell: SelectedCell) {
    if (mode !== HeatmapSelectionMode.SelectFinal) return;
    anchor.current = cell;
    setSelected(normalizeSelection(cell, cell));
  }

  function extendSelection(cell: SelectedCell) {
    if (mode !== HeatmapSelectionMode.SelectFinal || !anchor.current) return;
    const range = normalizeSelection(anchor.current, cell);
    if (range) setSelected(range);
  }

  function selectWithKeyboard(cell: SelectedCell, extendRange = false) {
    if (mode !== HeatmapSelectionMode.SelectFinal) return;
    if (!extendRange || !keyboardAnchor.current) keyboardAnchor.current = cell;
    const range = normalizeSelection(keyboardAnchor.current, cell);
    if (range) setSelected(range);
  }

  async function confirmSchedule() {
    if (!canEdit || !selected || !dialogOpen || busy.current || !onFinalize) return;
    if (!isValidSchedule(event, selected)) {
      toast.error('The selected time range is invalid.');
      return;
    }
    busy.current = true;
    onPendingChange(HeatmapPendingAction.Finalize);
    try {
      const result = await onFinalize(selected);
      if (!active.current) return;
      if (result.status !== 2 || !isValidSchedule(event, result.finalSchedule)) {
        throw new Error('The final schedule response is invalid.');
      }
      setDialogOpen(false);
      cancelSelection();
      onFinalized(result);
    } catch (failure) {
      if (active.current) {
        toast.error(failure instanceof Error ? failure.message : 'Unable to finalize the meeting. Please try again.');
      }
    } finally {
      busy.current = false;
      if (active.current) onPendingChange(null);
    }
  }

  const interactive = canEdit && pending === null && !dialogOpen;

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Heatmap
            event={event}
            suggestions={mode === HeatmapSelectionMode.SelectFinal ? suggestions : []}
            selected={selected}
            selecting={interactive && mode === HeatmapSelectionMode.SelectFinal}
            onInspect={showDetails}
            onInspectEnd={scheduleDetailsHide}
            onStart={startSelection}
            onExtend={extendSelection}
            onKeyboardSelect={selectWithKeyboard}
          />
        </div>
        <div className="space-y-5">
          {canEdit && (
            <ScheduleControls
              selected={selected}
              selecting={mode === HeatmapSelectionMode.SelectFinal}
              disabled={pending !== null || !onFinalize || getColumns(event).length === 0}
              onBegin={() => setMode(HeatmapSelectionMode.SelectFinal)}
              onCancel={cancelSelection}
              onConfirm={() => {
                setDialogOpen(true);
              }}
            />
          )}
          <AvailabilityDetails
            details={details}
            participants={event.participants}
            keyParticipant={keyParticipant}
            onMouseEnter={cancelDetailsHide}
            onMouseLeave={scheduleDetailsHide}
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
  );
}
