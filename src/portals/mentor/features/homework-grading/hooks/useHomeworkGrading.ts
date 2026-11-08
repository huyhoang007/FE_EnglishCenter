/**
 * useHomeworkGrading — hooks cho màn hình chấm bài tập của MENTOR (Dev 2.5)
 * -----------------------------------------------------------
 *   GET /api/v1/mentor/homework-submissions?pendingOnly=&page=&size=
 *   GET /api/v1/mentor/homework-submissions/{id}
 *   PUT /api/v1/mentor/homework-submissions/{id}/grade
 *   GET /api/v1/mentor/homework-submissions/{id}/history
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/Toast';
import {
  getHomeworkAiSuggestionApi,
  getHomeworkExamStatsApi,
  getHomeworkGradeHistoryApi,
  getHomeworkSubmissionForGradingApi,
  getMentorHomeworkQueueApi,
  gradeHomeworkApi,
} from '@/shared/api/homeworkService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type {
  GradeHomeworkPayload,
  HomeworkGradeHistory,
  HomeworkSubmission,
} from '@/shared/types/homework.types';

/** Hàng đợi bài nộp chờ chấm (hoặc tất cả nếu `pendingOnly = false`). */
export function useHomeworkGradingQueue(
  page = 0,
  size = 20,
  pendingOnly = true,
) {
  return useQuery({
    queryKey: QUERY_KEYS.homework.gradingQueue(page, pendingOnly),
    queryFn: async () => {
      const res = await getMentorHomeworkQueueApi(page, size, pendingOnly);
      if (!res.success) {
        throw new Error(res.message || 'Không tải được hàng đợi chấm');
      }
      return res.data;
    },
    staleTime: 10_000,
  });
}

/** Chi tiết một bài nộp (kèm lịch sử chấm). */
export function useHomeworkForGrading(submissionId?: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.homework.gradingDetail(submissionId ?? ''),
    queryFn: async () => {
      const res = await getHomeworkSubmissionForGradingApi(submissionId!);
      if (!res.success) {
        throw new Error(res.message || 'Không tải được bài nộp');
      }
      return res.data;
    },
    enabled: Boolean(submissionId),
    staleTime: 10_000,
  });
}

/** Lịch sử chấm của một bài nộp. */
export function useHomeworkGradeHistory(submissionId?: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.homework.gradingDetail(submissionId ?? ''), 'history'],
    queryFn: async () => {
      const res = await getHomeworkGradeHistoryApi(submissionId!);
      if (!res.success) {
        throw new Error(res.message || 'Không tải được lịch sử chấm');
      }
      return res.data;
    },
    enabled: Boolean(submissionId),
  });
}

/**
 * Gợi ý chấm từ AI (nút "Xem gợi ý chấm từ AI").
 * <p>
 * AI KHÔNG ghi điểm vào hệ thống — chỉ tham khảo để mentor chấm nhanh hơn.
 * Gọi thủ công (on-demand), không tự động fetch.
 */
export function useHomeworkAiSuggestion(_submissionId?: string | null) {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await getHomeworkAiSuggestionApi(id);
      if (!res.success) {
        throw new Error(res.message || 'Không lấy được gợi ý từ AI');
      }
      return res.data;
    },
  });
}

/**
 * Bảng thống kê kết quả làm bài TRẮC NGHIỆM (Nhóm A).
 * <p>
 * Hệ thống tự chấm → mentor chỉ xem để nắm điểm yếu chung của học viên.
 */
export function useHomeworkExamStats(homeworkContentId?: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.homework.examStats(homeworkContentId ?? ''),
    queryFn: async () => {
      const res = await getHomeworkExamStatsApi(homeworkContentId!);
      if (!res.success) {
        throw new Error(res.message || 'Không tải được thống kê');
      }
      return res.data;
    },
    enabled: Boolean(homeworkContentId),
  });
}

/** Mutation chấm / sửa điểm. */
export function useGradeHomework() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async ({
      submissionId,
      payload,
    }: {
      submissionId: string;
      payload: GradeHomeworkPayload;
    }) => {
      const res = await gradeHomeworkApi(submissionId, payload);
      if (!res.success) {
        throw new Error(res.message || 'Chấm điểm thất bại');
      }
      return res.data;
    },
    onSuccess: (submission, { submissionId }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.homework.gradingDetail(submissionId),
      });
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEYS.homework.gradingDetail(submissionId), 'history'],
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.homework.all });
      toast.success(
        submission.passed ? 'Đã chấm — học viên đạt' : 'Đã chấm điểm',
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Chấm điểm thất bại',
      );
    },
  });
}

export type { HomeworkSubmission, HomeworkGradeHistory };
