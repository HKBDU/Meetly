import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { expandTimeSlotRangesToIds } from '@/features/participants/gridUtils';
import { accessParticipant, fetchEventScheduleConfig } from '@/features/participants/services';
import { useParticipantStore } from '@/features/participants/store';
import type { ParticipantRequest } from '@/features/participants/types';

/**
 * Xử lý đăng nhập định danh (Màn hình 1).
 * Sau khi định danh thành công, tải luôn cấu hình lưới của sự kiện rồi
 * lưu tất cả vào store và điều hướng sang Overview.
 */
export function useAuthParticipant(shortCode: string) {
  const login = useParticipantStore((s) => s.login);
  const setScheduleConfig = useParticipantStore((s) => s.setScheduleConfig);

  const mutation = useMutation({
    mutationFn: async (credentials: ParticipantRequest) => {
      const [authResult, scheduleConfig] = await Promise.all([
        accessParticipant(shortCode, credentials),
        fetchEventScheduleConfig(shortCode),
      ]);
      return { authResult, scheduleConfig };
    },
    onSuccess: ({ authResult, scheduleConfig }) => {
      // `timeSlots` BE trả về là các KHOẢNG start-end đã lưu từ trước - bung
      // ngược thành tập slotId rời rạc mà lưới hiểu, dựa vào `scheduleConfig`
      // vừa tải cùng lúc (xem `expandTimeSlotRangesToIds`).
      const freeSlotIds = expandTimeSlotRangesToIds(authResult.timeSlots, scheduleConfig);
      login(
        {
          participantId: authResult.participantId,
          username: authResult.username,
          accessToken: authResult.accessToken,
        },
        freeSlotIds,
      );
      setScheduleConfig(scheduleConfig);
      toast.success(`Welcome, ${authResult.username}!`);
    },
    onError: () => {
      toast.error('Could not join, please try again');
    },
  });

  return {
    access: mutation.mutate,
    isPending: mutation.isPending,
  };
}
