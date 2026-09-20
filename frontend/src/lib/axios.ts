import axios from 'axios';
import { getEventSession } from '@/shared/auth/event-session';
import { env } from './env';

interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message: string | null;
  value: T | null;
}

type ApiResponseShape = Partial<Record<'isSuccess' | 'IsSuccess', boolean>> &
  Partial<Record<'code' | 'Code', number>> &
  Partial<Record<'message' | 'Message', string | null>> &
  Partial<Record<'value' | 'Value', unknown>>;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
});
api.defaults.headers.common.Accept = 'application/json';

function eventShortCode(url: string | undefined): string | null {
  const match = url?.match(/(?:^|\/)events\/([^/?#]+)/i);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function normalizeApiResponse(value: unknown): ApiResponse<unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as ApiResponseShape;
  const isSuccess = raw.isSuccess ?? raw.IsSuccess;
  const code = raw.code ?? raw.Code;
  if (typeof isSuccess !== 'boolean' || typeof code !== 'number') return null;
  return {
    isSuccess,
    code,
    message: raw.message ?? raw.Message ?? null,
    value: raw.value ?? raw.Value ?? null,
  };
}

function normalizeAxiosError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Unable to complete the request.');
  }

  const status = error.response?.status ?? 0;
  const message = normalizeApiResponse(error.response?.data)?.message;
  if (!error.response) return new ApiError('Unable to reach the Meetly server.', status);
  return new ApiError(message || `Unable to complete the request (${status}).`, status);
}

api.interceptors.request.use((config) => {
  const shortCode = eventShortCode(config.url);
  if (!shortCode) return config;
  config.headers.delete('Authorization');
  const session = getEventSession(shortCode);
  if (session) config.headers.Authorization = `Bearer ${session.accessToken}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = normalizeApiResponse(response.data);
    if (!body) return response;
    if (!body.isSuccess) {
      throw new ApiError(
        body.message || `Unable to complete the request (${body.code || response.status}).`,
        body.code || response.status,
      );
    }
    response.data = body.value;
    return response;
  },
  (error: unknown) => Promise.reject(normalizeAxiosError(error)),
);
