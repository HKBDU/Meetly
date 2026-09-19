import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, startOfMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, Pencil, RotateCcw } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { minuteRangeToTimes, parseDate, timesToMinuteRange } from '@/lib/date-time';
import { cn } from '@/lib/utils';
import {
  Button,
  Calendar,
  CalendarDayButton,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Slider,
} from '@/shared/components/ui';
import { SLOT_MINUTES, WEEKDAYS_MONDAY_FIRST } from '../constants';
import { applyDirectDateSelection, applyDraggedDateRange } from '../date-selection';
import { createEditEventSchema, isBlockedPastDate, type EditEventFormValues } from '../schema';
import type { EditEventDialogProps } from '../types';

const eventUi = {
  field: 'grid gap-2',
  fieldError: 'text-[11px] text-[#ba1a1a]',
  fieldHint: 'text-xs font-semibold text-[#009b4d]',
  form: 'p-4 sm:p-6',
  formContent: 'grid max-w-none gap-4 max-[640px]:gap-3',
  input:
    'h-[32px] w-full rounded border border-[#6b7280] bg-[#ffffff] px-3 text-md text-[#0b1c30] outline-0 focus:border-[#009b4d] focus:shadow-[0_0_0_2px_#009b4d26]',
  label: 'text-sm font-semibold text-[#0b1c30]',
  requiredMark: 'text-[#ba1a1a]',
  typeControl:
    'm-0 flex h-[45px] w-full rounded-lg border border-[#ffffff] bg-[#f9fafbcc] p-[3px]',
  typeControlButton:
    'min-w-0 flex-1 rounded-md border-0 bg-transparent text-sm text-[#6c7a71]',
  typeControlButtonActive:
    'border border-[#009b4d] bg-[#ecfdf566] text-[#009b4d] hover:bg-[#ecfdf566] hover:text-[#009b4d]',
  calendar:
    'min-w-0 rounded-lg bg-[#eff4ff] p-3 sm:p-6',
  calendarRoot: 'w-full',
  calendarMonths: 'w-full',
  calendarMonth: 'w-full',
  calendarMonthCaption: 'mb-4 flex h-8 items-center justify-between text-center text-sm',
  calendarToolbarButton:
    'size-8 border-0 bg-transparent p-0 text-[#0b1c30] hover:bg-[#d9f8e9]',
  calendarToolbarTitle: 'text-sm font-semibold text-[#0b1c30] sm:text-base',
  calendarGrid: 'w-full border-collapse',
  calendarWeekdays: 'flex w-full',
  calendarWeekday: 'flex-1 py-1 text-center text-xs font-semibold text-[#6c7a71]',
  calendarWeek: 'mt-1 flex w-full',
  calendarDay: 'relative flex-1 p-0 text-center',
  calendarDayButton:
    'grid h-9 w-full min-w-0 touch-none place-items-center rounded border-0 bg-transparent text-xs text-[#0b1c30] hover:bg-[#d9f8e9] sm:h-10',
  calendarDaySelected:
    '[&>button]:bg-[#00a854] [&>button]:text-white [&>button]:hover:bg-[#00a854]',
  calendarDayOutside: 'text-[#bbcabf]',
  calendarReset:
    'mt-5 h-auto border-0 bg-transparent p-0 text-xs font-semibold text-[#009b4d] hover:bg-transparent hover:text-[#008240]',
  weekdayOptions: 'grid grid-cols-7 gap-1 sm:gap-2',
  weekdayOption:
    'h-10 min-w-0 w-full border border-[#6b7280] bg-[#ffffff] px-1 text-xs text-[#0b1c30] sm:h-11 sm:text-sm',
  weekdayOptionSelected:
    'border-[#00a854] bg-[#00a854] text-white hover:bg-[#008240] hover:text-white',
  timeRange: 'relative grid grid-cols-2 gap-[13px]',
  primaryButton:
    'h-10 w-full justify-center rounded border-0 bg-[#009b4d] text-base font-semibold text-white hover:bg-[#008240] disabled:cursor-wait disabled:opacity-[.65] sm:w-auto sm:min-w-[150px]',
  secondaryButton:
    'h-10 w-full justify-center rounded border border-gray-300 bg-transparent text-base font-semibold text-gray-700 sm:w-auto sm:min-w-[132px]',
  formFooter:
    'mt-2 flex gap-2.5 border-0 pt-2 sm:justify-end',
  formFooterButton: 'h-10 w-full sm:w-auto',
} as const;

