import { api, type ApiResponse, unwrapApiResponse } from '@/lib/axios';
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

export async function getEvent(shortCode: string): Promise<HeatmapEvent> {
  return unwrapApiResponse(await api.get<ApiResponse<HeatmapEvent>>(eventEndpoint(shortCode)));
}

export async function getSuggestions(
  shortCode: string,
  params: SuggestionParams,
): Promise<SuggestedSlot[]> {
  const keyParticipant = params.keyParticipant?.trim() || undefined;
  if (params.minDuration !== undefined) {
    if (!Number.isFinite(params.minDuration) || params.minDuration <= 0)
      throw new Error('Duration must be greater than zero.');
  }
  const result = unwrapApiResponse(
    await api.get<ApiResponse<{ suggestedSlots: SuggestedSlot[] }>>(
      eventEndpoint(shortCode, '/suggestions'),
      {
        params: { keyParticipant, minDuration: params.minDuration },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    ),
  );
  if (!Array.isArray(result.suggestedSlots)) throw new Error('Invalid suggestions response.');
  return result.suggestedSlots;
}

export async function finalizeEvent(
  shortCode: string,
  payload: FinalSchedule,
): Promise<FinalizeResult> {
  if (!accessToken) throw new Error('Sign in to finalize the meeting.');
  return unwrapApiResponse(
    await api.post<ApiResponse<FinalizeResult>>(eventEndpoint(shortCode, '/finalize'), payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );
}

export async function updateEvent(
  shortCode: string,
  payload: UpdateEventPayload,
  accessToken: string,
): Promise<UpdateEventResult> {
  if (!accessToken) throw new Error('Sign in as the event host to edit this event.');
  return unwrapApiResponse(
    await api.put<ApiResponse<UpdateEventResult>>(eventEndpoint(shortCode), payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );
}
