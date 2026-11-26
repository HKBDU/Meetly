import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { cn } from '@/lib/utils'
import { formatHourLabel } from '@/lib/date-time'
import { WEEKDAYS } from '@/shared/constants'
import { useT } from '@/shared/i18n'
import { DemoCursor } from './DemoCursor'
import { useDemoPlaying, useFrameLoop, useReducedMotion } from './demoPlayback'

/** Thứ 2 → thứ 6 và 17:00 → 21:00 */
const DAYS = [1, 2, 3, 4, 5] as const
const HOURS = ['17:00', '18:00', '19:00', '20:00', '21:00']
const HEAT = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4', 'bg-heat-5']

/** Vùng một người kéo chọn trên lưới: cột (ngày) c0..c1, hàng (giờ) r0..r1 */
interface Area {
  c0: number
  c1: number
  r0: number
  r1: number
}

/**
 * 9 người lần lượt vào kéo chọn giờ rảnh. Kịch bản được chọn để Thứ 3 lúc 19:00 là ô duy nhất
 * có 8/9 người, khớp với câu chốt cuối demo.
 */
const PEOPLE: { name: string; tone: string; area: Area }[] = [
  { name: 'Anh', tone: 'bg-sky-500', area: { c0: 0, c1: 2, r0: 1, r1: 3 } },
  { name: 'Minh', tone: 'bg-violet-500', area: { c0: 1, c1: 1, r0: 0, r1: 4 } },
  { name: 'Khoa', tone: 'bg-amber-500', area: { c0: 1, c1: 4, r0: 2, r1: 3 } },
  { name: 'Linh', tone: 'bg-rose-500', area: { c0: 0, c1: 1, r0: 2, r1: 4 } },
  { name: 'Trang', tone: 'bg-indigo-500', area: { c0: 3, c1: 4, r0: 0, r1: 2 } },
  { name: 'Huy', tone: 'bg-orange-500', area: { c0: 1, c1: 3, r0: 1, r1: 2 } },
  { name: 'Nam', tone: 'bg-teal-500', area: { c0: 0, c1: 4, r0: 2, r1: 2 } },
  { name: 'Phúc', tone: 'bg-fuchsia-500', area: { c0: 1, c1: 2, r0: 2, r1: 4 } },
  { name: 'Vy', tone: 'bg-cyan-600', area: { c0: 1, c1: 4, r0: 1, r1: 3 } },
]
const TOTAL = PEOPLE.length
const VISIBLE_AVATARS = 4

type Frame =
  | { kind: 'idle' | 'finale' | 'reset'; ms: number }
  | { kind: 'move' | 'drag' | 'commit'; person: number; ms: number }

/** 3 người đầu chậm để người xem hiểu thao tác, những người sau nhanh dần cho đỡ dài */
const FRAMES: Frame[] = [
  { kind: 'idle', ms: 500 },
  ...PEOPLE.flatMap((_, person): Frame[] => {
    const fast = person >= 3
    return [
      { kind: 'move', person, ms: fast ? 300 : 450 },
      { kind: 'drag', person, ms: fast ? 380 : 600 },
      { kind: 'commit', person, ms: fast ? 240 : 380 },
    ]
  }),
  { kind: 'finale', ms: 3200 },
  { kind: 'reset', ms: 600 },
]
const DURATIONS = FRAMES.map((frame) => frame.ms)
const FINALE = FRAMES.findIndex((frame) => frame.kind === 'finale')

const inArea = (area: Area, row: number, column: number) =>
  row >= area.r0 && row <= area.r1 && column >= area.c0 && column <= area.c1

/** Cùng thang 0-5 như heatmap thật, tính theo tổng số người của nhóm */
const heatLevel = (count: number) => (count === 0 ? 0 : Math.min(5, Math.ceil((count / TOTAL) * 5)))