function formValues(event: EditEventDialogProps['event']): EditEventFormValues {
  return {
    title: event.title,
    eventType: event.eventType,
    availableDates: event.availableDates,
    availableWeekdays: event.availableWeekdays,
    dailyStartTime: event.dailyStartTime,
    dailyEndTime: event.dailyEndTime,
  };
}

function initialMonth(dates: string[]): Date {
  return startOfMonth(dates.map(parseDate).find((date): date is Date => date !== null) ?? new Date());
}

function shiftMonth(month: Date, offset: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1);
}

interface DateDragHandlers {
  start: (date: Date, event: ReactPointerEvent<HTMLButtonElement>) => void;
  enter: (date: Date) => void;
}

const DateDragContext = createContext<DateDragHandlers | null>(null);

function EditEventDayButton({ day, ...props }: ComponentProps<typeof CalendarDayButton>) {
  const drag = useContext(DateDragContext);

  return (
    <CalendarDayButton
      day={day}
      {...props}
      onPointerDown={(pointerEvent) => {
        props.onPointerDown?.(pointerEvent);
        drag?.start(day.date, pointerEvent);
      }}
      onPointerEnter={(pointerEvent) => {
        props.onPointerEnter?.(pointerEvent);
        drag?.enter(day.date);
      }}
    />
  );
}

interface EditEventDateCalendarProps {
  value: string[];
  existingDates: string[];
  month: Date;
  onMonthChange: (month: Date) => void;
  onChange: (dates: string[]) => void;
}

function EditEventDateCalendar({
  value,
  existingDates,
  month,
  onMonthChange,
  onChange,
}: EditEventDateCalendarProps) {
  const dragStart = useRef<Date | null>(null);
  const dragBase = useRef<string[]>([]);
  const dragSelecting = useRef(true);
  const suppressClick = useRef(false);

  useEffect(() => {
    const finishDrag = () => {
      dragStart.current = null;
    };
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', finishDrag);
    return () => {
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', finishDrag);
    };
  }, []);

  const dragHandlers = useMemo<DateDragHandlers>(() => ({
    start: (date, pointerEvent) => {
      if (pointerEvent.button !== 0) return;
      suppressClick.current = false;
      dragStart.current = date;
      dragBase.current = [...value];
      dragSelecting.current = !value.includes(format(date, 'yyyy-MM-dd'));
      if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
        pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
      }
    },
    enter: (date) => {
      const start = dragStart.current;
      if (!start || start.getTime() === date.getTime()) return;
      suppressClick.current = true;
      onChange(applyDraggedDateRange(dragBase.current, start, date, dragSelecting.current));
    },
  }), [onChange, value]);

  return (
    <DateDragContext.Provider value={dragHandlers}>
      <Calendar
        className="w-full bg-transparent p-0"
        classNames={{
          root: eventUi.calendarRoot,
          months: eventUi.calendarMonths,
          month: eventUi.calendarMonth,
          month_caption: 'hidden',
          month_grid: eventUi.calendarGrid,
          weekdays: eventUi.calendarWeekdays,
          weekday: eventUi.calendarWeekday,
          week: eventUi.calendarWeek,
          day: eventUi.calendarDay,
          day_button: eventUi.calendarDayButton,
          selected: eventUi.calendarDaySelected,
          outside: eventUi.calendarDayOutside,
        }}
        components={{ DayButton: EditEventDayButton }}
        mode="multiple"
        hideNavigation
        showOutsideDays={false}
        modifiers={{ blockedPast: (date) => isBlockedPastDate(date, existingDates) }}
        weekStartsOn={1}
        month={month}
        onMonthChange={onMonthChange}
        selected={value.map(parseDate).filter((date): date is Date => date !== null)}
        onDayClick={() => {
          suppressClick.current = false;
        }}
        onSelect={(dates, triggerDate) => {
          if (suppressClick.current) return;
          const nextDates = (dates ?? []).map((date) => format(date, 'yyyy-MM-dd'));
          onChange(applyDirectDateSelection(value, nextDates, triggerDate, existingDates));
        }}
      />
    </DateDragContext.Provider>
  );
}

