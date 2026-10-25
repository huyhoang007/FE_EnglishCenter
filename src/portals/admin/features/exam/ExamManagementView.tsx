/**
 * ExamManagementView — Danh sách đề thi (mọi trạng thái) cho Admin (Dev 3)
 * -----------------------------------------------------------
 * Lọc theo trạng thái / từ khóa, tạo đề mới, click dòng để mở trình soạn đề.
 * URL: /admin/exams
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileCheck2, Plus, Search } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { EXAM_STATUS_LABEL, EXAM_TYPE_LABEL, type ExamStatus } from '@/shared/types';
import { formatDate } from '@/shared/utils';
import { cn } from '@/shared/utils/cn';
import { useAdminExams } from './hooks/useAdminExams';
import { CreateExamModal } from './components/CreateExamModal';

const STATUS_VARIANT = { draft: 'neutral', published: 'success', archived: 'warning' } as const;

export const ExamManagementView: React.FC = () => {
  const navigate = useNavigate();
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-primary" /> Quản lý Đề thi
          </h1>
          <p className="text-sm text-slate-500">Tạo đề, thêm section & câu hỏi, công khai cho học viên.</p>
        </div>
        <Button leftIcon={Plus} onClick={() => setCreateOpen(true)}>
          Tạo đề thi
        </Button>
      </div>

      <Card className="flex flex-col sm:flex-row gap-3 !p-4">
        <label className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setPage(0);
            }}
            placeholder="Tìm theo tên hoặc mã đề…"
            className="w-full h-10 pl-9 pr-3 rounded-input border border-slate-200 text-sm"
          />
        </label>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ExamStatus | '');
            setPage(0);
          }}
          className="h-10 px-3 rounded-input border border-slate-200 text-sm bg-white"
          aria-label="Trạng thái"
        >
          <option value="">Mọi trạng thái</option>
          {(Object.keys(EXAM_STATUS_LABEL) as ExamStatus[]).map((s) => (
            <option key={s} value={s}>
              {EXAM_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </Card>

      {isLoading ? (
        <Skeleton className="h-72 rounded-card" />
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="Chưa có đề thi nào" description="Bấm “Tạo đề thi” để soạn đề đầu tiên." />
      ) : (
        <>
          <Card noPadding className={cn('overflow-x-auto', isFetching && 'opacity-70')}>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Đề thi</th>
                  <th className="px-4 py-3">Loại</th>
                  <th className="px-4 py-3">Câu / Phần</th>
                  <th className="px-4 py-3">Lượt thi</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((exam) => (
                  <tr
                    key={exam.examId}
                    className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => navigate(ADMIN_ROUTES.examEditor(exam.examId))}
                  >
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{exam.examTitle}</p>
                      <p className="text-xs text-slate-400 font-mono">
                        {exam.examCode ?? '—'} · {exam.examScope === 'trial' ? exam.certificateName : exam.courseTitle}
                      </p>
                    </td>
                    <td className="px-4 py-3">{exam.examType ? EXAM_TYPE_LABEL[exam.examType] : '—'}</td>
                    <td className="px-4 py-3">
                      {exam.totalQuestions} / {exam.totalParts}
                    </td>
                    <td className="px-4 py-3">{exam.totalAttempts ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge size="sm" variant={STATUS_VARIANT[exam.status]}>
                        {EXAM_STATUS_LABEL[exam.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{exam.lastUpdated ? formatDate(exam.lastUpdated) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Pagination currentPage={data.currentPage} totalPages={data.totalPages} onChange={setPage} />
        </>
      )}

      {isCreateOpen && <CreateExamModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
};

export default ExamManagementView;
