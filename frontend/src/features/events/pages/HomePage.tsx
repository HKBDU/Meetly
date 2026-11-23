import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'
import { parseEventCode } from '@/shared/lib/share'
import { Button } from '@/shared/components/ui/button'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'

const STEPS = [
  { title: 'Pick times', text: 'Choose the days and hours that could work.' },
  { title: 'Share one link', text: 'Everyone marks when they are free. No sign-up.' },
  { title: 'Find the best slot', text: 'The heatmap shows when most people can make it.' },
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
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const HOURS = ['5 PM', '6 PM', '7 PM', '8 PM', '9 PM']

/** Bản xem trước trang trí của heatmap, không mang dữ liệu thật */
function ProductPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto mt-16 w-full max-w-2xl select-none">
      <div className="rounded-2xl border bg-card p-5 shadow-lift sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Team dinner</p>
            <p className="text-xs text-muted-foreground">9 people responded</p>
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
              {day}
            </span>
          ))}
          {DEMO_GRID.map((row, rowIndex) => (
            <div key={HOURS[rowIndex]} className="contents">
              <span className="self-center">{HOURS[rowIndex]}</span>
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
        <span className="font-medium">Tue, 7:00 PM</span>
        <span className="text-muted-foreground">8 of 9 available</span>
      </div>
    </div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function join(event: React.FormEvent) {
    event.preventDefault()
    const shortCode = parseEventCode(code)
    if (!shortCode) {
      setError('Enter the event code or paste the link you received.')
      return
    }
    navigate(`/e/${encodeURIComponent(shortCode)}`)
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-10 pb-20 sm:pt-20">
      <section className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground shadow-[0_1px_2px_rgb(12_10_9/0.04)]">
          <span className="size-1.5 rounded-full bg-brand" />
          Group scheduling, simplified
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-5xl leading-[1.05] font-semibold tracking-[-0.035em] text-balance sm:text-6xl lg:text-7xl">
          Find a time that works for <span className="font-serif font-normal tracking-normal italic">everyone</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-pretty text-muted-foreground sm:text-lg">
          Create a poll, share one link, and see at a glance when your group is free.
        </p>

        <div className="mx-auto mt-9 flex max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-center">
          <Button size="lg" className="h-12 px-6" onClick={() => navigate('/create')}>
            Create an event
            <ArrowRight aria-hidden="true" />
          </Button>

          <form onSubmit={join} noValidate className="grid gap-1.5 text-left sm:w-64">
            <FieldLabel htmlFor="join-code" className="sr-only">
              Event code or link
            </FieldLabel>
            <div className="flex h-12 items-center rounded-full border bg-card pr-1.5 pl-5 shadow-[0_1px_2px_rgb(12_10_9/0.04)] transition-shadow focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15">
              <input
                id="join-code"
                placeholder="Have a code?"
                autoComplete="off"
                spellCheck={false}
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                value={code}
                aria-invalid={Boolean(error)}
                onChange={(event) => {
                  setCode(event.target.value)
                  setError('')
                }}
              />
              <Button type="submit" size="icon-sm" variant="secondary" aria-label="Join event">
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
            {error && <FieldError className="pl-5 text-xs">{error}</FieldError>}
          </form>
        </div>
      </section>

      <ProductPreview />

      <ol className="mt-24 grid divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {STEPS.map(({ title, text }, index) => (
          <li key={title} className="px-1 py-6 sm:px-6">
            <p className="font-serif text-2xl text-muted-foreground italic">0{index + 1}</p>
            <p className="mt-2 font-medium">{title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
