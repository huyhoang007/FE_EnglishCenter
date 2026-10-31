/**
 * PracticeExamManagementView — Admin quản lý kho đề luyện tập AI (route `/admin/practice-exams`)
 * -----------------------------------------------------------
 * Đề luyện tập dùng chung module Exam (exam_scope = practice): một đề gồm nhiều phần thi
 * Listening / Reading (tự chấm theo đáp án) và Writing / Speaking (AI - Claude chấm khi học viên nộp).
 *   - "Tạo đề luyện tập": thêm từng phần thi + file đề của kỹ năng đó → AI đọc → tạo 1 lần
 *   - Sửa câu hỏi / đáp án, xuất bản, lưu trữ: trang soạn đề của module Exam
 * API: GET /api/v1/admin/exams?examScope=practice, xem thêm exam/services/adminExamService.ts
 *
 * Layout giữ nguyên AdminLayout: StatCard → title bar → filter bar → bảng → modal,
 * bo góc 16-24px, viền slate-200/80, màu nhấn #0052CC (giống Certificates / Courses).
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle2, Eye, EyeOff, FileText, Pencil, Plus, RotateCcw, Search, Sparkles, Trash2, X } from 'lucide-react';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage, unwrapOrThrow } from '@/shared/api/axiosClient';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { formatDate } from '@/shared/utils/format';
import type { ExamStatus, ExamSummary } from '@/shared/types';
import { useAdminExams } from '@/portals/admin/features/exam/hooks/useAdminExams';
import {
  deleteExamApi,
  publishExamApi,
  unpublishExamApi,
} from '@/portals/admin/features/exam/services/adminExamService';
import { ExamStatusPill } from '@/portals/admin/features/exam/components/ExamStatusPill';
import { CreatePracticeExamModal } from './components/CreatePracticeExamModal';
import { ModalShell } from './components/PracticeFormParts';

const PAGE_SIZE = 10;

/* =========================================================
 * View
 * ========================================================= */
