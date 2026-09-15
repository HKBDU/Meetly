import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  EventScheduleConfig,
  ParticipantAuthInfo,
  ParticipantView,
  PaintMode,
  ScheduleDateMode,
} from '@/features/participants/types';

interface ParticipantState {
  // auth
  auth: ParticipantAuthInfo | null;

  // điều hướng
  currentView: ParticipantView;

  /*
   * Cấu hình lưới thời gian của sự kiện đang xem - dữ liệu "của server"
   * (event admin cấu hình), KHÔNG lưu vào localStorage (xem phần persist bên
   * dưới) - luôn tải lại mới mỗi khi vào lại app để không bị dùng bản cache
   * cũ nếu cấu hình event đã đổi.
   */
  scheduleConfig: EventScheduleConfig | null;

  /**
   * dateMode CỦA LẦN TẢI GẦN NHẤT - CÓ lưu localStorage (nhẹ, khác với
   * scheduleConfig đầy đủ) để khi reload biết cần tải lại đúng biến thể nào.
   * Hiện chỉ dùng cho mock/demo (xem ParticipantAuthForm) - khi có BE thật,
   * dateMode sẽ luôn đến từ chính `scheduleConfig` mới tải, field này chỉ
   * còn ý nghĩa "tải lại được" chứ participant không tự chọn.
   */
  dateMode: ScheduleDateMode | null;

  /*
   * Tập slotId đang được TÔ (highlight xanh) trên lưới - KHÔNG đồng nghĩa
   * với "rảnh". Ý nghĩa thật của tập này phụ thuộc vào `paintMode` tại
   * thời điểm lưu:
   *   - paintMode = "FREE" -> đây chính là danh sách slot RẢNH, gửi thẳng lên API.
   *   - paintMode = "BUSY" -> đây là danh sách slot BẬN, FE phải đảo ngược
   *     (lấy phần bù trên toàn bộ slot của lưới) để ra danh sách RẢNH trước
   *     khi gửi API. Xem `useAutoSaveSchedule`.
   * Vì 2 mode mang ý nghĩa khác nhau nên khi đổi mode, tập này bị xoá về
   * rỗng (xem action `setPaintMode`) để tránh lẫn lộn dữ liệu giữa 2 nghĩa.
   */
  selectedSlotIds: Set<string>;

  /* Chế độ tô hiện tại trên lưới cá nhân ------------------------------ */
  paintMode: PaintMode;

  /* Đã auto-save lần đầu tiên chưa - quyết định có bật popup email không */
  hasSavedOnce: boolean;

  /* Dialog xin email --------------------------------------------------- */
  isEmailDialogOpen: boolean;
  hasEmailSubscribed: boolean;

  /* Lịch đã được chốt (EventFinalized) --------------------------------- */
  isFinalized: boolean;
  finalizedMessage: string | null;

  /* Actions -------------------------------------------------------------- */
  login: (auth: ParticipantAuthInfo, initialFreeSlotIds: string[]) => void;
  setView: (view: ParticipantView) => void;
  setScheduleConfig: (config: EventScheduleConfig) => void;
  setPaintMode: (mode: PaintMode) => void;
  setSlotPainted: (slotId: string, isPainted: boolean) => void;
  /** Tô hàng loạt (VD: từ "Chọn thủ công" - nhập khoảng giờ rồi tô 1 lần thay vì gọi setSlotPainted lặp) */
  addPaintedSlots: (slotIds: string[]) => void;
  /** "Reset dates" - xoá trắng toàn bộ ô đang tô, không đổi paintMode */
  clearAllPainted: () => void;
  markSavedOnce: () => void;
  openEmailDialog: () => void;
  closeEmailDialog: () => void;
  markEmailSubscribed: () => void;
  finalizeEvent: (message: string) => void;
  /**
   * Rời sự kiện hiện tại (KHÔNG phải "đăng xuất" - app này không có tài
   * khoản/mật khẩu thật để đăng xuất khỏi). Xoá sạch phiên hiện tại và quay
   * về màn định danh, để participant có thể tham gia 1 sự kiện KHÁC (nhập
   * lại username/mã sự kiện khác) mà không cần đợi phiên tự hết hạn - phiên
   * hiện tại vốn không tự hết hạn vì đây là localStorage, không phải session
   * có thời hạn thật.
   */
  resetSession: () => void;
}

