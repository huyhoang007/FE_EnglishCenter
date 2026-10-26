/**
 * ExamManagementView — Danh sách đề thi (mọi trạng thái) cho Admin (Dev 3)
 * -----------------------------------------------------------
 * Header gọn + thanh công cụ (tìm kiếm, lọc trạng thái) + bảng dễ quét:
 * tên đề là liên kết mở trình soạn đề, số câu / số phần tách cột, cột số căn phải.
 * Màn hình nhỏ: bảng chuyển thành danh sách thẻ, không làm tràn trang.
 * URL: /admin/exams
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Pencil, Plus, Search, X } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { EXAM_STATUS_LABEL, EXAM_TYPE_LABEL, type ExamStatus, type ExamSummary } from '@/shared/types';
import { formatDate } from '@/shared/utils';
import { cn } from '@/shared/utils/cn';
import { useAdminExams } from './hooks/useAdminExams';
import { CreateExamModal } from './components/CreateExamModal';
import { ExamStatusPill } from './components/ExamStatusPill';

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC]/40';

/** Dòng phụ: mã đề · chứng chỉ hoặc khóa học */
const subline = (exam: ExamSummary) =>
  [exam.examCode, exam.examScope === 'trial' ? exam.certificateName : exam.courseTitle].filter(Boolean).join(' · ') ||
  'Chưa có mã đề';

export const ExamManagementView: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [status, setStatus] = useState<ExamStatus | ''>('');
  const [page, setPage] = useState(0);
  const [isCreateOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const { data, isLoading, isError, error, refetch, isFetching } = useAdminExams({
    keyword: debouncedKeyword,
    status,
    page,
  });
  const isFiltered = Boolean(debouncedKeyword.trim() || status);
  const clearFilters = () => {
    setKeyword('');
    setDebouncedKeyword('');
    setStatus('');
    setPage(0);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Quản lý đề thi</h1>
          <p className="text-sm text-slate-600 mt-1">Tạo đề, soạn phần thi và câu hỏi, rồi công khai cho học viên.</p>
        </div>
        <Button leftIcon={Plus} className="h-10 shrink-0" onClick={() => setCreateOpen(true)}>
          Tạo đề thi
        </Button>
      </div>

      {/* ---------- Thanh công cụ ---------- */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Tìm đề thi</span>
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo tên hoặc mã đề…"
            className="w-full h-10 pl-9 pr-9 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className={cn('absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:bg-slate-100', FOCUS_RING)}
              aria-label="Xóa từ khóa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </label>
        <label className="sm:w-52">
          <span className="sr-only">Lọc theo trạng thái</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ExamStatus | '');
              setPage(0);
            }}
            className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/20"
          >
            <option value="">Mọi trạng thái</option>
            {(Object.keys(EXAM_STATUS_LABEL) as ExamStatus[]).map((s) => (
              <option key={s} value={s}>
                {EXAM_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ---------- Nội dung ---------- */}
      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        isFiltered ? (
          <EmptyState
            title="Không tìm thấy đề phù hợp"
            description="Thử từ khóa khác hoặc bỏ bộ lọc trạng thái."
            actionLabel="Xóa bộ lọc"
            onAction={clearFilters}
          />
        ) : (
          <EmptyState title="Chưa có đề thi nào" description="Bấm “Tạo đề thi” để soạn đề đầu tiên." />
        )
      ) : (
        <>
          {/* Bảng — từ md trở lên */}
          <div className={cn('hidden md:block rounded-2xl border border-slate-200 bg-white overflow-hidden', isFetching && 'opacity-70')}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-600">
                    <th scope="col" className="py-3 px-4 w-full">Đề thi</th>
                    <th scope="col" className="py-3 px-3 whitespace-nowrap">Loại đề</th>
                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">Câu hỏi</th>
                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">Phần thi</th>
                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">Lượt thi</th>
                    <th scope="col" className="py-3 px-3 whitespace-nowrap">Trạng thái</th>
                    <th scope="col" className="py-3 px-3 text-right whitespace-nowrap">Cập nhật</th>
                    <th scope="col" className="py-3 px-4">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.data.map((exam) => (
                    <tr key={exam.examId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 max-w-0">
                        <Link
                          to={ADMIN_ROUTES.examEditor(exam.examId)}
                          className={cn('block font-semibold text-slate-900 hover:text-[#0052CC] truncate rounded', FOCUS_RING)}
                          title={exam.examTitle}
                        >
                          {exam.examTitle}
                        </Link>
                        <span className="block text-xs text-slate-500 truncate mt-0.5">{subline(exam)}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {exam.examType ? EXAM_TYPE_LABEL[exam.examType] : '—'}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-800">{exam.totalQuestions}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-800">{exam.totalParts}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-800">{exam.totalAttempts ?? 0}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <ExamStatusPill status={exam.status} />
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 whitespace-nowrap tabular-nums">
                        {exam.lastUpdated ? formatDate(exam.lastUpdated) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={ADMIN_ROUTES.examEditor(exam.examId)}
                          className={cn(
                            'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-[#0052CC] hover:bg-blue-50 whitespace-nowrap',
                            FOCUS_RING,
                          )}
                          aria-label={`Chỉnh sửa đề ${exam.examTitle}`}
                        >
                          <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Danh sách thẻ — màn hình nhỏ */}
          <ul className={cn('md:hidden space-y-3', isFetching && 'opacity-70')}>
            {data.data.map((exam) => (
              <li key={exam.examId}>
                <Link
                  to={ADMIN_ROUTES.examEditor(exam.examId)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300',
                    FOCUS_RING,
                  )}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 break-words">{exam.examTitle}</p>
                      <ExamStatusPill status={exam.status} />
                    </div>
                    <p className="text-xs text-slate-500 break-words">{subline(exam)}</p>
                    <p className="text-xs text-slate-700">
                      {exam.examType ? EXAM_TYPE_LABEL[exam.examType] : '—'} · {exam.totalQuestions} câu hỏi ·{' '}
                      {exam.totalParts} phần thi · {exam.totalAttempts ?? 0} lượt thi
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>

          <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {isCreateOpen && <CreateExamModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
};

export default ExamManagementView;
