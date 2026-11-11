/**
 * HomeworkGradingView — Màn hình chấm bài tập của MENTOR (Dev 2.5 + flow Mentor 1-1)
 * -----------------------------------------------------------
 * Flow nghiệp vụ:
 *   • Nhóm A — Bài tập TRẮC NGHIỆM: hệ thống tự chấm, mentor KHÔNG thao tác.
 *     Màn hình chỉ hiển thị bảng thống kê kết quả làm bài (điểm yếu chung).
 *   • Nhóm B — Bài tập THỦ CÔNG của học viên ĐÃ MUA GÓI MENTOR:
 *       - Hàng đợi chỉ hiện bài nộp của học viên có mua gói (có nhãn phân biệt)
 *       - Giao diện chấm split screen:
 *           Trái  : trình xem file PDF / trình phát Audio / văn bản học viên
 *           Phải  : bảng Rubrics + ô điểm & nhận xét 1-1
 *                  (kèm nút "Xem gợi ý chấm từ AI" để tham khảo)
 *       - Nút [Hoàn tất chấm bài] → ghi điểm chính thức + gửi thông báo học viên.
 *
 * URL: /mentor/homework-grading
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  History,
  RotateCcw,
  Sparkles,
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
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import type { HomeworkSource } from '@/shared/constants/queryKeys';
import type {
  HomeworkAiSuggestion,
  RubricScore,
} from '@/shared/types/homework.types';
import {
  useGradeHomework,
  useHomeworkAiSuggestion,
  useHomeworkForGrading,
  useHomeworkGradeHistory,
  useHomeworkGradingQueue,
} from './hooks/useHomeworkGrading';
import { SubmissionViewer } from './SubmissionViewer';
import { RubricGradePanel } from './RubricGradePanel';
import { HomeworkExamStatsPanel } from './HomeworkExamStatsPanel';

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
  audio: 'Ghi âm',
  multiple_choice: 'Trắc nghiệm',
};

/** Hình thức nộp → có cần mentor chấm tay không. */
const isManualType = (type?: string | null) =>
  (type ?? 'text').toLowerCase() !== 'multiple_choice';

