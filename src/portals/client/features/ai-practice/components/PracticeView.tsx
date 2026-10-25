/**
 * PracticeView — Phòng luyện đề Writing/Speaking có AI chấm (Dev 5 — TASK-D5-04)
 * -----------------------------------------------------------
 * Tab "Kho đề":
 *   1. Chọn đề trong danh sách (lọc Writing/Speaking, tìm theo tên)
 *   2. Viết bài (Speaking: nhập văn bản phiên âm bài nói)
 *   3. Bấm "Nộp bài & AI chấm" → gọi submit rồi ai-evaluate (mất 10 - 60 giây)
 *   4. Hiện kết quả 4 tiêu chí bên phải
 *   Nếu AI chấm lỗi (502/5016) thì bài đã nộp vẫn được giữ → bấm "Chấm lại" không phải nộp lại.
 * Tab "Lịch sử": các bài đã làm, xem lại kết quả hoặc chấm bài chưa chấm.
 *
 * URL hỗ trợ ?examId=... để mở sẵn 1 đề (dùng từ trang Lộ trình học).
 */

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  History,
  Loader2,
  Mic,
  PenLine,
  Search,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { cn, countWords } from '@/shared/utils';
import { useRole } from '@/portals/client/features/auth';
import { getErrorMessage } from '@/shared/api/axiosClient';
import type {
  PracticeAnswer,
  PracticeEvaluation,
  PracticeExam,
  PracticeExamType,
} from '@/shared/types';
import {
  useEvaluatePracticeAnswer,
  useMyPracticeAnswers,
  usePracticeEvaluation,
  usePracticeExams,
  useSubmitPracticeAnswer,
} from '../hooks/usePractice';
import { EvaluationResult } from './EvaluationResult';

/** BE yêu cầu bài làm 50 - 20000 ký tự */
const MIN_CHARS = 50;
const MAX_CHARS = 20000;

type Tab = 'bank' | 'history';
type TypeFilter = 'ALL' | PracticeExamType;
/** idle: chưa làm gì, submitting: đang nộp, evaluating: AI đang chấm */
type Phase = 'idle' | 'submitting' | 'evaluating';

