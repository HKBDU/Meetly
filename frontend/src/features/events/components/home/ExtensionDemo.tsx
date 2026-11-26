import { useMemo, useRef } from 'react'
import { Check, Link2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useT, type MessageKey } from '@/shared/i18n'
import { DemoCursor } from './DemoCursor'
import { useDemoPlaying, useFrameLoop, useReducedMotion } from './demoPlayback'

const CHIPS: { key: MessageKey; pick: boolean }[] = [
  { key: 'days.next7', pick: true },
  { key: 'days.next5Weekdays', pick: false },
  { key: 'preset.working', pick: true },
  { key: 'preset.evening', pick: false },
]
const TYPE_MS = 75

type Step = 'empty' | 'type' | 'chip1' | 'chip2' | 'press' | 'copied' | 'reset'

/** Kịch bản: gõ tên → chọn "7 ngày tới" → chọn "Giờ hành chính" → bấm nút → link đã chép */
function buildFrames(titleLength: number) {
  return [
    { step: 'empty' as Step, typed: 0, ms: 600 },
    ...Array.from({ length: titleLength }, (_, index) => ({ step: 'type' as Step, typed: index + 1, ms: TYPE_MS })),
    { step: 'chip1' as Step, typed: titleLength, ms: 550 },
    { step: 'chip2' as Step, typed: titleLength, ms: 650 },
    { step: 'press' as Step, typed: titleLength, ms: 280 },
    { step: 'copied' as Step, typed: titleLength, ms: 2600 },
    { step: 'reset' as Step, typed: 0, ms: 450 },
  ]
}

/** Bản demo popup extension ở trang chủ: tự gõ, tự chọn, tự tạo link. Chỉ để trang trí. */
export function ExtensionDemo() {
  const t = useT()
  const rootRef = useRef<HTMLDivElement>(null)
  const title = t('home.extDemoTitle')
  const frames = useMemo(() => buildFrames(title.length), [title.length])
  const durations = useMemo(() => frames.map((frame) => frame.ms), [frames])

  const reducedMotion = useReducedMotion()
  const playing = useDemoPlaying(rootRef) && !reducedMotion
  const [frameIndex] = useFrameLoop(durations, playing)
  // Đổi ngôn ngữ làm kịch bản ngắn/dài ra: giữ chỉ số trong phạm vi
  const frame = reducedMotion ? frames[frames.length - 2] : frames[frameIndex % frames.length]
  const order: Step[] = ['empty', 'type', 'chip1', 'chip2', 'press', 'copied', 'reset']
  const reached = (step: Step) => frame.step !== 'reset' && order.indexOf(frame.step) >= order.indexOf(step)

  const picked = [reached('chip1'), false, reached('chip2'), false]
  const copied = frame.step === 'copied'
  const typing = frame.step === 'empty' || frame.step === 'type'

  // Con trỏ: nằm cạnh ô nhập khi đang gõ, rồi tới chip 1, chip 2, nút tạo
  const cursorAt = frame.step === 'chip1' ? 'left-[22%] top-[58%]' : frame.step === 'chip2' ? 'left-[22%] top-[70%]' : 'left-[62%] top-[86%]'

  return (
    <div ref={rootRef} aria-hidden="true" className="relative mx-auto w-full max-w-80 select-none">
      <div className="absolute -inset-6 rounded-[2rem] bg-brand/10 blur-2xl" />
      <div className="relative rounded-2xl border bg-background p-4 shadow-lift">
        <div className="flex items-center gap-2 border-b pb-3 text-sm font-semibold">
          <img src="/meetly-logo.png" alt="" className="h-4 w-5 object-contain" />
          Meetly
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">{t('common.eventName')}</p>
        <div
          className={cn(
            'mt-1 flex h-9 items-center rounded-lg border bg-card px-3 text-sm transition-colors',
            typing && 'border-primary/60 ring-3 ring-primary/15',
          )}
        >
          <span className="truncate">{title.slice(0, frame.typed)}</span>
          {typing && <span className="demo-caret ml-px h-4 w-px bg-foreground" />}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {CHIPS.map(({ key }, index) => (
            <span
              key={key}
              className={cn(
                'rounded-full border px-2.5 py-1 transition-all duration-300',
                picked[index] ? 'scale-100 border-primary bg-brand-soft font-medium text-brand' : 'border-border',
              )}
            >
              {t(key)}
            </span>
          ))}
        </div>

        <div className="relative mt-4">
          <div
            className={cn(
              'flex h-9 items-center justify-center gap-1.5 rounded-full text-sm font-medium transition-all duration-200',
              copied ? 'bg-brand-soft text-brand' : 'bg-primary text-primary-foreground',
              frame.step === 'press' && 'scale-[0.97]',
            )}
          >
            {copied && <Check className="size-4" strokeWidth={2.5} />}
            {t(copied ? 'home.extDemoCopied' : 'ext.createAndCopy')}
          </div>
          {/* Link vừa chép nổi lên trên nút như một toast nhỏ */}
          <div
            className={cn(
              'absolute inset-x-2 -top-11 flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-xs shadow-lift transition-all duration-300',
              copied ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
            )}
          >
            <Link2 className="size-3.5 shrink-0 text-brand" />
            <span className="truncate font-mono">meetly-soon.vercel.app/e/K7P2QX</span>
          </div>
        </div>

        {!typing && !copied && frame.step !== 'reset' && (
          <DemoCursor
            pressing={frame.step === 'press'}
            className={cn('transition-[top,left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]', cursorAt)}
          />
        )}
      </div>
    </div>
  )
}
