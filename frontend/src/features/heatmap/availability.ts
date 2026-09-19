import type { AvailabilityLevel } from './constants';

export function getAvailabilityLevel(count: number, total: number): AvailabilityLevel {
  const ratio = total === 0 ? 0 : count / total;
  if (ratio === 0) return 0;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  if (ratio < 1) return 4;
  return 5;
}

export function getAvailabilityClass(count: number, total: number): string {
  return `availability-level-${getAvailabilityLevel(count, total)}`;
}

export function getAvailabilityLevelClass(level: AvailabilityLevel): string {
  return `availability-level-${level}`;
}
