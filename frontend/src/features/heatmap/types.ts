import type { FinalizeResult } from '@/shared/api/events'
import type { RankedTime } from './suggestions'
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
  /** Mở màn mời (link, tin nhắn mời) */
  onInvite?: () => void
  /** Tên người đang xem, để nhắc điền lịch khi họ chưa có ô rảnh nào */
  currentUsername?: string
}

export interface AvailabilityDetailsProps {
  details: CellDetails | null
  participants: Participant[]
  /** Người được đánh dấu sao (đang trong "Must include") */
  highlighted: string[]
  onMouseEnter?: () => void
  onMouseLeave?: () => void
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
  onConfirm: (withGoogleMeet: boolean) => void
}

export interface EditEventDialogProps {
  event: EditableEvent
  disabled?: boolean
  onSave: (payload: EditableEvent) => Promise<void>
}

export interface EventHeaderProps {
  event: EventDetail
  canEdit: boolean
  disabled: boolean
  canUpdate: boolean
  onOpenMySchedule?: () => void
  onInvite?: () => void
  onUpdateEvent: (payload: EditableEvent) => Promise<void>
  /** Để không báo "vừa cập nhật" cho chính mình */
  currentUsername?: string
}

export interface HeatmapWorkspaceProps {
  event: EventDetail
  canEdit: boolean
  bestTimes: RankedTime[]
  duration: number
  mustInclude: string[]
  onDurationChange: (minutes: number) => void
  onMustIncludeChange: (names: string[]) => void
  pending: HeatmapPendingAction | null
  onFinalize?: (slot: FinalSchedule) => Promise<FinalizeResult>
  onPendingChange: (action: HeatmapPendingAction | null) => void
}
