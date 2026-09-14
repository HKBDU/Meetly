import { eventUi } from './styles'
import { cn } from '@/lib/utils'

type EventFormActionsProps = { onCancel: () => void; submitting?: boolean; submitLabel?: string }

export function EventFormActions({ onCancel, submitting = false, submitLabel = 'Create Event' }: EventFormActionsProps) {
  return <footer className={eventUi.formFooter}>
    <button className={cn(eventUi.button, eventUi.formFooterButton, eventUi.secondaryButton)} onClick={onCancel} type="button">Cancel</button>
    <button className={cn(eventUi.button, eventUi.formFooterButton, eventUi.primaryButton)} disabled={submitting} type="submit">{submitting ? 'Saving...' : submitLabel}</button>
  </footer>
}
