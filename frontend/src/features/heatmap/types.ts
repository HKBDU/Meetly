export type EventType = 1 | 2;
export type EventStatus = 1 | 2 | 3;
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const HeatmapPendingAction = {
  Finalize: 'finalize',
  Update: 'update',
} as const;
export type HeatmapPendingAction =
  (typeof HeatmapPendingAction)[keyof typeof HeatmapPendingAction];

export const HeatmapSelectionMode = {
  View: 'view',
  SelectFinal: 'select-final',
} as const;
export type HeatmapSelectionMode =
  (typeof HeatmapSelectionMode)[keyof typeof HeatmapSelectionMode];

export interface Participant {
  username: string;
}

export interface HeatmapCellData {
  specificDate: string | null;
  dayOfWeek: DayOfWeek | null;
  startTime: string;
  participants: string[];
  count: number;
}

export interface FinalSchedule {
  specificDate: string | null;
  dayOfWeek: DayOfWeek | null;
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
  availableWeekdays: DayOfWeek[];
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
  dayOfWeek: DayOfWeek | null;
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

export interface HeatmapPageProps {
  initialEvent: HeatmapEvent | null;
  accessToken?: string;
  isAdmin?: boolean;
  loading?: boolean;
  loadError?: string;
  onSuggestions?: (params: SuggestionParams) => Promise<SuggestedSlot[]>;
  onFinalize?: (slot: FinalSchedule) => Promise<FinalizeResult>;
  onUpdateEvent?: (
    payload: UpdateEventPayload,
    currentEvent: HeatmapEvent,
  ) => Promise<UpdateEventResult>;
  onOpenMySchedule?: () => void;
}

export interface HeatmapUpdatedPayload {
  shortCode: string;
  revision: number;
  heatmapGrid: HeatmapCellData[];
}

export interface EventUpdatedPayload {
  shortCode: string;
  revision: number;
  title: string;
  eventType: EventType;
  availableDates: string[];
  availableWeekdays: DayOfWeek[];
  dailyStartTime: string;
  dailyEndTime: string;
}

export interface EventFinalizedPayload {
  shortCode: string;
  revision: number;
  status: 2;
  finalSchedule: FinalSchedule;
}

export interface HeatmapProps {
  event: HeatmapEvent;
  suggestions: SuggestedSlot[];
  selected: FinalSchedule | null;
  selecting: boolean;
  onInspect: (details: CellDetails) => void;
  onInspectEnd: () => void;
  onStart: (point: SelectedCell) => void;
  onExtend: (point: SelectedCell) => void;
  onKeyboardSelect: (point: SelectedCell, extendRange?: boolean) => void;
}

export interface HeatmapCellProps extends Omit<HeatmapProps, 'event'> {
  point: SelectedCell;
  cell: HeatmapCellData | undefined;
  total: number;
}

export interface AvailabilityDetailsProps {
  details: CellDetails | null;
  participants: Participant[];
  keyParticipant: string | null;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface KeyParticipantSelectorProps {
  participants: Participant[];
  selected: string | null;
  disabled: boolean;
  onChange: (name: string | null) => void;
}

export interface ScheduleControlsProps {
  selected: FinalSchedule | null;
  selecting: boolean;
  disabled: boolean;
  onBegin: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export interface FinalizeDialogProps {
  open: boolean;
  selected: FinalSchedule | null;
  timezone: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export interface EditEventDialogProps {
  event: EditableEvent;
  disabled?: boolean;
  onSave: (payload: UpdateEventPayload) => Promise<void>;
}

export interface EventHeaderProps {
  event: HeatmapEvent;
  canEdit: boolean;
  duration: number | undefined;
  disabled: boolean;
  canUpdate: boolean;
  onOpenMySchedule?: () => void;
  onDurationChange: (duration: number | undefined) => void;
  onUpdateEvent: (payload: UpdateEventPayload) => Promise<void>;
}

export interface AdminSuggestionControlsProps {
  participants: Participant[];
  keyParticipant: string | null;
  disabled: boolean;
  updating: boolean;
  loaded: boolean;
  suggestionCount: number;
  onKeyParticipantChange: (name: string | null) => void;
}

export interface HeatmapWorkspaceProps {
  event: HeatmapEvent;
  canEdit: boolean;
  suggestions: SuggestedSlot[];
  keyParticipant: string | null;
  pending: HeatmapPendingAction | null;
  onFinalize?: (slot: FinalSchedule) => Promise<FinalizeResult>;
  onFinalized: (result: FinalizeResult) => void;
  onPendingChange: (action: HeatmapPendingAction | null) => void;
}
