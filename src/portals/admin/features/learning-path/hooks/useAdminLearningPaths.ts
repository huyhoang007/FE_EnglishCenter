/**
 * Hooks TanStack Query — admin quản lý lộ trình học (Dev 5 — TASK-D5-03)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { fetchCourses } from '@/shared/api/courseService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type { LearningPathPayload } from '@/shared/types';
import { getMentorHomeworksApi } from '@/shared/api/mentorHomeworkService';
import {
  createLearningPathApi,
  deleteLearningPathApi,
  getExamOptionsApi,
  getLearningPathsApi,
  getPracticeOptionsApi,
  updateLearningPathApi,
  type AdminLearningPathFilter,
  type LearningPathManageMode,
} from '../services/adminLearningPathService';

export function useAdminLearningPaths(filter: AdminLearningPathFilter) {
  return useQuery({
    queryKey: QUERY_KEYS.admin.learningPaths(filter),
    queryFn: async () => unwrapOrThrow(await getLearningPathsApi(filter)),
  });
}

/** Sau khi thêm/sửa/xóa: làm mới bảng admin và trang Learning Paths của học viên */
function useInvalidateLearningPaths() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'learning-paths'] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learningPath.all });
  };
}

export function useSaveLearningPath(mode: LearningPathManageMode = 'admin') {
  const invalidate = useInvalidateLearningPaths();
  return useMutation({
    mutationFn: async (vars: { learningPathId?: string; payload: LearningPathPayload }) =>
      unwrapOrThrow(
        vars.learningPathId
          ? await updateLearningPathApi(vars.learningPathId, vars.payload, mode)
          : await createLearningPathApi(vars.payload, mode),
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteLearningPath(mode: LearningPathManageMode = 'admin') {
  const invalidate = useInvalidateLearningPaths();
  return useMutation({
    mutationFn: async (learningPathId: string) => unwrapOrThrow(await deleteLearningPathApi(learningPathId, mode)),
    onSuccess: invalidate,
  });
}

/** Lựa chọn cho dropdown chặng — chỉ tải khi form đang mở */
export function useLearningPathItemOptions(enabled: boolean, mode: LearningPathManageMode = 'admin') {
  const courses = useQuery({
    queryKey: QUERY_KEYS.admin.courseOptions,
    queryFn: async () => (await fetchCourses({ page: 0, size: 200 })).data,
    enabled,
    staleTime: 60_000,
  });
  const exams = useQuery({
    queryKey: QUERY_KEYS.admin.examOptions,
    queryFn: async () => unwrapOrThrow(await getExamOptionsApi()).data,
    enabled,
    staleTime: 60_000,
  });
  const practices = useQuery({
    queryKey: QUERY_KEYS.admin.practiceOptions,
    queryFn: async () => unwrapOrThrow(await getPracticeOptionsApi()).data,
    enabled,
    staleTime: 60_000,
  });
  // V27: chặng HOMEWORK — bài tập riêng của mentor đang đăng nhập
  const homeworks = useQuery({
    queryKey: QUERY_KEYS.homework.mentorLibrary(),
    queryFn: async () => unwrapOrThrow(await getMentorHomeworksApi()),
    enabled: enabled && mode === 'mentor',
    staleTime: 60_000,
  });
  return {
    courses: courses.data ?? [],
    exams: exams.data ?? [],
    practices: practices.data ?? [],
    homeworks: homeworks.data ?? [],
    isLoading: courses.isLoading || exams.isLoading || practices.isLoading || homeworks.isLoading,
  };
}
