/**
 * ExamRoomView — Gold Flow #4 (Phòng thi trực tuyến)
 * -----------------------------------------------------------
 * Sticky Topbar với tên đề, đồng hồ đếm ngược LED, tiến độ, nút Nộp bài.
 * Split-screen 50/50: bên trái passage có scroll riêng, bên phải câu hỏi.
 * Question Palette: lưới ô số 1-10, đã làm primary, chưa làm slate-100.
 * Submit mở Modal kết quả với Band Score, số câu đúng, feedback.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Circle,
  X,
  Send,
  Award,
  TrendingUp,
  Target,
  RotateCcw,
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Check,
  XCircle,
  FileText,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { cn } from '@/shared/utils';
import type {
  AnswerValue,
  Exam,
  ExamResult,
  Question,
} from './examTypes';

export interface ExamRoomViewProps {
  exam: Exam;
}

export const ExamRoomView: React.FC<ExamRoomViewProps> = ({ exam }) => {
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [secondsLeft, setSecondsLeft] = useState(exam.durationSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    exam.questions[0]?.id ?? '',
  );

  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const answersRef = useRef(answers);
  answersRef.current = answers;

  /* ====== Timer ====== */
  useEffect(() => {
    if (showResult) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [showResult]);

  /* Auto-submit khi hết giờ */
  useEffect(() => {
    if (secondsLeft === 0 && !showResult) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null && v !== '').length,
    [answers],
  );

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isUrgent = secondsLeft < 5 * 60;
  const isCritical = secondsLeft < 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  /* ====== Answer handlers ====== */
  const setAnswer = (qid: string, val: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [qid]: val }));
  };

  /* ====== Submit ====== */
  const handleSubmit = async () => {
    setSubmitting(true);
    setConfirmSubmit(false);
    // giả lập server side scoring
    await new Promise((r) => setTimeout(r, 700));
    const r = scoreExam(exam, answersRef.current);
    setResult(r);
    setSubmitting(false);
    setShowResult(true);
  };

  const scrollToQuestion = (qid: string) => {
    setActiveQuestionId(qid);
    const el = questionRefs.current[qid];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4">
      {/* ====================== STICKY TOPBAR ====================== */}
      <div
        className="sticky top-[96px] z-30 bg-white border border-slate-200 rounded-card shadow-elevation p-4 flex items-center gap-4"
        role="region"
        aria-label="Thanh điều khiển phòng thi"
      >
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-input bg-ai-gradient flex items-center justify-center shadow-ai-glow">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-ai">
              {exam.certificate} · {exam.skill}
            </p>
            <p className="font-bold text-sm text-slate-900 truncate max-w-[260px]">
              {exam.title}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

        {/* Progress */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Badge variant="primary" size="md" icon={Target}>
            Đã làm {answeredCount}/{exam.totalQuestions}
          </Badge>
        </div>

        <div className="flex-1" />

        {/* Digital Timer */}
        <div
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-input border shrink-0',
            isCritical
              ? 'bg-status-danger-bg border-red-300 animate-pulse'
              : isUrgent
                ? 'bg-status-warning-bg border-amber-300'
                : 'bg-slate-900 border-slate-900',
          )}
        >
          <Clock
            className={cn(
              'w-4 h-4',
              isCritical
                ? 'text-status-danger'
                : isUrgent
                  ? 'text-status-warning'
                  : 'text-emerald-400',
            )}
          />
          <div className="leading-none">
            <p
              className={cn(
                'text-[9px] font-extrabold uppercase tracking-widest',
                isCritical
                  ? 'text-status-danger'
                  : isUrgent
                    ? 'text-status-warning'
                    : 'text-slate-400',
              )}
            >
              {isCritical
                ? 'Sắp hết giờ!'
                : isUrgent
                  ? 'Cảnh báo'
                  : 'Thời gian còn'}
            </p>
            <p
              className={cn(
                'font-mono font-extrabold text-lg tabular-nums',
                isCritical
                  ? 'text-status-danger'
                  : isUrgent
                    ? 'text-status-warning'
                    : 'text-emerald-400',
                // LED effect
                !isUrgent &&
                  'tracking-[0.2em] [text-shadow:0_0_8px_rgba(52,211,153,0.5)]',
              )}
            >
              {timeStr}
            </p>
          </div>
        </div>

        {/* Submit */}
        <Button
          variant="primary"
          size="md"
          leftIcon={Send}
          onClick={() => setConfirmSubmit(true)}
          disabled={submitting || showResult}
        >
          Nộp bài thi
        </Button>
      </div>

      {/* ====================== SPLIT-SCREEN 50/50 ====================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ----- LEFT: PASSAGE ----- */}
        <Card
          noPadding
          className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col"
        >
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2 shrink-0">
            <Badge variant="ielts" size="sm">
              {exam.certificate}
            </Badge>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              Reading Passage
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
            {exam.passages.map((p) => (
              <article key={p.id} className="space-y-4">
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {p.title}
                </h2>
                {p.paragraphs.map((para, idx) => (
                  <div key={idx} className="space-y-1.5">
                    {para.heading && (
                      <h3 className="font-bold text-sm text-slate-800">
                        {para.heading}
                      </h3>
                    )}
                    <p className="text-[14px] leading-[1.75] text-slate-700">
                      {para.text}
                    </p>
                  </div>
                ))}
              </article>
            ))}
          </div>
        </Card>

        {/* ----- RIGHT: QUESTIONS ----- */}
        <Card
          noPadding
          className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col"
        >
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2 shrink-0">
            <Badge variant="primary" size="sm" icon={Sparkles}>
              Questions
            </Badge>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
              {exam.totalQuestions} câu · Trả lời bên dưới
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 scrollbar-thin">
            {exam.questions.map((q) => (
              <QuestionItem
                key={q.id}
                question={q}
                value={answers[q.id] ?? null}
                onChange={(v) => setAnswer(q.id, v)}
                ref={(el) => {
                  questionRefs.current[q.id] = el;
                }}
                active={activeQuestionId === q.id}
              />
            ))}
            <div className="pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={Send}
                onClick={() => setConfirmSubmit(true)}
              >
                Hoàn tất & Nộp bài
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* ====================== QUESTION PALETTE ====================== */}
      <Card noPadding>
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2">
          <Badge variant="ai" size="sm">
            Question Palette
          </Badge>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Click để nhảy tới câu tương ứng
          </span>
        </div>
        <div className="p-5 grid grid-cols-5 sm:grid-cols-10 gap-2.5">
          {exam.questions.map((q) => {
            const ans = answers[q.id];
            const answered = ans !== null && ans !== undefined && ans !== '';
            const active = activeQuestionId === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => scrollToQuestion(q.id)}
                className={cn(
                  'aspect-square rounded-full flex items-center justify-center font-extrabold text-sm transition-all',
                  'hover:scale-110 hover:shadow-md',
                  answered
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  active && 'ring-2 ring-ai ring-offset-2',
                )}
                aria-label={`Câu ${q.order}${answered ? ' (đã làm)' : ''}`}
              >
                {q.order}
              </button>
            );
          })}
        </div>
        <div className="px-5 pb-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary" />
            Đã làm ({answeredCount})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" />
            Chưa làm ({exam.totalQuestions - answeredCount})
          </span>
        </div>
      </Card>

      {/* ====================== CONFIRM SUBMIT MODAL ====================== */}
      {confirmSubmit && (
        <ModalShell onClose={() => setConfirmSubmit(false)}>
          <div className="p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-status-warning-bg flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7 text-status-warning" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Xác nhận nộp bài?
            </h3>
            <p className="text-sm text-slate-600">
              Bạn đã làm{' '}
              <span className="font-bold text-slate-900">
                {answeredCount}/{exam.totalQuestions}
              </span>{' '}
              câu. Bạn có thể tiếp tục hoặc nộp ngay.
            </p>
            <div className="flex items-center gap-2 justify-center pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setConfirmSubmit(false)}
                disabled={submitting}
              >
                Tiếp tục làm
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSubmit}
                isLoading={submitting}
                leftIcon={Send}
              >
                Nộp bài
              </Button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* ====================== RESULT MODAL ====================== */}
      {showResult && result && (
        <ModalShell onClose={() => setShowResult(false)} large>
          <div className="p-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-status-success-bg text-status-success text-[10px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3 h-3" />
              Hoàn thành bài thi
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900">
              Kết quả làm bài
            </h3>

            {/* Big Band Score */}
            <div className="mx-auto w-fit rounded-card border-2 border-primary/30 bg-gradient-to-br from-primary-tint to-white p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                Band Score
              </p>
              <p className="text-6xl font-extrabold text-slate-900 leading-none mt-2 tabular-nums">
                {result.bandScore.toFixed(1)}
                <span className="text-2xl text-slate-400 font-bold">
                  /{result.maxBand}
                </span>
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <StatBox
                icon={Check}
                tone="success"
                label="Đúng"
                value={`${result.correctCount}/${result.totalQuestions}`}
              />
              <StatBox
                icon={XCircle}
                tone="danger"
                label="Sai"
                value={`${result.incorrectCount}`}
              />
              <StatBox
                icon={Target}
                tone="primary"
                label="Tỉ lệ"
                value={`${Math.round(
                  (result.correctCount / result.totalQuestions) * 100,
                )}%`}
              />
            </div>

            <Card className="bg-gradient-to-br from-ai/5 to-primary-tint text-left">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-ai flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Nhận xét từ hệ thống
              </p>
              <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                {result.feedback}
              </p>
            </Card>

            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button
                variant="outline"
                size="md"
                leftIcon={RotateCcw}
                onClick={() => {
                  setAnswers({});
                  setSecondsLeft(exam.durationSeconds);
                  setShowResult(false);
                  setResult(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Làm lại đề khác
              </Button>
              <Button
                variant="ai"
                size="md"
                rightIcon={ArrowRight}
                onClick={() => navigate('/courses/ielts-intensive-mastery')}
              >
                Về trang khóa học
              </Button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

/* ====================== Sub-components ====================== */

const QuestionItem = React.forwardRef<
  HTMLDivElement,
  {
    question: Question;
    value: AnswerValue;
    onChange: (v: AnswerValue) => void;
    active: boolean;
  }
>(({ question, value, onChange, active }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-input border p-4 transition-all',
        active ? 'border-primary bg-primary-tint/30' : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-start gap-2.5 mb-3">
        <span
          className={cn(
            'w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0',
            active ? 'bg-primary text-white' : 'bg-slate-900 text-white',
          )}
        >
          {question.order}
        </span>
        <p className="text-sm font-semibold text-slate-800 leading-relaxed">
          {question.prompt}
        </p>
      </div>

      {question.type === 'MULTIPLE_CHOICE' && question.options && (
        <div className="space-y-2 ml-9">
          {question.options.map((opt) => {
            const selected = value === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onChange(opt.key)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md border text-left text-sm transition-all',
                  selected
                    ? 'border-primary bg-primary-tint ring-2 ring-primary/20 font-semibold text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700',
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0',
                    selected
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {opt.key}
                </span>
                <span>{opt.text}</span>
                {selected && (
                  <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'TRUE_FALSE_NOTGIVEN' && question.options && (
        <div className="grid grid-cols-3 gap-2 ml-9">
          {question.options.map((opt) => {
            const selected = value === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onChange(opt.key)}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2.5 rounded-md border text-xs font-bold transition-all',
                  selected
                    ? 'border-primary bg-primary-tint text-primary ring-2 ring-primary/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-600',
                )}
              >
                <span className="text-base">{opt.key}</span>
                <span className="text-[10px] font-normal leading-tight text-center">
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'FILL_BLANK' && (
        <div className="ml-9">
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nhập đáp án của bạn…"
            className="w-full px-3 py-2 rounded-md border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
          />
        </div>
      )}
    </div>
  );
});
QuestionItem.displayName = 'QuestionItem';

const StatBox: React.FC<{
  icon: React.ElementType;
  tone: 'success' | 'danger' | 'primary';
  label: string;
  value: string;
}> = ({ icon: Icon, tone, label, value }) => {
  const toneClass: Record<typeof tone, string> = {
    success: 'bg-status-success-bg text-status-success',
    danger: 'bg-status-danger-bg text-status-danger',
    primary: 'bg-primary-tint text-primary',
  };
  return (
    <div className="rounded-input border border-slate-200 p-3 text-center">
      <div
        className={cn(
          'w-8 h-8 rounded-md flex items-center justify-center mx-auto mb-1.5',
          toneClass[tone],
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-base font-extrabold text-slate-900 tabular-nums">
        {value}
      </p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
        {label}
      </p>
    </div>
  );
};

const ModalShell: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  large?: boolean;
}> = ({ children, onClose, large }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in"
    role="dialog"
    aria-modal="true"
  >
    <div
      className={cn(
        'w-full bg-white rounded-card shadow-2xl border border-slate-200 relative animate-in zoom-in-95',
        large ? 'max-w-lg' : 'max-w-md',
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Đóng"
      >
        <X className="w-4 h-4" />
      </button>
      {children}
    </div>
  </div>
);

/* ====================== Scoring helper ====================== */
function scoreExam(exam: Exam, answers: Record<string, AnswerValue>): ExamResult {
  let correct = 0;
  const perQuestion: ExamResult['perQuestion'] = [];
  for (const q of exam.questions) {
    const chosen = answers[q.id] ?? null;
    let isCorrect = false;
    if (typeof q.correctAnswer === 'string' && typeof chosen === 'string') {
      isCorrect =
        q.correctAnswer.trim().toLowerCase() === chosen.trim().toLowerCase();
    } else if (typeof q.correctAnswer === 'boolean' && typeof chosen === 'boolean') {
      isCorrect = q.correctAnswer === chosen;
    }
    if (isCorrect) correct += 1;
    perQuestion.push({ questionId: q.id, isCorrect, chosen });
  }
  const total = exam.totalQuestions;
  const ratio = correct / total;
  // IELTS band 0-9, mapping theo tỉ lệ đúng
  const band = Math.min(9, Math.max(0, +(ratio * 9).toFixed(1)));
  let feedback = '';
  if (ratio >= 0.9)
    feedback =
      'Xuất sắc! Bạn nắm rất vững chiến lược làm bài. Hãy thử đề khó hơn để challenge bản thân.';
  else if (ratio >= 0.7)
    feedback =
      'Kết quả tốt! Bạn đã nắm vững phần lớn các dạng bài. Tập trung ôn lại các câu sai để đạt 8.0+.';
  else if (ratio >= 0.5)
    feedback =
      'Khá ổn. Bạn cần luyện thêm True/False/Not Given và mở rộng vốn từ vựng Academic.';
  else
    feedback =
      'Cần cố gắng nhiều hơn. Hãy xem lại các video Reading trong khóa học và làm Placement Test trước khi đăng ký lớp chính thức.';

  return {
    totalQuestions: total,
    correctCount: correct,
    incorrectCount: total - correct,
    bandScore: band,
    maxBand: 9,
    feedback,
    perQuestion,
  };
}

export default ExamRoomView;
