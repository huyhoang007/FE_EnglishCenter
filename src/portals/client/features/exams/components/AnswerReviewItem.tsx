/**
 * AnswerReviewItem — một câu trong phần xem lại bài (Dev 3)
 * Câu trả lời của học viên, đúng/sai, đáp án đúng, giải thích, nhận xét mentor.
 */

import React from 'react';
import { CheckCircle2, Hourglass, MessageSquareText, XCircle } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import {
  QUESTION_TYPE_LABEL,
  type AnswerResult,
  type EssayAiEvaluation,
  type PracticeEvaluation,
} from '@/shared/types';
import { EvaluationResult } from '@/portals/client/features/ai-practice/components/EvaluationResult';
import { cn } from '@/shared/utils/cn';
import { parseMatching } from '../utils/examRoom';

interface AnswerReviewItemProps {
  answer: AnswerResult;
  isScoreVisible: boolean;
}

export const AnswerReviewItem: React.FC<AnswerReviewItemProps> = ({ answer, isScoreVisible }) => {
  const tone =
    answer.correct === true
      ? 'border-emerald-200 bg-emerald-50/40'
      : answer.correct === false
        ? 'border-rose-200 bg-rose-50/40'
        : 'border-slate-200';

  return (
    <div className={cn('rounded-2xl border p-4 space-y-2', tone)}>
      <div className="flex items-start gap-2.5">
        <span className="w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 bg-slate-900 text-white">
          {answer.displayNumber}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800 whitespace-pre-line [overflow-wrap:anywhere]">{answer.questionText}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge size="sm">{QUESTION_TYPE_LABEL[answer.questionType]}</Badge>
            {isScoreVisible && answer.earnedScore !== undefined && answer.earnedScore !== null && (
              <span className="text-[11px] font-bold text-slate-500">
                {answer.earnedScore}/{answer.points} điểm
              </span>
            )}
          </div>
        </div>
        {answer.correct === true && <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />}
        {answer.correct === false && <XCircle className="w-5 h-5 text-status-danger shrink-0" />}
        {answer.pendingManualGrading && <Hourglass className="w-5 h-5 text-ai shrink-0" />}
      </div>

      <div className="ml-9 space-y-1.5 text-sm">
        <p className="text-slate-600">
          <span className="font-bold text-slate-800">Bạn trả lời: </span>
          {answer.answered ? <StudentAnswer answer={answer} /> : <i className="text-slate-400">bỏ trống</i>}
        </p>
        {answer.correctAnswers && answer.correctAnswers.length > 0 && (
          <p className="text-emerald-700">
            <span className="font-bold">Đáp án đúng: </span>
            {answer.correctAnswers.map((a) => a.replace('::', ' → ')).join(' · ')}
          </p>
        )}
        {answer.explanation && <p className="text-slate-500 italic">{answer.explanation}</p>}
        {answer.aiEvaluation && (
          <div className="pt-1">
            <EvaluationResult evaluation={toPracticeEvaluation(answer, answer.aiEvaluation)} />
          </div>
        )}
        {answer.mentorFeedback && !answer.aiEvaluation && (
          <p className="rounded-xl bg-ai-tint text-slate-700 px-3 py-2 flex gap-2">
            <MessageSquareText className="w-4 h-4 text-ai shrink-0 mt-0.5" />
            <span>
              <b>Nhận xét của mentor:</b> {answer.mentorFeedback}
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

/** Kết quả AI chấm câu Writing / Speaking → dạng thẻ kết quả của Luyện tập AI để dùng lại EvaluationResult */
const toPracticeEvaluation = (answer: AnswerResult, e: EssayAiEvaluation): PracticeEvaluation => ({
  evaluationId: answer.questionId,
  answerId: answer.questionId,
  practiceExamId: '',
  examTitle: `Câu ${answer.displayNumber}`,
  examType: e.skill,
  bandScore: e.bandScore,
  certificateName: e.certificateName,
  minScore: e.minScore,
  maxScore: e.maxScore,
  cefrLevel: e.cefrLevel,
  taskAchievement: e.taskAchievement,
  coherenceCohesion: e.coherenceCohesion,
  lexicalResource: e.lexicalResource,
  grammaticalAccuracy: e.grammaticalAccuracy,
  feedback: e.feedback,
  suggestions: e.suggestions ?? [],
  model: e.model ?? 'claude',
  evaluatedAt: e.evaluatedAt ?? answer.gradedDate ?? '',
});

const StudentAnswer: React.FC<{ answer: AnswerResult }> = ({ answer }) => {
  if (answer.selectedOptionText) return <>{answer.selectedOptionText}</>;
  if (answer.questionType === 'matching') {
    return (
      <>
        {Object.entries(parseMatching(answer.answerText))
          .map(([left, right]) => `${left} → ${right}`)
          .join(' · ')}
      </>
    );
  }
  return <span className="whitespace-pre-line [overflow-wrap:anywhere]">{answer.answerText}</span>;
};

export default AnswerReviewItem;
