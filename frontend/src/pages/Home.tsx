import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  DoorOpen,
  LoaderCircle,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { Brand } from '@/components/Brand'
import { CreatedModal } from '@/components/CreatedModal'
import { TimeSelect } from '@/components/TimeSelect'
import { WeekdayPicker } from '@/components/WeekdayPicker'
import { Calendar } from '@/components/ui/calendar'
import { formatDateDMY, isOvernight, toLocalDateString } from '@/shared/schedule'
import { api } from '@/shared/services'
import { go, saveSession } from '@/shared/session'
import type { CreateEventInput } from '@/shared/types'

const emptyCreate: CreateEventInput = {
  title: '',
  eventType: 1,
  availableDates: [],
  availableWeekdays: [],
  dailyStartTime: '08:00',
  dailyEndTime: '17:00',
  admin: { username: '', password: null },
}

export function Home() {
  const [mode, setMode] = useState<'create' | 'join'>('create')
  const [create, setCreate] = useState(emptyCreate)
  const [join, setJoin] = useState({ code: '', username: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [createdModal, setCreatedModal] = useState<{ code: string; title: string } | null>(null)

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await api.createEvent(create)
      saveSession(result.shortCode, { ...result, username: create.admin.username, timeSlots: [] })
      setCreatedModal({ code: result.shortCode, title: create.title })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tạo sự kiện.')
    } finally {
      setBusy(false)
    }
  }

  const submitJoin = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const code = join.code.trim().toUpperCase()
      const result = await api.accessEvent(code, join.username, join.password)
      saveSession(code, result)
      go(`/event/${code}`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tham gia sự kiện.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="landing">
      <nav className="landing-nav">
        <Brand />
        <span className="nav-note">Lịch chung, quyết định nhanh.</span>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={15} /> Không đăng ký tài khoản
          </p>
          <h1>
            Biến giờ rảnh
            <br />
            <em>thành giờ họp.</em>
          </h1>
          <p className="hero-lead">
            Gom lịch rảnh của cả nhóm thành một heatmap trực quan. Chia sẻ một link. Chốt một giờ.
          </p>
          <div className="proof-row">
            <span>
              <MousePointer2 size={17} /> Chọn lịch 15 phút
            </span>
            <span>
              <Users size={17} /> Đồng bộ realtime
            </span>
            <span>
              <ShieldCheck size={17} /> Định danh theo sự kiện
            </span>
          </div>
        </div>
        <div className="entry-card">
          <div className="segmented" role="tablist">
            <button
              className={mode === 'create' ? 'active' : ''}
              onClick={() => {
                setMode('create')
                setError('')
              }}
            >
              Tạo lịch mới
            </button>
            <button
              className={mode === 'join' ? 'active' : ''}
              onClick={() => {
                setMode('join')
                setError('')
              }}
            >
              Tham gia
            </button>
          </div>
          {mode === 'create' ? (
            <form onSubmit={submitCreate} className="create-split-grid">
              <div className="create-fields-col">
                <p className="create-fields-title">Thông tin sự kiện</p>
                <label>
                  Tên cuộc họp
                  <input
                    required
                    maxLength={255}
                    value={create.title}
                    onChange={(e) => setCreate({ ...create, title: e.target.value })}
                    placeholder="Ví dụ: Planning quý IV"
                  />
                </label>
                <div className="two-col">
                  <label>
                    Tên của bạn
                    <input
                      required
                      maxLength={100}
                      value={create.admin.username}
                      onChange={(e) =>
                        setCreate({
                          ...create,
                          admin: { ...create.admin, username: e.target.value },
                        })
                      }
                      placeholder="Minh"
                    />
                  </label>
                  <label>
                    Mật khẩu <small>tùy chọn</small>
                    <input
                      type="password"
                      maxLength={128}
                      value={create.admin.password || ''}
                      onChange={(e) =>
                        setCreate({
                          ...create,
                          admin: { ...create.admin, password: e.target.value || null },
                        })
                      }
                      placeholder="••••••••"
                    />
                  </label>
                </div>
                <div className="two-col">
                  <label>
                    Bắt đầu
                    <TimeSelect
                      value={create.dailyStartTime}
                      onChange={(val) => setCreate({ ...create, dailyStartTime: val })}
                    />
                  </label>
                  <label>
                    Kết thúc{' '}
                    <small>
                      {isOvernight(create.dailyStartTime, create.dailyEndTime)
                        ? 'sang ngày sau'
                        : ''}
                    </small>
                    <TimeSelect
                      value={create.dailyEndTime}
                      onChange={(val) => setCreate({ ...create, dailyEndTime: val })}
                    />
                  </label>
                </div>
                {error && <p className="form-error">{error}</p>}
                <button
                  className="primary-button submit-create-btn"
                  disabled={
                    busy ||
                    (create.eventType === 1
                      ? !create.availableDates.length
                      : !create.availableWeekdays.length)
                  }
                >
                  {busy ? <LoaderCircle className="spin" /> : <ArrowRight />} Tạo lịch và tiếp tục
                </button>
              </div>

              <div className="create-calendar-col">
                <fieldset>
                  <legend>Kiểu lịch</legend>
                  <div className="choice-row">
                    <button
                      type="button"
                      className={create.eventType === 1 ? 'choice active' : 'choice'}
                      onClick={() =>
                        setCreate({ ...create, eventType: 1, availableWeekdays: [] })
                      }
                    >
                      Ngày cụ thể
                    </button>
                    <button
                      type="button"
                      className={create.eventType === 2 ? 'choice active' : 'choice'}
                      onClick={() =>
                        setCreate({ ...create, eventType: 2, availableDates: [] })
                      }
                    >
                      Theo thứ
                    </button>
                  </div>
                </fieldset>
                {create.eventType === 1 ? (
                  <fieldset className="dates-fieldset">
                    <legend>
                      Ngày có thể họp <small>(chạm trực tiếp trên lịch)</small>
                    </legend>
                    <div className="calendar-picker-wrap">
                      <Calendar
                        mode="multiple"
                        captionLayout="dropdown"
                        selected={create.availableDates.map((d) => new Date(`${d}T00:00:00`))}
                        onSelect={(dates) => {
                          const sorted = (dates || []).map(toLocalDateString).sort()
                          setCreate({ ...create, availableDates: sorted })
                          setError('')
                        }}
                        disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                      />
                    </div>
                    {create.availableDates.length > 0 && (
                      <div className="chips">
                        {create.availableDates.map((item) => (
                          <button
                            type="button"
                            className="chip"
                            key={item}
                            onClick={() =>
                              setCreate({
                                ...create,
                                availableDates: create.availableDates.filter((value) => value !== item),
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
                    value={create.availableWeekdays}
                    onChange={(availableWeekdays) =>
                      setCreate({ ...create, availableWeekdays })
                    }
                  />
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={submitJoin} className="join-split-grid">
              <div className="join-fields-col">
                <div className="join-header-compact">
                  <div className="join-icon">
                    <DoorOpen size={20} />
                  </div>
                  <div>
                    <h2>Vào lịch của nhóm</h2>
                    <p>Nhập mã 6 ký tự để chọn giờ rảnh hoặc xem kết quả.</p>
                  </div>
                </div>
                <label>
                  Mã sự kiện
                  <input
                    required
                    minLength={6}
                    maxLength={6}
                    className="code-input"
                    value={join.code}
                    onChange={(e) =>
                      setJoin({
                        ...join,
                        code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                      })
                    }
                    placeholder="A1B2C3"
                  />
                </label>
                <div className="two-col">
                  <label>
                    Tên hiển thị
                    <input
                      required
                      maxLength={100}
                      value={join.username}
                      onChange={(e) => setJoin({ ...join, username: e.target.value })}
                      placeholder="Tên của bạn"
                    />
                  </label>
                  <label>
                    Mật khẩu <small>nếu có</small>
                    <input
                      type="password"
                      maxLength={128}
                      value={join.password}
                      onChange={(e) => setJoin({ ...join, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </label>
                </div>
                {error && <p className="form-error">{error}</p>}
                <button
                  className="primary-button submit-join-btn"
                  disabled={busy || join.code.length !== 6}
                >
                  {busy ? <LoaderCircle className="spin" /> : <ArrowRight />} Tham gia sự kiện
                </button>
              </div>

              <div className="join-guide-col">
                <div className="guide-card">
                  <h3>Tham gia dễ dàng</h3>
                  <div className="guide-step">
                    <span className="step-badge">1</span>
                    <div>
                      <strong>Nhận mã hoặc link</strong>
                      <p>Mã 6 ký tự được người tổ chức gửi sau khi tạo lịch.</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-badge">2</span>
                    <div>
                      <strong>Chọn khung giờ rảnh</strong>
                      <p>Kéo chọn trực tiếp trên heatmap 15 hoặc 30 phút.</p>
                    </div>
                  </div>
                  <div className="guide-step">
                    <span className="step-badge">3</span>
                    <div>
                      <strong>Đồng bộ realtime</strong>
                      <p>Không cần đăng ký. Kết quả giao thoa cập nhật tức thì.</p>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
      <footer>Meetly · Asia/Ho_Chi_Minh · Quyết định theo dữ liệu, không theo cảm giác.</footer>
      {createdModal && (
        <CreatedModal
          code={createdModal.code}
          title={createdModal.title}
          onClose={() => {
            go(`/event/${createdModal.code}`)
            setCreatedModal(null)
          }}
        />
      )}
    </main>
  )
}
