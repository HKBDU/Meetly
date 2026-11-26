import type { CSSProperties, ReactNode } from 'react'
import { CalendarCheck, CalendarPlus, Check, Copy, Video } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatHourLabel } from '@/lib/date-time'
import { WEEKDAYS } from '@/shared/constants'
import { useT } from '@/shared/i18n'
import { MeetlyLoader } from '@/shared/components/MeetlyLoader'
import { DemoCursor } from './DemoCursor'

/** Con trỏ bay vào nút rồi bấm; sau khi bấm thì mờ đi */
function ClickTarget({ phase, children, className }: { phase: number; children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <div className={cn('transition-transform duration-150', phase === 1 && 'scale-[0.97]')}>{children}</div>
      {/* Lớp ngoài chạy animation bay vào, lớp trong mới mờ đi: animation giữ opacity nên không gộp chung được */}
      <span className="demo-cursor-in absolute top-5 right-10 z-20">
        <DemoCursor pressing={phase === 1} className={cn('transition-opacity duration-300', phase >= 2 && 'opacity-0')} />
      </span>
    </div>
  )
}

function FinalizedHeader() {
  const t = useT()
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[11px] font-medium text-brand">
        <Check className="size-3" strokeWidth={3} />
        {t('home.gDemoFinal')}
      </span>
      <p className="mt-3 text-sm font-semibold">{t('home.demoTitle')}</p>
      <p className="text-xs text-muted-foreground">{t('home.gDemoWhen')}</p>
    </>
  )
}

const pill = 'flex h-9 items-center gap-2 rounded-full px-3 text-sm'

/** Cảnh 1: bấm "Thêm vào Google Calendar", sự kiện trượt vào lịch */
function CalendarScene({ phase }: { phase: number }) {
  const t = useT()
  const added = phase >= 2
  return (
    <>
      <FinalizedHeader />
      <ClickTarget phase={phase} className="mt-4">
        <div className={cn(pill, 'border transition-colors duration-300', added ? 'border-primary/30 bg-brand-soft text-brand' : 'bg-card')}>
          {added ? <Check className="size-4" strokeWidth={2.5} /> : <CalendarPlus className="size-4 text-brand" />}
          <span className="truncate">{t(added ? 'home.gDemoAdded' : 'home.gDemoAddCalendar')}</span>
        </div>
      </ClickTarget>

      {/* Một ngày trong Google Calendar: các mốc giờ, sự kiện rơi vào đúng 19:00 */}
      <div
        className={cn(
          'mt-3 rounded-xl border bg-card p-2.5 transition-all duration-500',
          added ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        <p className="text-[10px] font-medium text-muted-foreground uppercase">{WEEKDAYS[2].shortLabel}</p>
        <div className="mt-1 grid gap-0">
          {['18:00', '19:00', '20:00'].map((hour) => (
            <div key={hour} className="flex h-6 items-start gap-2 border-t border-dashed">
              <span className="-mt-px w-9 shrink-0 text-[10px] text-muted-foreground">{formatHourLabel(hour)}</span>
              {hour === '19:00' && (
                <span
                  className={cn(
                    'mt-0.5 flex h-5 flex-1 items-center rounded-md border-l-[3px] border-primary bg-primary/15 px-2 text-[11px] font-medium transition-all delay-200 duration-500',
                    added ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0',
                  )}
                >
                  {t('home.demoTitle')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/** Cảnh 2: bấm "Tạo link Google Meet", chờ một nhịp rồi ra link và nút tham gia */
function MeetScene({ phase }: { phase: number }) {
  const t = useT()
  const creating = phase === 2
  const ready = phase >= 3
  return (
    <>
      <FinalizedHeader />
      <ClickTarget phase={phase} className="mt-4">
        <div
          className={cn(
            pill,
            'transition-colors duration-300',
            ready ? 'bg-primary font-medium text-primary-foreground' : 'border bg-card',
          )}
        >
          {creating ? <MeetlyLoader size="xs" decorative /> : <Video className={cn('size-4', !ready && 'text-brand')} />}
          <span className="truncate">{t(ready ? 'home.gDemoMeet' : 'home.gDemoCreateMeet')}</span>
        </div>
      </ClickTarget>

      <div
        className={cn(
          'mt-3 flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 transition-all duration-500',
          ready ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Video className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs">meet.google.com/kfp-zqrv-mtx</span>
        <Copy className="size-3.5 shrink-0 text-muted-foreground" />
      </div>
    </>
  )
}

/** Giờ bận lấy từ Google Calendar (hàng × cột), phần còn lại được tô rảnh */
const BUSY = new Set(['0-0', '1-0', '0-2', '1-2', '2-3', '1-4'])
const MINI_HOURS = ['18:00', '19:00', '20:00']
const MINI_DAYS = [1, 2, 3, 4, 5] as const

/** Cảnh 3: lấy giờ bận từ Google Calendar, lưới tự tô các giờ còn rảnh */
function BusyScene({ phase }: { phase: number }) {
  const t = useT()
  const imported = phase >= 2
  return (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
        <CalendarCheck className="size-3" strokeWidth={2.5} />
        {t('home.gDemoYourTimes')}
      </span>
      <ClickTarget phase={phase} className="mt-3">
        <div className={cn(pill, 'border bg-card transition-colors duration-300', imported && 'border-primary/30 bg-brand-soft text-brand')}>
          {imported ? <Check className="size-4" strokeWidth={2.5} /> : <CalendarCheck className="size-4 text-brand" />}
          <span className="truncate">{t(imported ? 'home.gDemoImported' : 'home.gDemoImport')}</span>
        </div>
      </ClickTarget>

      <div className="mt-3 grid grid-cols-[2.25rem_repeat(5,minmax(0,1fr))] gap-1 text-[10px] text-muted-foreground">
        <span />
        {MINI_DAYS.map((day) => (
          <span key={day} className="text-center">
            {WEEKDAYS[day].shortLabel}
          </span>
        ))}
        {MINI_HOURS.map((hour, row) => (
          <div key={hour} className="contents">
            <span className="self-center">{formatHourLabel(hour)}</span>
            {MINI_DAYS.map((day, column) => {
              const busy = BUSY.has(`${row}-${column}`)
              // Giờ bận hiện trước, giờ rảnh tô sau theo đường chéo
              const delay = busy ? column * 60 : 450 + (row + column) * 70
              return (
                <span
                  key={day}
                  style={{ transitionDelay: imported ? `${delay}ms` : '0ms' } as CSSProperties}
                  className={cn(
                    'grid h-6 place-items-center rounded-md border text-[9px] transition-colors duration-300',
                    !imported && 'border-foreground/5 bg-heat-0',
                    imported && busy && 'demo-busy border-foreground/10 text-muted-foreground',
                    imported && !busy && 'border-transparent bg-heat-4',
                  )}
                >
                  {imported && busy ? t('home.gDemoBusy') : null}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}

/** Bản demo bên trái khối Google: cảnh đổi theo tính năng đang được chọn */
export function GoogleFlowDemo({ scene, phase }: { scene: number; phase: number }) {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-80 select-none">
      <div className="absolute -inset-6 rounded-[2rem] bg-brand/10 blur-2xl" />
      <div className="relative h-[17.5rem] overflow-hidden rounded-2xl border bg-background p-4 shadow-lift">
        <div key={scene} className="duration-500 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
          {scene === 0 && <CalendarScene phase={phase} />}
          {scene === 1 && <MeetScene phase={phase} />}
          {scene === 2 && <BusyScene phase={phase} />}
        </div>
      </div>
    </div>
  )
}
