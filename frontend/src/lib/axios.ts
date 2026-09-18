import axios, { isAxiosError } from 'axios';

import { env } from '@/lib/env';
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

/** Câu lỗi tiếng Anh theo mã HTTP, không hiển thị message của BE */
const ERROR_MESSAGE_BY_STATUS: Record<number, string> = {
  400: 'Invalid information, please check and try again',
  422: 'Invalid information, please check and try again',
  401: 'Your session has expired, please join again',
  403: "You don't have permission to do this",
  404: 'Event not found',
  409: 'This action conflicts with the current state of the event',
  429: 'Too many requests, please slow down',
};

/** Câu lỗi để toast theo mã lỗi BE trả về; lỗi mạng hoặc mã lạ thì dùng `fallback` */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error) || !error.response) return fallback;
  const data = error.response.data as Partial<ApiEnvelope> | undefined;
  const code = data?.code ?? error.response.status;
  if (code >= 500) return 'Server error, please try again later';
  return ERROR_MESSAGE_BY_STATUS[code] ?? fallback;
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
    if (error.response?.status === 401) {
      useParticipantStore.getState().resetSession();
    }
    return Promise.reject(error);
  },
);
