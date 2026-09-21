import { useRef } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui';
import type { FinalizeDialogProps } from '../types';
import { formatDay } from '../time';

export function FinalizeDialog({
  open,
  selected,
  timezone,
  pending,
  onClose,
  onConfirm,
}: FinalizeDialogProps) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  return (
    <Dialog
      open={open && selected !== null}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
        <DialogContent
          showCloseButton={false}
          className="gap-3 p-4 sm:max-w-sm sm:p-5"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            returnFocus.current =
              document.activeElement instanceof HTMLElement ? document.activeElement : null;
            cancelButton.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (returnFocus.current?.isConnected) returnFocus.current.focus();
            else document.getElementById('event-title')?.focus();
          }}
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (pending) event.preventDefault();
          }}
        >
          <DialogHeader className="gap-1.5">
            <DialogTitle>Finalize this meeting?</DialogTitle>
            <DialogDescription className="leading-5 text-slate-600">
              Confirming will lock this event. Participants will no longer be able to edit their
              availability.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="rounded-lg bg-emerald-50 px-3 py-2.5">
              <p className="text-sm font-medium">{formatDay(selected)}</p>
              <p className="mt-0.5 text-lg font-semibold">
                {selected.startTime} – {selected.endTime}
              </p>
              <p className="mt-1 text-xs text-slate-600">{timezone}</p>
            </div>
          )}
          <DialogFooter className="mt-1">
            <Button
              ref={cancelButton}
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? 'Confirming…' : 'Confirm Final Time'}
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
