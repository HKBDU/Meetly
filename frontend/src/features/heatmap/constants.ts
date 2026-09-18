import type { DayOfWeek } from './types';

/** BE tổng hợp heatmap theo ô 30 phút */
export const SLOT_MINUTES = 30;
export const DEFAULT_MEETING_DURATION = 60;
export const MOBILE_COLUMNS_PER_PAGE = 3;
export const DESKTOP_COLUMNS_PER_PAGE = 5;

export const WEEKDAYS: ReadonlyArray<{ value: DayOfWeek; label: string; shortLabel: string }> = [
  { value: 0, label: 'Sunday', shortLabel: 'Sun' },
  { value: 1, label: 'Monday', shortLabel: 'Mon' },
  { value: 2, label: 'Tuesday', shortLabel: 'Tue' },
  { value: 3, label: 'Wednesday', shortLabel: 'Wed' },
  { value: 4, label: 'Thursday', shortLabel: 'Thu' },
  { value: 5, label: 'Friday', shortLabel: 'Fri' },
  { value: 6, label: 'Saturday', shortLabel: 'Sat' },
];

export const WEEKDAYS_MONDAY_FIRST = [
  WEEKDAYS[1],
  WEEKDAYS[2],
  WEEKDAYS[3],
  WEEKDAYS[4],
  WEEKDAYS[5],
  WEEKDAYS[6],
  WEEKDAYS[0],
];

export const AVAILABILITY_LEVELS = [0, 1, 2, 3, 4, 5] as const;
export type AvailabilityLevel = (typeof AVAILABILITY_LEVELS)[number];
