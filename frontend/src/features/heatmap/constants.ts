export { DESKTOP_COLUMNS_PER_PAGE, MOBILE_COLUMNS_PER_PAGE } from '@/shared/grid/model'

export const DEFAULT_MEETING_DURATION = 15
export const DURATION_OPTIONS = [15, 30, 45, 60, 75, 90, 120] as const

export const AVAILABILITY_LEVELS = [0, 1, 2, 3, 4, 5] as const
export type AvailabilityLevel = (typeof AVAILABILITY_LEVELS)[number]
