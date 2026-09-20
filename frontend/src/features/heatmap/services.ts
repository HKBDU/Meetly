import { api } from '@/lib/axios';
import type {
  FinalizeResult,
  FinalSchedule,
  HeatmapEvent,
  SuggestedSlot,
  SuggestionParams,
  UpdateEventPayload,
  CurrentParticipant,
} from './types';

const eventEndpoint = (shortCode: string, suffix = '') =>
  `/events/${encodeURIComponent(shortCode)}${suffix}`;

export async function getEvent(shortCode: string): Promise<HeatmapEvent> {
  const { data } = await api.get<HeatmapEvent>(eventEndpoint(shortCode));
  return data;
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
  const { data: result } = await api.get<{ suggestedSlots: SuggestedSlot[] }>(
    eventEndpoint(shortCode, '/suggestions'),
    { params: { keyParticipant, minDuration: params.minDuration } },
  );
  if (!Array.isArray(result.suggestedSlots)) throw new Error('Invalid suggestions response.');
  return result.suggestedSlots;
}

export async function finalizeEvent(
  shortCode: string,
  payload: FinalSchedule,
): Promise<FinalizeResult> {
  const { data } = await api.post<FinalizeResult>(eventEndpoint(shortCode, '/finalize'), payload);
  return data;
}

export async function updateEvent(
  shortCode: string,
  payload: UpdateEventPayload,
): Promise<HeatmapEvent> {
  await api.put<null>(eventEndpoint(shortCode), payload);
  return getEvent(shortCode);
}

export async function getCurrentParticipant(
  shortCode: string,
): Promise<CurrentParticipant> {
  const { data: participant } = await api.get<CurrentParticipant>(
    eventEndpoint(shortCode, '/participants/me'),
  );
  return participant;
}
