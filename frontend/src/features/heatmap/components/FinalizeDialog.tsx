import { useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { FinalSchedule } from '../types';
import { formatDay } from '../time';

interface Props {
  open: boolean;
  selected: FinalSchedule | null;
  timezone: string;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function FinalizeDialog({
  open,
  selected,
  timezone,
  pending,
  error,
  onClose,
  onConfirm,
}: Props) {
  const cancelButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root
      open={open && selected !== null}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl"
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
          <Dialog.Title className="text-xl font-semibold">Finalize this meeting?</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-slate-600">
            Confirming will lock this event. Participants will no longer be able to edit their
            availability.
          </Dialog.Description>
          {selected && (
            <div className="my-5 rounded-lg bg-emerald-50 p-4">
              <p className="font-medium">{formatDay(selected)}</p>
              <p className="mt-1 text-xl font-semibold">
                {selected.startTime} – {selected.endTime}
              </p>
              <p className="mt-2 text-xs text-slate-600">{timezone}</p>
            </div>
          )}
          {error && (
            <p role="alert" className="mb-4 text-sm text-rose-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button
              ref={cancelButton}
              type="button"
              disabled={pending}
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onConfirm}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {pending ? 'Confirming…' : 'Confirm Final Time'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
