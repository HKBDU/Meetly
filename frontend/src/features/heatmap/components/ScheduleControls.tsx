import { Button, Card, CardContent, CardHeader } from '@/shared/components/ui';
import type { ScheduleControlsProps } from '../types';
import { formatDay } from '@/shared/grid/model';
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
          {selected && (
            <div className="mt-4 rounded-lg border border-border p-4">
              <p className="text-sm font-medium">{formatDay(selected)}</p>
              <p className="mt-1 text-xl font-bold">
                {selected.startTime} – {selected.endTime}
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
