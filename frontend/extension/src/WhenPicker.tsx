import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { dateFormatter, fromIsoDate, minutesToTime, timeToMinutes, toIsoDate } from '@/lib/date-time'
import { HOUR_PRESETS, MAX_AVAILABLE_DATES, WEEKDAY_PRESETS } from '@/features/events/schema'
import { WEEKDAYS, WEEKDAYS_MONDAY_FIRST } from '@/shared/constants'
import { useT, type MessageKey } from '@/shared/i18n'
import { dayFromTomorrow, nextDays, nextWeekend, nextWorkdays } from './dates'

/** Ngày giờ của sự kiện đang tạo trong popup */
export interface When {
  mode: 'dates' | 'weekly'
  dates: string[]
  weekdays: number[]
  start: string
  end: string
}

const DAYS_PER_PAGE = 14
const MAX_PAGES = 4
/** Mốc 30 phút, bỏ 00:00 vì BE không nhận mốc biên của ngày */
const TIME_OPTIONS = Array.from({ length: 47 }, (_, index) => minutesToTime((index + 1) * 30))

const sameSet = (a: readonly (string | number)[], b: readonly (string | number)[]) =>
  a.length === b.length && a.every((item) => b.includes(item))

export function WhenPicker({ value, onChange }: { value: When; onChange: (next: When) => void }) {
  const t = useT()
  const set = (patch: Partial<When>) => onChange({ ...value, ...patch })

  return (
    <div className="grid gap-3.5">
      <section className="grid gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{t('common.daysTitle')}</span>
          <div role="radiogroup" aria-label={t('days.typeLabel')} className="flex rounded-full bg-muted p-0.5 text-[11px]">
            {(
              [
                ['dates', 'days.datesShort'],
                ['weekly', 'days.weeklyShort'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                role="radio"
                aria-checked={value.mode === mode}
                onClick={() => set({ mode })}
                className={cn(
                  'rounded-full px-2.5 py-1 font-medium transition-colors',
                  value.mode === mode ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        {value.mode === 'dates' ? (
          <DatesGrid dates={value.dates} onChange={(dates) => set({ dates })} />
        ) : (
          <WeekdayRow weekdays={value.weekdays} onChange={(weekdays) => set({ weekdays })} />
        )}
      </section>

      <section className="grid gap-2">
        <span className="text-xs text-muted-foreground">{t('common.hoursTitle')}</span>
        <div className="grid grid-cols-4 gap-1">
          {HOUR_PRESETS.map((preset) => {
            const active = value.start === preset.start && value.end === preset.end
            return (
              <button
                key={preset.labelKey}
                type="button"
                aria-pressed={active}
                onClick={() => set({ start: preset.start, end: preset.end })}
                title={`${preset.start}–${preset.end}`}
                className={cn(
                  'rounded-lg border px-1 py-1.5 text-center text-[11px] leading-tight font-medium transition-colors',
                  active ? 'border-primary bg-brand-soft text-brand' : 'bg-card hover:border-foreground/25',
                )}
              >
                {t(preset.labelKey)}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <TimeSelect
            label={t('hours.from')}
            value={value.start}
            options={TIME_OPTIONS.slice(0, -1)}
            onChange={(start) =>
              // Giờ bắt đầu vượt giờ kết thúc thì đẩy giờ kết thúc lùi theo 1 tiếng
              set({ start, end: timeToMinutes(value.end) > timeToMinutes(start) ? value.end : minutesToTime(Math.min(timeToMinutes(start) + 60, 23 * 60 + 30)) })
            }
          />
          <span className="text-muted-foreground" aria-hidden="true">
            –
          </span>
          <TimeSelect
            label={t('hours.to')}
            value={value.end}
            options={TIME_OPTIONS.filter((time) => timeToMinutes(time) > timeToMinutes(value.start))}
            onChange={(end) => set({ end })}
          />
        </div>
      </section>
    </div>
  )
}

function QuickLink({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition-colors',
        active ? 'border-primary bg-brand-soft text-brand' : 'bg-card text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

/** Lưới 2 tuần bấm để chọn từng ngày, lật được thêm vài tuần */
function DatesGrid({ dates, onChange }: { dates: string[]; onChange: (dates: string[]) => void }) {
  const t = useT()
  const [page, setPage] = useState(0)
  const cells = Array.from({ length: DAYS_PER_PAGE }, (_, index) => dayFromTomorrow(page * DAYS_PER_PAGE + index))
  const range = `${dateFormatter({ day: 'numeric', month: 'short' }).format(cells[0])} – ${dateFormatter({ day: 'numeric', month: 'short' }).format(cells[cells.length - 1])}`

  const toggle = (iso: string) => {
    if (dates.includes(iso)) onChange(dates.filter((item) => item !== iso))
    else if (dates.length < MAX_AVAILABLE_DATES) onChange([...dates, iso])
  }

  const quick: { label: MessageKey; pick: () => string[] }[] = [
    { label: 'days.next7', pick: () => nextDays(7) },
    { label: 'days.next5Weekdays', pick: () => nextWorkdays(5) },
    { label: 'preset.weekend', pick: nextWeekend },
  ]

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1">
        {quick.map((item) => {
          const picked = item.pick()
          return (
            <QuickLink key={item.label} active={sameSet(dates, picked)} onClick={() => onChange(picked)}>
              {t(item.label)}
            </QuickLink>
          )
        })}
        {dates.length > 0 && <QuickLink onClick={() => onChange([])}>{t('common.clear')}</QuickLink>}
      </div>

      <div className="rounded-xl border bg-card p-2">
        <div className="mb-1.5 flex items-center justify-between px-0.5">
          <PagerButton label={t('days.prevMonth')} disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronLeft />
          </PagerButton>
          <span className="text-[11px] font-medium text-muted-foreground tabular-nums">{range}</span>
          <PagerButton label={t('days.nextMonth')} disabled={page === MAX_PAGES - 1} onClick={() => setPage(page + 1)}>
            <ChevronRight />
          </PagerButton>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date) => {
            const iso = toIsoDate(date)
            const selected = dates.includes(iso)
            const weekend = date.getDay() === 0 || date.getDay() === 6
            return (
              <button
                key={iso}
                type="button"
                aria-pressed={selected}
                aria-label={dateFormatter({ weekday: 'long', day: 'numeric', month: 'long' }).format(date)}
                onClick={() => toggle(iso)}
                className={cn(
                  'flex flex-col items-center rounded-lg py-1 transition-colors',
                  selected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                <span className={cn('text-[9px] leading-3', selected ? 'opacity-80' : weekend ? 'text-brand' : 'text-muted-foreground')}>
                  {WEEKDAYS[date.getDay()].shortLabel}
                </span>
                <span className="text-[13px] leading-5 font-medium tabular-nums">{date.getDate()}</span>
              </button>
            )
          })}
        </div>
      </div>
      {/* Ngày đã chọn có thể nằm ở trang khác: luôn cho biết tổng số */}
      <p className="text-[11px] text-muted-foreground">
        {dates.length === 0 ? t('days.tapDates') : t('days.picked', { count: dates.length })}
        {dates.length > 0 && ` · ${formatRange(dates)}`}
      </p>
    </div>
  )
}

const formatRange = (dates: string[]) => {
  const sorted = [...dates].sort()
  const format = (iso: string) => dateFormatter({ day: 'numeric', month: 'short' }).format(fromIsoDate(iso))
  return sorted.length === 1 ? format(sorted[0]) : `${format(sorted[0])} – ${format(sorted[sorted.length - 1])}`
}

function PagerButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30 [&_svg]:size-3.5"
    >
      {children}
    </button>
  )
}

function WeekdayRow({ weekdays, onChange }: { weekdays: number[]; onChange: (weekdays: number[]) => void }) {
  const t = useT()
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-1">
        {WEEKDAY_PRESETS.map((preset) => (
          <QuickLink key={preset.labelKey} active={sameSet(weekdays, preset.days)} onClick={() => onChange([...preset.days])}>
            {t(preset.labelKey)}
          </QuickLink>
        ))}
      </div>
      <div role="group" aria-label={t('days.weekdays')} className="grid grid-cols-7 gap-1 rounded-xl border bg-card p-1.5">
        {WEEKDAYS_MONDAY_FIRST.map((day) => {
          const selected = weekdays.includes(day.value)
          return (
            <button
              key={day.value}
              type="button"
              aria-pressed={selected}
              aria-label={day.label}
              onClick={() => onChange(selected ? weekdays.filter((item) => item !== day.value) : [...weekdays, day.value])}
              className={cn(
                'rounded-lg py-2 text-xs font-medium transition-colors',
                selected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {day.shortLabel}
            </button>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        {weekdays.length === 0 ? t('days.tapDays') : t('days.perWeek', { count: weekdays.length })}
      </p>
    </div>
  )
}

function TimeSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="flex h-9 min-w-0 items-center gap-1.5 rounded-lg border bg-card pl-2.5 text-xs focus-within:border-primary/60">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 cursor-pointer bg-transparent pr-1 font-medium tabular-nums outline-none"
      >
        {/* Giờ đang chọn có thể không nằm trên mốc 30 phút: vẫn giữ trong danh sách */}
        {(options.includes(value) ? options : [value, ...options]).map((time) => (
          <option key={time} value={time} className="bg-card text-foreground">
            {time}
          </option>
        ))}
      </select>
    </label>
  )
}