/**
 * Lưu lại phiên làm việc vào `localStorage` để RELOAD TRANG (F5) KHÔNG BỊ
 * VĂNG VỀ MÀN ĐĂNG NHẬP - participant chỉ cần định danh (username) 1 lần,
 * không phải mật khẩu thật/session bảo mật, nên lưu cục bộ trên trình duyệt
 * là đủ.
 *
 * LƯU Ý: dùng `localStorage` (không phải `sessionStorage`) nên phiên này
 * SỐNG SÓT CẢ KHI ĐÓNG TAB/ĐÓNG TRÌNH DUYỆT rồi mở lại - không chỉ mỗi F5.
 * Chỉ mất khi: xoá localStorage thủ công (DevTools/cài đặt trình duyệt),
 * dùng chế độ ẩn danh rồi đóng cửa sổ ẩn danh, hoặc gọi `.clear()` từ code.
 * Nếu muốn phiên tự mất khi đóng tab (VD: máy dùng chung, không muốn người
 * sau thấy lịch của người trước), đổi `localStorage` bên dưới thành
 * `sessionStorage`.
 *
 * `selectedSlotIds` là kiểu `Set`, mà `JSON.stringify` mặc định biến Set
 * thành "{}" (rỗng) và không tự khôi phục lại được - nên phải tự viết
 * replacer/reviver để đổi Set <-> mảng khi lưu/đọc localStorage.
 */
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
      dateMode: null,
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
          // paintMode mặc định là "FREE" nên danh sách rảnh đã lưu trước đó
          // chính là tập được tô sẵn ban đầu.
          selectedSlotIds: new Set(initialFreeSlotIds),
          currentView: 'OVERVIEW',
        }),

      setView: (view) => set({ currentView: view }),

      setScheduleConfig: (config) => set({ scheduleConfig: config, dateMode: config.dateMode }),

      // Đổi mode = đổi Ý NGHĨA của việc tô -> xoá trắng lịch, bắt đầu tô lại
      // từ đầu để không lẫn lộn giữa "đã tô là rảnh" và "đã tô là bận".
      setPaintMode: (mode) => set({ paintMode: mode, selectedSlotIds: new Set<string>() }),

      setSlotPainted: (slotId: string, isPainted: boolean) =>
        set((state) => {
          const alreadyPainted = state.selectedSlotIds.has(slotId);
          if (alreadyPainted === isPainted) return state; // không đổi -> bỏ qua, tránh render thừa

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
          dateMode: null,
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
      // Bản localStorage cũ (trước khi bỏ `scheduleConfig` khỏi partialize
      // bên dưới) vẫn còn field này trong JSON đã lưu - nếu không bump
      // version, zustand sẽ MERGE đè giá trị CŨ đó lên state mới lúc
      // rehydrate (dù code không còn ghi field này nữa), khiến bug "vẫn thấy
      // cấu hình cũ sau khi code đã sửa" tiếp diễn. Tăng version khiến
      // zustand tự bỏ qua toàn bộ bản lưu cũ không khớp version, coi như
      // phiên mới - chỉ cần làm 1 lần cho mỗi lần đổi SHAPE của phần persist.
      version: 1,
      storage: createJSONStorage(() => localStorage, {
        replacer: persistReplacer,
        reviver: persistReviver,
      }),
      // CHỈ lưu những gì cần để khôi phục đúng phiên làm việc của participant.
      // KHÔNG lưu isFinalized/finalizedMessage/heatmap/isEmailDialogOpen vì đó
      // là state "sống" nên đồng bộ lại từ SignalR mỗi lần vào lại, lưu cứng
      // vào localStorage dễ gây kẹt UI (VD: lỡ bấm demo "chốt lịch" 1 lần thì
      // mọi lần reload sau bị khoá lịch mãi mãi dù lịch thật chưa hề chốt).
      //
      // KHÔNG lưu `scheduleConfig` (dù nó là nguyên nhân participant vào lại
      // vẫn thấy đúng lưới) - đây là dữ liệu THUỘC VỀ EVENT (admin cấu hình),
      // không phải dữ liệu của riêng participant này. Nếu cache cứng vào
      // localStorage, mỗi khi cấu hình event đổi (admin sửa ngày/giờ, hoặc ở
      // bản mock là mỗi khi code demo đổi), participant cũ sẽ vẫn thấy bản
      // CŨ mãi mãi vì không bao giờ tải lại - chỉ lưu `dateMode` (rất nhẹ) để
      // biết cần tải lại đúng biến thể nào, còn `scheduleConfig` LUÔN được
      // tải mới lại mỗi lần app khởi động (xem ParticipantPage).
      partialize: (state) => ({
        auth: state.auth,
        currentView: state.currentView,
        dateMode: state.dateMode,
        selectedSlotIds: state.selectedSlotIds,
        paintMode: state.paintMode,
        hasSavedOnce: state.hasSavedOnce,
        hasEmailSubscribed: state.hasEmailSubscribed,
      }),
    },
  ),
);
