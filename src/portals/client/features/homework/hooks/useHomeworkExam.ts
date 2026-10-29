/**
 * useHomeworkExam — hook làm bài TRẮC NGHIỆM cho một bài tập (Dev 2.5)
 * -----------------------------------------------------------
 * Bài tập trắc nghiệm dùng lại MÁY CHẤM của module Exam (`ExamGrader`) nhưng
 * có luồng RIÊNG, không đụng vào code của team:
 *
 *   1. `startHomeworkAttempt(homeworkContentId)` → BE tạo lượt thi thật
 *      trên `exam_attempts` (dùng đề mà bài tập trỏ tới) và trả attemptId.
 *   2. Học viên làm bài ở màn `/homework/attempts/:attemptId`.
 *   3. `submitHomeworkAttempt(attemptId, answers)` → BE nộp lượt thi, chấm tự động,
 *      rồi TỰ TẠO bản ghi `homework_submissions` (điểm + passed).
 *
 * Vì vậy học viên KHÔNG phải tự chuyển sang phòng thi của module Exam, và
 * bài nộp luôn gắn đúng lượt thi đã nộp.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/Toast';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import {
  getHomeworkAttemptApi,
  startHomeworkAttemptApi,
  submitHomeworkAttemptApi,
} from '@/shared/api/homeworkService';
import type { AnswerItemRequest, AttemptDetail } from '@/shared/types';

/**
 * Bắt đầu lượt thi cho bài tập trắc nghiệm.
 * <p>
 * BE trả về lượt thi đang mở (có câu hỏi) hoặc lượt thi đã nộp (nếu làm lại).
 */
export function useStartHomeworkAttempt(homeworkContentId?: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (contentId: string) => {
      const res = await startHomeworkAttemptApi(contentId);
      if (!res.success) {
        throw new Error(res.message || 'Không mở được phòng làm bài');
      }
      return res.data;
    },
    onSuccess: (attempt) => {
      queryClient.setQueryData(
        QUERY_KEYS.homework.attempt(attempt.attemptId),
        attempt,
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.homework.all });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Không mở được phòng làm bài',
      );
    },
  });
}

/** Tải lượt thi của bài tập (câu hỏi + đáp án đã lưu). */
export function useHomeworkAttempt(attemptId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.homework.attempt(attemptId ?? ''),
    queryFn: async () => {
      const res = await getHomeworkAttemptApi(attemptId!);
      if (!res.success) {
        throw new Error(res.message || 'Không tải được bài làm');
      }
      return res.data;
    },
    enabled: Boolean(attemptId),
    staleTime: 30_000,
    retry: false,
  });
}

/**
 * Nộp bài trắc nghiệm.
 * <p>
 * BE sẽ chấm tự động rồi tạo bài nộp `homework_submissions` tương ứng.
 */
export function useSubmitHomeworkAttempt(attemptId?: string) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (answers: AnswerItemRequest[]) => {
      const res = await submitHomeworkAttemptApi(attemptId!, answers);
      if (!res.success) {
        throw new Error(res.message || 'Nộp bài thất bại');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.homework.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.homework.mine() });
      toast.success('Nộp bài thành công!');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Nộp bài thất bại',
      );
    },
  });
}

/** Kiểu dữ liệu attempt trả về từ API homework (giống attempt của module Exam). */
export type { AttemptDetail };
