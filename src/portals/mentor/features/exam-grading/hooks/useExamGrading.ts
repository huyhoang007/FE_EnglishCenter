/**
 * Hooks chấm bài thi tự luận (Dev 3)
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import {
  getAttemptForGradingApi,
  getExamInfoApi,
  getPendingAttemptsApi,
  gradeAnswerApi,
  type GradeAnswerPayload,
} from '../services/examGradingService';

export function usePendingAttempts(page: number, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.gradingQueue(page),
    queryFn: async () => unwrapOrThrow(await getPendingAttemptsApi(page)),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAttemptForGrading(attemptId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.gradingAttempt(attemptId ?? ''),
    queryFn: async () => unwrapOrThrow(await getAttemptForGradingApi(attemptId ?? '')),
    enabled: Boolean(attemptId),
  });
}

/** Thông tin đề của bài đang chấm (để biết chứng chỉ → thang chấm). */
export function useGradingExamInfo(examId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.detail(examId ?? ''),
    queryFn: async () => unwrapOrThrow(await getExamInfoApi(examId ?? '')),
    enabled: Boolean(examId),
    staleTime: 5 * 60 * 1000,
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
