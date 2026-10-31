/**
 * Hooks TanStack Query — danh sách đề, chi tiết đề, bắt đầu lượt thi, lịch sử, kết quả (Dev 3)
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import type { ExamScope } from '@/shared/types';
import {
  aiGradeAttemptApi,
  getAttemptResultApi,
  getExamDetailApi,
  getExamsApi,
  getMyAttemptsApi,
  getMyProficiencyApi,
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

export function useMyAttempts(page: number, examScope?: ExamScope, size = 10, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.myAttempts(page, examScope),
    queryFn: async () => unwrapExam(await getMyAttemptsApi(page, size, examScope)),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Đề luyện tập: nhờ AI chấm Writing / Speaking rồi cập nhật kết quả, lịch sử, hồ sơ trình độ, chuông thông báo. */
export function useAiGradeAttempt(attemptId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => unwrapExam(await aiGradeAttemptApi(attemptId)),
    onSuccess: (result) => {
      queryClient.setQueryData(QUERY_KEYS.exam.result(attemptId), result);
      queryClient.invalidateQueries({ queryKey: ['exam', 'my-attempts'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.account.profile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all });
    },
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

/** Năng lực hiện tại theo chứng chỉ (từ bài kiểm tra năng lực gần nhất). */
export function useMyProficiency(enabled: boolean) {
  return useQuery({
    queryKey: ['exam', 'proficiency'],
    queryFn: async () => unwrapExam(await getMyProficiencyApi()),
    enabled,
  });
}
