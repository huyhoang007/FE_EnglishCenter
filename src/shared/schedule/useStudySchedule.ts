/**
 * useStudySchedule — hooks TanStack Query cho lịch học cá nhân (Dev 5 — TASK-D5-01)
 * -----------------------------------------------------------
 * View chỉ gọi các hook này, không gọi service trực tiếp.
 * Thêm / sửa / đổi trạng thái / xóa xong thì tải lại danh sách.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import type { StudySchedulePayload, StudyStatus } from '@/shared/types';
import {
  createStudyScheduleApi,
  deleteStudyScheduleApi,
  getMyStudySchedulesApi,
  updateStudyScheduleApi,
  updateStudyStatusApi,
} from './studyScheduleService';

function useInvalidateStudySchedule() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studySchedule.all });
}

/** Lịch học của tôi (30 ngày tới), lọc theo trạng thái nếu có */
export function useMyStudySchedules(status: StudyStatus | undefined, page: number) {
  return useQuery({
    queryKey: QUERY_KEYS.studySchedule.list(status ?? 'all', page),
    queryFn: async () => unwrapOrThrow(await getMyStudySchedulesApi(status, page)),
  });
}

export function useCreateStudySchedule() {
  const invalidate = useInvalidateStudySchedule();
  return useMutation({
    mutationFn: async (payload: StudySchedulePayload) => unwrapOrThrow(await createStudyScheduleApi(payload)),
    onSuccess: invalidate,
  });
}

export function useUpdateStudySchedule() {
  const invalidate = useInvalidateStudySchedule();
  return useMutation({
    mutationFn: async (vars: { scheduleId: string; payload: StudySchedulePayload }) =>
      unwrapOrThrow(await updateStudyScheduleApi(vars.scheduleId, vars.payload)),
    onSuccess: invalidate,
  });
}

export function useUpdateStudyStatus() {
  const invalidate = useInvalidateStudySchedule();
  return useMutation({
    mutationFn: async (vars: { scheduleId: string; status: StudyStatus }) =>
      unwrapOrThrow(await updateStudyStatusApi(vars.scheduleId, vars.status)),
    onSuccess: invalidate,
  });
}

export function useDeleteStudySchedule() {
  const invalidate = useInvalidateStudySchedule();
  return useMutation({
    mutationFn: async (scheduleId: string) => unwrapOrThrow(await deleteStudyScheduleApi(scheduleId)),
    onSuccess: invalidate,
  });
}
