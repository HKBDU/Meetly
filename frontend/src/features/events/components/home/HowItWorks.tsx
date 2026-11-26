import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Copy, Link2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { WEEKDAYS } from '@/shared/constants'
import { useT, type MessageKey } from '@/shared/i18n'

const STEPS: { title: MessageKey; text: MessageKey }[] = [
  { title: 'home.step1Title', text: 'home.step1Text' },
  { title: 'home.step2Title', text: 'home.step2Text' },
  { title: 'home.step3Title', text: 'home.step3Text' },
]

/** Bật `true` một lần khi phần tử cuộn vào màn hình (không tắt lại khi cuộn đi) */
function useRevealed<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setRevealed(true)
        observer.disconnect()
      },
      { threshold: 0.25 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, revealed] as const
}

const delay = (ms: number) => ({ transitionDelay: `${ms}ms`, animationDelay: `${ms}ms` }) as CSSProperties

/** Bước 1: chọn ngày (các chip sáng lần lượt) và khung giờ */
function PickIllustration() {
  const days = [1, 2, 3, 4, 5] as const
  const picked = [true, true, false, true, true]
  return (
    <div className="grid gap-2">
      <div className="flex gap-1">
        {days.map((day, index) => (
          <span
            key={day}
            style={delay(200 + index * 90)}
            className={cn(
              'grid h-7 flex-1 place-items-center rounded-md border text-[10px] transition-colors duration-300',
              picked[index]
                ? 'group-data-[revealed=true]:border-primary group-data-[revealed=true]:bg-brand-soft group-data-[revealed=true]:font-medium group-data-[revealed=true]:text-brand'
                : 'text-muted-foreground',
            )}
          >
            {WEEKDAYS[day].shortLabel}
          </span>
        ))}
      </div>
      <div className="relative h-2 rounded-full bg-muted">
        <span
          style={delay(700)}
          className="absolute inset-y-0 left-[30%] w-0 rounded-full bg-primary transition-[width] duration-700 ease-out group-data-[revealed=true]:w-[45%]"
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>9:00</span>
        <span>17:00</span>
      </div>
    </div>
  )
}

/** Bước 2: một link, mọi người lần lượt vào */
function ShareIllustration() {
  const people = [
    ['A', 'bg-sky-500'],
    ['M', 'bg-violet-500'],
    ['K', 'bg-amber-500'],
    ['L', 'bg-rose-500'],
  ] as const
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-[11px]">
        <Link2 className="size-3.5 shrink-0 text-brand" />
        <span className="truncate font-mono">meetly…/e/K7P2QX</span>
        <Copy className="ml-auto size-3 shrink-0 text-muted-foreground" />
      </div>
      <div className="flex -space-x-1.5">
        {people.map(([initial, tone], index) => (
          <span
            key={initial}
            style={delay(300 + index * 140)}
            className={cn(
              'grid size-7 scale-50 place-items-center rounded-full border-2 border-card text-[11px] font-semibold text-white opacity-0 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-data-[revealed=true]:scale-100 group-data-[revealed=true]:opacity-100',
              tone,
            )}
          >
            {initial}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Bước 3: lưới tô dần, ô đậm nhất được khoanh */
function BestIllustration() {
  const grid = [
    [1, 2, 1, 0],
    [2, 5, 3, 1],
    [1, 3, 2, 2],
  ]
  // Viết đủ tên class để Tailwind quét được (không ghép chuỗi động)
  const heat = [
    'group-data-[revealed=true]:bg-heat-0',
    'group-data-[revealed=true]:bg-heat-1',
    'group-data-[revealed=true]:bg-heat-2',
    'group-data-[revealed=true]:bg-heat-3',
    'group-data-[revealed=true]:bg-heat-4',
    'group-data-[revealed=true]:bg-heat-5',
  ]
  return (
    <div className="grid grid-cols-4 gap-1">
      {grid.flatMap((row, rowIndex) =>
        row.map((level, columnIndex) => {
          const best = level === 5
          return (
            <span
              key={`${rowIndex}-${columnIndex}`}
              style={delay(200 + (rowIndex + columnIndex) * 90)}
              className={cn(
                'h-5 rounded-md border border-foreground/5 bg-heat-0 transition-[background-color,box-shadow] duration-500',
                heat[level],
                best && 'group-data-[revealed=true]:ring-2 group-data-[revealed=true]:ring-foreground group-data-[revealed=true]:ring-offset-2 group-data-[revealed=true]:ring-offset-card',
              )}
            />
          )
        }),
      )}
    </div>
  )
}

const ILLUSTRATIONS = [PickIllustration, ShareIllustration, BestIllustration]

/** "Cách hoạt động": 3 bước, mỗi bước có minh hoạ nhỏ, hiện dần khi cuộn tới */
export function HowItWorks() {
  const t = useT()
  const [ref, revealed] = useRevealed<HTMLOListElement>()
  return (
    <ol ref={ref} className="mt-24 grid gap-4 sm:grid-cols-3">
      {STEPS.map(({ title, text }, index) => {
        const Illustration = ILLUSTRATIONS[index]
        return (
          <li
            key={title}
            data-revealed={revealed}
            style={delay(index * 120)}
            className="group translate-y-4 rounded-2xl border bg-card p-5 opacity-0 shadow-soft transition-all duration-700 ease-out data-[revealed=true]:translate-y-0 data-[revealed=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100"
          >
            <div aria-hidden="true" className="h-24 rounded-xl bg-muted/40 p-3">
              <Illustration />
            </div>
            <p className="mt-5 font-serif text-2xl text-muted-foreground italic">0{index + 1}</p>
            <p className="mt-1 font-medium">{t(title)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(text)}</p>
          </li>
        )
      })}
    </ol>
  )
}
