import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  EventScheduleConfig,
  ParticipantAuthInfo,
  ParticipantView,
  PaintMode,
} from '@/features/participants/types';

/** `Events.EventStatus.Open` bên BE */
const EVENT_STATUS_OPEN = 1;

interface ParticipantState {
  auth: ParticipantAuthInfo | null;
  currentView: ParticipantView;
  /** Cấu hình lưới của event - không persist, luôn tải mới khi vào lại app */
  scheduleConfig: EventScheduleConfig | null;
  /**
   * Các slot đang được tô. Nghĩa là "rảnh" khi `paintMode = FREE`, "bận" khi
   * `BUSY` (FE đảo ngược trước khi gửi API) - nên đổi mode sẽ xoá về rỗng.
   */
  selectedSlotIds: Set<string>;
  paintMode: PaintMode;
  hasSavedOnce: boolean;
  isEmailDialogOpen: boolean;
  hasEmailSubscribed: boolean;
  isFinalized: boolean;
  finalizedMessage: string | null;

  login: (auth: ParticipantAuthInfo, initialFreeSlotIds: string[]) => void;
  setView: (view: ParticipantView) => void;
  setScheduleConfig: (config: EventScheduleConfig) => void;
  setPaintMode: (mode: PaintMode) => void;
  setSlotPainted: (slotId: string, isPainted: boolean) => void;
  addPaintedSlots: (slotIds: string[]) => void;
  clearAllPainted: () => void;
  markSavedOnce: () => void;
  openEmailDialog: () => void;
  closeEmailDialog: () => void;
  markEmailSubscribed: () => void;
  finalizeEvent: (message: string) => void;
  /** Rời event hiện tại và quay về màn định danh */
  resetSession: () => void;
}

/** `JSON.stringify` biến `Set` thành `{}`, nên tự đổi Set <-> mảng khi lưu/đọc localStorage */
const SET_MARKER = '__set__';

interface SerializedSet {
  [SET_MARKER]: true;
  values: string[];
}

function isSerializedSet(value: unknown): value is SerializedSet {
  return typeof value === 'object' && value !== null && SET_MARKER in value;
}

function persistReplacer(_key: string, value: unknown): unknown {
  return value instanceof Set
    ? ({ [SET_MARKER]: true, values: Array.from(value) } satisfies SerializedSet)
    : value;
}

function persistReviver(_key: string, value: unknown): unknown {
  return isSerializedSet(value) ? new Set(value.values) : value;
}

export const useParticipantStore = create<ParticipantState>()(
  persist(
    (set) => ({
      auth: null,
      currentView: 'AUTH',
      scheduleConfig: null,
      selectedSlotIds: new Set<string>(),
      paintMode: 'FREE',
      hasSavedOnce: false,
      isEmailDialogOpen: false,
      hasEmailSubscribed: false,
      isFinalized: false,
      finalizedMessage: null,

      login: (auth, initialFreeSlotIds) =>
        set({
          auth,
          selectedSlotIds: new Set(initialFreeSlotIds),
          currentView: 'OVERVIEW',
        }),

      setView: (view) => set({ currentView: view }),

      // Event đã chốt trước khi vào thì SignalR sẽ không bắn lại, nên lấy từ `status`
      setScheduleConfig: (config) =>
        set({ scheduleConfig: config, isFinalized: config.status !== EVENT_STATUS_OPEN }),

      setPaintMode: (mode) => set({ paintMode: mode, selectedSlotIds: new Set<string>() }),

      setSlotPainted: (slotId: string, isPainted: boolean) =>
        set((state) => {
          if (state.selectedSlotIds.has(slotId) === isPainted) return state;

          const next = new Set(state.selectedSlotIds);
          if (isPainted) {
            next.add(slotId);
          } else {
            next.delete(slotId);
          }
          return { selectedSlotIds: next };
        }),

      addPaintedSlots: (slotIds) =>
        set((state) => {
          const next = new Set(state.selectedSlotIds);
          slotIds.forEach((id) => next.add(id));
          return { selectedSlotIds: next };
        }),

      clearAllPainted: () => set({ selectedSlotIds: new Set<string>() }),

      markSavedOnce: () => set({ hasSavedOnce: true }),

      openEmailDialog: () => set({ isEmailDialogOpen: true }),
      closeEmailDialog: () => set({ isEmailDialogOpen: false }),
      markEmailSubscribed: () => set({ hasEmailSubscribed: true, isEmailDialogOpen: false }),

      finalizeEvent: (message) => set({ isFinalized: true, finalizedMessage: message }),

      resetSession: () =>
        set({
          auth: null,
          currentView: 'AUTH',
          scheduleConfig: null,
          selectedSlotIds: new Set<string>(),
          paintMode: 'FREE',
          hasSavedOnce: false,
          isEmailDialogOpen: false,
          hasEmailSubscribed: false,
          isFinalized: false,
          finalizedMessage: null,
        }),
    }),
    {
      name: 'meetly-participant-session',
      // Tăng version khi đổi shape của phần persist để bỏ bản lưu cũ không khớp
      version: 2,
      storage: createJSONStorage(() => localStorage, {
        replacer: persistReplacer,
        reviver: persistReviver,
      }),
      // Chỉ lưu phiên của participant; trạng thái chốt lịch và `scheduleConfig`
      // luôn lấy mới từ server/SignalR để không bị kẹt bản cũ.
      partialize: (state) => ({
        auth: state.auth,
        currentView: state.currentView,
        selectedSlotIds: state.selectedSlotIds,
        paintMode: state.paintMode,
        hasSavedOnce: state.hasSavedOnce,
        hasEmailSubscribed: state.hasEmailSubscribed,
      }),
    },
  ),
);
