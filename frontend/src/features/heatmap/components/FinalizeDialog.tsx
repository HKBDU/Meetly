import { useRef } from 'react';
import { isGoogleConfigured, preloadGoogleIdentity } from '@/lib/google';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/components/ui';
import type { FinalizeDialogProps } from '../types';
import { describeRange, useTimeView } from '@/shared/grid/time-view';
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
  const view = useTimeView();
  const display = selected ? describeRange(view, selected, timezone) : null;
  const cancelButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const googleMeet = useRef<HTMLInputElement>(null);

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
          {display && (
            <div className="rounded-lg bg-secondary px-3 py-2.5">
              <p className="text-sm font-medium">{display.day}</p>
              <p className="mt-0.5 text-lg font-semibold">
                {display.time}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{display.zone}</p>
            </div>
          )}
          {isGoogleConfigured && (
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-border p-3">
              <span>
                <span id="finalize-meet-label" className="block text-sm font-medium">{t('finalize.meet')}</span>
                <span id="finalize-meet-help" className="block text-xs text-muted-foreground">{t('finalize.meetHelp')}</span>
              </span>
              <input
                ref={googleMeet}
                type="checkbox"
                role="switch"
                aria-labelledby="finalize-meet-label"
                aria-describedby="finalize-meet-help"
                disabled={pending}
                className="peer sr-only"
                onChange={(event) => {
                  if (event.currentTarget.checked) preloadGoogleIdentity();
                }}
              />
              <span aria-hidden="true" className="relative h-5 w-9 shrink-0 rounded-full bg-input after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-background after:shadow-sm after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-50" />
            </label>
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
              onClick={() => onConfirm(googleMeet.current?.checked === true)}
            >
              {pending ? t('finalize.confirming') : t('finalize.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
