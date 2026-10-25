/**
 * AdminVocabularyManagementView — Trang GÁN TỪ VỰNG cho 1 KHÓA HỌC
 * -----------------------------------------------------------
 * Route: `/admin/courses/:id/vocabularies`
 *
 * Mô hình mới (tách 2 luồng):
 *   - LUỒNG 2 (trang này): duyệt KHO TỪ VỰNG CHUNG → tick chọn → gán vào
 *     khóa học này. KHÔNG tạo từ vựng trực tiếp ở đây.
 *   - LUỒNG 1 (tạo bộ mới): mở `VocabularySetEditorModal` — bộ được tạo
 *     trong kho chung, độc lập với khóa học.
 *
 * API thật (Backend):
 *   GET    /api/v1/courses/{courseId}/vocabularies       → bộ đang gán
 *   GET    /api/v1/vocabulary-sets                       → kho chung
 *   PUT    /api/v1/vocabulary-sets/courses/{courseId}    → lưu danh sách tick
 *   DELETE /api/v1/vocabulary-sets/courses/{courseId}/{setId} → gỡ 1 bộ
 *
 * Bố cục bám sát Admin Layout: bo tròn `rounded-2xl`, viền slate-200/80.
 */

import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import { fetchCourseById } from '@/shared/api/courseService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { VocabularyAssignPanel } from './components/VocabularyAssignPanel';
import { VocabularySetEditorModal } from './components/VocabularySetEditorModal';

/* =========================================================
 * View
 * ========================================================= */
export const AdminVocabularyManagementView: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  /** Modal tạo / sửa bộ trong kho chung. */
  const [editorOpen, setEditorOpen] = useState(false);

  /* ---------- Query: thông tin khóa học ---------- */
  const {
    data: course,
    isLoading: courseLoading,
    isError: courseError,
    error: courseErrorObj,
    refetch: refetchCourse,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.course(id),
    queryFn: () => fetchCourseById(id),
    enabled: Boolean(id),
    retry: false,
  });

  /* ---------- Loading ---------- */
  if (courseLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  /* ---------- Error / Not found ---------- */
  if (courseError || !course) {
    return (
      <div className="space-y-5">
        <Button
          variant="outline"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/admin/courses')}
          className="font-bold"
        >
          {t('admin.course.backToList')}
        </Button>
        <ErrorState
          message={
            courseErrorObj instanceof Error
              ? courseErrorObj.message
              : t('admin.course.notFoundHint')
          }
          onRetry={() => refetchCourse()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ============ 1. BACK + TITLE ============ */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <Link
            to={`/admin/courses/${course.courseId}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0052CC] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('admin.course.backToDetail')}
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight truncate">
            {t('vocab.bank.assignToCourse')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {course.title} ·{' '}
            <span className="font-mono text-slate-400">{course.code}</span>
          </p>
        </div>
      </div>

      {/* ============ 2. PANEL GÁN TỪ VỰNG ============ */}
      <VocabularyAssignPanel
        courseId={course.courseId}
        courseTitle={course.title}
        onCreateSet={() => setEditorOpen(true)}
      />

      {/* ============ 3. MODAL TẠO BỘ MỚI TRONG KHO CHUNG ============ */}
      <VocabularySetEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
};

export default AdminVocabularyManagementView;
