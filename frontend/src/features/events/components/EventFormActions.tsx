type EventFormActionsProps = { onCancel: () => void; submitting?: boolean }

export function EventFormActions({ onCancel, submitting = false }: EventFormActionsProps) {
  return <footer className="event-form__footer">
    <button className="button button--secondary" onClick={onCancel} type="button">Cancel</button>
    <button className="button button--primary" disabled={submitting} type="submit">{submitting ? 'Creating...' : 'Create Event'}</button>
  </footer>
}
