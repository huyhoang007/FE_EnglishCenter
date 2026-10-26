/**
 * ExamRoomView — Phòng thi trực tuyến (Dev 3, dữ liệu thật thay MOCK_EXAM)
 * -----------------------------------------------------------
 * Sticky topbar: tên đề, tiến độ, trạng thái lưu, đồng hồ, nút Nộp bài.
 * Mỗi section: bên trái đoạn đọc / file nghe, bên phải câu hỏi. Cuối trang là Question Palette.
 * API: GET /api/v1/attempts/{id}, PUT .../answers (autosave), POST .../submit
 */

import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Cloud, CloudOff, FileText, Loader2, Send, Target } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { detectScale } from '@/shared/constants/examScales';
import type { ExamQuestion, ExamSection } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { useExamRoom, type SaveState } from '../hooks/useExamRoom';
import type { DraftAnswer } from '../utils/examRoom';
import { ExamTimer } from './ExamTimer';
import { QuestionItem } from './QuestionItem';
import { QuestionPalette } from './QuestionPalette';

export interface ExamRoomViewProps {
  attemptId: string;
}

export const ExamRoomView: React.FC<ExamRoomViewProps> = ({ attemptId }) => {
  const navigate = useNavigate();
  const room = useExamRoom(attemptId);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState('');
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  if (room.attemptQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    );
  }
  if (room.attemptQuery.isError || !room.attempt?.exam) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={() => navigate(CLIENT_ROUTES.exams)}>
          Ngân hàng đề
        </Button>
        <ErrorState
          message={room.attemptQuery.error?.message ?? 'Lượt thi đã kết thúc.'}
          onRetry={() => room.attemptQuery.refetch()}
        />
      </div>
    );
  }

  const exam = room.attempt.exam;
  const scale = detectScale(exam.exam.certificateName);
  const jumpTo = (questionId: string) => {
    setActiveQuestionId(questionId);
    questionRefs.current[questionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const renderQuestions = (questions: ExamQuestion[]) =>
    questions.map((q) => (
      <QuestionItem
        key={q.questionId}
        ref={(el) => {
          questionRefs.current[q.questionId] = el;
        }}
        question={q}
        value={room.answers[q.questionId]}
        onChange={(v: DraftAnswer) => {
          setActiveQuestionId(q.questionId);
          room.setAnswer(q.questionId, v);
        }}
        isActive={activeQuestionId === q.questionId}
      />
    ));

  return (
    <div className="space-y-4">
      <div className="sticky top-4 z-30 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              {exam.exam.certificateName ?? 'Đề thi'} · Lượt #{room.attempt.attemptNumber}
            </p>
            <p className="font-bold text-sm text-slate-900 truncate max-w-[280px]">{exam.exam.examTitle}</p>
          </div>
        </div>
        {scale.kind !== 'raw' && <Badge variant={scale.badge}>{scale.label}</Badge>}
        <Badge variant="primary" icon={Target}>
          Đã làm {room.answeredCount}/{room.questions.length}
        </Badge>
        <SaveIndicator state={room.saveState} />
        <div className="flex-1" />
        <ExamTimer secondsLeft={room.secondsLeft} />
        <Button leftIcon={Send} onClick={() => setConfirmOpen(true)} disabled={room.isSubmitting}>
          Nộp bài thi
        </Button>
      </div>

      {exam.sections.map((section) => (
        <SectionBlock key={section.sectionId} section={section}>
          {renderQuestions(section.questions ?? [])}
        </SectionBlock>
      ))}
      {(exam.unsectionedQuestions ?? []).length > 0 && (
        <Card className="space-y-4">{renderQuestions(exam.unsectionedQuestions ?? [])}</Card>
      )}

      <QuestionPalette
        questions={room.questions}
        answers={room.answers}
        activeQuestionId={activeQuestionId}
        onJump={jumpTo}
      />

      {isConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !room.isSubmitting && setConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 text-center space-y-3"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Xác nhận nộp bài?</h3>
            <p className="text-sm text-slate-600">
              Bạn đã làm{' '}
              <b>
                {room.answeredCount}/{room.questions.length}
              </b>{' '}
              câu. Sau khi nộp sẽ không sửa được nữa.
            </p>
            {room.submitError && (
              <p className="text-sm text-status-danger font-semibold">{room.submitError.message}</p>
            )}
            <div className="flex items-center gap-2 justify-center pt-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={room.isSubmitting}>
                Tiếp tục làm
              </Button>
              <Button leftIcon={Send} isLoading={room.isSubmitting} onClick={room.submit}>
                Nộp bài
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionBlock: React.FC<{ section: ExamSection; children: React.ReactNode }> = ({ section, children }) => {
  const hasMaterial = Boolean(section.passageText || section.audioUrl);
  return (
    <Card noPadding className="rounded-3xl overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2">
        <Badge variant="ai" size="sm">{section.sectionType}</Badge>
        <span className="font-bold text-sm text-slate-800">{section.title}</span>
        {section.instructions && (
          <span className="text-xs text-slate-500 hidden md:inline">· {section.instructions}</span>
        )}
      </div>
      <div className={hasMaterial ? 'grid lg:grid-cols-2' : ''}>
        {hasMaterial && (
          <div className="p-5 lg:border-r border-slate-200 lg:max-h-[70vh] lg:overflow-y-auto space-y-4">
            {section.audioUrl && <audio controls src={section.audioUrl} className="w-full" />}
            {section.passageText && (
              <p className="text-[14px] leading-[1.75] text-slate-700 whitespace-pre-line">{section.passageText}</p>
            )}
          </div>
        )}
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </Card>
  );
};

const SAVE_VIEW: Record<Exclude<SaveState, 'idle'>, { icon: React.ElementType; text: string; className: string }> = {
  saving: { icon: Loader2, text: 'Đang lưu…', className: 'text-slate-500 [&>svg]:animate-spin' },
  saved: { icon: Cloud, text: 'Đã lưu', className: 'text-status-success' },
  error: { icon: CloudOff, text: 'Lỗi lưu, sẽ thử lại', className: 'text-status-danger' },
};

const SaveIndicator: React.FC<{ state: SaveState }> = ({ state }) => {
  if (state === 'idle') return null;
  const view = SAVE_VIEW[state];
  const Icon = view.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', view.className)}>
      <Icon className="w-3.5 h-3.5" /> {view.text}
    </span>
  );
};

export default ExamRoomView;
