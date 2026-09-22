import type { AdminSuggestionControlsProps } from '../types';
import { KeyParticipantSelector } from './KeyParticipantSelector';

export function AdminSuggestionControls({
  participants,
  keyParticipant,
  disabled,
  updating,
  loaded,
  suggestionCount,
  onKeyParticipantChange,
}: AdminSuggestionControlsProps) {
  return (
    <>
      <KeyParticipantSelector
        participants={participants}
        selected={keyParticipant}
        disabled={disabled}
        onChange={onKeyParticipantChange}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {updating && (
          <span role="status" className="text-sm text-slate-500">
            Updating suggestions…
          </span>
        )}
        {suggestionCount > 0 && (
          <span className="text-xs text-slate-500">
            {suggestionCount} best {suggestionCount === 1 ? 'time' : 'times'} · Shown in red after you click Select Final Time
          </span>
        )}
        {!updating && loaded && suggestionCount === 0 && (
          <p role="status" className="text-sm text-slate-500">
            No suggested times found.
          </p>
        )}
        {!updating && !loaded && (
          <p className="text-xs text-slate-500">
            Suggestions update automatically when filters change.
          </p>
        )}
      </div>
    </>
  );
}
