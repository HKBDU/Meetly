import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { eventUi } from '@/shared/components/ui/styles'
import { cn } from '@/lib/utils'

interface UpdateWarningProps {
  open: boolean
  isUpdating: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Xác nhận trước khi lưu thay đổi cấu hình event */
export function UpdateWarning({ open, isUpdating, onCancel, onConfirm }: UpdateWarningProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !isUpdating && onCancel()}>
      <DialogContent className="max-w-[460px] rounded-xl bg-white p-7" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className={eventUi.updateWarningTitle}>Save event changes?</DialogTitle>
          <DialogDescription className={eventUi.updateWarningDescription}>
            Changing the event configuration may affect the availability data already entered by
            participants.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className={eventUi.updateWarningActions}>
          <Button
            className={cn(eventUi.button, eventUi.updateWarningSecondary)}
            disabled={isUpdating}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(eventUi.button, eventUi.primaryButton)}
            disabled={isUpdating}
            onClick={onConfirm}
            type="button"
          >
            {isUpdating ? 'Saving...' : 'Confirm changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
