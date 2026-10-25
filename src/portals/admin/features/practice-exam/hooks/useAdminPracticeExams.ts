/**
 * Hooks TanStack Query — admin quản lý đề luyện tập AI (Dev 5 — TASK-D5-04)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { PracticeExamPayload } from '@/shared/types';
import {
  createPracticeExamApi,
  deletePracticeExamApi,
  getPracticeExamsApi,
  updatePracticeExamApi,
  type AdminPracticeExamFilter,
} from '../services/adminPracticeExamService';

export function useAdminPracticeExams(filter: AdminPracticeExamFilter) {
  return useQuery({
    queryKey: QUERY_KEYS.admin.practiceExams(filter),
    queryFn: async () => unwrapOrThrow(await getPracticeExamsApi(filter)),
  });
}

/** Sau khi thêm/sửa/xóa: làm mới bảng admin, dropdown chặng lộ trình và trang luyện đề của học viên */
function useInvalidatePractice() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'practice-exams'] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.practiceOptions });
    queryClient.invalidateQueries({ queryKey: ['practice'] });
  };
}

export function useSavePracticeExam() {
  const invalidate = useInvalidatePractice();
  return useMutation({
    mutationFn: async (vars: { practiceExamId?: string; payload: PracticeExamPayload }) =>
      unwrapOrThrow(
        vars.practiceExamId
          ? await updatePracticeExamApi(vars.practiceExamId, vars.payload)
          : await createPracticeExamApi(vars.payload),
      ),
    onSuccess: invalidate,
  });
}

export function useDeletePracticeExam() {
  const invalidate = useInvalidatePractice();
  return useMutation({
    mutationFn: async (practiceExamId: string) => unwrapOrThrow(await deletePracticeExamApi(practiceExamId)),
    onSuccess: invalidate,
  });
}
