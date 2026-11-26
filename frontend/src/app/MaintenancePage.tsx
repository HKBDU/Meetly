import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Mail, RotateCw, Wrench } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import { MeetlyLoader } from '@/shared/components/MeetlyLoader'
import { CONTACT_EMAIL } from '@/shared/constants'
import { useT } from '@/shared/i18n'
import { checkServerHealth, useServerStatus } from '@/shared/lib/serverStatus'

const AUTO_CHECK_SECONDS = 30

/** Lưới heatmap trang trí: mức 0-5 như trên trang chủ, các ô sáng lên theo đợt sóng chéo */
const GRID = [
  [1, 2, 0, 1, 3, 2, 1],
  [2, 4, 1, 3, 5, 3, 2],
  [1, 3, 2, 4, 3, 1, 0],
  [0, 1, 3, 2, 1, 2, 1],
]
const HEAT = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4', 'bg-heat-5']

/** Xanh thương hiệu loang từ đỉnh thẻ xuống, giống thẻ thông báo ở trang chủ */
const GLOW = [
  'radial-gradient(60% 55% at 15% 0%, color-mix(in oklab, var(--primary) 45%, transparent), transparent 70%)',
  'radial-gradient(70% 60% at 85% 0%, color-mix(in oklab, var(--primary) 35%, transparent), transparent 75%)',
].join(', ')

/**
 * Màn "Hệ thống đang bảo trì" khi API lỗi 5xx hoặc không kết nối được. Tự kiểm tra lại mỗi 30 giây
 * (có đếm ngược); server sống lại thì tải lại trang để dữ liệu và kết nối realtime được dựng mới.
 */
export function MaintenancePage() {
  const t = useT()
  const markUp = useServerStatus((state) => state.markUp)
  const [checking, setChecking] = useState(false)
  const [stillDown, setStillDown] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_CHECK_SECONDS)
  const secondsRef = useRef(AUTO_CHECK_SECONDS)

  const check = useCallback(async () => {
    setChecking(true)
    const healthy = await checkServerHealth()
    setChecking(false)
    secondsRef.current = AUTO_CHECK_SECONDS
    setSecondsLeft(AUTO_CHECK_SECONDS)
    if (healthy) {
      markUp()
      window.location.reload()
    } else setStillDown(true)
  }, [markUp])

  // Toast lỗi của request vừa hỏng không cần nữa khi đã có màn này
  useEffect(() => {
    toast.dismiss()
    const late = window.setTimeout(() => toast.dismiss(), 600)
    return () => window.clearTimeout(late)
  }, [])

  // Đếm ngược tới lần tự kiểm tra; tab ẩn thì tạm dừng để không gọi server vô ích
  useEffect(() => {
    if (checking) return
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      secondsRef.current -= 1
      setSecondsLeft(Math.max(secondsRef.current, 0))
      if (secondsRef.current <= 0) void check()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [checking, check])

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg duration-700 animate-in fade-in slide-in-from-bottom-4 motion-reduce:animate-none">
        <section
          role="alert"
          aria-live="polite"
          className="announce-pill relative overflow-hidden rounded-3xl px-6 pt-8 pb-7 text-center shadow-lift sm:px-10"
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: GLOW }} />

          {/* Minh hoạ: heatmap mờ đang "được sửa", cờ lê lơ lửng ở giữa */}
          <div aria-hidden="true" className="relative mx-auto w-fit select-none">
            <div className="grid grid-cols-7 gap-1.5 opacity-90">
              {GRID.flatMap((row, rowIndex) =>
                row.map((level, columnIndex) => (
                  <span
                    key={`${rowIndex}-${columnIndex}`}
                    style={{ animationDelay: `${(rowIndex + columnIndex) * 120}ms` }}
                    className={cn('maint-wave h-5 w-7 rounded-md border border-foreground/5 sm:h-6 sm:w-9', HEAT[level])}
                  />
                )),
              )}
            </div>
            <span
              style={{ '--tilt': '-8deg' } as CSSProperties}
              className="announce-float absolute top-1/2 left-1/2 -mt-8 -ml-8 grid size-16 place-items-center rounded-2xl bg-card text-brand shadow-lift ring-1 ring-foreground/5"
            >
              <Wrench className="size-7" strokeWidth={2} />
            </span>
          </div>

          <div className="relative">
            <span className="mt-7 inline-flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-500/70 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-amber-500" />
              </span>
              {t('maint.badge')}
            </span>

            <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-4xl">
              {t('maint.titleBefore')}{' '}
              <span className="font-serif font-normal tracking-normal text-brand italic">{t('maint.titleEmphasis')}</span>
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-pretty text-muted-foreground">{t('maint.text')}</p>

            <div className="mt-7 flex flex-col items-center gap-3">
              <Button size="lg" className="h-12 px-7" onClick={() => void check()} disabled={checking}>
                {checking ? <MeetlyLoader size="xs" tone="current" decorative /> : <RotateCw aria-hidden="true" />}
                {t(checking ? 'maint.checking' : 'maint.retry')}
              </Button>
              <p className="text-sm text-muted-foreground tabular-nums">
                {checking
                  ? t('maint.checking')
                  : `${stillDown ? `${t('maint.stillDown')} ` : ''}${t('maint.nextCheck', { seconds: secondsLeft })}`}
              </p>
            </div>
          </div>
        </section>

        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mx-auto mt-6 flex w-fit items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          <Mail className="size-4" aria-hidden="true" />
          {t('maint.contact')}
        </a>
      </div>
    </div>
  )
}
