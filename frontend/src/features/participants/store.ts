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
  hasSavedOnce: boolean
  isEmailDialogOpen: boolean
  hasEmailSubscribed: boolean

  login: (auth: ParticipantAuthInfo) => void
  loadSlots: (shortCode: string, freeSlotIds: string[]) => void
  setPaintMode: (mode: PaintMode, allSlotIds: string[]) => void
  setSlotPainted: (slotId: string, isPainted: boolean) => void
  setSlotsPainted: (slotIds: string[], isPainted: boolean) => void
  clearAllPainted: () => void
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
  hasSavedOnce: false,
  isEmailDialogOpen: false,
  hasEmailSubscribed: false,
}

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set) => ({
      ...initialSession,

      login: (auth) => set({ ...initialSession, selectedSlotIds: new Set(), auth }),

      loadSlots: (shortCode, freeSlotIds) =>
        set({ selectedSlotIds: new Set(freeSlotIds), paintMode: 'FREE', loadedSlotsFor: shortCode }),

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
          if (state.selectedSlotIds.has(slotId) === isPainted) return state
          const next = new Set(state.selectedSlotIds)
          if (isPainted) next.add(slotId)
          else next.delete(slotId)
          return { selectedSlotIds: next }
        }),

      setSlotsPainted: (slotIds, isPainted) =>
        set((state) => {
          const next = new Set(state.selectedSlotIds)
          for (const id of slotIds) {
            if (isPainted) next.add(id)
            else next.delete(id)
          }
          return { selectedSlotIds: next }
        }),

      clearAllPainted: () => set({ selectedSlotIds: new Set<string>() }),
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
