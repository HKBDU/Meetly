import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { accessParticipant, fetchEventScheduleConfig } from '@/features/participants/services';
import { useParticipantStore } from '@/features/participants/store';
import type { ParticipantRequest, ScheduleDateMode } from '@/features/participants/types';

interface AccessParticipantInput {
  credentials: ParticipantRequest;
  /** CHỈ phục vụ demo chọn kiểu lịch ở ParticipantAuthForm - xem `ScheduleDateMode` */
  dateMode: ScheduleDateMode;
}

/**
 * Xử lý đăng nhập định danh (Màn hình 1).
 * Sau khi định danh thành công, tải luôn cấu hình lưới của sự kiện rồi
 * lưu tất cả vào store và điều hướng sang Overview.
 */
export function useAuthParticipant() {
  const login = useParticipantStore((s) => s.login);
  const setScheduleConfig = useParticipantStore((s) => s.setScheduleConfig);

  const mutation = useMutation({
    mutationFn: async ({ credentials, dateMode }: AccessParticipantInput) => {
      const [authResult, scheduleConfig] = await Promise.all([
        accessParticipant(credentials),
        fetchEventScheduleConfig(dateMode),
      ]);
      return { authResult, scheduleConfig };
    },
    onSuccess: ({ authResult, scheduleConfig }) => {
      login(
        {
          participantId: authResult.participantId,
          username: authResult.username,
          token: authResult.token,
        },
        authResult.freeSlotIds,
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
