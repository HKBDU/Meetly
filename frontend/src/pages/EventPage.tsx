import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clipboard,
  Clock3,
  Edit3,
  Link2,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import { Brand } from '@/components/Brand'
import { TimeSelect } from '@/components/TimeSelect'
import { WeekdayPicker } from '@/components/WeekdayPicker'
import { Calendar } from '@/components/ui/calendar'
import {
  cellKey,
  cellsToSlots,
  clock,
  formatDateDMY,
  formatEventDatesSummary,
  getTimeSession,
  isOvernight,
  minutes,
  rangeInWindow,
  type SessionType,
  slotsToCells,
  subTimes,
  targetKey,
  targetLabel,
  timeLabel,
  times,
  toLocalDateString,
  WEEKDAYS,
} from '@/shared/schedule'
import { api, connectRealtime } from '@/shared/services'
import { readSession, saveSession, sessionKey } from '@/shared/session'
import type { EventData, FinalSchedule, Session, Suggestion, TimeSlot } from '@/shared/types'

export function EventPage({ code }: { code: string }) {
  const [data, setData] = useState<EventData | null>(null)
  const [session, setSession] = useState<Session | null>(() => readSession(code))
  const [tab, setTab] = useState<'overview' | 'mine'>('overview')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [adminPanel, setAdminPanel] = useState<'edit' | 'finalize' | null>(null)
  const [realtimeRetry, setRealtimeRetry] = useState(0)

  const load = useCallback(async () => {
    try {
      const event = await api.getEvent(code)
      setData(event)
      setError('')
      const stored = readSession(code)
      if (stored) {
        try {
          const me = await api.getMe(code, stored.accessToken)
          const next = { ...stored, ...me }
          saveSession(code, next)
          setSession(next)
        } catch {
          localStorage.removeItem(sessionKey(code))
          setSession(null)
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải sự kiện.')
    }
  }, [code])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const accessToken = session?.accessToken
  useEffect(() => {
    let disposed = false
    let connection: Awaited<ReturnType<typeof connectRealtime>> | null = null
    let retryTimer: ReturnType<typeof setTimeout> | undefined
    void connectRealtime(code, accessToken, {
      heatmapUpdated: () => {
        void load()
      },
      eventChanged: () => {
        void load()
      },
    })
      .then((value) => {
        if (disposed) void value.stop()
        else connection = value
      })
      .catch(() => {
        if (!disposed) retryTimer = setTimeout(() => setRealtimeRetry((value) => value + 1), 3000)
      })
    return () => {
      disposed = true
      clearTimeout(retryTimer)
      if (connection) void connection.stop()
    }
  }, [accessToken, code, load, realtimeRetry])

  const authenticate = async (username: string, password: string) => {
    const result = await api.accessEvent(code, username, password)
    saveSession(code, result)
    setSession(result)
    setTab('mine')
    await load()
  }

  const logout = () => {
    localStorage.removeItem(sessionKey(code))
    setSession(null)
    setTab('overview')
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(location.href)
    setNotice('Đã sao chép link')
    setTimeout(() => setNotice(''), 1800)
  }

  if (!data) {
    return (
      <main className="event-shell">
        <nav className="event-nav">
          <Brand compact />
        </nav>
        <div className="state-card">
          {error || (
            <>
              <LoaderCircle className="spin" /> Đang tải lịch…
            </>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="event-shell">
      <nav className="event-nav">
        <Brand compact />
        <div className="event-nav-actions">
          <button className="ghost-button" onClick={copyLink}>
            <Link2 size={16} /> {notice || 'Chia sẻ'}
          </button>
          {session ? (
            <>
              <span className="user-pill">
                <span>{session.username.slice(0, 1).toUpperCase()}</span>
                {session.username}
                {session.isAdmin && <ShieldCheck size={15} />}
              </span>
              <button className="icon-button" onClick={logout} aria-label="Đăng xuất">
                <LogOut size={17} />
              </button>
            </>
          ) : null}
        </div>
      </nav>
      <section className="event-heading">
        <div>
          <p className="eyebrow">Mã sự kiện · {code}</p>
          <h1>{data.title}</h1>
          <div className="event-meta-row">
            <span
              className="meta-item"
              title={
                data.eventType === 1
                  ? data.availableDates.map(formatDateDMY).join(', ')
                  : undefined
              }
            >
              <CalendarDays size={15} /> {formatEventDatesSummary(data)}
            </span>
            <span className="meta-item">
              <Clock3 size={15} /> {data.dailyStartTime}–{data.dailyEndTime}
              {isOvernight(data.dailyStartTime, data.dailyEndTime) ? ' (+1 ngày)' : ''} ·{' '}
              {data.timezone}
            </span>
          </div>
        </div>
        <div className="event-stats">
          <strong>{data.participants.length}</strong>
          <span>người tham gia</span>
          <strong>{data.revision}</strong>
          <span>lần cập nhật</span>
        </div>
      </section>
      {data.finalSchedule && <FinalBanner data={data} />}
      {data.status === 3 && (
        <div className="closed-banner">
          <LockKeyhole /> Sự kiện đã đóng. Dữ liệu chỉ còn chế độ xem.
        </div>
      )}
      {error && <p className="form-error page-error">{error}</p>}
      <div className="workspace">
        <div className="tabs">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
            Tổng quan
          </button>
          <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
            Lịch của tôi
          </button>
        </div>
        {tab === 'overview' ? (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Heatmap tổng</p>
                <h2>Thời gian cả nhóm cùng rảnh</h2>
              </div>
              <p>Màu đậm hơn nghĩa là nhiều người tham gia hơn.</p>
            </div>
            <Heatmap event={data} suggestions={suggestions} />
            {session?.isAdmin && (
              <AdminTools
                event={data}
                session={session}
                suggestions={suggestions}
                setSuggestions={setSuggestions}
                panel={adminPanel}
                setPanel={setAdminPanel}
                reload={load}
              />
            )}
          </>
        ) : session ? (
          <Availability
            key={`${session.participantId}:${data.revision}`}
            event={data}
            session={session}
            onSaved={async (slots) => {
              const next = { ...session, timeSlots: slots }
              setSession(next)
              saveSession(code, next)
              await load()
            }}
          />
        ) : (
          <JoinPanel onJoin={authenticate} />
        )}
      </div>
    </main>
  )
}

function JoinPanel({
  onJoin,
}: {
  onJoin: (username: string, password: string) => Promise<void>
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  return (
    <form
      className="join-panel"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError('')
        try {
          await onJoin(username, password)
        } catch (reason) {
          setError(reason instanceof Error ? reason.message : 'Không thể đăng nhập.')
        } finally {
          setBusy(false)
        }
      }}
    >
      <div className="join-icon">
        <LockKeyhole />
      </div>
      <div>
        <h2>Định danh để chọn lịch</h2>
        <p>Tên chỉ tồn tại trong sự kiện này. Mật khẩu không bắt buộc.</p>
      </div>
      <label>
        Tên hiển thị
        <input required maxLength={100} value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Mật khẩu <small>tùy chọn</small>
        <input
          type="password"
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" disabled={busy}>
        {busy ? <LoaderCircle className="spin" /> : <ArrowRight />} Tiếp tục
      </button>
    </form>
  )
}

function Heatmap({
  event,
  suggestions = [],
  selectable,
  selected,
  mode = 'free',
  onCellDown,
  onCellEnter,
}: {
  event: EventData
  suggestions?: Suggestion[]
  selectable?: boolean
  selected?: Set<string>
  mode?: 'free' | 'busy'
  onCellDown?: (keys: string[], event: PointerEvent<HTMLButtonElement>) => void
  onCellEnter?: (keys: string[], event: PointerEvent<HTMLButtonElement>) => void
}) {
  const [step, setStep] = useState<30 | 15>(30)
  const [sessionFilter, setSessionFilter] = useState<SessionType>('all')

  const columns =
    event.eventType === 1
      ? event.availableDates.map((value) => ({ key: value, date: value, day: null as number | null }))
      : event.availableWeekdays.map((value) => ({
          key: `weekday:${value}`,
          date: null as string | null,
          day: value,
        }))

  const allRows = times(event.dailyStartTime, event.dailyEndTime, step)
  const presentSessions = new Set(allRows.map((t) => getTimeSession(t, event.dailyStartTime)))
  const hasMorning = presentSessions.has('morning')
  const hasAfternoon = presentSessions.has('afternoon')
  const hasEvening = presentSessions.has('evening')
  const hasMultipleSessions = presentSessions.size > 1

  const rows =
    sessionFilter === 'all'
      ? allRows
      : allRows.filter((t) => getTimeSession(t, event.dailyStartTime) === sessionFilter)

  const cells = new Map(
    event.heatmapGrid.map((item) => [
      cellKey(targetKey(item.specificDate, item.dayOfWeek), item.startTime),
      item,
    ])
  )
  const max = Math.max(1, event.participants.length)
  const suggested = slotsToCells(suggestions)

  return (
    <div className="heatmap-container">
      <div className="heatmap-controls">
        {hasMultipleSessions ? (
          <div className="session-filter" role="tablist">
            <button
              type="button"
              className={sessionFilter === 'all' ? 'active' : ''}
              onClick={() => setSessionFilter('all')}
            >
              Tất cả
            </button>
            {hasMorning && (
              <button
                type="button"
                className={sessionFilter === 'morning' ? 'active' : ''}
                onClick={() => setSessionFilter('morning')}
              >
                Sáng
              </button>
            )}
            {hasAfternoon && (
              <button
                type="button"
                className={sessionFilter === 'afternoon' ? 'active' : ''}
                onClick={() => setSessionFilter('afternoon')}
              >
                Chiều
              </button>
            )}
            {hasEvening && (
              <button
                type="button"
                className={sessionFilter === 'evening' ? 'active' : ''}
                onClick={() => setSessionFilter('evening')}
              >
                Tối
              </button>
            )}
          </div>
        ) : (
          <div />
        )}
        <div className="step-filter" role="tablist">
          <button
            type="button"
            className={step === 30 ? 'active' : ''}
            onClick={() => setStep(30)}
          >
            30 phút
          </button>
          <button
            type="button"
            className={step === 15 ? 'active' : ''}
            onClick={() => setStep(15)}
          >
            15 phút
          </button>
        </div>
      </div>
      <div className="heatmap-wrap">
        <table className="heatmap">
          <thead>
            <tr>
              <th>Giờ</th>
              {columns.map((column) => (
                <th key={column.key}>{targetLabel(event, column.date, column.day)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((time) => {
              const rowLabel = timeLabel(time, event.dailyStartTime)
              return (
                <tr key={time}>
                  <th>{rowLabel}</th>
                  {columns.map((column) => {
                    const subTimesList = subTimes(time, step)
                    const subKeys = subTimesList.map((t) => cellKey(column.key, t))
                    const isSuggested = subKeys.some((k) => suggested.has(k))
                    const dateLabel = targetLabel(event, column.date, column.day)
                    const rangeEnd = clock(minutes(time) + step)
                    const timeRangeDesc = `${rowLabel}–${rangeEnd}${
                      minutes(rangeEnd) < minutes(event.dailyStartTime) ? ' (+1 ngày)' : ''
                    }`

                    if (selectable) {
                      const allSelected = subKeys.every((k) => selected?.has(k))
                      const anySelected = subKeys.some((k) => selected?.has(k))
                      const active = mode === 'free' ? allSelected : !anySelected
                      return (
                        <td key={column.key}>
                          <button
                            type="button"
                            className={`heat-cell${active ? ' selected' : ''}${
                              isSuggested ? ' suggested' : ''
                            }`}
                            title={`${dateLabel} ${timeRangeDesc}`}
                            onPointerDown={(pointer) => onCellDown?.(subKeys, pointer)}
                            onPointerEnter={(pointer) => onCellEnter?.(subKeys, pointer)}
                          >
                            <span>
                              {active ? (
                                <Check size={14} />
                              ) : step === 30 && anySelected && !allSelected ? (
                                '½'
                              ) : (
                                ''
                              )}
                            </span>
                          </button>
                        </td>
                      )
                    }

                    const subCells = subKeys.map((k) => cells.get(k))
                    let commonParticipants: string[] = []
                    if (subCells.every(Boolean)) {
                      if (subCells.length === 1) {
                        commonParticipants = subCells[0]?.participants ?? []
                      } else {
                        const [first, ...rest] = subCells
                        commonParticipants = (first?.participants ?? []).filter((p) =>
                          rest.every((c) => c?.participants.includes(p))
                        )
                      }
                    }
                    const count = commonParticipants.length
                    const level = count > 0 ? Math.ceil((count / max) * 4) : 0
                    const hoverText =
                      commonParticipants.length > 0
                        ? `${dateLabel} ${timeRangeDesc}: ${commonParticipants.join(
                            ', '
                          )} (${count}/${max})`
                        : `${dateLabel} ${timeRangeDesc}: Chưa có ai rảnh`

                    return (
                      <td key={column.key}>
                        <button
                          type="button"
                          disabled
                          className={`heat-cell level-${level}${
                            isSuggested ? ' suggested' : ''
                          }`}
                          title={hoverText}
                        >
                          <span>{count || ''}</span>
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Availability({
  event,
  session,
  onSaved,
}: {
  event: EventData
  session: Session
  onSaved: (slots: TimeSlot[]) => Promise<void>
}) {
  const [selected, setSelected] = useState(() => slotsToCells(session.timeSlots))
  const [mode, setMode] = useState<'free' | 'busy'>('free')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [manual, setManual] = useState({
    target:
      event.eventType === 1
        ? event.availableDates[0] || ''
        : `weekday:${event.availableWeekdays[0] ?? 1}`,
    start: event.dailyStartTime,
    end: event.dailyEndTime,
  })
  const dragValue = useRef<boolean | null>(null)

  useEffect(() => {
    const up = () => {
      dragValue.current = null
    }
    addEventListener('pointerup', up)
    return () => removeEventListener('pointerup', up)
  }, [])

  const setKeys = (keys: string[], value: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      for (const key of keys) {
        if (value) next.add(key)
        else next.delete(key)
      }
      return next
    })

  const pointerDown = (keys: string[], pointer: PointerEvent<HTMLButtonElement>) => {
    pointer.preventDefault()
    const allSelected = keys.every((k) => selected.has(k))
    const anySelected = keys.some((k) => selected.has(k))
    const shouldSelect = mode === 'free' ? !allSelected : !anySelected
    dragValue.current = shouldSelect
    setKeys(keys, shouldSelect)
  }

  const pointerEnter = (keys: string[], pointer: PointerEvent<HTMLButtonElement>) => {
    if (pointer.buttons === 1 && dragValue.current !== null) {
      setKeys(keys, dragValue.current)
    }
  }

  const addManual = () => {
    if (!rangeInWindow(event.dailyStartTime, event.dailyEndTime, manual.start, manual.end)) {
      return setError('Khoảng giờ nằm ngoài khung giờ của sự kiện.')
    }
    const next = new Set(selected)
    const markFree = mode === 'free'
    for (const time of times(manual.start, manual.end)) {
      const key = cellKey(manual.target, time)
      if (markFree) next.add(key)
      else next.delete(key)
    }
    setSelected(next)
    setError('')
  }

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      const slots = cellsToSlots(event, selected)
      await api.saveAvailability(event.shortCode, session.accessToken, slots, email)
      await onSaved(slots)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu lịch.')
    } finally {
      setBusy(false)
    }
  }

  if (event.status !== 1) {
    return (
      <div className="state-card">
        <LockKeyhole /> Sự kiện đã khóa. Lịch cá nhân không thể chỉnh sửa.
      </div>
    )
  }

  return (
    <div className="availability">
      <div className="schedule-toolbar">
        <div>
          <p className="eyebrow">Lịch của {session.username}</p>
          <h2>Kéo hoặc chạm để đánh dấu</h2>
        </div>
        <div className="segmented compact">
          <button
            className={mode === 'free' ? 'active' : ''}
            onClick={() => setMode('free')}
          >
            Tôi rảnh
          </button>
          <button
            className={mode === 'busy' ? 'active' : ''}
            onClick={() => setMode('busy')}
          >
            Tôi bận
          </button>
        </div>
      </div>
      <Heatmap
        event={event}
        selectable
        selected={selected}
        mode={mode}
        onCellDown={pointerDown}
        onCellEnter={pointerEnter}
      />
      <div className="manual-row">
        <label>
          Ngày
          <select
            className="styled-select"
            value={manual.target}
            onChange={(e) => setManual({ ...manual, target: e.target.value })}
          >
            {event.eventType === 1
              ? event.availableDates.map((date) => (
                  <option key={date} value={date}>
                    {formatDateDMY(date)} ({targetLabel(event, date, null)})
                  </option>
                ))
              : event.availableWeekdays.map((day) => (
                  <option key={day} value={`weekday:${day}`}>
                    {WEEKDAYS[day]}
                  </option>
                ))}
          </select>
        </label>
        <label>
          Từ
          <TimeSelect value={manual.start} onChange={(val) => setManual({ ...manual, start: val })} />
        </label>
        <label>
          Đến
          <TimeSelect value={manual.end} onChange={(val) => setManual({ ...manual, end: val })} />
        </label>
        <button className="secondary-button" onClick={addManual}>
          <Plus size={16} /> Đánh dấu
        </button>
      </div>
      <div className="save-bar">
        <label>
          <Mail size={17} /> Nhận lịch chốt qua email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ban@congty.vn"
          />
        </label>
        <div>
          {error && <span className="form-error">{error}</span>}
          <button className="primary-button" onClick={save} disabled={busy}>
            {busy ? <LoaderCircle className="spin" /> : <Check />} Lưu lịch của tôi
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminTools({
  event,
  session,
  suggestions,
  setSuggestions,
  panel,
  setPanel,
  reload,
}: {
  event: EventData
  session: Session
  suggestions: Suggestion[]
  setSuggestions: (value: Suggestion[]) => void
  panel: 'edit' | 'finalize' | null
  setPanel: (value: 'edit' | 'finalize' | null) => void
  reload: () => Promise<void>
}) {
  const [person, setPerson] = useState('')
  const [duration, setDuration] = useState(60)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const search = async () => {
    setBusy(true)
    setError('')
    try {
      setSuggestions(
        (await api.suggestions(event.shortCode, session.accessToken, person, duration)).suggestedSlots
      )
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tìm gợi ý.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-area">
      <div className="admin-card">
        <div className="admin-card-title">
          <Search />
          <div>
            <h3>Gợi ý giờ vàng</h3>
            <p>Ưu tiên khung có người chủ chốt.</p>
          </div>
        </div>
        <div className="filter-row">
          <label>
            Người chủ chốt
            <select
              className="styled-select"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
            >
              <option value="">Không bắt buộc</option>
              {event.participants.map(({ username }) => (
                <option key={username}>{username}</option>
              ))}
            </select>
          </label>
          <label>
            Thời lượng
            <select
              className="styled-select"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={15}>15 phút</option>
              <option value={30}>30 phút</option>
              <option value={45}>45 phút</option>
              <option value={60}>60 phút (1 giờ)</option>
              <option value={90}>90 phút (1.5 giờ)</option>
              <option value={120}>120 phút (2 giờ)</option>
              <option value={180}>180 phút (3 giờ)</option>
            </select>
          </label>
          <button className="secondary-button" onClick={search} disabled={busy}>
            {busy ? <LoaderCircle className="spin" /> : <Sparkles />} Tìm
          </button>
        </div>
        {suggestions.length > 0 && (
          <p className="success-note">
            <Check /> Đã đánh dấu {suggestions.length} khung phù hợp trên heatmap.
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
      {event.status === 1 && (
        <div className="admin-actions">
          <button
            className="secondary-button"
            onClick={() => setPanel(panel === 'edit' ? null : 'edit')}
          >
            <Edit3 /> Chỉnh sự kiện
          </button>
          <button
            className="primary-button"
            onClick={() => setPanel(panel === 'finalize' ? null : 'finalize')}
          >
            <LockKeyhole /> Chốt lịch họp
          </button>
        </div>
      )}
      {panel === 'edit' && (
        <EditEvent
          event={event}
          token={session.accessToken}
          done={async () => {
            setPanel(null)
            await reload()
          }}
        />
      )}
      {panel === 'finalize' && (
        <FinalizeEvent
          event={event}
          token={session.accessToken}
          done={async () => {
            setPanel(null)
            await reload()
          }}
        />
      )}
    </section>
  )
}

function EditEvent({
  event,
  token,
  done,
}: {
  event: EventData
  token: string
  done: () => Promise<void>
}) {
  const [form, setForm] = useState({
    title: event.title,
    eventType: event.eventType,
    availableDates: [...event.availableDates],
    availableWeekdays: [...event.availableWeekdays],
    dailyStartTime: event.dailyStartTime,
    dailyEndTime: event.dailyEndTime,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async (submit: FormEvent) => {
    submit.preventDefault()
    if (!confirm('Thay đổi cấu hình có thể xóa hoặc cắt ngắn lịch đã chọn. Tiếp tục?')) return
    setBusy(true)
    setError('')
    try {
      await api.updateEvent(event.shortCode, token, {
        title: form.title,
        eventType: form.eventType,
        availableDates: form.eventType === 1 ? form.availableDates : [],
        availableWeekdays: form.eventType === 2 ? form.availableWeekdays : [],
        dailyStartTime: form.dailyStartTime,
        dailyEndTime: form.dailyEndTime,
      })
      await done()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={save}>
      <h3>Chỉnh cấu hình sự kiện</h3>
      <label>
        Tiêu đề
        <input
          required
          maxLength={255}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </label>
      <div className="choice-row">
        <button
          type="button"
          className={form.eventType === 1 ? 'choice active' : 'choice'}
          onClick={() => setForm({ ...form, eventType: 1, availableWeekdays: [] })}
        >
          Ngày cụ thể
        </button>
        <button
          type="button"
          className={form.eventType === 2 ? 'choice active' : 'choice'}
          onClick={() => setForm({ ...form, eventType: 2, availableDates: [] })}
        >
          Theo thứ
        </button>
      </div>
      {form.eventType === 1 ? (
        <fieldset>
          <legend>
            Ngày có thể họp <small>(chạm trực tiếp trên lịch)</small>
          </legend>
          <div className="calendar-picker-wrap">
            <Calendar
              mode="multiple"
              captionLayout="dropdown"
              selected={form.availableDates.map((d) => new Date(`${d}T00:00:00`))}
              onSelect={(dates) => {
                const sorted = (dates || []).map(toLocalDateString).sort()
                setForm({ ...form, availableDates: sorted })
                setError('')
              }}
              disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
            />
          </div>
          {form.availableDates.length > 0 && (
            <div className="chips">
              {form.availableDates.map((item) => (
                <button
                  type="button"
                  className="chip"
                  key={item}
                  onClick={() =>
                    setForm({
                      ...form,
                      availableDates: form.availableDates.filter((v) => v !== item),
                    })
                  }
                >
                  {formatDateDMY(item)}
                  <X size={13} />
                </button>
              ))}
            </div>
          )}
        </fieldset>
      ) : (
        <WeekdayPicker
          value={form.availableWeekdays}
          onChange={(availableWeekdays) => setForm({ ...form, availableWeekdays })}
        />
      )}
      <div className="two-col">
        <label>
          Bắt đầu
          <TimeSelect
            value={form.dailyStartTime}
            onChange={(val) => setForm({ ...form, dailyStartTime: val })}
          />
        </label>
        <label>
          Kết thúc{' '}
          <small>
            {isOvernight(form.dailyStartTime, form.dailyEndTime) ? 'sang ngày hôm sau' : ''}
          </small>
          <TimeSelect
            value={form.dailyEndTime}
            onChange={(val) => setForm({ ...form, dailyEndTime: val })}
          />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button
        className="primary-button"
        disabled={
          busy ||
          (form.eventType === 1 ? !form.availableDates.length : !form.availableWeekdays.length)
        }
      >
        {busy ? <LoaderCircle className="spin" /> : <Check />} Lưu thay đổi
      </button>
    </form>
  )
}

function FinalizeEvent({
  event,
  token,
  done,
}: {
  event: EventData
  token: string
  done: () => Promise<void>
}) {
  const firstTarget =
    event.eventType === 1
      ? event.availableDates[0] || ''
      : `weekday:${event.availableWeekdays[0] ?? 1}`
  const [form, setForm] = useState({
    target: firstTarget,
    startTime: event.dailyStartTime,
    endTime: event.dailyEndTime,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const save = async (submit: FormEvent) => {
    submit.preventDefault()
    if (!confirm('Sau khi chốt, mọi người sẽ không thể sửa lịch. Xác nhận chốt?')) return
    setBusy(true)
    setError('')
    try {
      const slot: FinalSchedule =
        event.eventType === 1
          ? {
              specificDate: form.target,
              dayOfWeek: null,
              startTime: form.startTime,
              endTime: form.endTime,
            }
          : {
              specificDate: null,
              dayOfWeek: Number(form.target.replace('weekday:', '')),
              startTime: form.startTime,
              endTime: form.endTime,
            }
      await api.finalize(event.shortCode, token, slot)
      await done()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể chốt lịch.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="admin-form finalize-form" onSubmit={save}>
      <h3>Chốt lịch chính thức</h3>
      <label>
        Ngày
        <select
          className="styled-select"
          value={form.target}
          onChange={(e) => setForm({ ...form, target: e.target.value })}
        >
          {event.eventType === 1
            ? event.availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatDateDMY(date)} ({targetLabel(event, date, null)})
                </option>
              ))
            : event.availableWeekdays.map((day) => (
                <option key={day} value={`weekday:${day}`}>
                  {WEEKDAYS[day]}
                </option>
              ))}
        </select>
      </label>
      <div className="two-col">
        <label>
          Bắt đầu
          <TimeSelect
            value={form.startTime}
            onChange={(val) => setForm({ ...form, startTime: val })}
          />
        </label>
        <label>
          Kết thúc
          <TimeSelect value={form.endTime} onChange={(val) => setForm({ ...form, endTime: val })} />
        </label>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" disabled={busy}>
        {busy ? <LoaderCircle className="spin" /> : <LockKeyhole />} Xác nhận và khóa lịch
      </button>
    </form>
  )
}

function FinalBanner({ data }: { data: EventData }) {
  const slot = data.finalSchedule!
  return (
    <div className="final-banner">
      <span className="final-icon">
        <Check />
      </span>
      <div>
        <p>Lịch họp đã chốt</p>
        <strong>
          {targetLabel(data, slot.specificDate, slot.dayOfWeek)} · {slot.startTime}–{slot.endTime}
          {isOvernight(slot.startTime, slot.endTime) ? ' (+1 ngày)' : ''}
        </strong>
      </div>
      <button
        className="ghost-button"
        onClick={() =>
          navigator.clipboard.writeText(
            `${data.title}: ${targetLabel(data, slot.specificDate, slot.dayOfWeek)} ${
              slot.startTime
            }-${slot.endTime}`
          )
        }
      >
        <Clipboard /> Sao chép
      </button>
    </div>
  )
}
