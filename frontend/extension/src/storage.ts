/**
 * Dữ liệu extension lưu trên máy: tên host hay dùng và danh sách sự kiện đã tạo.
 * Chạy ngoài Chrome (xem trước bằng `vite`) thì dùng localStorage thay cho chrome.storage.
 */
export interface StoredEvent {
  shortCode: string
  title: string
  createdAt: string
  participantId: string
  username: string
  /** Mật khẩu host do extension tự sinh, để đăng nhập lại khi token hết hạn */
  password: string
  accessToken: string
  expiresAt: string
}

const KEYS = { hostName: 'meetly.hostName', events: 'meetly.events' } as const
export const MAX_STORED_EVENTS = 30

const hasChromeStorage = () => typeof chrome !== 'undefined' && Boolean(chrome.storage?.local)

async function read<T>(key: string, fallback: T): Promise<T> {
  if (hasChromeStorage()) {
    const result = await chrome.storage.local.get(key)
    return (result[key] as T | undefined) ?? fallback
  }
  const raw = localStorage.getItem(key)
  return raw ? (JSON.parse(raw) as T) : fallback
}

async function write(key: string, value: unknown) {
  if (hasChromeStorage()) await chrome.storage.local.set({ [key]: value })
  else localStorage.setItem(key, JSON.stringify(value))
}

export const getHostName = () => read(KEYS.hostName, '')
export const setHostName = (name: string) => write(KEYS.hostName, name)

export const getEvents = () => read<StoredEvent[]>(KEYS.events, [])

export async function saveEvent(event: StoredEvent) {
  const events = (await getEvents()).filter((item) => item.shortCode !== event.shortCode)
  await write(KEYS.events, [event, ...events].slice(0, MAX_STORED_EVENTS))
}

export async function updateEvent(shortCode: string, patch: Partial<StoredEvent>) {
  const events = await getEvents()
  await write(
    KEYS.events,
    events.map((item) => (item.shortCode === shortCode ? { ...item, ...patch } : item)),
  )
}

export async function removeEvent(shortCode: string) {
  await write(KEYS.events, (await getEvents()).filter((item) => item.shortCode !== shortCode))
}

/** Mở tab mới (trong extension) hoặc cửa sổ mới (khi xem trước ngoài Chrome) */
export function openTab(url: string) {
  if (typeof chrome !== 'undefined' && chrome.tabs?.create) void chrome.tabs.create({ url })
  else window.open(url, '_blank', 'noopener')
}

/** Mật khẩu host ngẫu nhiên: người dùng không phải nghĩ, extension giữ hộ */
export function generatePassword(length = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}
