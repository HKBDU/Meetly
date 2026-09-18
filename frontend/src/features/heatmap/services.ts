import { api, getApiErrorMessage } from '@/lib/axios';
import type {
  FinalizeResult,
  FinalSchedule,
  HeatmapEvent,
  SuggestedSlot,
  SuggestionParams,
  UpdateEventPayload,
  UpdateEventResult,
} from './types';

const eventEndpoint = (shortCode: string, suffix = '') =>
  `/events/${encodeURIComponent(shortCode)}${suffix}`;

const authHeaders = (accessToken: string) => ({ Authorization: `Bearer ${accessToken}` });

/** Đổi lỗi axios thành `Error` với câu tiếng Anh để nơi gọi toast trực tiếp */
async function unwrap<T>(request: Promise<{ data: T }>, fallback: string): Promise<T> {
  try {
    return (await request).data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, fallback), { cause: error });
  }
}

export function getEvent(shortCode: string): Promise<HeatmapEvent> {
  return unwrap(api.get<HeatmapEvent>(eventEndpoint(shortCode)), 'Unable to load the event.');
}

export async function getSuggestions(
  shortCode: string,
  params: SuggestionParams,
  accessToken: string,
): Promise<SuggestedSlot[]> {
  if (!accessToken) throw new Error('Sign in to find suggested times.');
  const keyParticipant = params.keyParticipant?.trim() || undefined;
  if (params.minDuration !== undefined) {
    if (!Number.isFinite(params.minDuration) || params.minDuration <= 0)
      throw new Error('Duration must be greater than zero.');
  }
  const result = await unwrap(
    api.get<{ suggestedSlots: SuggestedSlot[] }>(eventEndpoint(shortCode, '/suggestions'), {
      params: { keyParticipant, minDuration: params.minDuration },
      headers: authHeaders(accessToken),
    }),
    'Unable to update suggestions. Please try again.',
  );
  if (!Array.isArray(result.suggestedSlots)) throw new Error('Invalid suggestions response.');
  return result.suggestedSlots;
}

export async function finalizeEvent(
  shortCode: string,
  payload: FinalSchedule,
  accessToken: string,
): Promise<FinalizeResult> {
  if (!accessToken) throw new Error('Sign in to finalize the meeting.');
  return unwrap(
    api.post<FinalizeResult>(eventEndpoint(shortCode, '/finalize'), payload, {
      headers: authHeaders(accessToken),
    }),
    'Unable to finalize the meeting. Please try again.',
  );
}

export async function updateEvent(
  shortCode: string,
  payload: UpdateEventPayload,
  accessToken: string,
): Promise<UpdateEventResult> {
  if (!accessToken) throw new Error('Sign in as the event host to edit this event.');
  return unwrap(
    api.put<UpdateEventResult>(eventEndpoint(shortCode), payload, {
      headers: authHeaders(accessToken),
    }),
    'Unable to update the event. Please try again.',
  );
}
