/**
 * ExamListView — Ngân hàng đề thi (Dev 3)
 * -----------------------------------------------------------
 * Lọc theo từ khóa, loại đề, phạm vi (kiểm tra đầu vào / khóa học), level; phân trang phía server.
 * API: GET /api/v1/exams — BE chỉ trả đề kiểm tra đầu vào + đề của khóa học viên đã mua (không trả hết).
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck2, Gauge, History, Search } from 'lucide-react';
import { usePendingAttempts } from '@/portals/mentor/features/exam-grading';
import { Button } from '@/shared/components/Button';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { CLIENT_ROUTES, MENTOR_ROUTES } from '@/shared/constants/routes';
import { EXAM_TYPE_LABEL, type ExamScope, type ExamType } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { useExamList } from '../hooks/useExams';
import { ExamCard } from './ExamCard';

const SCOPE_OPTIONS: { value: ExamScope | ''; label: string }[] = [
  { value: '', label: 'Tất cả' },
  { value: 'trial', label: 'Kiểm tra đầu vào' },
  { value: 'course', label: 'Khóa học của tôi' },
];

export const ExamListView: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Mentor / admin: lối vào trang chấm Writing / Speaking, kèm số bài đang chờ chấm
  const canGrade = useAuthStore((s) => s.role === 'MENTOR' || s.role === 'ADMIN');
  const pendingGrading = usePendingAttempts(0, isAuthenticated && canGrade);
  const pendingCount = pendingGrading.data?.totalElements ?? 0;
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [examType, setExamType] = useState<ExamType | ''>('');
  const [examScope, setExamScope] = useState<ExamScope | ''>('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(0);

  // Debounce ô tìm kiếm 400ms
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(keyword), 400);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  const { data, isLoading, isError, error, refetch, isFetching } = useExamList({
    keyword: debouncedKeyword,
    examType,
    examScope,
    level,
    page,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Khảo thí & Luyện đề</h1>
          <p className="text-sm text-slate-500 mt-1">Đề kiểm tra đầu vào và đề của các khóa bạn đã mua. Giữa kỳ mở khi bạn đạt hết Quiz; Cuối kỳ mở khi bạn đạt Giữa kỳ và đạt đủ bài tập của khóa.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAuthenticated && canGrade && (
            <Button variant="outline" leftIcon={FileCheck2} onClick={() => navigate(MENTOR_ROUTES.examGrading)}>
              Chấm bài thi
              {pendingCount > 0 && (
                <span className="ml-1.5 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold inline-flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </Button>
          )}
          <Button leftIcon={Gauge} onClick={() => navigate(CLIENT_ROUTES.examPlacement)}>
            Kiểm tra năng lực
          </Button>
          {isAuthenticated && (
            <Button variant="outline" leftIcon={History} onClick={() => navigate(CLIENT_ROUTES.examHistory)}>
              Lịch sử thi của tôi
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-card p-4 flex flex-col md:flex-row gap-3">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo tên hoặc mã đề…"
            className="w-full h-10 pl-9 pr-3 rounded-input border border-slate-200 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary"
          />
        </label>
        <select
          value={examType}
          onChange={(e) => {
            setExamType(e.target.value as ExamType | '');
            setPage(0);
          }}
          className="h-10 px-3 rounded-input border border-slate-200 text-sm bg-white"
          aria-label="Loại đề"
        >
          <option value="">Mọi loại đề</option>
          {(Object.keys(EXAM_TYPE_LABEL) as ExamType[]).map((t) => (
            <option key={t} value={t}>
              {EXAM_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <input
          value={level}
          onChange={(e) => {
            setLevel(e.target.value);
            setPage(0);
          }}
          placeholder="Level (VD: B1)"
          className="h-10 w-full md:w-32 px-3 rounded-input border border-slate-200 text-sm"
          aria-label="Level"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {SCOPE_OPTIONS.map((opt) => (
          <button
            key={opt.value || 'all'}
            type="button"
            onClick={() => {
              setExamScope(opt.value);
              setPage(0);
            }}
            className={cn(
              'h-8 px-3 rounded-full text-xs font-bold border transition-colors',
              examScope === opt.value
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-card" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="Chưa có đề phù hợp" description="Thử bỏ bớt bộ lọc. Đề của khóa học chỉ hiện sau khi bạn mua khóa đó." />
      ) : (
        <>
          <div className={cn('grid sm:grid-cols-2 xl:grid-cols-3 gap-4', isFetching && 'opacity-70')}>
            {data.data.map((exam) => (
              <ExamCard key={exam.examId} exam={exam} onSelect={(id) => navigate(CLIENT_ROUTES.exam(id))} />
            ))}
          </div>
          <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
};

export default ExamListView;
