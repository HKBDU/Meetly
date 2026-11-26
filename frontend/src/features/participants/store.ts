import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { ParticipantAuthInfo, PaintMode } from '@/features/participants/types'

/**
 * Phiên của participant trên một event. Dữ liệu event (cấu hình lưới, trạng thái chốt)
 * KHÔNG nằm ở đây mà lấy từ `useEventQuery`; màn đang xem lấy từ route.
 */
interface ParticipantState {
  auth: ParticipantAuthInfo | null
  /**
   * Các ô đang tô trên lưới cá nhân. Là "rảnh" khi `paintMode = FREE`, "bận" khi `BUSY`
   * (đảo lại trước khi gửi API). Không persist: luôn tải lại từ `GET /participants/me`.
   */
  selectedSlotIds: Set<string>
  /** shortCode mà `selectedSlotIds` đã được nạp từ server, tránh nạp lại đè lên thao tác đang làm */
  loadedSlotsFor: string | null
  paintMode: PaintMode
  /**
   * Bản nháp khi nhập giờ bận từ Google Calendar: tập ô RẢNH đề xuất, chưa gửi BE.
   * Khác `null` thì lưới hiện và sửa bản nháp, autosave tạm dừng tới khi áp dụng hoặc huỷ.
   */
  draftFreeSlotIds: Set<string> | null
  hasSavedOnce: boolean
  isEmailDialogOpen: boolean
  hasEmailSubscribed: boolean

  login: (auth: ParticipantAuthInfo) => void
  loadSlots: (shortCode: string, freeSlotIds: string[]) => void
  setPaintMode: (mode: PaintMode, allSlotIds: string[]) => void
  setSlotPainted: (slotId: string, isPainted: boolean) => void
  setSlotsPainted: (slotIds: string[], isPainted: boolean) => void
  clearAllPainted: () => void
  /** Mở bản nháp; lịch đang tô chuyển sang chế độ FREE (giữ nguyên nội dung) để bản nháp và lịch cùng nghĩa */
  startDraft: (freeSlotIds: readonly string[], allSlotIds: readonly string[]) => void
  /** Bản nháp thành lịch rảnh thật; bên gọi tự trigger autosave */
  applyDraft: () => void
  discardDraft: () => void
  markSavedOnce: () => void
  openEmailDialog: () => void
  closeEmailDialog: () => void
  markEmailSubscribed: () => void
  /** Rời event hiện tại và quay về màn định danh */
  resetSession: () => void
}

const initialSession = {
  auth: null,
  selectedSlotIds: new Set<string>(),
  loadedSlotsFor: null,
  paintMode: 'FREE' as PaintMode,
  draftFreeSlotIds: null,
  hasSavedOnce: false,
  isEmailDialogOpen: false,
  hasEmailSubscribed: false,
}

type PaintedState = Pick<ParticipantState, 'draftFreeSlotIds' | 'selectedSlotIds'>

/** Tập ô đang hiện là "được tô" trên lưới: bản nháp nếu đang mở, không thì lịch đang tô */
export const selectPaintedSlotIds = (state: PaintedState): Set<string> =>
  state.draftFreeSlotIds ?? state.selectedSlotIds

/** Ghi tập ô đã sửa vào đúng chỗ: bản nháp nếu đang mở, không thì lịch đang tô */
const paintedPatch = (state: PaintedState, next: Set<string>): Partial<PaintedState> =>
  state.draftFreeSlotIds ? { draftFreeSlotIds: next } : { selectedSlotIds: next }

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set) => ({
      ...initialSession,

      login: (auth) => set({ ...initialSession, selectedSlotIds: new Set(), auth }),

      loadSlots: (shortCode, freeSlotIds) =>
        set({
          selectedSlotIds: new Set(freeSlotIds),
          paintMode: 'FREE',
          loadedSlotsFor: shortCode,
          draftFreeSlotIds: null,
        }),

      // Đổi chế độ giữ nguyên lịch: tập ô tô mới là phần bù của tập cũ trên toàn lưới
      setPaintMode: (mode, allSlotIds) =>
        set((state) => {
          if (state.paintMode === mode) return state
          return {
            paintMode: mode,
            selectedSlotIds: new Set(allSlotIds.filter((id) => !state.selectedSlotIds.has(id))),
          }
        }),

      setSlotPainted: (slotId, isPainted) =>
        set((state) => {
          const painted = selectPaintedSlotIds(state)
          if (painted.has(slotId) === isPainted) return state
          const next = new Set(painted)
          if (isPainted) next.add(slotId)
          else next.delete(slotId)
          return paintedPatch(state, next)
        }),

      setSlotsPainted: (slotIds, isPainted) =>
        set((state) => {
          const next = new Set(selectPaintedSlotIds(state))
          for (const id of slotIds) {
            if (isPainted) next.add(id)
            else next.delete(id)
          }
          return paintedPatch(state, next)
        }),

      clearAllPainted: () => set((state) => paintedPatch(state, new Set<string>())),

      startDraft: (freeSlotIds, allSlotIds) =>
        set((state) => ({
          draftFreeSlotIds: new Set(freeSlotIds),
          paintMode: 'FREE',
          selectedSlotIds:
            state.paintMode === 'FREE'
              ? state.selectedSlotIds
              : new Set(allSlotIds.filter((id) => !state.selectedSlotIds.has(id))),
        })),

      applyDraft: () =>
        set((state) =>
          state.draftFreeSlotIds ? { selectedSlotIds: state.draftFreeSlotIds, draftFreeSlotIds: null } : state,
        ),

      discardDraft: () => set({ draftFreeSlotIds: null }),
      markSavedOnce: () => set({ hasSavedOnce: true }),
      openEmailDialog: () => set({ isEmailDialogOpen: true }),
      closeEmailDialog: () => set({ isEmailDialogOpen: false }),
      markEmailSubscribed: () => set({ hasEmailSubscribed: true, isEmailDialogOpen: false }),
      resetSession: () => set({ ...initialSession, selectedSlotIds: new Set() }),
    }),
    {
      name: 'meetly-participant-session',
      // Tăng version khi đổi shape của phần persist để bỏ bản lưu cũ không khớp
      version: 5,
      storage: createJSONStorage(() => localStorage),
      migrate: () => ({}) as ParticipantState,
      partialize: (state) => ({
        auth: state.auth,
        hasSavedOnce: state.hasSavedOnce,
        hasEmailSubscribed: state.hasEmailSubscribed,
      }),
    },
  ),
)
