/**
 * useMentorHomework — hooks TanStack Query cho trang Homework của mentor (Dev 5, V27)
 * -----------------------------------------------------------
 * View chỉ gọi các hook này, không gọi service trực tiếp.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import {
  createMentorHomeworkApi,
  deleteMentorHomeworkApi,
  getMentorHomeworksApi,
  importHomeworkPdfApi,
  updateMentorHomeworkApi,
} from '@/shared/api/mentorHomeworkService';
import type { MentorHomeworkPayload } from '@/shared/types/homework.types';

export function useMentorHomeworks(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.homework.mentorLibrary(),
    queryFn: async () => unwrapOrThrow(await getMentorHomeworksApi()),
    enabled,
  });
}

/** Lưu (tạo mới khi không có contentId, sửa khi có) */
export function useSaveMentorHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { contentId?: string; payload: MentorHomeworkPayload }) =>
      unwrapOrThrow(
        vars.contentId
          ? await updateMentorHomeworkApi(vars.contentId, vars.payload)
          : await createMentorHomeworkApi(vars.payload),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.homework.mentorLibrary() }),
  });
}

export function useDeleteMentorHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contentId: string) => unwrapOrThrow(await deleteMentorHomeworkApi(contentId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.homework.mentorLibrary() }),
  });
}

/** AI đọc PDF đề bài tập → bản nháp (chưa lưu) */
export function useImportHomeworkPdf() {
  return useMutation({
    mutationFn: async (vars: { fileBase64: string; fileName: string }) =>
      unwrapOrThrow(await importHomeworkPdfApi(vars.fileBase64, vars.fileName)),
  });
}
