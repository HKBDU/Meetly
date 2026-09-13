type EventFormActionsProps = { onCancel: () => void; submitting?: boolean; submitLabel?: string }

export function EventFormActions({ onCancel, submitting = false, submitLabel = 'Create Event' }: EventFormActionsProps) {
  return <footer className="event-form__footer">
    <button className="button button--secondary" onClick={onCancel} type="button">Cancel</button>
    <button className="button button--primary" disabled={submitting} type="submit">{submitting ? 'Saving...' : submitLabel}</button>
  </footer>
}
