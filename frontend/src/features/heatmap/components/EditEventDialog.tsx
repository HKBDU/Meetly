import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { EventForm, toUpdateEventPayload } from '@/features/events';
import type { EventFormValues } from '@/features/events';
import { UpdateWarning } from '@/features/events/components/UpdateWarning';
import { eventUi } from '@/shared/components/ui/styles';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui';
import { WEEKDAYS } from '../constants';
import type { EditableEvent, EditEventDialogProps, UpdateEventPayload } from '../types';

/** "08:00:00" -> "08:00" */
const toHourMinute = (time: string) => time.slice(0, 5);

function toFormValues(event: EditableEvent): Partial<EventFormValues> {
  const weekdayNames = event.availableWeekdays.map(
    (day) => WEEKDAYS.find((weekday) => weekday.value === day)?.shortLabel ?? '',
  );
  return {
    title: event.title,
    eventType: event.eventType,
    availableDates: event.eventType === 1 ? event.availableDates : weekdayNames,
    dailyStartTime: toHourMinute(event.dailyStartTime),
    dailyEndTime: toHourMinute(event.dailyEndTime),
  };
}

export function EditEventDialog({ event, disabled = false, onSave }: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<UpdateEventPayload>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function confirmSave(adminPassword: string) {
    if (!pendingPayload) return;
    setSaving(true);
    setError(undefined);
    try {
      await onSave(pendingPayload, adminPassword);
      setPendingPayload(undefined);
      setOpen(false);
    } catch (failure) {
      setPendingPayload(undefined);
      setError(failure instanceof Error ? failure.message : 'Unable to update the event.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (next) setError(undefined);
          setOpen(next);
        }}
      >
        <DialogTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className="border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
          >
            <Pencil size={15} aria-hidden="true" />
            Edit Event
          </Button>
        </DialogTrigger>
        <DialogContent className="flex max-h-[calc(100dvh-5rem)] w-[calc(100vw-2rem)] max-w-[760px] flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 sm:max-w-[760px]">
          <DialogHeader className="shrink-0 px-6 pt-6 pr-12">
            <DialogTitle className={eventUi.pageTitle}>Edit Event</DialogTitle>
            <DialogDescription className="sr-only">
              Update the event name, dates and daily time range.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <EventForm
            adminUsername=""
            adminPassword=""
            error={error}
            initialValues={toFormValues(event)}
            onCancel={() => setOpen(false)}
            onSubmit={(values) => setPendingPayload(toUpdateEventPayload(values) as UpdateEventPayload)}
            submitLabel="Save Changes"
            submitting={saving}
          />
          </div>
        </DialogContent>
      </Dialog>
      <UpdateWarning
        open={Boolean(pendingPayload)}
        isUpdating={saving}
        onCancel={() => setPendingPayload(undefined)}
        onConfirm={(adminPassword) => void confirmSave(adminPassword)}
      />
    </>
  );
}
