import { House } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useParticipantStore } from '@/features/participants/store';
import { Button } from '@/shared/components/ui';

/** Header chung cho các màn; nút về trang chủ chỉ hiện khi đã định danh. */
export function AppHeader() {
  const auth = useParticipantStore((s) => s.auth);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showBackToHome = Boolean(auth) && pathname.startsWith('/e/');

  return (
    <header className="flex shrink-0 items-center justify-between px-4 py-4 sm:px-8">
      <a href="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
        <img
          src="/meetly-logo.png"
          alt=""
          aria-hidden="true"
          className="h-9 w-11 shrink-0 object-contain"
        />
        Meetly
      </a>

      {showBackToHome && (
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <House aria-hidden="true" />
          Back to Home
        </Button>
      )}
    </header>
  );
}
