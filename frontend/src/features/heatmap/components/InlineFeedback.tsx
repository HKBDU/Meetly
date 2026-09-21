import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InlineFeedbackProps {
  message: string;
  tone: 'success' | 'error' | 'info';
  className?: string;
}

const toneClasses = {
  success: 'border-primary/25 bg-primary/10 text-foreground',
  error: 'border-destructive/25 bg-destructive/10 text-destructive',
  info: 'border-border bg-muted text-muted-foreground',
};

const icons = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

export function InlineFeedback({ message, tone, className }: InlineFeedbackProps) {
  const Icon = icons[tone];

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex w-fit max-w-full items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-xs sm:max-w-lg',
        toneClasses[tone],
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
