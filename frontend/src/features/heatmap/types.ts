export type EventType = 1 | 2;
export type EventStatus = 1 | 2 | 3;

export interface Participant {
  username: string;
}

export interface HeatmapCellData {
  specificDate: string | null;
  dayOfWeek: number | null;
  startTime: string;
  participants: string[];
  count: number;
}

export interface FinalSchedule {
  specificDate: string | null;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
}

export interface SuggestedSlot extends FinalSchedule {
  participantCount: number;
  totalParticipants: number;
}

export interface HeatmapEvent {
  title: string;
  shortCode: string;
  url: string;
  eventType: EventType;
  timezone: string;
  availableDates: string[];
  availableWeekdays: number[];
  dailyStartTime: string;
  dailyEndTime: string;
  status: EventStatus;
  revision: number;
  participants: Participant[];
  heatmapGrid: HeatmapCellData[];
  finalSchedule: FinalSchedule | null;
}

export type EditableEvent = Pick<
  HeatmapEvent,
  | 'title'
  | 'eventType'
  | 'availableDates'
  | 'availableWeekdays'
  | 'dailyStartTime'
  | 'dailyEndTime'
>;

export type UpdateEventPayload = EditableEvent;

export interface UpdateEventResult {
  revision: number;
}

export interface SuggestionParams {
  keyParticipant?: string;
  minDuration?: number;
}

export interface FinalizeResult {
  status: 2;
  finalSchedule: FinalSchedule;
  revision: number;
}

export interface TimeColumn {
  key: string;
  label: string;
  detail: string;
  specificDate: string | null;
  dayOfWeek: number | null;
}

export interface TimeRow {
  startTime: string;
  endTime: string;
}

export interface SelectedCell {
  column: TimeColumn;
  row: TimeRow;
}

export interface CellDetails {
  dayLabel: string;
  startTime: string;
  endTime: string;
  availableNames: string[];
  count: number;
}
