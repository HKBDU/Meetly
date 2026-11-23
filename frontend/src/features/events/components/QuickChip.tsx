import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Nút chọn nhanh dạng chip; `active` khi lựa chọn hiện tại đúng bằng preset này */
export function QuickChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200',
        'focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-soft'
          : 'border-border bg-card text-foreground hover:border-foreground/25',
      )}
    >
      {icon}
      {children}
    </button>
  )
}
