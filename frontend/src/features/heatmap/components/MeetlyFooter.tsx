import { CalendarDays, Heart, MessageCircle, Send } from 'lucide-react';

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
        {/* Decorative only until the team supplies its social URLs. */}
        <div aria-hidden="true" className="flex items-center gap-5">
          <span className="text-sm font-medium">𝕏</span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.6-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.58 9.58 0 0 1 12 6.82c.85 0 1.71.11 2.51.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
          </svg>
          <span className="rounded-sm border border-current px-0.5 text-[10px] font-bold leading-3">
            in
          </span>
          <Send size={15} />
          <MessageCircle size={15} />
        </div>
      </div>
    </footer>
  );
}
