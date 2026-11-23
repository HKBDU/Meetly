export { DESKTOP_COLUMNS_PER_PAGE, MOBILE_COLUMNS_PER_PAGE } from '@/shared/grid/model'

/** Thời lượng mặc định khi tìm giờ tốt nhất (phút) */
export const DEFAULT_MEETING_DURATION = 60
export const DURATION_OPTIONS = [30, 60, 90, 120] as const

export const AVAILABILITY_LEVELS = [0, 1, 2, 3, 4, 5] as const
export type AvailabilityLevel = (typeof AVAILABILITY_LEVELS)[number]
