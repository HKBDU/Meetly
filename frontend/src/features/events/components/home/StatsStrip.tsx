import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, CalendarPlus, Users, type LucideIcon } from 'lucide-react'

import { env } from '@/lib/env'
import { useLocale, useT, type MessageKey } from '@/shared/i18n'
import { useReducedMotion } from './demoPlayback'

interface PublicStats {
  events: number
  participants: number
  finalized: number
}

/**
 * Gọi bằng `fetch` thường, không qua axios: trang chủ không được bật màn bảo trì chỉ vì
 * dải số liệu này lỗi (VD server Render đang ngủ). Lỗi thì ẩn dải đi là xong.
 */
async function loadStats(signal: AbortSignal): Promise<PublicStats | null> {
  try {
    const response = await fetch(`${env.apiBaseUrl}/api/v1/stats`, { signal })
    if (!response.ok) return null
    const body = (await response.json()) as { value?: PublicStats }
    return body.value ?? null
  } catch {
    return null
  }
}

const ITEMS: { key: keyof PublicStats; label: MessageKey; icon: LucideIcon }[] = [
  { key: 'events', label: 'home.statEvents', icon: CalendarPlus },
  { key: 'participants', label: 'home.statPeople', icon: Users },
  { key: 'finalized', label: 'home.statFinalized', icon: CalendarCheck },
]

/** Số đếm chạy từ 0 lên giá trị thật khi dải số liệu hiện ra */
function CountUp({ value, run }: { value: number; run: boolean }) {
  const { locale } = useLocale()
  const reducedMotion = useReducedMotion()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!run || reducedMotion) return
    let frame = 0
    const started = performance.now()
    const duration = 1200
    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration)
      // Chậm dần về cuối cho cảm giác "dừng" tự nhiên
      setShown(Math.round(value * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [run, value, reducedMotion])

  return <>{new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US').format(reducedMotion ? value : shown)}</>
}

/** Dải số liệu thật của Meetly trên trang chủ; chỉ hiện khi đã có số và có ít nhất một event */
export function StatsStrip() {
  const t = useT()
  const ref = useRef<HTMLDListElement>(null)
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    void loadStats(controller.signal).then(setStats)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setInView(true)
      observer.disconnect()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [stats])

  if (!stats || stats.events === 0) return null

  return (
    <dl
      ref={ref}
      className="mt-16 grid grid-cols-3 divide-x rounded-2xl border bg-card/60 py-5 text-center shadow-soft backdrop-blur duration-700 animate-in fade-in"
    >
      {ITEMS.map(({ key, label, icon: Icon }) => (
        <div key={key} className="flex flex-col items-center gap-1 px-2">
          <Icon className="size-4 text-brand" aria-hidden="true" />
          {/* dt phải đứng trước dd trong HTML; `order-last` đưa nhãn xuống dưới con số */}
          <dt className="order-last text-xs text-muted-foreground sm:text-sm">{t(label)}</dt>
          <dd className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
            <CountUp value={stats[key]} run={inView} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
