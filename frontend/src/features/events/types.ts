export type EventType = 1 | 2;

export interface EditableEvent {
  title: string;
  eventType: EventType;
  availableDates: string[];
  availableWeekdays: number[];
  dailyStartTime: string;
  dailyEndTime: string;
}

export type UpdateEventPayload = EditableEvent;

export interface UpdateEventResult {
  revision: number;
}
