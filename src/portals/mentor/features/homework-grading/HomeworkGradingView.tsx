/**
 * HomeworkGradingView — Hàng đợi bài tập chờ chấm + panel chấm (Dev 2.5)
 * -----------------------------------------------------------
 * Admin thấy mọi bài nộp; mentor chỉ thấy bài thuộc khóa học mình phụ trách
 * (backend lọc theo `course.mentor`).
 *
 * Hỗ trợ chấm:
 *   - Bài tự luận  : đọc `answerContent`
 *   - Bài nộp file : xem/nhận file qua URL có thời hạn
 *   - Bài trắc nghiệm: đã chấm tự động → mentor chỉ có thể sửa điểm
 *
 * Mỗi lần sửa điểm sẽ ghi vào lịch sử (người sửa, điểm cũ, điểm mới, thời gian).
 * URL: /mentor/homework-grading
 */

import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  Download,
  FileText,
  History,
  RotateCcw,
  Save,
  User,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import {
  EmptyState,
  ErrorState,
  Pagination,
  Skeleton,
} from '@/shared/components/Feedback';
import { cn } from '@/shared/utils/cn';
import {
  useGradeHomework,
  useHomeworkForGrading,
  useHomeworkGradeHistory,
  useHomeworkGradingQueue,
} from './hooks/useHomeworkGrading';

const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/** Nhãn hình thức nộp. */
const TYPE_LABEL: Record<string, string> = {
  text: 'Tự luận',
  file: 'Nộp file',
  multiple_choice: 'Trắc nghiệm',
};

