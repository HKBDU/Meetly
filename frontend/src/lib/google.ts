import { env } from '@/lib/env'

/**
 * Xin quyền Google bằng Google Identity Services (token model), hoàn toàn trên trình duyệt:
 * - Script của Google chỉ nạp khi người dùng sắp dùng tới (rê chuột/focus vào nút, hoặc lúc bấm).
 * - Mỗi scope xin riêng, đúng lúc cần; không có refresh token, không gửi token lên server Meetly.
 * - Access token chỉ nằm trong bộ nhớ tab (Google cấp ~1 giờ), tải lại trang là mất.
 * Không có `VITE_GOOGLE_CLIENT_ID` thì coi như chưa cấu hình: các nút cần quyền Google bị ẩn.
 */

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'
/** Bỏ token sớm hơn hạn thật một chút để không dùng token hết hạn giữa chừng một lần gọi */
const EXPIRY_MARGIN_MS = 60_000

export const isGoogleConfigured = Boolean(env.googleClientId)

export type GoogleAuthErrorKind =
  | 'not_configured'
  /** Không tải được script của Google (mất mạng, bị chặn) */
  | 'script_failed'
  /** Người dùng tự đóng cửa sổ đăng nhập */
  | 'popup_closed'
  /** Trình duyệt chặn cửa sổ đăng nhập */
  | 'popup_blocked'
  /** Người dùng từ chối, hoặc bỏ tick quyền cần thiết trên màn hình cấp quyền */
  | 'access_denied'
  | 'unknown'

export class GoogleAuthError extends Error {
  readonly kind: GoogleAuthErrorKind

  constructor(kind: GoogleAuthErrorKind) {
    super(`Google authorization failed: ${kind}`)
    this.name = 'GoogleAuthError'
    this.kind = kind
  }
}

/** Phần API của Google Identity Services mà Meetly dùng */
interface TokenResponse {
  access_token?: string
  expires_in?: number | string
  scope?: string
  error?: string
}

interface TokenClientError {
  type?: string
}

interface TokenClient {
  requestAccessToken: () => void
}

interface GoogleOAuth2 {
  initTokenClient: (config: {
    client_id: string
    scope: string
    include_granted_scopes: boolean
    callback: (response: TokenResponse) => void
    error_callback?: (error: TokenClientError) => void
  }) => TokenClient
  hasGrantedAllScopes: (response: TokenResponse, firstScope: string, ...restScopes: string[]) => boolean
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } }
  }
}

let scriptPromise: Promise<GoogleOAuth2> | null = null

function loadGoogleIdentity(): Promise<GoogleOAuth2> {
  if (typeof window === 'undefined') return Promise.reject(new GoogleAuthError('script_failed'))
  const ready = window.google?.accounts?.oauth2
  if (ready) return Promise.resolve(ready)
  if (!scriptPromise) {
    scriptPromise = new Promise<GoogleOAuth2>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = GIS_SCRIPT_URL
      script.async = true
      script.onload = () => {
        const oauth2 = window.google?.accounts?.oauth2
        if (oauth2) resolve(oauth2)
        else reject(new GoogleAuthError('script_failed'))
      }
      script.onerror = () => {
        script.remove()
        reject(new GoogleAuthError('script_failed'))
      }
      document.head.appendChild(script)
    }).catch((error: unknown) => {
      // Cho phép thử nạp lại ở lần bấm sau
      scriptPromise = null
      throw error
    })
  }
  return scriptPromise
}

/**
 * Nạp sẵn script của Google khi người dùng sắp bấm. Popup cấp quyền phải mở gần ngay sau cú bấm,
 * nếu lúc bấm mới tải script thì trình duyệt có thể chặn popup.
 */
export function preloadGoogleIdentity(): void {
  if (!isGoogleConfigured) return
  loadGoogleIdentity().catch(() => {
    // Lỗi sẽ được báo khi người dùng thật sự bấm
  })
}

const tokens = new Map<string, { accessToken: string; expiresAt: number }>()
const pending = new Map<string, Promise<string>>()

function errorKindOf(type: string | undefined): GoogleAuthErrorKind {
  if (type === 'popup_closed') return 'popup_closed'
  if (type === 'popup_failed_to_open') return 'popup_blocked'
  return 'unknown'
}

/**
 * Access token cho đúng một scope (VD `calendar.freebusy`). Còn hạn thì dùng lại, không thì mở
 * cửa sổ cấp quyền của Google. Gọi trong handler của cú bấm. Lỗi luôn ném `GoogleAuthError`.
 */
export function requestGoogleAccessToken(scope: string): Promise<string> {
  const clientId = env.googleClientId
  if (!clientId) return Promise.reject(new GoogleAuthError('not_configured'))

  const cached = tokens.get(scope)
  if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.accessToken)

  // Bấm liên tiếp khi cửa sổ cấp quyền đang mở thì dùng chung một lượt
  const inFlight = pending.get(scope)
  if (inFlight) return inFlight

  const request = loadGoogleIdentity()
    .then(
      (oauth2) =>
        new Promise<string>((resolve, reject) => {
          const client = oauth2.initTokenClient({
            client_id: clientId,
            scope,
            include_granted_scopes: false,
            callback: (response) => {
              if (response.error || !response.access_token) {
                reject(new GoogleAuthError(response.error === 'access_denied' ? 'access_denied' : 'unknown'))
                return
              }
              // Màn hình cấp quyền cho phép bỏ tick từng quyền
              if (!oauth2.hasGrantedAllScopes(response, scope)) {
                reject(new GoogleAuthError('access_denied'))
                return
              }
              const lifetimeMs = (Number(response.expires_in) || 3600) * 1000
              tokens.set(scope, { accessToken: response.access_token, expiresAt: Date.now() + lifetimeMs - EXPIRY_MARGIN_MS })
              resolve(response.access_token)
            },
            error_callback: (error) => reject(new GoogleAuthError(errorKindOf(error.type))),
          })
          client.requestAccessToken()
        }),
    )
    .finally(() => pending.delete(scope))

  pending.set(scope, request)
  return request
}

/** Bỏ token đang giữ (VD Google báo 401), lần sau sẽ xin lại */
export function invalidateGoogleToken(scope: string): void {
  tokens.delete(scope)
}
