import { useEffect, useRef, useState } from 'react';
import type { FinalSchedule, SelectedCell } from '../types';
import { normalizeSelection } from '../time';

export function useHeatmapSelection() {
  const [mode, setMode] = useState<'view' | 'select-final'>('view');
  const [selected, setSelected] = useState<FinalSchedule | null>(null);
  const anchor = useRef<SelectedCell | null>(null);
  const keyboardAnchor = useRef<SelectedCell | null>(null);

  useEffect(() => {
    const stop = () => {
      anchor.current = null;
    };
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);
    return () => {
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('blur', stop);
    };
  }, []);

  function start(cell: SelectedCell) {
    if (mode !== 'select-final') return;
    anchor.current = cell;
    setSelected(normalizeSelection(cell, cell));
  }

  function extend(cell: SelectedCell) {
    if (mode !== 'select-final' || !anchor.current) return;
    const range = normalizeSelection(anchor.current, cell);
    if (range) setSelected(range);
  }

  function chooseCell(cell: SelectedCell, extendRange = false) {
    if (mode !== 'select-final') return;
    if (!extendRange || !keyboardAnchor.current) keyboardAnchor.current = cell;
    const range = normalizeSelection(keyboardAnchor.current, cell);
    if (range) setSelected(range);
  }

  function cancel() {
    anchor.current = null;
    keyboardAnchor.current = null;
    setSelected(null);
    setMode('view');
  }

  return {
    mode,
    selected,
    start,
    extend,
    chooseCell,
    cancel,
    begin: () => setMode('select-final'),
  };
}
