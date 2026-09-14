import type { UpdateEventPayload, UpdateEventResult } from './types';

interface ApiResponse<T> {
  isSuccess: boolean;
  message: string;
  value: T | null;
}

export async function updateEvent(
  shortCode: string,
  payload: UpdateEventPayload,
  accessToken: string,
): Promise<UpdateEventResult> {
  if (!accessToken) throw new Error('Sign in as the event host to edit this event.');

  const response = await fetch(`/api/v1/events/${encodeURIComponent(shortCode)}`, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const body: ApiResponse<UpdateEventResult> = await response.json();

  if (!response.ok || body.isSuccess !== true) {
    throw new Error(body.message || `Unable to update the event (${response.status}).`);
  }
  if (!body.value || !Number.isFinite(body.value.revision)) {
    throw new Error('Invalid update event response.');
  }

  return body.value;
}
