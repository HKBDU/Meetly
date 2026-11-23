import type { CSSProperties } from 'react'

import { cn } from '@/lib/utils'
import { useT } from '@/shared/i18n'

/** Mức màu tĩnh của từng ô khi người dùng tắt chuyển động (vẫn đọc ra là một góc heatmap) */
const STATIC_LEVELS = [1, 2, 3, 2, 3, 4, 3, 4, 5]
/** Mỗi bước chéo trễ hơn một nhịp để ô sáng lan từ góc trên trái xuống góc dưới phải */
const WAVE_STEP_SECONDS = 0.13

const SIZE = {
  xs: 'size-3.5 gap-px',
  sm: 'size-5 gap-[2px]',
  md: 'size-9 gap-[3px]',
  lg: 'size-16 gap-[5px]',
} as const

const CELL_RADIUS = {
  xs: 'rounded-[1px]',
  sm: 'rounded-[2px]',
  md: 'rounded-[3px]',
  lg: 'rounded-[6px]',
} as const

export interface MeetlyLoaderProps {
  size?: keyof typeof SIZE
  /**
   * `brand`: các ô đổi màu theo thang heatmap (dùng trên nền thường).
   * `current`: dùng màu chữ hiện tại, hợp với trong nút hoặc trên nền màu.
   */
  tone?: 'brand' | 'current'
  /** Chữ hiện dưới loader; bỏ trống thì chỉ đọc cho trình đọc màn hình */
  label?: string
  /** Chỉ để trang trí (VD trong nút đã có chữ "Đang lưu…"): ẩn khỏi trình đọc màn hình */
  decorative?: boolean
  className?: string
}

/**
 * Loader đặc trưng của Meetly: lưới 3×3 như một góc heatmap, các ô sáng lên theo đường
 * chéo giống lịch rảnh đang được lấp dần. Animation nằm trong `global.css` (`.meetly-loader-cell`).
 */
export function MeetlyLoader({ size = 'md', tone = 'brand', label, decorative = false, className }: MeetlyLoaderProps) {
  const t = useT()
  return (
    <span
      role={decorative ? undefined : 'status'}
      aria-live={decorative ? undefined : 'polite'}
      aria-hidden={decorative || undefined}
      data-tone={tone}
      className={cn('meetly-loader inline-flex flex-col items-center gap-3', className)}
    >
      <span aria-hidden="true" className={cn('grid shrink-0 grid-cols-3 grid-rows-3', SIZE[size])}>
        {STATIC_LEVELS.map((level, index) => {
          const row = Math.floor(index / 3)
          const column = index % 3
          return (
            <span
              key={index}
              className={cn('meetly-loader-cell', CELL_RADIUS[size])}
              style={
                {
                  '--delay': `${(row + column) * WAVE_STEP_SECONDS}s`,
                  '--static-heat': `var(--heat-${level})`,
                  '--static-opacity': 0.3 + level * 0.14,
                } as CSSProperties
              }
            />
          )
        })}
      </span>
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
