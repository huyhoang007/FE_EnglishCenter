/**
 * QuestionItem — hiển thị 1 câu hỏi theo loại và nhận câu trả lời (Dev 3)
 * -----------------------------------------------------------
 * Không bao giờ nhận đáp án đúng: backend đã ẩn isCorrect, đáp án điền từ và cặp nối.
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { QUESTION_TYPE_LABEL, type ExamQuestion } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { countWords, parseMatching, type DraftAnswer } from '../utils/examRoom';

interface QuestionItemProps {
  question: ExamQuestion;
  value?: DraftAnswer;
  onChange: (value: DraftAnswer) => void;
  isActive: boolean;
}

export const QuestionItem = React.forwardRef<HTMLDivElement, QuestionItemProps>(
  ({ question, value, onChange, isActive }, ref) => (
    <div
      ref={ref}
      id={`question-${question.questionId}`}
      className={cn(
        'rounded-2xl border p-4 transition-all scroll-mt-40',
        isActive ? 'border-primary bg-blue-50/30' : 'border-slate-200 bg-white',
      )}
    >
      <div className="flex items-start gap-2.5 mb-3">
        <span className="w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 bg-slate-900 text-white">
          {question.displayNumber}
        </span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-line [overflow-wrap:anywhere]">
            {question.questionText}
          </p>
          <div className="flex items-center gap-2">
            <Badge size="sm">{QUESTION_TYPE_LABEL[question.questionType]}</Badge>
            <span className="text-[11px] text-slate-400">{question.points} điểm</span>
          </div>
        </div>
      </div>
      {question.imageUrl && <img src={question.imageUrl} alt="" className="ml-9 mb-3 rounded-xl max-h-64" />}
      {question.audioUrl && <audio controls src={question.audioUrl} className="ml-9 mb-3 w-[calc(100%-2.25rem)]" />}
      <div className="ml-9">
        <AnswerInput question={question} value={value} onChange={onChange} />
      </div>
    </div>
  ),
);
QuestionItem.displayName = 'QuestionItem';

const inputClass =
  'w-full px-3 py-2 rounded-input border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary';

const AnswerInput: React.FC<Omit<QuestionItemProps, 'isActive'>> = ({ question, value, onChange }) => {
  switch (question.questionType) {
    case 'multiple_choice':
    case 'true_false':
      return (
        <div className={question.questionType === 'true_false' ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
          {(question.options ?? []).map((opt, idx) => {
            const isSelected = value?.selectedOptionId === opt.optionId;
            return (
              <button
                key={opt.optionId}
                type="button"
                onClick={() => onChange({ selectedOptionId: isSelected ? null : opt.optionId })}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left text-sm transition-all',
                  isSelected
                    ? 'border-primary bg-blue-50 ring-2 ring-primary/20 font-semibold text-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700',
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0',
                    isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="min-w-0 [overflow-wrap:anywhere]">{opt.optionText}</span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      );
    case 'fill_blank':
      return (
        <input
          value={value?.answerText ?? ''}
          onChange={(e) => onChange({ answerText: e.target.value })}
          placeholder="Nhập đáp án của bạn…"
          className={inputClass}
        />
      );
    case 'matching': {
      const pairs = parseMatching(value?.answerText);
      const setPair = (left: string, right: string) => {
        const next = { ...pairs, [left]: right };
        if (!right) delete next[left];
        onChange({ answerText: Object.keys(next).length ? JSON.stringify(next) : null });
      };
      return (
        <div className="space-y-2">
          {(question.matchingLeft ?? []).map((left) => (
            <div key={left} className="grid grid-cols-2 gap-2 items-center">
              <span className="text-sm font-semibold text-slate-700">{left}</span>
              <select value={pairs[left] ?? ''} onChange={(e) => setPair(left, e.target.value)} className={inputClass}>
                <option value="">— Chọn —</option>
                {(question.matchingRight ?? []).map((right) => (
                  <option key={right} value={right}>
                    {right}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }
    case 'essay':
      return (
        <div className="space-y-1.5">
          <textarea
            value={value?.answerText ?? ''}
            onChange={(e) => onChange({ answerText: e.target.value })}
            rows={8}
            placeholder="Viết bài của bạn (Speaking: dán link file ghi âm)…"
            className={cn(inputClass, 'resize-y leading-relaxed')}
          />
          <p className="text-[11px] text-slate-400 text-right">{countWords(value?.answerText ?? '')} từ</p>
        </div>
      );
    default:
      return null;
  }
};

export default QuestionItem;
