/**
 * usePractice — hooks TanStack Query cho phòng luyện đề AI (Dev 5)
 * -----------------------------------------------------------
 * View chỉ gọi các hook này, không gọi service trực tiếp.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import type { PracticeExamType } from '@/shared/types';
import {
  evaluatePracticeAnswerApi,
  getMyPracticeAnswersApi,
  getPracticeEvaluationApi,
  getPracticeExamsApi,
  getRecommendationsApi,
  submitPracticeAnswerApi,
} from '../services/practiceService';

/** Kho đề (lọc theo loại + từ khóa + chứng chỉ) */
export function usePracticeExams(type?: PracticeExamType, keyword?: string, certificateId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.practice.list(type, keyword, certificateId),
    queryFn: async () => unwrapOrThrow(await getPracticeExamsApi(type, keyword, 0, 50, certificateId)).data,
  });
}

/** Lịch sử làm bài của học viên */
export function useMyPracticeAnswers(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.practice.myAnswers,
    queryFn: async () => unwrapOrThrow(await getMyPracticeAnswersApi()),
    enabled,
  });
}

/** Xem lại 1 kết quả chấm (null = không tải) */
export function usePracticeEvaluation(evaluationId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.practice.evaluation(evaluationId ?? ''),
    queryFn: async () => unwrapOrThrow(await getPracticeEvaluationApi(evaluationId as string)),
    enabled: !!evaluationId,
  });
}

/** Nộp bài */
export function useSubmitPracticeAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { examId: string; content: string }) =>
      unwrapOrThrow(await submitPracticeAnswerApi(input.examId, input.content)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.practice.myAnswers }),
  });
}

/** Gọi AI chấm. Xong thì làm mới lịch sử, tiến độ lộ trình và chuông thông báo */
export function useEvaluatePracticeAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (answerId: string) => unwrapOrThrow(await evaluatePracticeAnswerApi(answerId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.practice.myAnswers });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learningPath.myProgress });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notification.all });
    },
  });
}

/** Gợi ý khóa học và lộ trình phù hợp (TASK-DEV1 T8) */
export function useRecommendations(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.practice.recommendations,
    queryFn: async () => unwrapOrThrow(await getRecommendationsApi()),
    enabled,
  });
}
