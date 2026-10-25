/**
 * Hooks chấm bài thi tự luận (Dev 3)
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import {
  getAttemptForGradingApi,
  getPendingAttemptsApi,
  gradeAnswerApi,
  type GradeAnswerPayload,
} from '../services/examGradingService';

export function usePendingAttempts(page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.gradingQueue(page),
    queryFn: async () => unwrapOrThrow(await getPendingAttemptsApi(page)),
    placeholderData: keepPreviousData,
  });
}

export function useAttemptForGrading(attemptId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.gradingAttempt(attemptId ?? ''),
    queryFn: async () => unwrapOrThrow(await getAttemptForGradingApi(attemptId ?? '')),
    enabled: Boolean(attemptId),
  });
}

/** Chấm một câu essay; cập nhật bài đang mở và làm mới hàng đợi. */
export function useGradeAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: GradeAnswerPayload) => unwrapOrThrow(await gradeAnswerApi(payload)),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(QUERY_KEYS.exam.gradingAttempt(variables.attemptId), result);
      queryClient.invalidateQueries({ queryKey: ['exam', 'grading-queue'] });
    },
  });
}
