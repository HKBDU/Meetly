import { CalendarClock } from 'lucide-react';

import { useParticipantStore } from '@/features/participants/store';
import { Button } from '@/shared/components/ui';

/**
 * Header cố định đầu trang - hiển thị xuyên suốt cả 3 màn Auth/Overview/Personal.
 * Chiều cao THẤP theo đúng ảnh mẫu (chỉ padding, không set height cố định) -
 * bản trước dùng h-14 (56px) cao hơn hẳn ảnh mẫu (~40px).
 * Nút bên phải CHỈ hiện khi đã định danh (auth != null) - dùng để rời sự
 * kiện hiện tại, tham gia sự kiện khác bằng mã/ID khác (xem `resetSession`
 * trong store, không phải "log out" thật).
 */
export function AppHeader() {
  const auth = useParticipantStore((s) => s.auth);
  const resetSession = useParticipantStore((s) => s.resetSession);

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-2 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CalendarClock className="size-5" />
        </div>
        <span className="text-lg font-bold text-foreground">meetly</span>
      </div>

      {auth && (
        <Button variant="outline" size="sm" onClick={resetSession}>
          Join with ID
        </Button>
      )}
    </header>
  );
}
