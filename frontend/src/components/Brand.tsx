import { CalendarDays } from 'lucide-react'
import { go } from '@/shared/session'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <button className="brand" onClick={() => go('/')} aria-label="Về trang chủ">
      <span className="brand-mark">
        <CalendarDays size={compact ? 18 : 22} />
      </span>
      <span>meetly</span>
    </button>
  )
}
