/**
 * Hooks quản lý đề thi cho Admin (Dev 3)
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCertificates } from '@/shared/api/certificateService';
import { fetchCourses } from '@/shared/api/courseService';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import {
  addQuestionApi,
  createExamApi,
  createSectionApi,
  deleteExamApi,
  deleteSectionApi,
  getAdminExamApi,
  getAdminExamsApi,
  publishExamApi,
  removeQuestionApi,
  unpublishExamApi,
  type AdminExamFilter,
  type CreateExamRequest,
  type CreateQuestionRequest,
  type CreateSectionRequest,
} from '../services/adminExamService';

export function useAdminExams(filter: AdminExamFilter) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.adminList(filter),
    queryFn: async () => unwrapOrThrow(await getAdminExamsApi(filter)),
    placeholderData: keepPreviousData,
  });
}

export function useAdminExam(examId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.exam.adminDetail(examId),
    queryFn: async () => unwrapOrThrow(await getAdminExamApi(examId)),
    enabled: Boolean(examId),
  });
}

/** Danh mục chứng chỉ / khóa học (API public của Dev 2, chỉ đọc) cho form tạo đề. */
export function useExamFormOptions() {
  const certificates = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
  });
  const courses = useQuery({
    queryKey: QUERY_KEYS.catalog.courses({ size: 100, purpose: 'exam-form' }),
    queryFn: async () => (await fetchCourses({ size: 100 })).data,
  });
  return { certificates, courses };
}

/** Làm mới mọi cache liên quan tới đề: danh sách admin, ngân hàng đề, dropdown đề của lộ trình học. */
function useInvalidateExams() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['exam'] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.examOptions });
  };
}

export function useCreateExam() {
  const invalidate = useInvalidateExams();
  return useMutation({
    mutationFn: async (payload: CreateExamRequest) => unwrapOrThrow(await createExamApi(payload)),
    onSuccess: invalidate,
  });
}

/** Các thao tác trên một đề: mọi mutation thành công đều làm mới chi tiết đề và danh sách đề. */
export function useExamActions(examId: string) {
  const queryClient = useQueryClient();
  const onSuccess = useInvalidateExams();
  return {
    publish: useMutation({
      mutationFn: async () => unwrapOrThrow(await publishExamApi(examId)),
      onSuccess,
    }),
    unpublish: useMutation({
      mutationFn: async () => unwrapOrThrow(await unpublishExamApi(examId)),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: async () => unwrapOrThrow(await deleteExamApi(examId)),
      // Làm mới mọi cache đề trừ chi tiết đề vừa xóa, tránh tải lại nó (404) trước khi rời trang
      onSuccess: () => {
        const deletedKey = JSON.stringify(QUERY_KEYS.exam.adminDetail(examId));
        queryClient.invalidateQueries({
          queryKey: ['exam'],
          predicate: (query) => JSON.stringify(query.queryKey) !== deletedKey,
        });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.examOptions });
      },
    }),
    addSection: useMutation({
      mutationFn: async (payload: CreateSectionRequest) => unwrapOrThrow(await createSectionApi(examId, payload)),
      onSuccess,
    }),
    removeSection: useMutation({
      mutationFn: async (sectionId: string) => unwrapOrThrow(await deleteSectionApi(examId, sectionId)),
      onSuccess,
    }),
    addQuestion: useMutation({
      mutationFn: async (payload: CreateQuestionRequest) => unwrapOrThrow(await addQuestionApi(examId, payload)),
      onSuccess,
    }),
    removeQuestion: useMutation({
      mutationFn: async (questionId: string) => unwrapOrThrow(await removeQuestionApi(examId, questionId)),
      onSuccess,
    }),
  };
}
