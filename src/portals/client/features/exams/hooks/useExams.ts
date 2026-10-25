/**
 * Hooks TanStack Query — danh sách đề, chi tiết đề, bắt đầu lượt thi, lịch sử, kết quả (Dev 3)
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import {
  getAttemptResultApi,
  getExamDetailApi,
  getExamsApi,
  getMyAttemptsApi,
  startAttemptApi,
  unwrapExam,
  type ExamListFilter,
} from '../services/examService';

export function useExamList(filter: ExamListFilter) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.list(filter),
    queryFn: async () => unwrapExam(await getExamsApi(filter)),
    placeholderData: keepPreviousData,
  });
}

export function useExamDetail(examId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.detail(examId),
    queryFn: async () => unwrapExam(await getExamDetailApi(examId)),
    enabled: Boolean(examId),
    retry: false,
  });
}

/** Bắt đầu (hoặc tiếp tục) lượt thi rồi chuyển vào phòng thi. */
export function useStartAttempt() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (examId: string) => unwrapExam(await startAttemptApi(examId)),
    onSuccess: (attempt) => {
      queryClient.setQueryData(QUERY_KEYS.exam.attempt(attempt.attemptId), attempt);
      queryClient.invalidateQueries({ queryKey: ['exam', 'my-attempts'] });
      navigate(CLIENT_ROUTES.examAttempt(attempt.attemptId));
    },
  });
}

export function useMyAttempts(page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.myAttempts(page),
    queryFn: async () => unwrapExam(await getMyAttemptsApi(page)),
    placeholderData: keepPreviousData,
  });
}

export function useAttemptResult(attemptId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.result(attemptId),
    queryFn: async () => unwrapExam(await getAttemptResultApi(attemptId)),
    enabled: Boolean(attemptId),
    retry: false,
  });
}