export function EditEventDialog({ event, disabled = false, onSave }: EditEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => initialMonth(event.availableDates));
  const editSchema = useMemo(
    () => createEditEventSchema(),
    [],
  );
  const form = useForm<EditEventFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: formValues(event),
  });
  const pending = form.formState.isSubmitting;
  const eventType = useWatch({ control: form.control, name: 'eventType' });

  function prepareDialog() {
    form.reset(formValues(event));
    setVisibleMonth(initialMonth(event.availableDates));
  }

  async function handleSubmit(values: EditEventFormValues) {
    try {
      await onSave({
        ...values,
        title: values.title.trim(),
        availableDates: values.eventType === 1 ? values.availableDates : [],
        availableWeekdays: values.eventType === 2 ? values.availableWeekdays : [],
      });
      setOpen(false);
    } catch (failure) {
      toast.error(failure instanceof Error ? failure.message : 'Unable to update the event.');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && pending) return;
        if (nextOpen) prepareDialog();
        setOpen(nextOpen);
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
      <DialogContent
        showCloseButton={!pending}
        className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-[760px] gap-0 overflow-y-auto rounded-2xl border border-[#bbcabf]/60 bg-white p-0 shadow-[0_1px_1px_rgba(0,0,0,.05)] sm:max-w-[760px]"
        onEscapeKeyDown={(dialogEvent) => pending && dialogEvent.preventDefault()}
        onPointerDownOutside={(dialogEvent) => pending && dialogEvent.preventDefault()}
      >
        <DialogHeader className="px-[25px] pt-[25px] pr-12">
          <DialogTitle className="text-xl text-[#0b1c30]">Edit Event</DialogTitle>
          <DialogDescription className="sr-only">
            Update the event name, available hours, and {eventType === 1 ? 'dates' : 'weekdays'}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className={eventUi.form} onSubmit={form.handleSubmit(handleSubmit)}>
            <section className={eventUi.formContent}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className={eventUi.field}>
                  <FormLabel className={eventUi.label}>
                    Event name <span className={eventUi.requiredMark} aria-hidden="true">*</span>
                  </FormLabel>
                  <FormControl><Input disabled={pending} className={eventUi.input} autoComplete="off" {...field} /></FormControl>
                  <FormMessage className={eventUi.fieldError} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem className={eventUi.field}>
                  <FormLabel className={eventUi.label}>
                    Event type <span className={eventUi.requiredMark} aria-hidden="true">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className={eventUi.typeControl} role="radiogroup" aria-label="Event type">
                      {([
                        { value: 1 as const, label: 'Dates and times' },
                        { value: 2 as const, label: 'Weekdays' },
                      ]).map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant="ghost"
                          role="radio"
                          aria-checked={field.value === option.value}
                          disabled={pending}
                          onClick={() => field.onChange(option.value)}
                          className={cn(
                            eventUi.typeControlButton,
                            field.value === option.value && eventUi.typeControlButtonActive,
                          )}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage className={eventUi.fieldError} />
                </FormItem>
              )}
            />

            {eventType === 1 ? (
              <FormField
                control={form.control}
                name="availableDates"
                render={({ field }) => (
                  <FormItem className={eventUi.field}>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className={eventUi.label}>
                        Date selection <span className={eventUi.requiredMark} aria-hidden="true">*</span>
                      </FormLabel>
                      <span className={eventUi.fieldHint}>{field.value.length} selected</span>
                    </div>
                    <FormDescription className="sr-only">Select or deselect multiple dates.</FormDescription>
                    <FormControl>
                      <div className={eventUi.calendar}>
                        <div className={eventUi.calendarMonthCaption}>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={pending}
                            aria-label="Previous month"
                            className={eventUi.calendarToolbarButton}
                            onClick={() => setVisibleMonth((month) => shiftMonth(month, -1))}
                          >
                            <ChevronLeft aria-hidden="true" />
                          </Button>
                          <span className={eventUi.calendarToolbarTitle}>
                            {format(visibleMonth, 'MMMM yyyy')}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={pending}
                            aria-label="Next month"
                            className={eventUi.calendarToolbarButton}
                            onClick={() => setVisibleMonth((month) => shiftMonth(month, 1))}
                          >
                            <ChevronRight aria-hidden="true" />
                          </Button>
                        </div>
                        <EditEventDateCalendar
                          value={field.value}
                          existingDates={event.availableDates}
                          month={visibleMonth}
                          onMonthChange={setVisibleMonth}
                          onChange={field.onChange}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={pending || field.value.length === 0}
                          onClick={() => field.onChange([])}
                          className={eventUi.calendarReset}
                        >
                          <RotateCcw aria-hidden="true" />
                          Reset dates
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className={eventUi.fieldError} />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="availableWeekdays"
                render={({ field }) => (
                  <FormItem className={eventUi.field}>
                    <div className="flex items-center justify-between gap-3">
                      <FormLabel className={eventUi.label}>
                        Weekdays <span className={eventUi.requiredMark} aria-hidden="true">*</span>
                      </FormLabel>
                      <span className={eventUi.fieldHint}>{field.value.length} selected</span>
                    </div>
                    <FormControl>
                      <div className={eventUi.weekdayOptions}>
                        {WEEKDAYS_MONDAY_FIRST.map((day) => {
                          const selected = field.value.includes(day.value);
                          return (
                            <Button
                              type="button"
                              key={day.value}
                              variant="ghost"
                              size="sm"
                              aria-pressed={selected}
                              disabled={pending}
                              onClick={() => field.onChange(selected ? field.value.filter((value) => value !== day.value) : [...field.value, day.value])}
                              className={cn(
                                eventUi.weekdayOption,
                                selected && eventUi.weekdayOptionSelected,
                              )}
                            >
                              {day.shortLabel}
                            </Button>
                          );
                        })}
                      </div>
                    </FormControl>
                    <FormMessage className={eventUi.fieldError} />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="dailyStartTime"
              render={({ field: startField }) => (
                <FormField
                  control={form.control}
                  name="dailyEndTime"
                  render={({ field: endField }) => {
                    const range = timesToMinuteRange(startField.value, endField.value);

                    return (
                      <FormItem className={eventUi.field}>
                        <FormLabel id="event-time-range-label" className={eventUi.label}>
                          What times might work? <span className={eventUi.requiredMark} aria-hidden="true">*</span>
                        </FormLabel>
                        <div className={eventUi.timeRange}>
                          <div className={eventUi.field}>
                            <span className={eventUi.label}>From</span>
                            <div className={cn(eventUi.input, 'flex items-center font-medium tabular-nums')}>
                              {startField.value}
                            </div>
                          </div>
                          <div className={eventUi.field}>
                            <span className={eventUi.label}>To</span>
                            <div className={cn(eventUi.input, 'flex items-center font-medium tabular-nums')}>
                              {endField.value}
                            </div>
                          </div>
                        </div>
                        <FormControl>
                          <Slider
                            aria-labelledby="event-time-range-label"
                            value={range}
                            min={0}
                            max={23 * 60 + 45}
                            step={SLOT_MINUTES}
                            minStepsBetweenThumbs={1}
                            thumbLabels={['From time', 'To time']}
                            disabled={pending}
                            className="min-h-10 px-1"
                            onValueChange={(values) => {
                              if (values.length !== 2) return;
                              const [startTime, endTime] = minuteRangeToTimes([values[0], values[1]]);
                              startField.onChange(startTime);
                              endField.onChange(endTime);
                            }}
                            onValueCommit={() => {
                              startField.onBlur();
                              endField.onBlur();
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-[#6c7a71]">Drag either handle in 15-minute steps.</FormDescription>
                        <FormMessage className={eventUi.fieldError} />
                      </FormItem>
                    );
                  }}
                />
              )}
            />

            </section>
            <DialogFooter className={eventUi.formFooter}>
              <Button type="submit" disabled={pending} className={cn(eventUi.primaryButton, eventUi.formFooterButton)}>
                {pending ? 'Saving…' : 'Save Changes'}
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={pending} className={cn(eventUi.secondaryButton, eventUi.formFooterButton)}>
                  Cancel
                </Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
