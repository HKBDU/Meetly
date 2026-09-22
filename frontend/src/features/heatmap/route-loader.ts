import {
  clearEventSession,
  getEventSession,
} from '@/shared/auth/event-session';
import { ApiError } from '@/lib/axios';
import { getCurrentParticipant, getEvent } from './services';
import type { HeatmapEvent } from './types';

export interface HeatmapRouteData {
  event: HeatmapEvent;
  isAdmin: boolean;
  accessToken?: string;
}

export async function loadHeatmapRouteData(shortCode: string): Promise<HeatmapRouteData> {
  const event = await getEvent(shortCode);
  const session = getEventSession(shortCode);
  if (!session) return { event, isAdmin: false };

  try {
    const participant = await getCurrentParticipant(shortCode);
    return {
      event,
      isAdmin: participant.isAdmin,
      accessToken: session.accessToken,
    };
  } catch (failure) {
    if (failure instanceof ApiError && (failure.status === 401 || failure.status === 403)) {
      clearEventSession(shortCode);
    }
    return { event, isAdmin: false };
  }
}
