import { CalendarCheck, CalendarPlus, Video, type LucideIcon } from 'lucide-react'

import type { MessageKey } from '@/shared/i18n'

/**
 * Mỗi cảnh là một tính năng: con trỏ bay tới nút (phase 0), bấm (1), rồi hiện kết quả (2, 3...).
 * Cảnh Meet có thêm một nhịp "đang tạo link" trước khi ra link.
 */
export const GOOGLE_SCENES: { key: MessageKey; icon: LucideIcon; phases: number[] }[] = [
  { key: 'home.gPoint1', icon: CalendarPlus, phases: [650, 250, 2600] },
  { key: 'home.gPoint2', icon: Video, phases: [650, 250, 600, 2300] },
  { key: 'home.gPoint3', icon: CalendarCheck, phases: [650, 250, 2600] },
]

/** Khung phẳng cho useFrameLoop: (cảnh, phase) theo thứ tự */
export const GOOGLE_FRAMES = GOOGLE_SCENES.flatMap((scene, sceneIndex) =>
  scene.phases.map((ms, phase) => ({ scene: sceneIndex, phase, ms })),
)
export const GOOGLE_DURATIONS = GOOGLE_FRAMES.map((frame) => frame.ms)
export const sceneStart = (scene: number) => GOOGLE_FRAMES.findIndex((frame) => frame.scene === scene)
export const sceneLength = (scene: number) => GOOGLE_SCENES[scene].phases.reduce((sum, ms) => sum + ms, 0)