export const HomeworkGradingView: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queue = useHomeworkGradingQueue(page, 20, pendingOnly);
  const detail = useHomeworkForGrading(selectedId);
  const history = useHomeworkGradeHistory(selectedId);
  const gradeMutation = useGradeHomework();

  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  // Nạp điểm/nhận xét hiện có khi chọn bài khác.
  useEffect(() => {
    if (!detail.data) return;
    setScore(detail.data.score != null ? String(detail.data.score) : '');
    setFeedback(detail.data.feedback ?? '');
  }, [detail.data]);

  const handleSave = async () => {
    if (!selectedId) return;
    const value = Number(score);
    if (!Number.isFinite(value) || value < 0) {
      return;
    }
    await gradeMutation.mutateAsync({
      submissionId: selectedId,
      payload: { score: value, feedback: feedback.trim() || undefined },
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Chấm bài tập
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bài trắc nghiệm đã được chấm tự động. Bài tự luận và bài nộp file
          đang chờ bạn chấm.
        </p>
      </div>

      <div className="grid lg:grid-cols-[360px,1fr] gap-5 items-start">
        {/* ---------------- Hàng đợi ---------------- */}
        <Card noPadding>
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-slate-800">
              Hàng đợi ({queue.data?.totalElements ?? 0})
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={pendingOnly ? 'primary' : 'ghost'}
                onClick={() => {
                  setPendingOnly(true);
                  setPage(0);
                }}
              >
                Chờ chấm
              </Button>
              <Button
                size="sm"
                variant={pendingOnly ? 'ghost' : 'primary'}
                onClick={() => {
                  setPendingOnly(false);
                  setPage(0);
                }}
              >
                Tất cả
              </Button>
              <Button
                size="sm"
                variant="ghost"
                leftIcon={RotateCcw}
                onClick={() => queue.refetch()}
              >
                Làm mới
              </Button>
            </div>
          </div>

          {queue.isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : queue.isError ? (
            <ErrorState
              className="m-4"
              message={queue.error.message}
              onRetry={() => queue.refetch()}
            />
          ) : (queue.data?.data.length ?? 0) === 0 ? (
            <EmptyState
              className="m-4"
              title={
                pendingOnly ? 'Không còn bài nào chờ chấm' : 'Chưa có bài nộp nào'
              }
            />
          ) : (
            <>
              <ul>
                {queue.data?.data.map((s) => (
                  <li key={s.submissionId}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(s.submissionId)}
                      className={cn(
                        'w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50',
                        selectedId === s.submissionId && 'bg-primary-tint',
                      )}
                    >
                      <p className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {s.studentName ?? s.studentEmail ?? 'Học viên'}
                      </p>
                      <p className="text-xs text-slate-600 truncate">
                        {s.homeworkTitle ?? 'Bài tập'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="neutral" size="sm">
                          {TYPE_LABEL[s.submissionType ?? 'text'] ??
                            s.submissionType}
                        </Badge>
                        {s.graded ? (
                          <Badge
                            variant={s.passed ? 'success' : 'danger'}
                            size="sm"
                          >
                            {s.score ?? 0} điểm
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Chờ chấm
                          </Badge>
                        )}
                        <span className="text-[11px] text-slate-400 ml-auto">
                          {formatDateTime(s.submittedDate)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
              {queue.data && (
                <Pagination
                  className="py-3"
                  currentPage={queue.data.currentPage}
                  totalPages={queue.data.totalPages}
                  onChange={setPage}
                />
              )}
            </>
          )}
        </Card>

        {/* ---------------- Panel chấm ---------------- */}
        <Card className="space-y-4">
          {!selectedId ? (
            <div className="py-16 text-center text-sm text-slate-500">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              Chọn một bài trong hàng đợi để chấm.
            </div>
          ) : detail.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-48" />
            </div>
          ) : detail.isError || !detail.data ? (
            <ErrorState
              message={detail.error?.message}
              onRetry={() => detail.refetch()}
            />
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-slate-900">
                  {detail.data.studentName ?? detail.data.studentEmail}
                </h2>
                <Badge variant="primary">
                  {detail.data.homeworkTitle ?? 'Bài tập'}
                </Badge>
                <Badge variant="neutral">
                  {TYPE_LABEL[detail.data.submissionType ?? 'text'] ??
                    detail.data.submissionType}
                </Badge>
                {detail.data.graded ? (
                  <Badge variant={detail.data.passed ? 'success' : 'danger'}>
                    {detail.data.passed ? 'Đạt' : 'Chưa đạt'} ·{' '}
                    {detail.data.score ?? 0} điểm
                  </Badge>
                ) : (
                  <Badge variant="warning">Chờ chấm</Badge>
                )}
                <span className="ml-auto text-[11px] text-slate-400">
                  Nộp lúc {formatDateTime(detail.data.submittedDate)}
                </span>
              </div>

              {/* Nội dung bài nộp */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nội dung bài nộp
                </p>

                {detail.data.submissionType === 'file' ? (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {detail.data.fileOriginalName ?? 'File đính kèm'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Định dạng: {detail.data.fileFormat ?? '—'} · Dung lượng:{' '}
                      {detail.data.fileBytes
                        ? `${Math.round(detail.data.fileBytes / 1024)} KB`
                        : '—'}
                    </p>
                    {detail.data.fileUrl ? (
                      <a
                        href={detail.data.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Mở file (URL có thời hạn)
                      </a>
                    ) : (
                      <p className="text-[11px] text-amber-600">
                        Chưa có URL xem file — backend cần cấu hình Cloudinary.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {detail.data.answerContent?.trim() ||
                        '(Học viên không nhập nội dung)'}
                    </p>
                  </div>
                )}
              </div>

              {/* Form chấm */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <label
                    htmlFor="hw-score"
                    className="text-xs font-bold text-slate-700"
                  >
                    Điểm
                  </label>
                  <input
                    id="hw-score"
                    type="number"
                    min={0}
                    step="0.5"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="0"
                    className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/15"
                  />
                  <span className="text-[11px] text-slate-400">
                    Điểm vượt quá điểm tối đa sẽ bị backend từ chối.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="hw-feedback"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Nhận xét cho học viên
                  </label>
                  <textarea
                    id="hw-feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    placeholder="Nhận xét của bạn về bài làm…"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/15 resize-y"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <Button
                    onClick={handleSave}
                    isLoading={gradeMutation.isPending}
                    leftIcon={Save}
                    disabled={
                      !Number.isFinite(Number(score)) || Number(score) < 0
                    }
                  >
                    {detail.data.graded ? 'Cập nhật điểm' : 'Chấm điểm'}
                  </Button>
                </div>
              </div>

              {/* Lịch sử chấm */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  Lịch sử chấm ({history.data?.length ?? 0})
                </p>
                {history.isLoading ? (
                  <Skeleton className="h-12" />
                ) : (history.data?.length ?? 0) === 0 ? (
                  <p className="text-xs text-slate-400">Chưa có lịch sử chấm.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {history.data?.map((h) => (
                      <li
                        key={h.historyId}
                        className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap"
                      >
                        <span className="font-bold text-slate-700">
                          {h.gradedByName ?? 'Mentor'}
                        </span>
                        <span>
                          {h.oldScore != null ? `${h.oldScore} → ` : ''}
                          <span className="font-bold text-[#0052CC]">
                            {h.newScore ?? '—'}
                          </span>
                        </span>
                        {h.passed != null && (
                          <Badge
                            variant={h.passed ? 'success' : 'danger'}
                            size="sm"
                          >
                            {h.passed ? 'Đạt' : 'Chưa đạt'}
                          </Badge>
                        )}
                        <span className="ml-auto text-slate-400">
                          {formatDateTime(h.gradedAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default HomeworkGradingView;
