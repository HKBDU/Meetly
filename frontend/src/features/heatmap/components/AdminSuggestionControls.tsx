import type { AdminSuggestionControlsProps } from '../types'
import { KeyParticipantSelector } from './KeyParticipantSelector'

export function AdminSuggestionControls({
  participants,
  keyParticipant,
  disabled,
  hasFilters,
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
      <div className="mb-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground" role="status">
        {suggestionCount > 0 ? (
          <span>
            {suggestionCount} best {suggestionCount === 1 ? 'time' : 'times'} · Shown in red after you click Select Final
            Time
          </span>
        ) : (
          <span>{hasFilters ? 'No suggested times found.' : 'Pick a meeting duration to see suggested times.'}</span>
        )}
        <span>Suggestions update automatically when filters change.</span>
      </div>
    </>
  )
}
