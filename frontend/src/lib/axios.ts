import axios from 'axios';

import { env } from '@/lib/env';
import { useParticipantStore } from '@/features/participants/store';

/** Axios instance dùng chung cho toàn app. Các feature service sẽ import và gọi trực tiếp. */
export const api = axios.create({
  baseURL: `${env.apiBaseUrl}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Gắn Bearer token của participant hiện tại (nếu có) vào MỌI request - BE xác
 * định participant/admin hoàn toàn qua claim trong JWT này (participantId,
 * eventId, isAdmin - xem `EventService.IssueToken` bên BE), không có
 * cookie/session nào khác.
 */
api.interceptors.request.use((config) => {
  const accessToken = useParticipantStore.getState().auth?.accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/**
 * Mọi response thành công đều được BE bọc trong `ApiResponse<T>` (xem
 * `Meetly.Contract.DTOs.Common.ApiResponse`) - bóc sẵn `value` ra thành
 * `response.data` ở đây, để nơi gọi (`services.ts`) chỉ cần
 * `const { data } = await api.get<T>(...)` là `data` đã đúng kiểu `T`,
 * không phải tự bóc `.value` lặp lại ở từng hàm.
 *
 * KHÔNG tự động `toast.error` lỗi ở đây - mỗi mutation trong feature đã tự
 * xử lý `onError` với thông báo phù hợp riêng (xem `useAuthParticipant`,
 * `useAutoSaveSchedule`, `EmailPromptDialog`), thêm toast chung ở đây sẽ
 * khiến 1 lỗi hiện ra 2 lần.
 */
api.interceptors.response.use(
  (response) => {
    response.data = response.data?.value ?? response.data;
    return response;
  },
  (error) => {
    // 401 nghĩa là access token không còn hợp lệ (hết hạn/sai) - BE KHÔNG có
    // endpoint refresh token, nên không thể âm thầm lấy token mới: chỉ có
    // thể đưa participant về lại màn định danh để họ join lại.
    if (error.response?.status === 401) {
      useParticipantStore.getState().resetSession();
    }
    return Promise.reject(error);
  },
);
