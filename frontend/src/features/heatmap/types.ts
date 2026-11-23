import type { FinalizeResult } from '@/shared/api/events'
import type { TimeColumn, TimeRow } from '@/shared/grid/model'
import type { EditableEvent, EventDetail, FinalSchedule, Participant } from '@/shared/types'

export const HeatmapPendingAction = {
  Finalize: 'finalize',
  Update: 'update',
} as const
export type HeatmapPendingAction = (typeof HeatmapPendingAction)[keyof typeof HeatmapPendingAction]

export const HeatmapSelectionMode = {
  View: 'view',
  SelectFinal: 'select-final',
} as const
export type HeatmapSelectionMode = (typeof HeatmapSelectionMode)[keyof typeof HeatmapSelectionMode]

export interface SuggestedSlot extends FinalSchedule {
  participantCount: number
  totalParticipants: number
}

export interface SuggestionParams {
  keyParticipant?: string
  minDuration?: number
}

export interface SelectedCell {
  column: TimeColumn
  row: TimeRow
}

export interface CellDetails {
  dayLabel: string
  startTime: string
  endTime: string
  availableNames: string[]
  count: number
}

export interface HeatmapPageProps {
  event: EventDetail
  isAdmin?: boolean
  onFinalize?: (slot: FinalSchedule) => Promise<FinalizeResult>
  onUpdateEvent?: (payload: EditableEvent) => Promise<void>
  onOpenMySchedule?: () => void
}

export interface HeatmapProps {
  event: EventDetail
  suggestions: SuggestedSlot[]
  selected: FinalSchedule | null
  selecting: boolean
  onInspect: (details: CellDetails) => void
  onInspectEnd: () => void
  onStart: (point: SelectedCell) => void
  onExtend: (point: SelectedCell) => void
  onKeyboardSelect: (point: SelectedCell, extendRange?: boolean) => void
}

export interface AvailabilityDetailsProps {
  details: CellDetails | null
  participants: Participant[]
  keyParticipant: string | null
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export interface KeyParticipantSelectorProps {
  participants: Participant[]
  selected: string | null
  disabled: boolean
  onChange: (name: string | null) => void
}

export interface ScheduleControlsProps {
  selected: FinalSchedule | null
  selecting: boolean
  disabled: boolean
  onBegin: () => void
  onCancel: () => void
  onConfirm: () => void
}

export interface FinalizeDialogProps {
  open: boolean
  selected: FinalSchedule | null
  timezone: string
  pending: boolean
  onClose: () => void
  onConfirm: () => void
}

export interface EditEventDialogProps {
  event: EditableEvent
  disabled?: boolean
  onSave: (payload: EditableEvent) => Promise<void>
}

export interface EventHeaderProps {
  event: EventDetail
  canEdit: boolean
  duration: number | undefined
  disabled: boolean
  canUpdate: boolean
  onOpenMySchedule?: () => void
  onDurationChange: (duration: number | undefined) => void
  onUpdateEvent: (payload: EditableEvent) => Promise<void>
}

export interface AdminSuggestionControlsProps {
  participants: Participant[]
  keyParticipant: string | null
  disabled: boolean
  hasFilters: boolean
  suggestionCount: number
  onKeyParticipantChange: (name: string | null) => void
}

export interface HeatmapWorkspaceProps {
  event: EventDetail
  canEdit: boolean
  suggestions: SuggestedSlot[]
  keyParticipant: string | null
  pending: HeatmapPendingAction | null
  onFinalize?: (slot: FinalSchedule) => Promise<FinalizeResult>
  onPendingChange: (action: HeatmapPendingAction | null) => void
}
