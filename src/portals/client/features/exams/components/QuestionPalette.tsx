/**
 * QuestionPalette — lưới số câu: đã làm tô màu primary, click để nhảy tới câu (Dev 3)
 */

import React from 'react';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import type { ExamQuestion } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { isAnswered, type DraftAnswer } from '../utils/examRoom';

interface QuestionPaletteProps {
  questions: ExamQuestion[];
  answers: Record<string, DraftAnswer>;
  activeQuestionId: string;
  onJump: (questionId: string) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({ questions, answers, activeQuestionId, onJump }) => {
  const answeredCount = questions.filter((q) => isAnswered(q, answers[q.questionId])).length;
  return (
    <Card noPadding className="rounded-3xl">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center gap-2">
        <Badge variant="ai" size="sm">Question Palette</Badge>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          Click để nhảy tới câu
        </span>
      </div>
      <div className="p-4 grid grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))] gap-2 justify-items-center">
        {questions.map((q) => {
          const done = isAnswered(q, answers[q.questionId]);
          return (
            <button
              key={q.questionId}
              type="button"
              onClick={() => onJump(q.questionId)}
              className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                done ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                activeQuestionId === q.questionId && 'ring-2 ring-primary ring-offset-2',
              )}
              aria-label={`Câu ${q.displayNumber}${done ? ' (đã làm)' : ''}`}
            >
              {q.displayNumber}
            </button>
          );
        })}
      </div>
      <div className="px-4 pb-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary" /> Đã làm ({answeredCount})
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300" /> Chưa làm (
          {questions.length - answeredCount})
        </span>
      </div>
    </Card>
  );
};

export default QuestionPalette;
