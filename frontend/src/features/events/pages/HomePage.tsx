import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatHourLabel } from '@/lib/date-time'
import { WEEKDAYS } from '@/shared/constants'
import { useT, type MessageKey } from '@/shared/i18n'
import { parseEventCode } from '@/shared/lib/share'
import { Button } from '@/shared/components/ui/button'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'

const STEPS: { title: MessageKey; text: MessageKey }[] = [
  { title: 'home.step1Title', text: 'home.step1Text' },
  { title: 'home.step2Title', text: 'home.step2Text' },
  { title: 'home.step3Title', text: 'home.step3Text' },
]

/** Lưới mẫu cho bản xem trước: 0-5 = mức rảnh của mỗi ô */
const DEMO_GRID = [
  [1, 2, 0, 1, 2],
  [2, 3, 1, 2, 3],
  [3, 5, 2, 3, 4],
  [2, 4, 3, 4, 3],
  [1, 2, 3, 2, 1],
]
const HEAT = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4', 'bg-heat-5']
/** Thứ 2 → thứ 6 và 17:00 → 21:00 */
const DAYS = [1, 2, 3, 4, 5] as const
const HOURS = ['17:00', '18:00', '19:00', '20:00', '21:00']

/** Bản xem trước trang trí của heatmap, không mang dữ liệu thật */
function ProductPreview() {
  const t = useT()
  return (
    <div aria-hidden="true" className="relative mx-auto mt-16 w-full max-w-2xl select-none">
      <div className="rounded-2xl border bg-card p-5 shadow-lift sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t('home.demoTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('home.demoResponded')}</p>
          </div>
          <div className="flex -space-x-1.5">
            {['A', 'M', 'K', 'L'].map((initial, index) => (
              <span
                key={initial}
                className={cn(
                  'grid size-7 place-items-center rounded-full border-2 border-card text-[11px] font-medium',
                  ['bg-secondary', 'bg-brand-soft', 'bg-heat-2', 'bg-muted'][index],
                )}
              >
                {initial}
              </span>
            ))}
            <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-muted text-[10px] text-muted-foreground">
              +5
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-[2.75rem_repeat(5,1fr)] gap-1.5 text-[11px] text-muted-foreground">
          <span />
          {DAYS.map((day) => (
            <span key={day} className="text-center">
              {WEEKDAYS[day].shortLabel}
            </span>
          ))}
          {DEMO_GRID.map((row, rowIndex) => (
            <div key={HOURS[rowIndex]} className="contents">
              <span className="self-center">{formatHourLabel(HOURS[rowIndex])}</span>
              {row.map((level, columnIndex) => (
                <span
                  key={columnIndex}
                  className={cn(
                    'h-7 rounded-md border border-foreground/4',
                    HEAT[level],
                    rowIndex === 2 && columnIndex === 1 && 'ring-2 ring-foreground ring-offset-2 ring-offset-card',
                  )}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full border bg-card px-4 py-2 text-sm whitespace-nowrap shadow-lift">
        <span className="size-2 rounded-full bg-brand" />
        <span className="font-medium">
          {WEEKDAYS[2].shortLabel}, {formatHourLabel('19:00')}
        </span>
        <span className="text-muted-foreground">{t('home.demoAvailable')}</span>
      </div>
    </div>
  )
}

export function HomePage() {
  const t = useT()
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  // Lưu cờ thay vì câu lỗi để đổi ngôn ngữ thì câu lỗi đổi theo
  const [error, setError] = useState(false)

  function join(event: React.FormEvent) {
    event.preventDefault()
    const shortCode = parseEventCode(code)
    if (!shortCode) {
      setError(true)
      return
    }
    navigate(`/e/${encodeURIComponent(shortCode)}`)
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:pt-20">
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground shadow-[0_1px_2px_rgb(12_10_9/0.04)]">
          <span className="size-1.5 rounded-full bg-brand" />
          {t('home.badge')}
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
          {t('home.titleBefore')}{' '}
          <span className="font-serif font-normal tracking-normal italic">{t('home.titleEmphasis')}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-pretty text-muted-foreground sm:text-lg">
          {t('home.subtitle')}
        </p>

        <div className="mx-auto mt-9 flex max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-center">
          <Button size="lg" className="h-12 px-6" onClick={() => navigate('/create')}>
            {t('home.create')}
            <ArrowRight aria-hidden="true" />
          </Button>

          <form onSubmit={join} noValidate className="grid gap-1.5 text-left sm:w-64">
            <FieldLabel htmlFor="join-code" className="sr-only">
              {t('home.codeLabel')}
            </FieldLabel>
            <div className="flex h-12 items-center rounded-full border bg-card pr-1.5 pl-5 shadow-[0_1px_2px_rgb(12_10_9/0.04)] transition-shadow focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15">
              <input
                id="join-code"
                placeholder={t('home.codePlaceholder')}
                autoComplete="off"
                spellCheck={false}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                value={code}
                aria-invalid={error}
                onChange={(event) => {
                  setCode(event.target.value)
                  setError(false)
                }}
              />
              <Button type="submit" size="icon-sm" variant="secondary" aria-label={t('home.join')}>
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
            {error && <FieldError className="pl-5 text-xs">{t('home.codeError')}</FieldError>}
          </form>
        </div>
      </section>

      <ProductPreview />

      <ol className="mt-24 grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STEPS.map(({ title, text }, index) => (
          <li key={title} className="px-1 py-6 sm:px-6">
            <p className="font-serif text-2xl text-muted-foreground italic">0{index + 1}</p>
            <p className="mt-2 font-medium">{t(title)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t(text)}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