export const HomeworkGradingView: React.FC = () => {
  const [page, setPage] = useState(0);
  const [pendingOnly, setPendingOnly] = useState(true);
  // Tách 2 nguồn bài tập: bài tập mặc định của khóa (admin tạo) và bài tập mentor tự giao.
  const [source, setSource] = useState<HomeworkSource>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const toast = useToast();

  const queue = useHomeworkGradingQueue(page, 20, pendingOnly, source);
  const detail = useHomeworkForGrading(selectedId);
  const history = useHomeworkGradeHistory(selectedId);
  const gradeMutation = useGradeHomework();
  const aiSuggestionMutation = useHomeworkAiSuggestion();

  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rubricValues, setRubricValues] = useState<Record<string, RubricScore>>(
    {},
  );
  const [aiSuggestion, setAiSuggestion] = useState<HomeworkAiSuggestion | null>(
    null,
  );

  // Nạp điểm/nhận xét hiện có khi chọn bài khác.
  useEffect(() => {
    if (!detail.data) return;
    setScore(detail.data.score != null ? String(detail.data.score) : '');
    setFeedback(detail.data.feedback ?? '');
    setAiSuggestion(detail.data.aiSuggestion ?? null);
    const initial: Record<string, RubricScore> = {};
    (detail.data.rubric ?? []).forEach((c) => {
      initial[c.criterion] = { criterion: c.criterion, score: null, comment: '' };
    });
    setRubricValues(initial);
  }, [detail.data]);

  /** Tổng điểm từ các tiêu chí rubric (nếu mentor đã điền). */
  const rubricTotal = useMemo(() => {
    let sum = 0;
    let hasAny = false;
    Object.values(rubricValues).forEach((v) => {
      if (v.score != null && !Number.isNaN(v.score)) {
        sum += v.score;
        hasAny = true;
      }
    });
    return { sum: Math.round(sum * 100) / 100, hasAny };
  }, [rubricValues]);

  /** Điểm sẽ gửi: ưu tiên tổng rubric khi có, không thì dùng ô điểm tổng. */
  const effectiveScore = rubricTotal.hasAny ? rubricTotal.sum : Number(score);

  const handleRubricChange = (
    criterion: string,
    patch: Partial<RubricScore>,
  ) => {
    setRubricValues((prev) => ({
      ...prev,
      [criterion]: { ...prev[criterion], criterion, ...patch },
    }));
  };

  const handleRequestAi = async () => {
    if (!selectedId) return;
    try {
      const result = await aiSuggestionMutation.mutateAsync(selectedId);
      setAiSuggestion(result);
      toast.success('Đã lấy gợi ý chấm từ AI');
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Không lấy được gợi ý từ AI',
      );
    }
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
    const value = effectiveScore;
    if (!Number.isFinite(value) || value < 0) {
      toast.error('Điểm không hợp lệ');
      return;
    }
    const rubricScores = Object.values(rubricValues).filter(
      (v) => v.score != null || (v.comment ?? '').trim() !== '',
    );
    await gradeMutation.mutateAsync({
      submissionId: selectedId,
      payload: {
        score: value,
        feedback: feedback.trim() || undefined,
        rubricScores: rubricScores.length ? rubricScores : undefined,
      },
    });
  };

  const selected = detail.data;
  const isManual = isManualType(selected?.submissionType);
  const maxScore = selected?.maxScore ?? null;
  const rubric = selected?.rubric ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Chấm bài tập
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bài <b>trắc nghiệm</b> hệ thống tự chấm — bạn chỉ xem bảng thống kê.{' '}
          Bài <b>thủ công</b> của học viên đã mua gói mentor kèm 1-1 mới cần bạn
          chấm tay.
        </p>
      </div>

      <div className="grid lg:grid-cols-[360px,1fr] gap-5 items-start">
        {/* ---------------- Hàng đợi (chỉ bài thủ công) ---------------- */}
        <Card noPadding>
          {/* Tách 2 nguồn bài tập: của khóa (admin tạo) và mentor tự giao */}
          <div className="px-4 pt-3 pb-2 border-b border-slate-200">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {(
                [
                  { key: 'all', label: 'Tất cả' },
                  { key: 'course', label: 'Bài tập khóa học' },
                  { key: 'mentor', label: 'Bài tập tôi giao' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSource(tab.key);
                    setPage(0);
                    setSelectedId(null);
                  }}
                  className={cn(
                    'flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition',
                    source === tab.key
                      ? 'bg-white text-[#0052CC] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-slate-800">
              Hàng đợi chấm tay ({queue.data?.totalElements ?? 0})
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
              title="Không có bài nào chờ bạn chấm"
              description="Bài trắc nghiệm do hệ thống tự chấm. Chỉ bài thủ công của học viên đã mua gói mentor mới hiện ở đây."
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
                      {s.courseTitle && (
                        <p className="text-[11px] text-slate-400 truncate">
                          Khóa: {s.courseTitle}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="neutral" size="sm">
                          {TYPE_LABEL[s.submissionType ?? 'text'] ??
                            s.submissionType}
                        </Badge>
                        {/* Nhãn nguồn bài tập: của khóa học hay mentor tự giao */}
                        {s.homeworkSource === 'mentor' ? (
                          <Badge variant="info" size="sm">
                            Mentor giao
                          </Badge>
                        ) : s.courseTitle ? (
                          <Badge variant="primary" size="sm">
                            Bài tập khóa
                          </Badge>
                        ) : null}
                        {/* Nhãn phân biệt: học viên đã mua gói mentor */}
                        {s.assignedGraderId ? (
                          <Badge variant="primary" size="sm">
                            Gói Mentor 1-1
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm">
                            AI chấm
                          </Badge>
                        )}
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
        {!selectedId ? (
          <Card className="space-y-4">
            <div className="py-16 text-center text-sm text-slate-500">
              <ClipboardCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              Chọn một bài trong hàng đợi để chấm.
            </div>
          </Card>
        ) : detail.isLoading ? (
          <Card className="space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48" />
          </Card>
        ) : detail.isError || !selected ? (
          <Card>
            <ErrorState
              message={detail.error?.message}
              onRetry={() => detail.refetch()}
            />
          </Card>
        ) : !isManual ? (
          /* ===== Nhóm A — trắc nghiệm: chỉ hiển thị bảng thống kê ===== */
          <div className="space-y-4">
            <Card className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-slate-900">
                  {selected.studentName ?? selected.studentEmail}
                </h2>
                <Badge variant="primary">{selected.homeworkTitle}</Badge>
                <Badge variant="neutral">Trắc nghiệm</Badge>
                <Badge variant="success" icon={CheckCircle2}>
                  Hệ thống đã tự chấm
                </Badge>
                <span className="ml-auto text-sm font-bold text-slate-700">
                  Điểm: {selected.score ?? 0}
                  {maxScore != null ? `/${maxScore}` : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Bài trắc nghiệm không cần mentor chấm tay. Xem bảng thống kê bên
                dưới để nắm điểm yếu chung của học viên.
              </p>
            </Card>
            <HomeworkExamStatsPanel
              homeworkContentId={selected.homeworkContentId}
            />
          </div>
        ) : (
          /* ===== Nhóm B — thủ công: split screen ===== */
          <div className="space-y-4">
            {/* Header */}
            <Card className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-slate-900">
                  {selected.studentName ?? selected.studentEmail}
                </h2>
                <Badge variant="primary">{selected.homeworkTitle}</Badge>
                {selected.homeworkSource === 'mentor' ? (
                  <Badge variant="info">Bài tập mentor giao</Badge>
                ) : selected.courseTitle ? (
                  <Badge variant="neutral">
                    Khóa: {selected.courseTitle}
                  </Badge>
                ) : null}
                <Badge variant="neutral">
                  {TYPE_LABEL[selected.submissionType ?? 'text'] ??
                    selected.submissionType}
                </Badge>
                {selected.assignedGraderId ? (
                  <Badge variant="primary" size="sm">
                    Gói Mentor 1-1
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    AI chấm — bạn chấm lại được
                  </Badge>
                )}
                {selected.graded ? (
                  <Badge variant={selected.passed ? 'success' : 'danger'}>
                    {selected.passed ? 'Đạt' : 'Chưa đạt'} · {selected.score ?? 0}
                    {maxScore != null ? `/${maxScore}` : ''}
                  </Badge>
                ) : (
                  <Badge variant="warning">Chờ chấm</Badge>
                )}
                <span className="ml-auto text-[11px] text-slate-400">
                  Nộp lúc {formatDateTime(selected.submittedDate)}
                </span>
              </div>
            </Card>

            {/* SPLIT SCREEN: trái = bài nộp, phải = rubric + điểm */}
            <div className="grid lg:grid-cols-2 gap-4 items-start">
              {/* TRÁI — trình xem bài nộp */}
              <Card className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Bài nộp của học viên
                </p>
                <SubmissionViewer
                  submissionType={selected.submissionType}
                  answerContent={selected.answerContent}
                  fileUrl={selected.fileUrl}
                  fileOriginalName={selected.fileOriginalName}
                  fileFormat={selected.fileFormat}
                  fileBytes={selected.fileBytes}
                />
              </Card>

              {/* PHẢI — rubric + điểm + nhận xét */}
              <Card className="space-y-4">
                <RubricGradePanel
                  rubric={rubric}
                  values={rubricValues}
                  onChange={handleRubricChange}
                  maxScore={maxScore}
                  aiSuggestion={aiSuggestion}
                  onRequestAiSuggestion={handleRequestAi}
                  aiLoading={aiSuggestionMutation.isPending}
                  readOnly={selected.graded}
                />

                {/* Ô điểm tổng */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 flex-wrap">
                    <label
                      htmlFor="hw-score"
                      className="text-xs font-bold text-slate-700"
                    >
                      Điểm tổng
                    </label>
                    <input
                      id="hw-score"
                      type="number"
                      min={0}
                      max={maxScore ?? undefined}
                      step="0.5"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="0"
                      className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/15"
                    />
                    {maxScore != null && (
                      <span className="text-[11px] text-slate-400">
                        / {maxScore}
                      </span>
                    )}
                    {rubricTotal.hasAny && (
                      <span className="text-[11px] text-slate-500">
                        Tổng rubric:{' '}
                        <b className="text-[#0052CC]">{rubricTotal.sum}</b>
                      </span>
                    )}
                  </div>
                  {selected.passingScore != null && (
                    <p className="text-[11px] text-slate-400">
                      Đạt khi đạt từ {selected.passingScore}% điểm tối đa.
                    </p>
                  )}
                </div>

                {/* Nhận xét tổng */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="hw-feedback"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Nhận xét tổng quát cho học viên
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

                {/* Nút hoàn tất chấm bài */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {aiSuggestion?.suggestedScore != null && (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={Sparkles}
                      onClick={() =>
                        setScore(String(aiSuggestion.suggestedScore ?? ''))
                      }
                    >
                      Dùng điểm gợi ý của AI ({aiSuggestion.suggestedScore})
                    </Button>
                  )}
                  <Button
                    onClick={handleSubmit}
                    isLoading={gradeMutation.isPending}
                    leftIcon={CheckCircle2}
                    disabled={
                      !Number.isFinite(effectiveScore) || effectiveScore < 0
                    }
                  >
                    {selected.graded
                      ? 'Cập nhật điểm'
                      : 'Hoàn tất chấm bài'}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Lịch sử chấm */}
            <Card className="space-y-2">
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
                        {h.gradedByName ??
                          (h.gradedByType === 'ai' ? 'AI' : 'Mentor')}
                      </span>
                      {h.gradedByType && (
                        <Badge variant="neutral" size="sm">
                          {h.gradedByType === 'ai' ? 'AI chấm' : 'Mentor chấm'}
                        </Badge>
                      )}
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
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeworkGradingView;
