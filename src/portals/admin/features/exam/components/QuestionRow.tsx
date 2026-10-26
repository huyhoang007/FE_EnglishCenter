/**
 * QuestionRow — một câu hỏi trong trình soạn đề, hiện cả đáp án đúng (góc nhìn admin, Dev 3)
 */

import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { QUESTION_TYPE_LABEL, type ExamQuestion } from '@/shared/types';
import { cn } from '@/shared/utils/cn';

interface QuestionRowProps {
  question: ExamQuestion;
  isEditable: boolean;
  onRemove: () => void;
}

export const QuestionRow: React.FC<QuestionRowProps> = ({ question, isEditable, onRemove }) => (
  <div className="rounded-xl border border-slate-200 p-3 flex gap-3">
    <span className="w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 bg-slate-900 text-white">
      {question.displayNumber}
    </span>
    <div className="flex-1 min-w-0 space-y-1.5">
      <p className="text-sm font-semibold text-slate-800 whitespace-pre-line [overflow-wrap:anywhere]">{question.questionText}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge size="sm">{QUESTION_TYPE_LABEL[question.questionType]}</Badge>
        <span className="text-[11px] text-slate-400">{question.points} điểm</span>
      </div>
      {(question.options ?? []).length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {(question.options ?? []).map((o) => (
            <li
              key={o.optionId}
              className={cn(
                'text-xs px-2 py-1 rounded-md border inline-flex items-center gap-1 max-w-full [overflow-wrap:anywhere]',
                o.isCorrect
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 font-semibold'
                  : 'border-slate-200 text-slate-600',
              )}
            >
              {o.isCorrect && <CheckCircle2 className="w-3 h-3" />}
              {o.optionText.replace('::', ' → ')}
            </li>
          ))}
        </ul>
      )}
    </div>
    {isEditable && (
      <Button
        size="icon"
        variant="ghost"
        aria-label="Gỡ câu hỏi"
        onClick={() => window.confirm('Gỡ câu hỏi khỏi đề?') && onRemove()}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    )}
  </div>
);

export default QuestionRow;
