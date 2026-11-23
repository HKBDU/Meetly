import { useRef } from 'react';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui';
import type { FinalizeDialogProps } from '../types';
import { formatDay } from '@/shared/grid/model';
import { useT } from '@/shared/i18n';

export function FinalizeDialog({
  open,
  selected,
  timezone,
  pending,
  onClose,
  onConfirm,
}: FinalizeDialogProps) {
  const t = useT();
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
            <DialogTitle>{t('finalize.title')}</DialogTitle>
            <DialogDescription className="leading-5 text-muted-foreground">
              {t('finalize.description')}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="rounded-lg bg-secondary px-3 py-2.5">
              <p className="text-sm font-medium">{formatDay(selected)}</p>
              <p className="mt-0.5 text-lg font-semibold">
                {selected.startTime} – {selected.endTime}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{timezone}</p>
            </div>
          )}
          <DialogFooter className="mt-1">
            <Button
              ref={cancelButton}
              variant="outline"
              disabled={pending}
              onClick={onClose}
            >
              {t('common.cancel')}
            </Button>
            <Button
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? t('finalize.confirming') : t('finalize.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