export const PracticeExamManagementView: React.FC = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<ExamStatus | ''>('');
  const [certificateFilter, setCertificateFilter] = useState<string>('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<ExamSummary | null>(null);

  const { data: certificates = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 5 * 60_000,
  });

  const listQuery = useAdminExams({
    examScope: 'practice',
    keyword,
    status,
    certificateId: certificateFilter || undefined,
    page,
    size: PAGE_SIZE,
  });
  // Thống kê: chỉ cần totalElements
  const allQuery = useAdminExams({ examScope: 'practice', page: 0, size: 1 });
  const publishedQuery = useAdminExams({ examScope: 'practice', status: 'published', page: 0, size: 1 });
  const draftQuery = useAdminExams({ examScope: 'practice', status: 'draft', page: 0, size: 1 });

  const exams = listQuery.data?.data ?? [];
  const total = allQuery.data?.totalElements ?? 0;
  const publishedTotal = publishedQuery.data?.totalElements ?? 0;
  const draftTotal = draftQuery.data?.totalElements ?? 0;
  const hasFilter = Boolean(status || keyword || certificateFilter);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['exam'] });

  /** Xuất bản / ẩn đề ngay trên bảng */
  const toggleMutation = useMutation({
    mutationFn: async (exam: ExamSummary) =>
      unwrapOrThrow(await (exam.status === 'published' ? unpublishExamApi : publishExamApi)(exam.examId)),
    onSuccess: (detail) => {
      toast.success(detail.exam.status === 'published' ? 'Đã xuất bản đề cho học viên' : 'Đã ẩn đề (về nháp)');
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (examId: string) => unwrapOrThrow(await deleteExamApi(examId)),
    onSuccess: () => {
      toast.success('Đã xóa đề luyện tập');
      setDeleting(null);
      invalidate();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  /* ---------- Debounce keyword (giống Courses) ---------- */
  const timerRef = React.useRef<number | undefined>(undefined);
  const applyKeyword = (value: string) => {
    setKeywordInput(value);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setKeyword(value.trim());
      setPage(0);
    }, 400);
  };

  const resetFilters = () => {
    setStatus('');
    setCertificateFilter('');
    setKeywordInput('');
    setKeyword('');
    setPage(0);
  };

  return (
    <div className="space-y-6">
      {/* ============ 1. STATS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        <StatCard
          title="Tổng đề luyện tập"
          value={total.toLocaleString('vi-VN')}
          subtext="Nhiều kỹ năng, AI chấm"
          icon={Sparkles}
          colorScheme="purple"
          trendPoints={[2, 3, 3, 4, 5, 5, 6, total || 6]}
        />
        <StatCard
          title="Đã xuất bản"
          value={publishedTotal.toLocaleString('vi-VN')}
          subtext="Học viên đang thấy"
          icon={CheckCircle2}
          colorScheme="emerald"
          trendPoints={[1, 2, 2, 3, 3, 4, 4, publishedTotal || 4]}
        />
        <StatCard
          title="Nháp"
          value={draftTotal.toLocaleString('vi-VN')}
          subtext="Chưa xuất bản"
          icon={FileText}
          colorScheme="blue"
          trendPoints={[1, 1, 2, 2, 3, 3, 4, draftTotal || 4]}
        />
        <StatCard
          title="Đang hiển thị"
          value={(listQuery.data?.totalElements ?? 0).toLocaleString('vi-VN')}
          subtext={hasFilter ? 'Sau khi lọc' : 'Tất cả'}
          icon={Search}
          colorScheme="amber"
          trendPoints={[3, 4, 4, 5, 5, 6, 6, listQuery.data?.totalElements || 6]}
        />
      </div>

      {/* ============ 2. TITLE BAR ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đề luyện tập AI</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Mỗi đề gồm nhiều phần thi: Reading / Listening tự chấm theo đáp án, Writing / Speaking do AI chấm theo thang
            chứng chỉ mục tiêu của học viên.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={Plus}
          onClick={() => setCreateOpen(true)}
          className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
        >
          Tạo đề luyện tập
        </Button>
      </div>

      {/* ============ 3. FILTER BAR ============ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 flex-1 min-w-[240px] focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => applyKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc mô tả…"
              className="bg-transparent outline-none w-full text-slate-700 text-sm placeholder:text-slate-400"
              aria-label="Tìm đề luyện tập"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ExamStatus | '');
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Nháp</option>
            <option value="archived">Lưu trữ</option>
          </select>

          <select
            value={certificateFilter}
            onChange={(e) => {
              setCertificateFilter(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc theo chứng chỉ"
          >
            <option value="">Tất cả chứng chỉ</option>
            {certificates.map((cert) => (
              <option key={cert.certificateId} value={cert.certificateId}>
                {cert.certificateName}
              </option>
            ))}
          </select>

          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* ============ 4. CONTENT ============ */}
      {listQuery.isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : listQuery.isError ? (
        <ErrorState message={getErrorMessage(listQuery.error)} onRetry={() => listQuery.refetch()} />
      ) : exams.length === 0 ? (
        hasFilter ? (
          <EmptyState
            title="Không tìm thấy đề phù hợp"
            description="Thử đổi trạng thái, chứng chỉ hoặc xoá bớt từ khoá."
            actionLabel="Đặt lại bộ lọc"
            onAction={resetFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có đề luyện tập nào"
            description="Tạo đề đầu tiên: thêm từng phần thi và tải file đề của kỹ năng đó lên, AI sẽ đọc giúp."
            actionLabel="Tạo đề luyện tập"
            onAction={() => setCreateOpen(true)}
          />
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3.5 px-4 font-bold">Đề luyện tập</th>
                  <th className="py-3.5 px-3 font-bold">Chứng chỉ</th>
                  <th className="py-3.5 px-3 font-bold text-right">Phần thi</th>
                  <th className="py-3.5 px-3 font-bold text-right">Câu hỏi</th>
                  <th className="py-3.5 px-3 font-bold text-right">Lượt làm</th>
                  <th className="py-3.5 px-3 font-bold">Trạng thái</th>
                  <th className="py-3.5 px-3 font-bold">Cập nhật</th>
                  <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.examId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 max-w-[340px]">
                      <span className="font-bold text-slate-900 block truncate">{exam.examTitle}</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {exam.durationMinutes} phút{exam.description ? ` · ${exam.description}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {exam.certificateName ? (
                        <Badge variant="ai" size="sm" icon={Award}>
                          {exam.certificateName}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">Mọi mục tiêu</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700">{exam.totalParts}</td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700">{exam.totalQuestions}</td>
                    <td className="py-3 px-3 text-right tabular-nums text-slate-700">{exam.totalAttempts ?? 0}</td>
                    <td className="py-3 px-3">
                      <ExamStatusPill status={exam.status} />
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {exam.lastUpdated ? formatDate(exam.lastUpdated) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(ADMIN_ROUTES.examEditor(exam.examId))}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Soạn đề: sửa câu hỏi, đáp án, phần thi"
                          aria-label="Soạn đề"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {exam.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => toggleMutation.mutate(exam)}
                            disabled={toggleMutation.isPending}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                            title={exam.status === 'published' ? 'Ẩn đề (về nháp)' : 'Xuất bản cho học viên'}
                            aria-label={exam.status === 'published' ? 'Ẩn đề' : 'Xuất bản'}
                          >
                            {exam.status === 'published' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleting(exam)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Xóa đề"
                          aria-label="Xóa đề"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-slate-100">
            <Pagination currentPage={page} totalPages={listQuery.data?.totalPages ?? 0} onChange={setPage} />
          </div>
        </div>
      )}

      {/* ============ MODALS ============ */}
      {isCreateOpen && <CreatePracticeExamModal onClose={() => setCreateOpen(false)} />}

      {deleting && (
        <ModalShell onClose={() => setDeleting(null)}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Xóa đề luyện tập</h3>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-700 pt-4">
            Xóa đề <span className="font-bold">{deleting.examTitle}</span>? Đề đã có học viên làm bài thì không xóa được
            (để giữ lịch sử của học viên) — hãy ẩn hoặc lưu trữ đề ở trang soạn đề.
          </p>
          <div className="flex justify-end gap-2 pt-5">
            <Button variant="ghost" size="md" onClick={() => setDeleting(null)}>
              Đóng
            </Button>
            <Button
              variant="danger"
              size="md"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleting.examId)}
            >
              Xác nhận xóa
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default PracticeExamManagementView;
