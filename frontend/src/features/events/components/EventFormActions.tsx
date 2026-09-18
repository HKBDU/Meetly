import { eventUi } from '../../../shared/components/ui/styles'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/lib/utils'
import type {
  EventFormActionsProps,
  EventFormCancelActionProps,
  EventFormSubmitActionProps,
} from '../types'

export function EventFormCancelAction({ onCancel, label = 'Cancel' }: EventFormCancelActionProps) {
  if (!onCancel) return null

  return (
    <Button
      className={cn(
        'w-full flex-1 min-w-0 sm:w-auto sm:flex-initial',
        eventUi.secondaryButton,
        eventUi.formFooterButton,
      )}
      onClick={onCancel}
      type="button"
      variant="outline"
    >
      {label}
    </Button>
  )
}

export function EventFormSubmitAction({
  submitting = false,
  submitLabel = 'Create Event',
}: EventFormSubmitActionProps) {
  return (
    <Button
      className={cn(
        'w-full flex-1 min-w-0 sm:w-auto sm:flex-initial',
        eventUi.primaryButton,
        eventUi.formFooterButton,
      )}
      disabled={submitting}
      type="submit"
    >
      {submitting ? 'Saving...' : submitLabel}
    </Button>
  )
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
        'flex w-full max-w-full flex-row items-center gap-2.5 box-border sm:w-auto sm:justify-end',
        eventUi.formFooter,
      )}
    >
      <EventFormCancelAction label={cancelLabel} onCancel={onCancel} />
      <EventFormSubmitAction submitLabel={submitLabel} submitting={submitting} />
    </footer>
  )
}
