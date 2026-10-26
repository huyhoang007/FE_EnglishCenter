/**
 * SectionCard — một phần thi trong trang soạn đề (Dev 3)
 * -----------------------------------------------------------
 * Header: số thứ tự, tên phần, kỹ năng, số câu · điểm, "Thêm câu hỏi", nút xóa (có tooltip / aria-label).
 * Thân: hướng dẫn, file nghe, đoạn đọc (giới hạn bề rộng đọc, dài thì thu gọn), danh sách câu hỏi
 * và trạng thái trống ngay trong phần thi.
 */

import React, { useState } from 'react';
import { Headphones, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import type { ExamSection } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { QuestionRow } from './QuestionRow';

const PASSAGE_PREVIEW = 360;

interface SectionCardProps {
  section: ExamSection;
  index: number;
  isEditable: boolean;
  onAddQuestion: () => void;
  onRemove: () => void;
  onRemoveQuestion: (questionId: string) => void;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  index,
  isEditable,
  onAddQuestion,
  onRemove,
  onRemoveQuestion,
}) => {
  const [isPassageOpen, setPassageOpen] = useState(false);
  const passage = section.passageText ?? '';
  const isLongPassage = passage.length > PASSAGE_PREVIEW;
  const questions = section.questions ?? [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white" aria-labelledby={`section-${section.sectionId}`}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 py-4 border-b border-slate-100">
        <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={`section-${section.sectionId}`} className="text-base font-bold text-slate-900 min-w-0 [overflow-wrap:anywhere]">
              {section.title}
            </h3>
            <Badge variant="ai" size="sm">{section.sectionType}</Badge>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {section.questionCount} câu hỏi · {section.maxScore ?? 0} điểm
          </p>
        </div>
        {isEditable && (
          // Màn hình nhỏ: nút xuống dòng riêng để tên phần thi không bị ép
          <div className="flex items-center justify-end gap-1 w-full sm:w-auto">
            <Button size="sm" variant="secondary" leftIcon={Plus} onClick={onAddQuestion}>
              Thêm câu hỏi
            </Button>
            <button
              type="button"
              onClick={onRemove}
              title="Xóa phần thi"
              aria-label={`Xóa phần thi ${section.title}`}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      <div className="px-5 py-4 space-y-4">
        {(section.instructions || section.audioUrl || passage) && (
          <div className="space-y-2 max-w-prose min-w-0">
            {section.instructions && <p className="text-sm text-slate-700 [overflow-wrap:anywhere]">{section.instructions}</p>}
            {section.audioUrl && (
              <p className="text-xs text-slate-600 flex items-center gap-1.5 min-w-0">
                <Headphones className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{section.audioUrl}</span>
              </p>
            )}
            {passage && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <p className={cn('text-sm leading-relaxed text-slate-700 whitespace-pre-line [overflow-wrap:anywhere]', !isPassageOpen && isLongPassage && 'line-clamp-4')}>
                  {passage}
                </p>
                {isLongPassage && (
                  <button
                    type="button"
                    onClick={() => setPassageOpen((v) => !v)}
                    aria-expanded={isPassageOpen}
                    className="mt-2 text-xs font-semibold text-[#0052CC] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC]/40 rounded"
                  >
                    {isPassageOpen ? 'Thu gọn đoạn đọc' : 'Xem toàn bộ đoạn đọc'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {questions.length > 0 ? (
          <div className="space-y-2">
            {questions.map((q) => (
              <QuestionRow
                key={q.questionId}
                question={q}
                isEditable={isEditable}
                onRemove={() => onRemoveQuestion(q.questionId)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center">
            <p className="text-sm text-slate-600">Phần thi này chưa có câu hỏi.</p>
            {isEditable && (
              <Button size="sm" variant="outline" leftIcon={Plus} className="mt-3" onClick={onAddQuestion}>
                Thêm câu hỏi đầu tiên
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default SectionCard;