export const PracticeView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const role = useRole();
  const isStudent = role === 'STUDENT';

  const [tab, setTab] = useState<Tab>('bank');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');

  const [selectedExamId, setSelectedExamId] = useState<string | null>(searchParams.get('examId'));
  const [content, setContent] = useState('');
  /** Bài đã nộp nhưng AI chấm lỗi → giữ lại để chấm lại */
  const [pendingAnswerId, setPendingAnswerId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  /** Kết quả vừa chấm xong */
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);
  /** Kết quả đang xem lại từ tab Lịch sử */
  const [viewEvaluationId, setViewEvaluationId] = useState<string | null>(null);

  /* ---------------- Data (hooks) ---------------- */
  const examsQuery = usePracticeExams(typeFilter === 'ALL' ? undefined : typeFilter, keyword);
  const exams: PracticeExam[] = examsQuery.data ?? [];
  const selectedExam = exams.find((e) => e.practiceExamId === selectedExamId) ?? null;

  const historyQuery = useMyPracticeAnswers(isStudent && tab === 'history');
  const viewedEvaluationQuery = usePracticeEvaluation(viewEvaluationId);
  const submitMutation = useSubmitPracticeAnswer();
  const evaluateMutation = useEvaluatePracticeAnswer();

  const shownEvaluation = evaluation ?? viewedEvaluationQuery.data ?? null;

  /* ---------------- Actions ---------------- */
  const resetWorkspace = () => {
    setContent('');
    setPendingAnswerId(null);
    setEvaluation(null);
    setViewEvaluationId(null);
    setError(null);
  };

  const handleSelectExam = (examId: string) => {
    if (phase !== 'idle') return;
    setSelectedExamId(examId);
    resetWorkspace();
  };

  /** Chấm 1 bài đã nộp */
  const runEvaluate = async (answerId: string) => {
    setPhase('evaluating');
    setError(null);
    setViewEvaluationId(null);
    try {
      const result = await evaluateMutation.mutateAsync(answerId);
      setEvaluation(result);
      setPendingAnswerId(null);
    } catch (err) {
      setPendingAnswerId(answerId);
      setError(getErrorMessage(err));
    } finally {
      setPhase('idle');
    }
  };

  /** Nộp bài (nếu chưa nộp) rồi gọi AI chấm */
  const handleSubmitAndEvaluate = async () => {
    if (!selectedExam) return;
    if (pendingAnswerId) {
      await runEvaluate(pendingAnswerId);
      return;
    }
    setPhase('submitting');
    setError(null);
    setEvaluation(null);
    setViewEvaluationId(null);
    try {
      const answer = await submitMutation.mutateAsync({
        examId: selectedExam.practiceExamId,
        content: content.trim(),
      });
      await runEvaluate(answer.answerId);
    } catch (err) {
      setError(getErrorMessage(err));
      setPhase('idle');
    }
  };

  /** Tab lịch sử: xem kết quả bài đã chấm */
  const handleViewEvaluation = (answer: PracticeAnswer) => {
    if (!answer.evaluationId) return;
    setError(null);
    setEvaluation(null);
    setViewEvaluationId(answer.evaluationId);
  };

  /* ---------------- Render ---------------- */
  const charCount = content.trim().length;
  const wordCount = content.trim() ? countWords(content) : 0;
  const canSubmit =
    isStudent && !!selectedExam && phase === 'idle' && charCount >= MIN_CHARS && charCount <= MAX_CHARS;

  return (
    <div className="space-y-6">
      {/* ============== HEADER ============== */}
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <Sparkles className="w-3.5 h-3.5" />
          Luyện đề với AI
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Phòng luyện Writing & Speaking
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Chọn đề, viết bài (hoặc dán phiên âm bài nói) và nhận điểm theo 4 tiêu chí IELTS kèm nhận xét
          bằng tiếng Việt.
        </p>
      </header>

      {/* ============== TABS ============== */}
      <div className="inline-flex p-1 rounded-full bg-slate-100">
        <TabButton active={tab === 'bank'} onClick={() => setTab('bank')} icon={FileText}>
          Kho đề
        </TabButton>
        {isStudent && (
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={History}>
            Lịch sử làm bài
          </TabButton>
        )}
      </div>

      {!isStudent && (
        <Card className="bg-amber-50 border-amber-200 text-sm text-amber-800">
          Chỉ tài khoản Học viên (STUDENT) đăng nhập bằng Backend mới nộp bài và được AI chấm. Bạn vẫn xem được
          kho đề.
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
        {/* ============== CỘT TRÁI ============== */}
        <div className="space-y-5 min-w-0">
          {tab === 'bank' ? (
            <>
              {/* Bộ lọc */}
              <Card className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'WRITING', 'SPEAKING'] as TypeFilter[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                        typeFilter === t
                          ? 'bg-[#0052CC] border-[#0052CC] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {t === 'ALL' ? 'Tất cả' : t === 'WRITING' ? 'Writing' : 'Speaking'}
                    </button>
                  ))}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setKeyword(keywordInput.trim());
                  }}
                >
                  <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-input border border-slate-200 focus-within:border-primary">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Tìm theo tên đề…"
                      className="flex-1 text-sm outline-none bg-transparent"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="md">
                    Tìm
                  </Button>
                </form>
              </Card>

              {/* Danh sách đề */}
              <ExamList
                exams={exams}
                isLoading={examsQuery.isLoading}
                errorMessage={examsQuery.isError ? getErrorMessage(examsQuery.error) : null}
                selectedExamId={selectedExamId}
                onSelect={handleSelectExam}
              />

              {/* Khu làm bài */}
              {selectedExam && (
                <Card noPadding>
                  <div className="p-5 border-b border-slate-100 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <ExamTypeBadge type={selectedExam.examType} />
                      {selectedExam.bankName && (
                        <Badge variant="neutral" size="sm">
                          {selectedExam.bankName}
                        </Badge>
                      )}
                    </div>
                    <h2 className="font-extrabold text-slate-900">{selectedExam.title}</h2>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {selectedExam.description}
                    </p>
                  </div>

                  <div className="p-5">
                    <textarea
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        // Sửa bài sau khi nộp lỗi → coi như bài mới
                        setPendingAnswerId(null);
                      }}
                      disabled={!isStudent || phase !== 'idle'}
                      rows={12}
                      maxLength={MAX_CHARS}
                      placeholder={
                        selectedExam.examType === 'SPEAKING'
                          ? 'Dán văn bản phiên âm bài nói của bạn tại đây…'
                          : 'Viết bài của bạn tại đây…'
                      }
                      className="w-full rounded-input border border-slate-200 p-3.5 text-sm text-slate-800 leading-relaxed resize-y focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:bg-slate-50"
                    />

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        <span className="font-bold text-slate-800 tabular-nums">{wordCount}</span> từ ·{' '}
                        <span className="tabular-nums">{charCount}</span> ký tự
                        {charCount < MIN_CHARS && (
                          <span className="ml-2 text-amber-600">(tối thiểu {MIN_CHARS} ký tự)</span>
                        )}
                      </p>
                      <Button
                        variant="ai"
                        size="md"
                        leftIcon={Wand2}
                        isLoading={phase !== 'idle'}
                        disabled={!canSubmit}
                        onClick={handleSubmitAndEvaluate}
                      >
                        {phase === 'submitting'
                          ? 'Đang nộp bài…'
                          : phase === 'evaluating'
                            ? 'AI đang chấm…'
                            : pendingAnswerId
                              ? 'Chấm lại'
                              : 'Nộp bài & AI chấm'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <HistoryList
              answers={historyQuery.data ?? []}
              isLoading={historyQuery.isLoading}
              errorMessage={historyQuery.isError ? getErrorMessage(historyQuery.error) : null}
              busy={phase !== 'idle'}
              onView={handleViewEvaluation}
              onEvaluate={(a) => runEvaluate(a.answerId)}
            />
          )}
        </div>

        {/* ============== CỘT PHẢI: KẾT QUẢ ============== */}
        <div className="lg:sticky lg:top-[112px] space-y-4">
          {viewedEvaluationQuery.isError && (
            <Card className="bg-red-50 border-red-200 text-sm text-red-700">
              {getErrorMessage(viewedEvaluationQuery.error)}
            </Card>
          )}

          {error && (
            <Card className="bg-red-50 border-red-200">
              <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Không thành công
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              {pendingAnswerId && tab === 'bank' && (
                <p className="mt-2 text-xs text-red-600">
                  Bài của bạn đã được lưu. Bấm "Chấm lại" để thử chấm lần nữa.
                </p>
              )}
            </Card>
          )}

          {phase === 'evaluating' || viewedEvaluationQuery.isFetching ? (
            <Card className="text-center py-10">
              <Loader2 className="w-8 h-8 mx-auto text-violet-600 animate-spin" />
              {phase === 'evaluating' ? (
                <>
                  <p className="mt-3 font-bold text-slate-900">AI đang chấm bài…</p>
                  <p className="mt-1 text-sm text-slate-500">Thường mất 10 - 60 giây, đừng tải lại trang.</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Đang tải kết quả…</p>
              )}
            </Card>
          ) : shownEvaluation ? (
            <EvaluationResult evaluation={shownEvaluation} />
          ) : (
            <Card className="text-center py-10 border-dashed">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                {tab === 'bank'
                  ? 'Chọn đề và nộp bài để xem kết quả AI chấm tại đây.'
                  : 'Chọn "Xem kết quả" ở một bài đã chấm.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 *  Sub components
 * ============================================================ */

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ active, onClick, icon: Icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors',
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
    )}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

const ExamTypeBadge: React.FC<{ type: PracticeExamType }> = ({ type }) =>
  type === 'SPEAKING' ? (
    <Badge variant="ai" size="sm" icon={Mic}>
      Speaking
    </Badge>
  ) : (
    <Badge variant="primary" size="sm" icon={PenLine}>
      Writing
    </Badge>
  );

const ExamList: React.FC<{
  exams: PracticeExam[];
  isLoading: boolean;
  errorMessage: string | null;
  selectedExamId: string | null;
  onSelect: (examId: string) => void;
}> = ({ exams, isLoading, errorMessage, selectedExamId, onSelect }) => {
  if (isLoading) {
    return (
      <Card className="flex justify-center py-8 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </Card>
    );
  }
  if (errorMessage) {
    return <Card className="text-sm text-red-600">{errorMessage}</Card>;
  }
  if (exams.length === 0) {
    return (
      <Card className="text-sm text-slate-500 text-center py-8">
        Chưa có đề luyện tập nào. Mentor hoặc Admin cần tạo đề trước.
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {exams.map((exam) => (
        <button
          key={exam.practiceExamId}
          type="button"
          onClick={() => onSelect(exam.practiceExamId)}
          className={cn(
            'text-left p-4 rounded-card border bg-white transition-all',
            exam.practiceExamId === selectedExamId
              ? 'border-[#0052CC] ring-2 ring-[#0052CC]/15'
              : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <div className="flex flex-wrap gap-1.5">
            <ExamTypeBadge type={exam.examType} />
            {exam.bankName && (
              <Badge variant="neutral" size="sm">
                {exam.bankName}
              </Badge>
            )}
          </div>
          <p className="mt-2 font-bold text-slate-900 line-clamp-1">{exam.title}</p>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{exam.description}</p>
        </button>
      ))}
    </div>
  );
};

const HistoryList: React.FC<{
  answers: PracticeAnswer[];
  isLoading: boolean;
  errorMessage: string | null;
  busy: boolean;
  onView: (a: PracticeAnswer) => void;
  onEvaluate: (a: PracticeAnswer) => void;
}> = ({ answers, isLoading, errorMessage, busy, onView, onEvaluate }) => {
  if (isLoading) {
    return (
      <Card className="flex justify-center py-8 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </Card>
    );
  }
  if (errorMessage) {
    return <Card className="text-sm text-red-600">{errorMessage}</Card>;
  }
  if (answers.length === 0) {
    return <Card className="text-sm text-slate-500 text-center py-8">Bạn chưa làm bài nào.</Card>;
  }
  return (
    <Card noPadding>
      <ul className="divide-y divide-slate-100">
        {answers.map((a) => (
          <li key={a.answerId} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <ExamTypeBadge type={a.examType} />
                {a.status === 'EVALUATED' ? (
                  <Badge variant="success" size="sm">
                    Đã chấm
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    Chưa chấm
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 font-bold text-slate-900 truncate">{a.examTitle}</p>
              <p className="text-xs text-slate-500">
                {new Date(a.submittedAt).toLocaleString('vi-VN')} · {a.wordCount} từ
              </p>
            </div>
            {a.status === 'EVALUATED' && a.bandScore != null && (
              <span className="text-2xl font-extrabold text-[#0052CC] tabular-nums">
                {Number(a.bandScore).toFixed(1)}
              </span>
            )}
            {a.status === 'EVALUATED' ? (
              <Button variant="outline" size="sm" onClick={() => onView(a)}>
                Xem kết quả
              </Button>
            ) : (
              <Button variant="ai" size="sm" leftIcon={Wand2} disabled={busy} onClick={() => onEvaluate(a)}>
                AI chấm
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default PracticeView;
