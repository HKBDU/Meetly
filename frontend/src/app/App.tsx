import { useCallback, useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import {
  ArrowRight, CalendarDays, Check, Clipboard, Clock3, DoorOpen, Edit3, Link2, LoaderCircle, LockKeyhole,
  LogOut, Mail, MousePointer2, Plus, Search, ShieldCheck, Sparkles, Users, X,
} from 'lucide-react'
import { api, connectRealtime } from '@/shared/services'
import { cellKey, cellsToSlots, slotsToCells, targetKey, targetLabel, times, WEEKDAYS } from '@/shared/schedule'
import type { CreateEventInput, EventData, FinalSchedule, Session, Suggestion, TimeSlot } from '@/shared/types'

const emptyCreate: CreateEventInput = {
  title: '', eventType: 1, availableDates: [], availableWeekdays: [], dailyStartTime: '08:00', dailyEndTime: '17:00',
  admin: { username: '', password: null },
}
const sessionKey = (code: string) => `meetly:session:${code}`
const readSession = (code: string): Session | null => {
  try { return JSON.parse(localStorage.getItem(sessionKey(code)) || 'null') as Session | null } catch { return null }
}
const saveSession = (code: string, session: Session) => localStorage.setItem(sessionKey(code), JSON.stringify(session))
const eventCodeFromPath = () => {
  const parts = location.pathname.split('/').filter(Boolean)
  const candidate = parts[0]?.toLowerCase() === 'event' ? parts[1] : parts[0]
  return candidate && /^[a-z0-9]{6}$/i.test(candidate) ? candidate.toUpperCase() : null
}
const go = (path: string) => { history.pushState({}, '', path); dispatchEvent(new PopStateEvent('popstate')) }
const today = new Date().toISOString().slice(0, 10)

export default function App() {
  const [code, setCode] = useState(eventCodeFromPath)
  useEffect(() => {
    const sync = () => setCode(eventCodeFromPath())
    addEventListener('popstate', sync)
    return () => removeEventListener('popstate', sync)
  }, [])
  return code ? <EventPage code={code} /> : <Home />
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <button className="brand" onClick={() => go('/')} aria-label="Về trang chủ">
    <span className="brand-mark"><CalendarDays size={compact ? 18 : 22} /></span><span>meetly</span>
  </button>
}

function Home() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [create, setCreate] = useState(emptyCreate)
  const [date, setDate] = useState('')
  const [join, setJoin] = useState({ code: '', username: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await api.createEvent(create)
      saveSession(result.shortCode, { ...result, username: create.admin.username, timeSlots: [] })
      go(`/event/${result.shortCode}`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tạo sự kiện.') }
    finally { setBusy(false) }
  }
  const submitJoin = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const code = join.code.trim().toUpperCase()
      const result = await api.accessEvent(code, join.username, join.password)
      saveSession(code, result); go(`/event/${code}`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tham gia sự kiện.') }
    finally { setBusy(false) }
  }
  const addDate = () => {
    if (date && !create.availableDates.includes(date)) setCreate({ ...create, availableDates: [...create.availableDates, date].sort() })
    setDate('')
  }

  return <main className="landing">
    <nav className="landing-nav"><Brand /><span className="nav-note">Lịch chung, quyết định nhanh.</span></nav>
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow"><Sparkles size={15} /> Không đăng ký tài khoản</p>
        <h1>Tìm giờ họp<br /><em>không cần họp.</em></h1>
        <p className="hero-lead">Gom lịch rảnh của cả nhóm thành một heatmap trực quan. Chia sẻ một link. Chốt một giờ.</p>
        <div className="proof-row">
          <span><MousePointer2 size={17} /> Chọn lịch 15 phút</span><span><Users size={17} /> Đồng bộ realtime</span>
          <span><ShieldCheck size={17} /> Định danh theo sự kiện</span>
        </div>
      </div>
      <div className="entry-card">
        <div className="segmented" role="tablist">
          <button className={mode === 'create' ? 'active' : ''} onClick={() => { setMode('create'); setError('') }}>Tạo lịch mới</button>
          <button className={mode === 'join' ? 'active' : ''} onClick={() => { setMode('join'); setError('') }}>Tham gia</button>
        </div>
        {mode === 'create' ? <form onSubmit={submitCreate} className="form-stack">
          <label>Tên cuộc họp<input required maxLength={255} value={create.title} onChange={(e) => setCreate({ ...create, title: e.target.value })} placeholder="Ví dụ: Planning quý IV" /></label>
          <div className="two-col">
            <label>Tên của bạn<input required maxLength={100} value={create.admin.username} onChange={(e) => setCreate({ ...create, admin: { ...create.admin, username: e.target.value } })} placeholder="Minh" /></label>
            <label>Mật khẩu <small>tùy chọn</small><input type="password" maxLength={128} value={create.admin.password || ''} onChange={(e) => setCreate({ ...create, admin: { ...create.admin, password: e.target.value || null } })} placeholder="••••••••" /></label>
          </div>
          <fieldset><legend>Kiểu lịch</legend><div className="choice-row">
            <button type="button" className={create.eventType === 1 ? 'choice active' : 'choice'} onClick={() => setCreate({ ...create, eventType: 1, availableWeekdays: [] })}>Ngày cụ thể</button>
            <button type="button" className={create.eventType === 2 ? 'choice active' : 'choice'} onClick={() => setCreate({ ...create, eventType: 2, availableDates: [] })}>Theo thứ</button>
          </div></fieldset>
          {create.eventType === 1 ? <fieldset><legend>Ngày có thể họp</legend>
            <div className="inline-input"><input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /><button type="button" className="icon-button" onClick={addDate} aria-label="Thêm ngày"><Plus size={18} /></button></div>
            <div className="chips">{create.availableDates.map((item) => <button type="button" className="chip" key={item} onClick={() => setCreate({ ...create, availableDates: create.availableDates.filter((value) => value !== item) })}>{item}<X size={13} /></button>)}</div>
          </fieldset> : <WeekdayPicker value={create.availableWeekdays} onChange={(availableWeekdays) => setCreate({ ...create, availableWeekdays })} />}
          <div className="two-col">
            <label>Bắt đầu<input required type="time" step={900} value={create.dailyStartTime} onChange={(e) => setCreate({ ...create, dailyStartTime: e.target.value })} /></label>
            <label>Kết thúc<input required type="time" step={900} value={create.dailyEndTime} onChange={(e) => setCreate({ ...create, dailyEndTime: e.target.value })} /></label>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={busy || (create.eventType === 1 ? !create.availableDates.length : !create.availableWeekdays.length)}>{busy ? <LoaderCircle className="spin" /> : <ArrowRight />} Tạo lịch và tiếp tục</button>
        </form> : <form onSubmit={submitJoin} className="form-stack join-form">
          <div className="join-icon"><DoorOpen /></div><div><h2>Vào lịch của nhóm</h2><p>Nhập mã 6 ký tự từ người tổ chức.</p></div>
          <label>Mã sự kiện<input required minLength={6} maxLength={6} className="code-input" value={join.code} onChange={(e) => setJoin({ ...join, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} placeholder="A1B2C3" /></label>
          <label>Tên hiển thị<input required maxLength={100} value={join.username} onChange={(e) => setJoin({ ...join, username: e.target.value })} placeholder="Tên của bạn" /></label>
          <label>Mật khẩu <small>nếu đã đặt</small><input type="password" maxLength={128} value={join.password} onChange={(e) => setJoin({ ...join, password: e.target.value })} /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" disabled={busy || join.code.length !== 6}>{busy ? <LoaderCircle className="spin" /> : <ArrowRight />} Tham gia sự kiện</button>
        </form>}
      </div>
    </section>
    <footer>Meetly · Asia/Ho_Chi_Minh · Quyết định theo dữ liệu, không theo cảm giác.</footer>
  </main>
}

function WeekdayPicker({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  return <fieldset><legend>Ngày trong tuần</legend><div className="weekday-grid">
    {WEEKDAYS.map((day, index) => <button type="button" key={day} className={value.includes(index) ? 'day active' : 'day'} onClick={() => onChange(value.includes(index) ? value.filter((item) => item !== index) : [...value, index].sort())}>{day.replace('Thứ ', 'T')}</button>)}
  </div></fieldset>
}

function EventPage({ code }: { code: string }) {
  const [data, setData] = useState<EventData | null>(null)
  const [session, setSession] = useState<Session | null>(() => readSession(code))
  const [tab, setTab] = useState<'overview' | 'mine'>('overview')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [adminPanel, setAdminPanel] = useState<'edit' | 'finalize' | null>(null)

  const load = useCallback(async () => {
    try {
      const event = await api.getEvent(code)
      setData(event); setError('')
      const stored = readSession(code)
      if (stored) {
        try {
          const me = await api.getMe(code, stored.accessToken)
          const next = { ...stored, ...me }; saveSession(code, next); setSession(next)
        } catch { localStorage.removeItem(sessionKey(code)); setSession(null) }
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải sự kiện.') }
  }, [code])
  // Initial fetch synchronizes route state with the API.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load() }, [load])
  const accessToken = session?.accessToken
  useEffect(() => {
    if (!accessToken) return
    let disposed = false
    let connection: Awaited<ReturnType<typeof connectRealtime>> | null = null
    void connectRealtime(code, accessToken, {
      heatmapUpdated: (payload) => setData((current) => current && payload.revision > current.revision ? { ...current, revision: payload.revision, heatmapGrid: payload.heatmapGrid } : current),
      eventChanged: () => { void load() },
    }).then((value) => { if (disposed) void value.stop(); else connection = value }).catch(() => undefined)
    return () => { disposed = true; if (connection) void connection.stop() }
  }, [accessToken, code, load])

  const authenticate = async (username: string, password: string) => {
    const result = await api.accessEvent(code, username, password)
    saveSession(code, result); setSession(result); setTab('mine'); await load()
  }
  const logout = () => { localStorage.removeItem(sessionKey(code)); setSession(null); setTab('overview') }
  const copyLink = async () => { await navigator.clipboard.writeText(location.href); setNotice('Đã sao chép link'); setTimeout(() => setNotice(''), 1800) }

  if (!data) return <main className="event-shell"><nav className="event-nav"><Brand compact /></nav><div className="state-card">{error || <><LoaderCircle className="spin" /> Đang tải lịch…</>}</div></main>
  return <main className="event-shell">
    <nav className="event-nav"><Brand compact /><div className="event-nav-actions">
      <button className="ghost-button" onClick={copyLink}><Link2 size={16} /> {notice || 'Chia sẻ'}</button>
      {session ? <><span className="user-pill"><span>{session.username.slice(0, 1).toUpperCase()}</span>{session.username}{session.isAdmin && <ShieldCheck size={15} />}</span><button className="icon-button" onClick={logout} aria-label="Đăng xuất"><LogOut size={17} /></button></> : null}
    </div></nav>
    <section className="event-heading">
      <div><p className="eyebrow">Mã sự kiện · {code}</p><h1>{data.title}</h1><p><Clock3 size={15} /> {data.dailyStartTime}–{data.dailyEndTime} · {data.timezone}</p></div>
      <div className="event-stats"><strong>{data.participants.length}</strong><span>người tham gia</span><strong>{data.revision}</strong><span>lần cập nhật</span></div>
    </section>
    {data.finalSchedule && <FinalBanner data={data} />}
    {data.status === 3 && <div className="closed-banner"><LockKeyhole /> Sự kiện đã đóng. Dữ liệu chỉ còn chế độ xem.</div>}
    {error && <p className="form-error page-error">{error}</p>}
    <div className="workspace">
      <div className="tabs"><button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>Tổng quan</button><button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>Lịch của tôi</button></div>
      {tab === 'overview' ? <>
        <div className="section-heading"><div><p className="eyebrow">Heatmap tổng</p><h2>Thời gian cả nhóm cùng rảnh</h2></div><p>Màu đậm hơn nghĩa là nhiều người tham gia hơn.</p></div>
        <Heatmap event={data} suggestions={suggestions} />
        {session?.isAdmin && <AdminTools event={data} session={session} suggestions={suggestions} setSuggestions={setSuggestions} panel={adminPanel} setPanel={setAdminPanel} reload={load} />}
      </> : session ? <Availability key={`${session.participantId}:${data.revision}`} event={data} session={session} onSaved={async (slots) => { const next = { ...session, timeSlots: slots }; setSession(next); saveSession(code, next); await load() }} /> : <JoinPanel onJoin={authenticate} />}
    </div>
  </main>
}

function JoinPanel({ onJoin }: { onJoin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  return <form className="join-panel" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setError(''); try { await onJoin(username, password) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể đăng nhập.') } finally { setBusy(false) } }}>
    <div className="join-icon"><LockKeyhole /></div><div><h2>Định danh để chọn lịch</h2><p>Tên chỉ tồn tại trong sự kiện này. Mật khẩu không bắt buộc.</p></div>
    <label>Tên hiển thị<input required maxLength={100} value={username} onChange={(e) => setUsername(e.target.value)} /></label>
    <label>Mật khẩu <small>tùy chọn</small><input type="password" maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} /></label>
    {error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <ArrowRight />} Tiếp tục</button>
  </form>
}

function Heatmap({ event, suggestions = [], selectable, selected, mode = 'free', onCellDown, onCellEnter }: {
  event: EventData; suggestions?: Suggestion[]; selectable?: boolean; selected?: Set<string>; mode?: 'free' | 'busy';
  onCellDown?: (key: string, event: PointerEvent<HTMLButtonElement>) => void; onCellEnter?: (key: string, event: PointerEvent<HTMLButtonElement>) => void
}) {
  const columns = event.eventType === 1
    ? event.availableDates.map((value) => ({ key: value, date: value, day: null as number | null }))
    : event.availableWeekdays.map((value) => ({ key: `weekday:${value}`, date: null as string | null, day: value }))
  const rows = times(event.dailyStartTime, event.dailyEndTime)
  const cells = new Map(event.heatmapGrid.map((item) => [cellKey(targetKey(item.specificDate, item.dayOfWeek), item.startTime), item]))
  const max = Math.max(1, event.participants.length)
  const highlighted = (column: (typeof columns)[number], time: string) => suggestions.some((slot) =>
    slot.specificDate === column.date && slot.dayOfWeek === column.day && time >= slot.startTime && time < slot.endTime)
  return <div className="heatmap-wrap"><table className="heatmap"><thead><tr><th>Giờ</th>{columns.map((column) => <th key={column.key}>{targetLabel(event, column.date, column.day)}</th>)}</tr></thead>
    <tbody>{rows.map((time) => <tr key={time}><th>{time}</th>{columns.map((column) => {
      const key = cellKey(column.key, time); const cell = cells.get(key); const free = selected?.has(key) ?? false; const active = mode === 'free' ? free : !free
      const level = cell ? Math.ceil((cell.count / max) * 4) : 0
      return <td key={key}><button type="button" disabled={!selectable} className={`heat-cell level-${level}${active && selectable ? ' selected' : ''}${highlighted(column, time) ? ' suggested' : ''}`} title={selectable ? `${targetLabel(event, column.date, column.day)} ${time}` : cell?.participants.join(', ') || 'Chưa có ai rảnh'} onPointerDown={(pointer) => onCellDown?.(key, pointer)} onPointerEnter={(pointer) => onCellEnter?.(key, pointer)}><span>{selectable ? (active ? <Check size={14} /> : '') : cell?.count || ''}</span></button></td>
    })}</tr>)}</tbody></table></div>
}

function Availability({ event, session, onSaved }: { event: EventData; session: Session; onSaved: (slots: TimeSlot[]) => Promise<void> }) {
  const [selected, setSelected] = useState(() => slotsToCells(session.timeSlots)); const [mode, setMode] = useState<'free' | 'busy'>('free')
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const [manual, setManual] = useState({ target: event.eventType === 1 ? event.availableDates[0] || '' : `weekday:${event.availableWeekdays[0] ?? 1}`, start: event.dailyStartTime, end: event.dailyEndTime })
  const dragValue = useRef<boolean | null>(null)
  useEffect(() => { const up = () => { dragValue.current = null }; addEventListener('pointerup', up); return () => removeEventListener('pointerup', up) }, [])
  const setCell = (key: string, value: boolean) => setSelected((current) => { const next = new Set(current); if (value) next.add(key); else next.delete(key); return next })
  const pointerDown = (key: string, pointer: PointerEvent<HTMLButtonElement>) => { pointer.preventDefault(); const next = !selected.has(key); dragValue.current = next; setCell(key, next) }
  const pointerEnter = (key: string, pointer: PointerEvent<HTMLButtonElement>) => { if (pointer.buttons === 1 && dragValue.current !== null) setCell(key, dragValue.current) }
  const addManual = () => {
    if (manual.start >= manual.end) return setError('Giờ bắt đầu phải trước giờ kết thúc.')
    const next = new Set(selected); const markFree = mode === 'free'
    for (const time of times(manual.start, manual.end)) { const key = cellKey(manual.target, time); if (markFree) next.add(key); else next.delete(key) }
    setSelected(next); setError('')
  }
  const save = async () => { setBusy(true); setError(''); try { const slots = cellsToSlots(event, selected); await api.saveAvailability(event.shortCode, session.accessToken, slots, email); await onSaved(slots) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể lưu lịch.') } finally { setBusy(false) } }
  if (event.status !== 1) return <div className="state-card"><LockKeyhole /> Sự kiện đã khóa. Lịch cá nhân không thể chỉnh sửa.</div>
  return <div className="availability">
    <div className="schedule-toolbar"><div><p className="eyebrow">Lịch của {session.username}</p><h2>Kéo hoặc chạm để đánh dấu</h2></div><div className="segmented compact"><button className={mode === 'free' ? 'active' : ''} onClick={() => setMode('free')}>Tôi rảnh</button><button className={mode === 'busy' ? 'active' : ''} onClick={() => setMode('busy')}>Tôi bận</button></div></div>
    <Heatmap event={event} selectable selected={selected} mode={mode} onCellDown={pointerDown} onCellEnter={pointerEnter} />
    <div className="manual-row"><label>Ngày<select value={manual.target} onChange={(e) => setManual({ ...manual, target: e.target.value })}>{event.eventType === 1 ? event.availableDates.map((date) => <option key={date} value={date}>{targetLabel(event, date, null)}</option>) : event.availableWeekdays.map((day) => <option key={day} value={`weekday:${day}`}>{WEEKDAYS[day]}</option>)}</select></label><label>Từ<input type="time" step={900} min={event.dailyStartTime} max={event.dailyEndTime} value={manual.start} onChange={(e) => setManual({ ...manual, start: e.target.value })} /></label><label>Đến<input type="time" step={900} min={event.dailyStartTime} max={event.dailyEndTime} value={manual.end} onChange={(e) => setManual({ ...manual, end: e.target.value })} /></label><button className="secondary-button" onClick={addManual}><Plus size={16} /> Đánh dấu</button></div>
    <div className="save-bar"><label><Mail size={17} /> Nhận lịch chốt qua email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@congty.vn" /></label><div>{error && <span className="form-error">{error}</span>}<button className="primary-button" onClick={save} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Check />} Lưu lịch của tôi</button></div></div>
  </div>
}

function AdminTools({ event, session, suggestions, setSuggestions, panel, setPanel, reload }: {
  event: EventData; session: Session; suggestions: Suggestion[]; setSuggestions: (value: Suggestion[]) => void;
  panel: 'edit' | 'finalize' | null; setPanel: (value: 'edit' | 'finalize' | null) => void; reload: () => Promise<void>
}) {
  const [person, setPerson] = useState(''); const [duration, setDuration] = useState(60); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const search = async () => { setBusy(true); setError(''); try { setSuggestions((await api.suggestions(event.shortCode, session.accessToken, person, duration)).suggestedSlots) } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tìm gợi ý.') } finally { setBusy(false) } }
  return <section className="admin-area">
    <div className="admin-card"><div className="admin-card-title"><Search /><div><h3>Gợi ý giờ vàng</h3><p>Ưu tiên khung có người chủ chốt.</p></div></div><div className="filter-row"><label>Người chủ chốt<select value={person} onChange={(e) => setPerson(e.target.value)}><option value="">Không bắt buộc</option>{event.participants.map(({ username }) => <option key={username}>{username}</option>)}</select></label><label>Thời lượng<input type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></label><button className="secondary-button" onClick={search} disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Sparkles />} Tìm</button></div>{suggestions.length > 0 && <p className="success-note"><Check /> Đã đánh dấu {suggestions.length} khung phù hợp trên heatmap.</p>}{error && <p className="form-error">{error}</p>}</div>
    {event.status === 1 && <div className="admin-actions"><button className="secondary-button" onClick={() => setPanel(panel === 'edit' ? null : 'edit')}><Edit3 /> Chỉnh sự kiện</button><button className="primary-button" onClick={() => setPanel(panel === 'finalize' ? null : 'finalize')}><LockKeyhole /> Chốt lịch họp</button></div>}
    {panel === 'edit' && <EditEvent event={event} token={session.accessToken} done={async () => { setPanel(null); await reload() }} />}
    {panel === 'finalize' && <FinalizeEvent event={event} token={session.accessToken} done={async () => { setPanel(null); await reload() }} />}
  </section>
}

function EditEvent({ event, token, done }: { event: EventData; token: string; done: () => Promise<void> }) {
  const [form, setForm] = useState({ title: event.title, eventType: event.eventType, availableDates: event.availableDates.join(', '), availableWeekdays: event.availableWeekdays, dailyStartTime: event.dailyStartTime, dailyEndTime: event.dailyEndTime })
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const save = async (submit: FormEvent) => { submit.preventDefault(); if (!confirm('Thay đổi cấu hình có thể xóa hoặc cắt ngắn lịch đã chọn. Tiếp tục?')) return; setBusy(true); setError(''); try { await api.updateEvent(event.shortCode, token, { title: form.title, eventType: form.eventType, availableDates: form.eventType === 1 ? form.availableDates.split(',').map((item) => item.trim()).filter(Boolean) : [], availableWeekdays: form.eventType === 2 ? form.availableWeekdays : [], dailyStartTime: form.dailyStartTime, dailyEndTime: form.dailyEndTime }); await done() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể cập nhật.') } finally { setBusy(false) } }
  return <form className="admin-form" onSubmit={save}><h3>Chỉnh cấu hình sự kiện</h3><label>Tiêu đề<input required maxLength={255} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><div className="choice-row"><button type="button" className={form.eventType === 1 ? 'choice active' : 'choice'} onClick={() => setForm({ ...form, eventType: 1, availableWeekdays: [] })}>Ngày cụ thể</button><button type="button" className={form.eventType === 2 ? 'choice active' : 'choice'} onClick={() => setForm({ ...form, eventType: 2, availableDates: '' })}>Theo thứ</button></div>{form.eventType === 1 ? <label>Ngày, cách nhau bằng dấu phẩy<input required value={form.availableDates} onChange={(e) => setForm({ ...form, availableDates: e.target.value })} placeholder="2026-09-20, 2026-09-21" /></label> : <WeekdayPicker value={form.availableWeekdays} onChange={(availableWeekdays) => setForm({ ...form, availableWeekdays })} />}<div className="two-col"><label>Bắt đầu<input type="time" step={900} value={form.dailyStartTime} onChange={(e) => setForm({ ...form, dailyStartTime: e.target.value })} /></label><label>Kết thúc<input type="time" step={900} value={form.dailyEndTime} onChange={(e) => setForm({ ...form, dailyEndTime: e.target.value })} /></label></div>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <Check />} Lưu thay đổi</button></form>
}

function FinalizeEvent({ event, token, done }: { event: EventData; token: string; done: () => Promise<void> }) {
  const firstTarget = event.eventType === 1 ? event.availableDates[0] || '' : `weekday:${event.availableWeekdays[0] ?? 1}`
  const [form, setForm] = useState({ target: firstTarget, startTime: event.dailyStartTime, endTime: event.dailyEndTime })
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const save = async (submit: FormEvent) => { submit.preventDefault(); if (!confirm('Sau khi chốt, mọi người sẽ không thể sửa lịch. Xác nhận chốt?')) return; setBusy(true); setError(''); try { const slot: FinalSchedule = event.eventType === 1 ? { specificDate: form.target, dayOfWeek: null, startTime: form.startTime, endTime: form.endTime } : { specificDate: null, dayOfWeek: Number(form.target.replace('weekday:', '')), startTime: form.startTime, endTime: form.endTime }; await api.finalize(event.shortCode, token, slot); await done() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể chốt lịch.') } finally { setBusy(false) } }
  return <form className="admin-form finalize-form" onSubmit={save}><h3>Chốt lịch chính thức</h3><label>Ngày<select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}>{event.eventType === 1 ? event.availableDates.map((date) => <option key={date} value={date}>{targetLabel(event, date, null)}</option>) : event.availableWeekdays.map((day) => <option key={day} value={`weekday:${day}`}>{WEEKDAYS[day]}</option>)}</select></label><div className="two-col"><label>Bắt đầu<input type="time" step={900} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></label><label>Kết thúc<input type="time" step={900} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></label></div>{error && <p className="form-error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? <LoaderCircle className="spin" /> : <LockKeyhole />} Xác nhận và khóa lịch</button></form>
}

function FinalBanner({ data }: { data: EventData }) {
  const slot = data.finalSchedule!
  return <div className="final-banner"><span className="final-icon"><Check /></span><div><p>Lịch họp đã chốt</p><strong>{targetLabel(data, slot.specificDate, slot.dayOfWeek)} · {slot.startTime}–{slot.endTime}</strong></div><button className="ghost-button" onClick={() => navigator.clipboard.writeText(`${data.title}: ${targetLabel(data, slot.specificDate, slot.dayOfWeek)} ${slot.startTime}-${slot.endTime}`)}><Clipboard /> Sao chép</button></div>
}
