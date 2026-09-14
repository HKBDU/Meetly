import { eventUi } from './styles'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'

interface CancelActionProps {
  onCancel?: () => void
  label?: string
}

export function EventFormCancelAction({ onCancel, label = 'Cancel' }: CancelActionProps) {
  if (!onCancel) return null

  return (
    <Button
      className={eventUi.secondaryButton}
      onClick={onCancel}
      type="button"
      variant="outline"
    >
      {label}
    </Button>
  )
}

interface SubmitActionProps {
  submitting?: boolean
  submitLabel?: string
}

export function EventFormSubmitAction({
  submitting = false,
  submitLabel = 'Create Event',
}: SubmitActionProps) {
  return (
    <Button
      className={eventUi.primaryButton}
      disabled={submitting}
      type="submit"
    >
      {submitting ? 'Saving...' : submitLabel}
    </Button>
  )
}

interface EventFormActionsProps {
  onCancel?: () => void
  submitting?: boolean
  submitLabel?: string
  cancelLabel?: string
}

export function EventFormActions({
  onCancel,
  submitting = false,
  submitLabel = 'Create Event',
  cancelLabel = 'Cancel',
}: EventFormActionsProps) {
  return (
    <footer
      className={cn(
        'grid w-full grid-flow-col auto-cols-fr gap-3 sm:flex sm:w-auto sm:justify-end',
        eventUi.formFooter,
      )}
    >
      <EventFormSubmitAction submitLabel={submitLabel} submitting={submitting} />
      <EventFormCancelAction label={cancelLabel} onCancel={onCancel} />
    </footer>
  )
}