import type { SuggestionParams } from './types';

export function getSuggestionParams(
  duration: number | undefined,
  keyParticipant: string | null,
): SuggestionParams | null {
  if (duration === undefined && keyParticipant === null) return null;
  return {
    ...(duration === undefined ? {} : { minDuration: duration }),
    ...(keyParticipant === null ? {} : { keyParticipant }),
  };
}
