import axios, { type AxiosResponse } from 'axios';
import { env } from './env';

export interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message: string;
  value: T | null;
}

export const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
});
api.defaults.headers.common.Accept = 'application/json';

export function unwrapApiResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;
  if (!body || typeof body !== 'object') throw new Error('Invalid API response.');
  if (body.isSuccess !== true) {
    throw new Error(body.message || `Unable to complete the request (${response.status}).`);
  }
  if (body.value === null || body.value === undefined) throw new Error('Invalid API response.');
  return body.value;
}

function normalizeAxiosError(error: unknown): Error {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error : new Error('Unable to complete the request.');
  }

  const message = (error.response?.data as Partial<ApiResponse<unknown>> | undefined)?.message;
  if (message) return new Error(message);
  if (!error.response) return new Error('Unable to reach the Meetly server.');
  return new Error(`Unable to complete the request (${error.response.status}).`);
}

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeAxiosError(error)),
);
