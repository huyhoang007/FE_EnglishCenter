/**
 * useHomework — hooks cho luồng bài tập của HỌC VIÊN (Dev 2.5)
 * -----------------------------------------------------------
 *   - useMyHomeworkSubmissions()  : danh sách bài nộp của tôi
 *   - useHomeworkSubmission(hwId) : bài nộp của tôi cho một bài tập
 *   - useSubmitHomework()         : mutation nộp bài (text / file / multiple_choice)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/Toast';
import {
  getMyHomeworkSubmissionApi,
  getMyHomeworkSubmissionsApi,
  submitHomeworkApi,
} from '@/shared/api/homeworkService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type {
  HomeworkSubmission,
  SubmitHomeworkPayload,
} from '@/shared/types/homework.types';

/** Bài nộp của tôi cho một bài tập (rỗng = chưa nộp). */
export function useHomeworkSubmission(homeworkContentId?: string) {
  const query = useQuery({
    queryKey: QUERY_KEYS.homework.mySubmission(homeworkContentId ?? ''),
    queryFn: async () => {
      const res = await getMyHomeworkSubmissionApi(homeworkContentId!);
      if (!res.success) {
        throw new Error(res.message || 'Không tải được bài nộp');
      }
      return res.data;
    },
    enabled: Boolean(homeworkContentId),
    staleTime: 15_000,
  });

  /** Lần nộp mới nhất (mảng được sắp theo submittedDate desc từ BE). */
  const latest: HomeworkSubmission | undefined = query.data?.[0];

  return {
    ...query,
    submissions: query.data ?? [],
    latest,
    /** true nếu đã nộp (bất kể đã chấm hay chưa). */
    hasSubmitted: Boolean(latest),
  };
}

/** Toàn bộ bài nộp của học viên đang đăng nhập. */
export function useMyHomeworkSubmissions() {
  return useQuery({
    queryKey: QUERY_KEYS.homework.mine(),
    queryFn: async () => {
      const res = await getMyHomeworkSubmissionsApi();
      if (!res.success) {
        throw new Error(res.message || 'Không tải được danh sách bài nộp');
      }
      return res.data;
    },
    staleTime: 15_000,
  });
}

/** Mutation nộp bài. */
export function useSubmitHomework() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: async (payload: SubmitHomeworkPayload) => {
      const res = await submitHomeworkApi(payload);
      if (!res.success) {
        throw new Error(res.message || 'Nộp bài thất bại');
      }
      return res.data;
    },
    onSuccess: (_submission, payload) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.homework.mySubmission(payload.homeworkContentId),
      });
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
