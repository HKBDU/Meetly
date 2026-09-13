import type { FinalizeResult, FinalSchedule, HeatmapEvent, SuggestedSlot, SuggestionParams } from './types.ts'
import { buildRows, formatTime, getColumns, isValidSchedule, toMinutes } from './time.ts'

const participants = ['Dương', 'An', 'Bình', 'Chi', 'Duy', 'Huyền', 'Khoa', 'Linh'].map(username => ({ username }))

const baseEvent: HeatmapEvent = {
  title: 'Meetly Team Meeting', shortCode: 'DEMO26', url: 'https://meetly.example/DEMO26',
  eventType: 1, timezone: 'Asia/Ho_Chi_Minh',
  availableDates: ['2026-09-10', '2026-09-11', '2026-09-12'], availableWeekdays: [],
  dailyStartTime: '08:00', dailyEndTime: '12:00', status: 1, revision: 12,
  participants, heatmapGrid: [], finalSchedule: null,
}

function withSampleAvailability(event: HeatmapEvent): HeatmapEvent {
  const levels = [0, 2, 4, 5, 6, 7, 8]
  return {
    ...event,
    heatmapGrid: getColumns(event).flatMap((column, dayIndex) =>
      buildRows(event.dailyStartTime, event.dailyEndTime).map((row, rowIndex) => {
        // Everyone is available in the first column from 10:00 to 12:00, matching the sample suggestion.
        const count = dayIndex === 0 && rowIndex >= 8 ? 8 : levels[(rowIndex + dayIndex) % levels.length]
        const names = participants.slice(0, count).map(person => person.username)
        return { specificDate: column.specificDate, dayOfWeek: column.dayOfWeek, startTime: row.startTime, participants: names, count }
      }),
    ),
  }
}

export const mockDatesEvent = withSampleAvailability(baseEvent)
export const mockWeekdaysEvent = withSampleAvailability({ ...baseEvent, eventType: 2, availableDates: [], availableWeekdays: [1, 3, 5] })

export function getMockScenario(params: URLSearchParams) {
  let event = params.get('type') === 'weekdays' ? mockWeekdaysEvent : mockDatesEvent
  if (params.get('empty') === 'participants') event = { ...event, participants: [], heatmapGrid: [] }
  if (params.get('empty') === 'availability') event = { ...event, heatmapGrid: [] }
  if (params.get('empty') === 'days') event = { ...event, availableDates: [], availableWeekdays: [], heatmapGrid: [] }
  return { event, isAdmin: params.get('role') !== 'user' }
}

export async function getMockSuggestions(event: HeatmapEvent, params: SuggestionParams): Promise<SuggestedSlot[]> {
  const duration = params.minDuration ?? 60
  const firstDay = getColumns(event)[0]
  const knownParticipant = !params.keyParticipant || event.participants.some(person => person.username === params.keyParticipant)
  if (!firstDay || !knownParticipant || !event.participants.length || !event.heatmapGrid.length || duration <= 0 || duration > 120) return []
  // A fixed sample, not the production suggestion algorithm.
  return [{
    specificDate: firstDay.specificDate, dayOfWeek: firstDay.dayOfWeek,
    startTime: '10:00', endTime: formatTime(toMinutes('10:00') + duration),
    participantCount: 8, totalParticipants: 8,
  }]
}

export async function finalizeMockEvent(event: HeatmapEvent, slot: FinalSchedule): Promise<FinalizeResult> {
  if (event.status !== 1) throw new Error('This event is locked and cannot be finalized again.')
  if (!isValidSchedule(event, slot)) throw new Error('The time range is outside the event schedule.')
  return {
    status: 2,
    finalSchedule: { specificDate: slot.specificDate, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime },
    revision: event.revision + 1,
  }
}