/** Trạng thái của demo tại một khung: ai đã vào, ai đã lưu, con trỏ đang ở đâu */
function sceneAt(index: number) {
  const frame = FRAMES[index]
  if (!('person' in frame)) {
    const done = frame.kind === 'finale' ? TOTAL : 0
    return { frame, joined: done, saved: done }
  }
  const saved = frame.kind === 'commit' ? frame.person + 1 : frame.person
  return { frame, joined: frame.person + 1, saved }
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Bản xem trước sống động ở đầu trang chủ: mọi người lần lượt vào, kéo chọn giờ rảnh, heatmap đậm dần
 * và khung giờ tốt nhất cập nhật theo. Chỉ để trang trí (aria-hidden), không gọi API.
 */
export function LiveHeatmapDemo() {
  const t = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [boxes, setBoxes] = useState<Box[]>([])

  const reducedMotion = useReducedMotion()
  const playing = useDemoPlaying(rootRef) && !reducedMotion
  const [frameIndex] = useFrameLoop(DURATIONS, playing)
  const { frame, joined, saved } = sceneAt(reducedMotion ? FINALE : frameIndex)

  // Vị trí từng ô so với lưới, để con trỏ và vùng chọn bám đúng ô ở mọi kích thước màn hình
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const measure = () => {
      const origin = grid.getBoundingClientRect()
      setBoxes(
        cellRefs.current.map((cell) => {
          const rect = cell?.getBoundingClientRect()
          return rect
            ? { x: rect.left - origin.left, y: rect.top - origin.top, w: rect.width, h: rect.height }
            : { x: 0, y: 0, w: 0, h: 0 }
        }),
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    return () => observer.disconnect()
  }, [])

  const counts = useMemo(
    () =>
      HOURS.map((_, row) =>
        DAYS.map((__, column) => PEOPLE.slice(0, saved).filter(({ area }) => inArea(area, row, column)).length),
      ),
    [saved],
  )

  // Khung giờ đang tốt nhất (nhiều người rảnh nhất, hoà thì lấy ô đầu tiên) cập nhật theo từng người lưu
  const best = useMemo(() => {
    let top = { row: -1, column: -1, count: 0 }
    counts.forEach((row, rowIndex) =>
      row.forEach((count, columnIndex) => {
        if (count > top.count) top = { row: rowIndex, column: columnIndex, count }
      }),
    )
    return top
  }, [counts])

  const active = 'person' in frame ? frame.person : -1
  const activePerson = active >= 0 ? PEOPLE[active] : null
  const box = (row: number, column: number) => boxes[row * DAYS.length + column]
  const ready = boxes.length === HOURS.length * DAYS.length

  // Con trỏ: lúc "move" bay tới ô bắt đầu, lúc "drag" kéo tới ô kết thúc rồi nhả ở đó
  let cursor: Box | undefined
  let selection: Box | undefined
  if (activePerson && ready) {
    const { area } = activePerson
    const start = box(area.r0, area.c0)
    const end = box(area.r1, area.c1)
    const to = frame.kind === 'move' ? start : end
    cursor = to
    selection = { x: start.x, y: start.y, w: to.x + to.w - start.x, h: to.y + to.h - start.y }
  }
  const motion = { transitionDuration: `${Math.round(frame.ms * 0.85)}ms` }

  const extra = Math.max(0, joined - VISIBLE_AVATARS)
  const finale = frame.kind === 'finale'

  return (
    <div ref={rootRef} aria-hidden="true" className="relative mx-auto mt-16 w-full max-w-2xl select-none">
      <div className="rounded-2xl border bg-card p-5 shadow-lift sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{t('home.demoTitle')}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{t('home.demoResponded', { count: saved })}</p>
          </div>
          <div className="flex h-7 -space-x-1.5">
            {PEOPLE.slice(0, Math.min(joined, VISIBLE_AVATARS)).map(({ name, tone }) => (
              <span
                key={name}
                className={cn(
                  'grid size-7 place-items-center rounded-full border-2 border-card text-[11px] font-semibold text-white duration-300 animate-in fade-in zoom-in-50',
                  tone,
                )}
              >
                {name[0]}
              </span>
            ))}
            {extra > 0 && (
              <span
                key={extra}
                className="grid size-7 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground tabular-nums duration-300 animate-in zoom-in-75"
              >
                +{extra}
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-1.5 text-[11px] text-muted-foreground">
          <span />
          <div className="grid grid-cols-5 gap-1.5 pb-1.5">
            {DAYS.map((day) => (
              <span key={day} className="text-center">
                {WEEKDAYS[day].shortLabel}
              </span>
            ))}
          </div>

          <div className="grid grid-rows-5 gap-1.5">
            {HOURS.map((hour) => (
              <span key={hour} className="self-center">
                {formatHourLabel(hour)}
              </span>
            ))}
          </div>

          <div ref={gridRef} className="relative grid grid-cols-5 grid-rows-5 gap-1.5">
            {HOURS.map((_, row) =>
              DAYS.map((__, column) => {
                const count = counts[row][column]
                // Ô vừa được người hiện tại lưu thì "nảy" nhẹ; đổi tên animation theo chẵn/lẻ để chạy lại mỗi lần
                const justSaved = frame.kind === 'commit' && activePerson && inArea(activePerson.area, row, column)
                const isBest = finale && row === best.row && column === best.column
                return (
                  <span
                    key={`${row}-${column}`}
                    ref={(element) => {
                      cellRefs.current[row * DAYS.length + column] = element
                    }}
                    style={justSaved ? ({ animationName: active % 2 ? 'demo-cell-pop-b' : 'demo-cell-pop-a' } as CSSProperties) : undefined}
                    className={cn(
                      'demo-cell h-7 rounded-md border border-foreground/4 transition-[background-color,box-shadow] duration-500',
                      HEAT[heatLevel(count)],
                      isBest && 'demo-best ring-2 ring-foreground ring-offset-2 ring-offset-card',
                    )}
                  />
                )
              }),
            )}

            {/* Vùng đang kéo chọn, như khi dùng chuột trên lưới thật */}
            {selection && (
              <span
                style={{ left: selection.x, top: selection.y, width: selection.w, height: selection.h, ...motion }}
                className={cn(
                  'pointer-events-none absolute rounded-md border-2 border-primary bg-primary/15 transition-[left,top,width,height,opacity] ease-out',
                  frame.kind === 'drag' ? 'opacity-100' : 'opacity-0',
                )}
              />
            )}

            {activePerson && cursor && (
              <DemoCursor
                label={activePerson.name}
                tone={activePerson.tone}
                pressing={frame.kind === 'drag'}
                className="transition-transform ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{ transform: `translate(${cursor.x + cursor.w * 0.6}px, ${cursor.y + cursor.h * 0.45}px)`, ...motion }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Khung giờ tốt nhất hiện tại; tới cuối thì "chốt" bằng viền quanh ô */}
      <div
        className={cn(
          'absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full border bg-card px-4 py-2 text-sm whitespace-nowrap shadow-lift transition-all duration-500',
          best.count > 0 ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        <span className="relative flex size-2">
          {finale && <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/60" />}
          <span className="relative size-2 rounded-full bg-brand" />
        </span>
        {best.count > 0 && (
          <>
            <span key={`${best.row}-${best.column}`} className="font-medium duration-300 animate-in fade-in">
              {WEEKDAYS[DAYS[best.column]].shortLabel}, {formatHourLabel(HOURS[best.row])}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {t('home.demoAvailable', { count: best.count, total: saved })}
            </span>
          </>
        )}
      </div>
    </div>
  )
}
