/**
 * useLearningPaths — hooks TanStack Query cho trang Lộ trình học (Dev 5)
 * -----------------------------------------------------------
 * View chỉ gọi các hook này, không gọi service trực tiếp.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import {
  enrollLearningPathApi,
  getCertificatesApi,
  getLearningPathsApi,
  getMyLearningPathProgressApi,
} from '../services/learningPathService';

/** Danh sách lộ trình (lọc theo chứng chỉ, '' = tất cả) */
export function useLearningPaths(certificateId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.learningPath.list(certificateId),
    queryFn: async () => unwrapOrThrow(await getLearningPathsApi(certificateId)).data,
  });
}

/** Tiến độ các lộ trình học viên đã ghi danh (chỉ STUDENT) */
export function useMyLearningPathProgress(enabled: boolean) {
  return useQuery({
    queryKey: QUERY_KEYS.learningPath.myProgress,
    queryFn: async () => unwrapOrThrow(await getMyLearningPathProgressApi()),
    enabled,
  });
}

/** Danh sách chứng chỉ để lọc (API của Dev 2) */
export function useCertificateOptions() {
  return useQuery({
    queryKey: QUERY_KEYS.learningPath.certificates,
    queryFn: async () => unwrapOrThrow(await getCertificatesApi()).data,
  });
}

/** Ghi danh lộ trình, xong thì tải lại danh sách + tiến độ */
export function useEnrollLearningPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (pathId: string) => unwrapOrThrow(await enrollLearningPathApi(pathId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learningPath.all }),
  });
}
