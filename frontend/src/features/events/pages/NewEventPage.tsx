import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm, useWatch, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { createEvent } from '@/shared/api/events'
import { t as translate, useT } from '@/shared/i18n'
import { useParticipantStore } from '@/features/participants/store'
import { MeetlyLoader } from '@/shared/components/MeetlyLoader'
import { Button } from '@/shared/components/ui/button'
import { FieldError, FieldLabel } from '@/shared/components/ui/field'
import { Input } from '@/shared/components/ui/input'
import { DaysField } from '../components/DaysField'
import { HoursField } from '../components/HoursField'
import { createEventSchema, DEFAULT_CREATE_VALUES, toEventFields, type CreateEventFormValues } from '../schema'
import { dailyMinutes, dayCount, describeDays, describeDuration } from '../summary'

/** Thứ tự mục trên trang, để cuộn tới mục lỗi đầu tiên khi bấm Create */
const SECTION_OF_FIELD: Record<string, string> = {
  title: 'section-name',
  dates: 'section-days',
  weekdays: 'section-days',
  dailyStartTime: 'section-hours',
  dailyEndTime: 'section-hours',
  adminUsername: 'section-host',
  adminPassword: 'section-host',
}
const SECTION_ORDER = ['section-name', 'section-days', 'section-hours', 'section-host']

/** Một hàng trong form: nhãn + mô tả bên trái, điều khiển bên phải (xếp dọc trên mobile) */
function Row({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="grid scroll-mt-24 gap-4 px-5 py-6 sm:px-7 md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
      <div>
        <h2 id={`${id}-title`} className="text-sm font-medium">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

/** Một trang: tên → ngày → giờ → host; tạo xong sang màn chia sẻ link */
export function NewEventPage() {
  const t = useT()
  const navigate = useNavigate()
  const [error, setError] = useState<string>()
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<CreateEventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: DEFAULT_CREATE_VALUES,
  })
  const values = useWatch({ control }) as CreateEventFormValues
  const validate = { shouldValidate: isSubmitted }

  async function onValid(form: CreateEventFormValues) {
    setError(undefined)
    try {
      const username = form.adminUsername.trim()
      const created = await createEvent({
        ...toEventFields(form),
        admin: { username, password: form.adminPassword },
      })
      useParticipantStore.getState().login({
        shortCode: created.shortCode,
        participantId: created.participantId,
        username,
        isAdmin: created.isAdmin,
        accessToken: created.accessToken,
      })
      navigate(`/e/${created.shortCode}/share`, { replace: true })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : translate('api.createEvent'))
    }
  }

  function onInvalid(fieldErrors: FieldErrors<CreateEventFormValues>) {
    const sections = new Set(Object.keys(fieldErrors).map((field) => SECTION_OF_FIELD[field]))
    const first = SECTION_ORDER.find((id) => sections.has(id))
    if (first) document.getElementById(first)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const days = dayCount(values)
  const minutes = dailyMinutes(values.dailyStartTime, values.dailyEndTime)
  const submitContent = (
    <>
      {isSubmitting && <MeetlyLoader size="xs" tone="current" decorative />}
      {isSubmitting ? t('create.creating') : t('create.submit')}
      {!isSubmitting && <ArrowRight aria-hidden="true" />}
    </>
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:pt-8 lg:pb-16">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('common.back')}
      </Link>

      <form onSubmit={handleSubmit(onValid, onInvalid)} noValidate className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0">
          <div id="section-name" className="scroll-mt-24">
            <p className="text-sm text-muted-foreground">{t('create.newEvent')}</p>
            <FieldLabel htmlFor="event-name" className="sr-only">
              {t('common.eventName')}
            </FieldLabel>
            <input
              id="event-name"
              placeholder={t('create.untitled')}
              autoFocus
              autoComplete="off"
              aria-invalid={Boolean(errors.title)}
              className="mt-1 w-full bg-transparent text-4xl font-semibold tracking-[-0.03em] outline-none placeholder:text-foreground/20 sm:text-5xl"
              {...register('title')}
            />
            {errors.title && <FieldError className="mt-2">{errors.title.message}</FieldError>}
          </div>

          <div className="mt-8 divide-y rounded-2xl border bg-card shadow-soft">
            <Row id="section-days" title={t('common.daysTitle')} description={t('create.daysHint')}>
              <DaysField
                eventType={values.eventType}
                dates={values.dates}
                weekdays={values.weekdays}
                onEventTypeChange={(type) => setValue('eventType', type, validate)}
                onDatesChange={(next) => setValue('dates', next, validate)}
                onWeekdaysChange={(next) => setValue('weekdays', next, validate)}
                error={errors.dates?.message ?? errors.weekdays?.message}
              />
            </Row>

            <Row id="section-hours" title={t('common.hoursTitle')} description={t('create.hoursHint')}>
              <HoursField
                start={values.dailyStartTime}
                end={values.dailyEndTime}
                onChange={(start, end) => {
                  setValue('dailyStartTime', start, validate)
                  setValue('dailyEndTime', end, validate)
                }}
                error={errors.dailyEndTime?.message}
              />
            </Row>

            <Row id="section-host" title={t('create.host')} description={t('create.hostHint')}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="admin-username" className="text-xs font-normal text-muted-foreground">
                    {t('common.yourName')}
                  </FieldLabel>
                  <Input id="admin-username" autoComplete="username" aria-invalid={Boolean(errors.adminUsername)} {...register('adminUsername')} />
                  {errors.adminUsername && <FieldError className="text-xs">{errors.adminUsername.message}</FieldError>}
                </div>
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="admin-password" className="text-xs font-normal text-muted-foreground">
                    {t('common.password')}
                  </FieldLabel>
                  <Input id="admin-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.adminPassword)} {...register('adminPassword')} />
                  {errors.adminPassword && <FieldError className="text-xs">{errors.adminPassword.message}</FieldError>}
                </div>
              </div>
            </Row>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        {/* Desktop: tóm tắt luôn nhìn thấy khi cuộn */}
        <aside className="sticky top-24 hidden rounded-2xl border bg-card p-5 shadow-soft lg:block" aria-label={t('create.summaryLabel')}>
          <p className="text-xs text-muted-foreground">{t('create.summary')}</p>
          <p className="mt-1 truncate font-medium">{values.title?.trim() || t('create.untitled')}</p>
          <dl className="mt-4 grid gap-3 border-t pt-4 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{t('common.daysTitle')}</dt>
              <dd className="mt-0.5">{describeDays(values)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('common.hoursTitle')}</dt>
              <dd className="mt-0.5 tabular-nums">
                {values.dailyStartTime} – {values.dailyEndTime}
                <span className="text-muted-foreground"> · {describeDuration(minutes)}</span>
              </dd>
            </div>
          </dl>
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={isSubmitting}>
            {submitContent}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">{t('create.nextHint')}</p>
        </aside>

        {/* Mobile: thanh dính đáy màn hình trong lúc điền form, hết form thì dừng (không che footer) */}
        <div className="surface-glass sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-medium">{days > 0 ? t('common.days', { count: days }) : t('create.noDaysYet')}</p>
            <p className="truncate text-muted-foreground tabular-nums">
              {values.dailyStartTime} – {values.dailyEndTime}
            </p>
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {submitContent}
          </Button>
        </div>
      </form>
    </div>
  )
}
