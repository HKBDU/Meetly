import { useId } from 'react'

import { cn } from '@/lib/utils'
import { useT } from '@/shared/i18n'

const SIZE = {
  xs: 'w-3.5',
  sm: 'w-5',
  md: 'w-9',
  lg: 'w-16',
} as const

export interface MeetlyLoaderProps {
  size?: keyof typeof SIZE
  /**
   * `brand`: giữ màu gốc của logo (dùng trên nền thường).
   * `current`: dùng màu chữ hiện tại, hợp với trong nút hoặc trên nền màu.
   */
  tone?: 'brand' | 'current'
  /** Chữ hiện dưới loader; bỏ trống thì chỉ đọc cho trình đọc màn hình */
  label?: string
  /** Chỉ để trang trí (VD trong nút đã có chữ "Đang lưu…"): ẩn khỏi trình đọc màn hình */
  decorative?: boolean
  className?: string
}

export function MeetlyLoader({ size = 'md', tone = 'brand', label, decorative = false, className }: MeetlyLoaderProps) {
  const t = useT()
  const id = useId()
  const logo = <image href="/meetly-logo.png" width="256" height="193" />
  const mark = tone === 'current'
    ? <rect width="256" height="193" fill="currentColor" mask={`url(#${id}-logo)`} />
    : logo

  return (
    <span
      role={decorative ? undefined : 'status'}
      aria-live={decorative ? undefined : 'polite'}
      aria-hidden={decorative || undefined}
      className={cn('inline-flex flex-col items-center gap-3', className)}
    >
      <svg aria-hidden="true" viewBox="0 0 256 193" className={cn('block h-auto shrink-0', SIZE[size])}>
        <defs>
          {tone === 'current' && <mask id={`${id}-logo`} maskContentUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>{logo}</mask>}
          <mask id={`${id}-trace`} maskContentUnits="userSpaceOnUse">
            {/* The broad stroke reveals the original logo without changing its silhouette. */}
            <path
              className="meetly-loader-trace"
              d="M 37 156 V 45 Q 37 35 46 45 L 114 112 Q 128 128 142 112 L 210 45 Q 219 35 219 45 V 156"
              pathLength="1"
              fill="none"
              stroke="white"
              strokeWidth="100"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>
        <g className="meetly-loader-base">{mark}</g>
        <g className="meetly-loader-fill" mask={`url(#${id}-trace)`}>{mark}</g>
      </svg>
      {label ? (
        <span className="text-sm text-muted-foreground">{label}</span>
      ) : (
        !decorative && <span className="sr-only">{t('common.loading')}</span>
      )}
    </span>
  )
}

/** Loader giữa vùng nội dung khi cả trang đang tải; hiện sau một nhịp ngắn để tải nhanh thì không nháy */
export function PageLoader({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn('meetly-loader-delayed flex min-h-[60dvh] items-center justify-center px-4', className)}>
      <MeetlyLoader size="lg" label={label} />
    </div>
  )
}
