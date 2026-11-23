import axios, { isAxiosError } from 'axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** 401 của request này là sai thông tin, không phải token hết hạn nên không đá về màn định danh */
    keepSessionOn401?: boolean;
  }
}

import { env } from '@/lib/env';
import { t, type MessageKey } from '@/shared/i18n';
import { useParticipantStore } from '@/features/participants/store';

/** Envelope `ApiResponse<T>` của BE; response lỗi trả PascalCase nên chuẩn hóa về camelCase */
export interface ApiEnvelope<T = unknown> {
  isSuccess: boolean;
  code: number;
  message: string | null;
  value: T | null;
}

function normalizeEnvelope(data: unknown): unknown {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const raw = data as Partial<Record<'isSuccess' | 'IsSuccess', boolean>> &
    Partial<Record<'code' | 'Code', number>> &
    Partial<Record<'message' | 'Message', string | null>> &
    Partial<Record<'value' | 'Value', unknown>>;
  if (raw.isSuccess === undefined && raw.IsSuccess === undefined) return data;
  return {
    isSuccess: raw.isSuccess ?? raw.IsSuccess,
    code: raw.code ?? raw.Code,
    message: raw.message ?? raw.Message ?? null,
    value: raw.value ?? raw.Value ?? null,
  } satisfies Partial<ApiEnvelope>;
}

/** Câu lỗi theo mã HTTP (theo ngôn ngữ đang chọn), không hiển thị message của BE */
const ERROR_MESSAGE_BY_STATUS: Record<number, MessageKey> = {
  400: 'api.invalid',
  422: 'api.invalid',
  401: 'api.sessionExpired',
  403: 'api.forbidden',
  404: 'api.notFound',
  409: 'api.conflict',
  429: 'api.tooMany',
};

/** Câu lỗi để toast theo mã lỗi BE trả về; lỗi mạng hoặc mã lạ thì dùng `fallback` */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error) || !error.response) return fallback;
  const data = error.response.data as Partial<ApiEnvelope> | undefined;
  const code = data?.code ?? error.response.status;
  if (code >= 500) return t('api.server');
  const key = ERROR_MESSAGE_BY_STATUS[code];
  return key ? t(key) : fallback;
}

export const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

/** Gắn Bearer token của participant hiện tại; BE xác định participant/admin qua claim trong JWT */
api.interceptors.request.use((config) => {
  const accessToken = useParticipantStore.getState().auth?.accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** Bóc `value` khỏi envelope `ApiResponse<T>`; lỗi để từng mutation tự toast qua `onError` */
api.interceptors.response.use(
  (response) => {
    const envelope = normalizeEnvelope(response.data) as Partial<ApiEnvelope> | undefined;
    response.data = envelope?.value ?? envelope ?? response.data;
    return response;
  },
  (error) => {
    if (error.response) error.response.data = normalizeEnvelope(error.response.data);
    // BE không có endpoint refresh token, nên 401 chỉ có thể đưa về màn định danh
    if (error.response?.status === 401 && !error.config?.keepSessionOn401) {
      useParticipantStore.getState().resetSession();
    }
    return Promise.reject(error);
  },
);
