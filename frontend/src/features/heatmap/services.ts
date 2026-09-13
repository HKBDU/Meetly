import type {
  FinalizeResult,
  FinalSchedule,
  HeatmapEvent,
  SuggestedSlot,
  SuggestionParams,
} from './types';

interface ApiResponse<T> {
  isSuccess: boolean;
  code: number;
  message: string;
  value: T | null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const response = await fetch(`/api/v1/events/${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });
  const body: ApiResponse<T> = await response.json();
  if (!body || typeof body !== 'object') throw new Error('Invalid API response.');
  if (!response.ok || body.isSuccess !== true) {
    throw new Error(body.message || `Unable to complete the request (${response.status}).`);
  }
  if (body.value === null || body.value === undefined) throw new Error('Invalid API response.');
  return body.value;
}

export function getEvent(shortCode: string): Promise<HeatmapEvent> {
  return request(encodeURIComponent(shortCode));
}

export async function getSuggestions(
  shortCode: string,
  params: SuggestionParams,
  accessToken: string,
): Promise<SuggestedSlot[]> {
  if (!accessToken) throw new Error('Sign in to find suggested times.');
  const query = new URLSearchParams();
  if (params.keyParticipant?.trim()) query.set('keyParticipant', params.keyParticipant.trim());
  if (params.minDuration !== undefined) {
    if (!Number.isFinite(params.minDuration) || params.minDuration <= 0)
      throw new Error('Duration must be greater than zero.');
    query.set('minDuration', String(params.minDuration));
  }
  const suffix = query.size ? `?${query.toString()}` : '';
  const result = await request<{ suggestedSlots: SuggestedSlot[] }>(
    `${encodeURIComponent(shortCode)}/suggestions${suffix}`,
    {},
    accessToken,
  );
  if (!Array.isArray(result.suggestedSlots)) throw new Error('Invalid suggestions response.');
  return result.suggestedSlots;
}

export function finalizeEvent(
  shortCode: string,
  payload: FinalSchedule,
  accessToken: string,
): Promise<FinalizeResult> {
  if (!accessToken) return Promise.reject(new Error('Sign in to finalize the meeting.'));
  return request(
    `${encodeURIComponent(shortCode)}/finalize`,
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken,
  );
}
