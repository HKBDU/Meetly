import { create } from 'zustand'

import type { HeatmapCellData, Participant } from '@/shared/types'

export type ActivityKind = 'updated' | 'joined'

export interface ActivityItem {
  id: number
  shortCode: string
  name: string
  kind: ActivityKind
  at: number
}

interface EventActivityState {
  items: ActivityItem[]
  push: (shortCode: string, entries: { name: string; kind: ActivityKind }[]) => void
}

/** Giữ tối đa chừng này mục gần nhất; giao diện chỉ hiện các mục còn "mới" */
const MAX_ITEMS = 20
let nextId = 1

/** Ai vừa làm gì trong event (lấy từ realtime), để trang event hiện "Minh vừa cập nhật lịch rảnh" */
export const useEventActivity = create<EventActivityState>((set) => ({
  items: [],
  push: (shortCode, entries) =>
    set((state) => ({
      items: [
        ...state.items,
        ...entries.map((entry) => ({ ...entry, shortCode, id: nextId++, at: Date.now() })),
      ].slice(-MAX_ITEMS),
    })),
}))

/**
 * So lưới cũ với lưới mới để biết ai vừa đổi lịch rảnh (tên xuất hiện hoặc biến mất ở ô nào đó),
 * và ai mới vào event. Payload realtime chỉ có lưới tổng nên phải tự suy ra.
 */
export function diffActivity(
  before: { heatmapGrid: HeatmapCellData[]; participants: Participant[] },
  after: { heatmapGrid: HeatmapCellData[]; participants?: Participant[] },
): { name: string; kind: ActivityKind }[] {
  const cellKey = (cell: HeatmapCellData) => `${cell.specificDate ?? ''}|${cell.dayOfWeek ?? ''}|${cell.startTime}`
  const namesAt = (grid: HeatmapCellData[]) => new Map(grid.map((cell) => [cellKey(cell), new Set(cell.participants)]))
  const oldCells = namesAt(before.heatmapGrid)
  const newCells = namesAt(after.heatmapGrid)

  const changed = new Set<string>()
  for (const key of new Set([...oldCells.keys(), ...newCells.keys()])) {
    const oldNames = oldCells.get(key) ?? new Set<string>()
    const newNames = newCells.get(key) ?? new Set<string>()
    for (const name of oldNames) if (!newNames.has(name)) changed.add(name)
    for (const name of newNames) if (!oldNames.has(name)) changed.add(name)
  }

  const known = new Set(before.participants.map((person) => person.username))
  const joined = (after.participants ?? []).map((person) => person.username).filter((name) => !known.has(name))

  return [
    ...joined.map((name) => ({ name, kind: 'joined' as const })),
    ...[...changed].filter((name) => !joined.includes(name)).map((name) => ({ name, kind: 'updated' as const })),
  ]
}
