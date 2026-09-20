import type { SuggestionParams } from './types';

export function getSuggestionParams(
  duration: number | undefined,
  keyParticipant: string | null,
): SuggestionParams | null {
  if (duration === undefined) return null;
  return {
    minDuration: duration,
    ...(keyParticipant === null ? {} : { keyParticipant }),
  };
}
