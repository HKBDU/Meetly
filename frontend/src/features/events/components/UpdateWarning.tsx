import { useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { eventUi } from '@/shared/components/ui/styles'
import { cn } from '@/lib/utils'

interface UpdateWarningProps {
  open: boolean
  isUpdating: boolean
  onCancel: () => void
  onConfirm: (adminPassword: string) => void
}

const ACTION_BUTTON = 'h-10 min-w-0 flex-1 justify-center rounded text-base font-semibold'

/** Xác nhận trước khi lưu thay đổi cấu hình event, kèm mật khẩu admin (BE xác thực lại) */
export function UpdateWarning({ open, isUpdating, onCancel, onConfirm }: UpdateWarningProps) {
  const [password, setPassword] = useState('')

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
        <label className="grid gap-1.5 text-sm font-medium text-[#0b1c30]">
          Admin password
          <Input
            autoComplete="current-password"
            disabled={isUpdating}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Leave blank if the event has no password"
            type="password"
            value={password}
          />
        </label>
        <DialogFooter className="flex-row gap-2.5 sm:justify-stretch">
          <Button
            className={ACTION_BUTTON}
            disabled={isUpdating}
            onClick={onCancel}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className={cn(ACTION_BUTTON, 'border-0 bg-[#009b4d] text-white hover:bg-[#008240]')}
            disabled={isUpdating}
            onClick={() => onConfirm(password)}
            type="button"
          >
            {isUpdating ? 'Saving...' : 'Confirm changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
