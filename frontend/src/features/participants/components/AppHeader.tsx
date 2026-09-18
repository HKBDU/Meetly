import { CalendarDays } from 'lucide-react';

import { useParticipantStore } from '@/features/participants/store';
import { Button } from '@/shared/components/ui';

/** Header chung cho cả 3 màn; nút rời event chỉ hiện khi đã định danh */
export function AppHeader() {
  const auth = useParticipantStore((s) => s.auth);
  const resetSession = useParticipantStore((s) => s.resetSession);

  return (
    <header className="flex shrink-0 items-center justify-between px-4 py-4 sm:px-8">
      <a href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <span className="rounded-lg bg-emerald-600 p-2 text-white">
          <CalendarDays size={21} aria-hidden="true" />
        </span>
        Meetly
      </a>

      {auth && (
        <Button variant="outline" size="sm" onClick={resetSession}>
          Join with ID
        </Button>
      )}
    </header>
  );
}
