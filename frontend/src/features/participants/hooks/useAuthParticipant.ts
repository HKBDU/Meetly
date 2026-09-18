import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getApiErrorMessage } from '@/lib/axios';

import { expandTimeSlotRangesToIds } from '@/features/participants/gridUtils';
import { accessParticipant, fetchEventScheduleConfig } from '@/features/participants/services';
import { useParticipantStore } from '@/features/participants/store';
import type { ParticipantRequest } from '@/features/participants/types';

/** Định danh participant, tải cấu hình lưới rồi chuyển sang màn Overview */
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
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Could not join, please try again'));
    },
  });

  return {
    access: mutation.mutate,
    isPending: mutation.isPending,
  };
}
