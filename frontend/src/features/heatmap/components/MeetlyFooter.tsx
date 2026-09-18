import { CalendarDays, Heart } from 'lucide-react';

export function MeetlyFooter() {
  return (
    <footer className="mt-auto bg-emerald-600 px-5 py-5 text-white sm:px-8">
      <div className="mx-auto flex max-w-[1376px] flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold">
            <CalendarDays size={17} aria-hidden="true" />
            meetly
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs">
            Made with <Heart size={12} aria-label="love" /> by{' '}
            <span className="underline underline-offset-2">@hkbdu</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
