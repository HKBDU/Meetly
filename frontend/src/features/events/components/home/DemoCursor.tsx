import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'

interface DemoCursorProps {
  /** Tên hiện cạnh con trỏ, như con trỏ của người khác trong Figma */
  label?: string
  /** Màu nhãn tên (class nền Tailwind) */
  tone?: string
  pressing?: boolean
  className?: string
  style?: CSSProperties
}

/** Con trỏ chuột giả cho các bản demo trang chủ; đầu mũi tên nằm ở góc trên trái của phần tử */
export function DemoCursor({ label, tone = 'bg-foreground', pressing = false, className, style }: DemoCursorProps) {
  return (
    <span aria-hidden="true" style={style} className={cn('pointer-events-none absolute top-0 left-0 z-20 select-none', className)}>
      <span className={cn('block transition-transform duration-150', pressing && 'scale-85')}>
        <svg width="18" height="18" viewBox="0 0 18 18" className="drop-shadow-[0_2px_3px_rgb(0_0_0/0.25)]">
          <path
            d="M2 1.5 15.5 8.2 9.4 9.6 6.6 15.6Z"
            className="fill-foreground stroke-background"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {label && (
        <span
          className={cn(
            'absolute top-4 left-3.5 rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-white shadow-sm',
            tone,
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}
