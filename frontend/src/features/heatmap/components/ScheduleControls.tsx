import { Button, Card, CardContent, CardHeader } from '@/shared/components/ui';
import type { ScheduleControlsProps } from '../types';
import { describeRange, useTimeView } from '@/shared/grid/time-view';
import { useT } from '@/shared/i18n';

export function ScheduleControls({
  selected,
  selecting,
  disabled,
  onBegin,
  onCancel,
  onConfirm,
}: ScheduleControlsProps) {
  const t = useT();
  const view = useTimeView();
  const display = selected ? describeRange(view, selected) : null;
  return (
    <Card
      className="gap-4"
      aria-labelledby="schedule-heading"
    >
      <CardHeader>
        <h2 id="schedule-heading" className="font-medium">{t('select.title')}</h2>
      </CardHeader>
      <CardContent>
      {!selecting && (
        <>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t('select.enable')}
          </p>
          <Button
            disabled={disabled}
            onClick={onBegin}
            className="mt-4 w-full"
          >
            {t('select.begin')}
          </Button>
        </>
      )}
      {selecting && (
        <>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t('select.help')}
          </p>
          {display && (
            <div className="mt-4 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{display.day}</p>
              <p className="mt-1 text-xl font-bold">
                {display.time}
              </p>
            </div>
          )}
          <Button
            disabled={disabled || !selected}
            onClick={onConfirm}
            className="mt-4 w-full"
          >
            {t('select.confirm')}
          </Button>
          <Button
            variant="outline"
            disabled={disabled}
            onClick={onCancel}
            className="mt-2 w-full"
          >
            {t('select.cancel')}
          </Button>
        </>
      )}
      </CardContent>
    </Card>
  );
}
