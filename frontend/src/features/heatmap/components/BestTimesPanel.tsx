import { useState } from 'react'
import { Check, Sparkles, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { formatDay } from '@/shared/grid/model'
import { Button } from '@/shared/components/ui/button'
import type { Participant } from '@/shared/types'
import { DURATION_OPTIONS } from '../constants'
import { rankedKey, type RankedTime } from '../suggestions'

const PARTICIPANTS_COLLAPSED = 6

/** 30 -> "30m", 60 -> "1h", 90 -> "1.5h" */
const durationLabel = (minutes: number) => (minutes < 60 ? `${minutes}m` : `${minutes / 60}h`)

function Chip({ active, onClick, children, label }: { active: boolean; onClick: () => void; children: React.ReactNode; label?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-xs transition-colors duration-200',
        'focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:outline-none',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:border-foreground/25',
      )}
    >
      {children}
    </button>
  )
}

interface BestTimesPanelProps {
  times: RankedTime[]
  participants: Participant[]
  duration: number
  mustInclude: string[]
  highlightedKey: string | null
  disabled: boolean
  onDurationChange: (minutes: number) => void
  onMustIncludeChange: (names: string[]) => void
  onHighlight: (slot: RankedTime | null) => void
  onPick: (slot: RankedTime) => void
  onChooseManually: () => void
}

/** Danh sách khung giờ tốt nhất, xếp hạng, chốt bằng một cú bấm */
export function BestTimesPanel({
  times,
  participants,
  duration,
  mustInclude,
  highlightedKey,
  disabled,
  onDurationChange,
  onMustIncludeChange,
  onHighlight,
  onPick,
  onChooseManually,
}: BestTimesPanelProps) {
  const [showAllPeople, setShowAllPeople] = useState(false)
  const total = participants.length
  const visiblePeople = showAllPeople ? participants : participants.slice(0, PARTICIPANTS_COLLAPSED)
  const hiddenCount = participants.length - visiblePeople.length

  const toggle = (name: string) =>
    onMustIncludeChange(mustInclude.includes(name) ? mustInclude.filter((item) => item !== name) : [...mustInclude, name])

  return (
    <section aria-labelledby="best-times-heading" className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="best-times-heading" className="flex items-center gap-2 font-medium whitespace-nowrap">
          <Sparkles className="size-4 text-brand" aria-hidden="true" />
          Best times
        </h2>
        <div className="flex gap-1" role="group" aria-label="Meeting length">
          {DURATION_OPTIONS.map((minutes) => (
            <Chip key={minutes} active={duration === minutes} onClick={() => onDurationChange(minutes)} label={`${minutes} minutes`}>
              {durationLabel(minutes)}
            </Chip>
          ))}
        </div>
      </div>

      {participants.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground">Must include</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visiblePeople.map((person) => {
              const active = mustInclude.includes(person.username)
              return (
                <Chip key={person.username} active={active} onClick={() => toggle(person.username)}>
                  {active && <Check className="size-3" aria-hidden="true" />}
                  {person.username}
                </Chip>
              )
            })}
            {hiddenCount > 0 && (
              <Chip active={false} onClick={() => setShowAllPeople(true)}>
                +{hiddenCount}
              </Chip>
            )}
            {mustInclude.length > 0 && (
              <button type="button" onClick={() => onMustIncludeChange([])} className="inline-flex h-8 items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
                <X className="size-3" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {times.length === 0 ? (
        <p role="status" className="mt-5 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
          {total === 0
            ? 'No one has added their availability yet.'
            : mustInclude.length > 0
              ? 'No time works for everyone you selected. Try removing someone or a shorter meeting.'
              : 'No time fits this meeting length yet. Try a shorter meeting.'}
        </p>
      ) : (
        <>
          {times[0].missing.length > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">No time works for everyone, so these are the closest.</p>
          )}
          {/* Mobile: thẻ cuộn ngang; desktop: danh sách dọc */}
          <ol
            aria-label="Ranked times"
            className="-mx-4 mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5 lg:mx-0 lg:grid lg:overflow-visible lg:px-0 lg:pb-0"
          >
            {times.map((slot, index) => {
              const key = rankedKey(slot)
              const everyone = slot.missing.length === 0
              const highlighted = highlightedKey === key
              return (
                <li
                  key={key}
                  className={cn(
                    'w-64 shrink-0 snap-start rounded-xl border p-3 transition-colors duration-200 lg:w-auto',
                    highlighted ? 'border-primary/50 bg-brand-soft' : 'bg-card hover:border-foreground/20',
                  )}
                  onMouseEnter={() => onHighlight(slot)}
                  onMouseLeave={() => onHighlight(null)}
                  onFocus={() => onHighlight(slot)}
                  onClick={() => onHighlight(slot)}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full text-xs font-medium tabular-nums',
                        index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{formatDay(slot)}</p>
                      <p className="text-sm text-muted-foreground tabular-nums">
                        {slot.startTime} – {slot.endTime}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                        everyone ? 'bg-brand-soft text-brand' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {slot.available.length}/{total}
                    </span>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2 pl-9">
                    <p className="line-clamp-2 min-w-0 text-xs text-muted-foreground">
                      {everyone ? 'Everyone can make it' : `Missing: ${slot.missing.join(', ')}`}
                    </p>
                    <Button
                      type="button"
                      size="xs"
                      variant={index === 0 ? 'default' : 'outline'}
                      disabled={disabled}
                      onClick={(event) => {
                        event.stopPropagation()
                        onPick(slot)
                      }}
                    >
                      Pick
                    </Button>
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={onChooseManually}
        className="mt-4 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
      >
        Or drag on the grid to choose another time
      </button>
    </section>
  )
}
