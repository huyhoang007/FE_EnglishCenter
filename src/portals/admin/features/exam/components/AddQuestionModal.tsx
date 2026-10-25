/**
 * AddQuestionModal — thêm câu hỏi mới vào đề (Dev 3)
 * -----------------------------------------------------------
 * Ô nhập đáp án đổi theo loại câu:
 *   trắc nghiệm / đúng-sai: chọn 1 đáp án đúng; điền từ: các đáp án chấp nhận;
 *   nối cặp: "trái" - "phải"; essay: không có.
 * Validate nhanh ở FE, backend validate lại toàn bộ.
 */

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { QUESTION_TYPE_LABEL, type ExamSection, type QuestionType } from '@/shared/types';
import type { CreateQuestionRequest, QuestionOptionInput } from '../services/adminExamService';
import { ExamModal, FIELD_CLASS, Field } from './ExamFormParts';

interface AddQuestionModalProps {
  sections: ExamSection[];
  defaultSectionId?: string;
  isSubmitting: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (payload: CreateQuestionRequest) => void;
}

interface Row {
  key: number;
  text: string;
  right: string;
}

const DEFAULT_ROWS: Record<QuestionType, string[]> = {
  multiple_choice: ['', '', '', ''],
  true_false: ['True', 'False'],
  fill_blank: [''],
  matching: ['', ''],
  essay: [],
};

let rowKey = 0;
const makeRows = (type: QuestionType): Row[] => DEFAULT_ROWS[type].map((text) => ({ key: ++rowKey, text, right: '' }));

export const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  sections,
  defaultSectionId,
  isSubmitting,
  serverError,
  onClose,
  onSubmit,
}) => {
  const [type, setType] = useState<QuestionType>('multiple_choice');
  const [text, setText] = useState('');
  const [points, setPoints] = useState('1');
  const [sectionId, setSectionId] = useState(defaultSectionId ?? '');
  const [explanation, setExplanation] = useState('');
  const [rows, setRows] = useState<Row[]>(() => makeRows('multiple_choice'));
  const [correctKey, setCorrectKey] = useState<number | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const changeType = (next: QuestionType) => {
    setType(next);
    setRows(makeRows(next));
    setCorrectKey(null);
  };
  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  /** Trả về danh sách option, hoặc chuỗi lỗi nếu nhập chưa đủ. */
  const buildOptions = (): QuestionOptionInput[] | string => {
    const filled = rows.filter((r) => r.text.trim());
    if (type === 'essay') return [];
    if (type === 'matching') {
      if (filled.length < 2 || filled.some((r) => !r.right.trim())) return 'Câu nối cần ít nhất 2 cặp, mỗi cặp đủ 2 vế';
      return filled.map((r) => ({ optionText: `${r.text.trim()}::${r.right.trim()}`, isCorrect: true }));
    }
    if (type === 'fill_blank') {
      return filled.length
        ? filled.map((r) => ({ optionText: r.text.trim(), isCorrect: true }))
        : 'Nhập ít nhất 1 đáp án được chấp nhận';
    }
    if (filled.length < 2) return 'Cần ít nhất 2 lựa chọn';
    if (!filled.some((r) => r.key === correctKey)) return 'Chọn 1 đáp án đúng';
    return filled.map((r) => ({ optionText: r.text.trim(), isCorrect: r.key === correctKey }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return setFieldError('Nhập nội dung câu hỏi');
    const options = buildOptions();
    if (typeof options === 'string') return setFieldError(options);
    setFieldError(null);
    onSubmit({
      questionType: type,
      questionText: text.trim(),
      points: Number(points) || 1,
      sectionId: sectionId || undefined,
      explanation: explanation.trim() || undefined,
      options,
    });
  };

  const hasSingleCorrect = type === 'multiple_choice' || type === 'true_false';

  return (
    <ExamModal title="Thêm câu hỏi" onClose={onClose} isDismissDisabled={isSubmitting}>
      <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Loại câu hỏi">
            <select value={type} onChange={(e) => changeType(e.target.value as QuestionType)} className={FIELD_CLASS}>
              {(Object.keys(QUESTION_TYPE_LABEL) as QuestionType[]).map((t) => (
                <option key={t} value={t}>
                  {QUESTION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Section">
            <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className={FIELD_CLASS}>
              <option value="">— Không thuộc section —</option>
              {sections.map((s) => (
                <option key={s.sectionId} value={s.sectionId}>
                  {s.title}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Điểm">
            <input
              type="number"
              min={0.25}
              step={0.25}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              className={FIELD_CLASS}
            />
          </Field>
        </div>
        <Field label="Nội dung câu hỏi *">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={FIELD_CLASS} />
        </Field>

        {type !== 'essay' && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600">
              {hasSingleCorrect
                ? 'Lựa chọn (tick đáp án đúng)'
                : type === 'fill_blank'
                  ? 'Đáp án được chấp nhận'
                  : 'Các cặp nối'}
            </p>
            {rows.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                {hasSingleCorrect && (
                  <input
                    type="radio"
                    name="correct"
                    checked={correctKey === row.key}
                    onChange={() => setCorrectKey(row.key)}
                    className="w-4 h-4 accent-primary"
                    aria-label="Đáp án đúng"
                  />
                )}
                <input
                  value={row.text}
                  onChange={(e) => updateRow(row.key, { text: e.target.value })}
                  className={FIELD_CLASS}
                  placeholder={type === 'matching' ? 'Vế trái' : 'Nội dung'}
                />
                {type === 'matching' && (
                  <input
                    value={row.right}
                    onChange={(e) => updateRow(row.key, { right: e.target.value })}
                    className={FIELD_CLASS}
                    placeholder="Vế phải"
                  />
                )}
                {type !== 'true_false' && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                    aria-label="Xóa dòng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {type !== 'true_false' && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={Plus}
                onClick={() => setRows((rs) => [...rs, { key: ++rowKey, text: '', right: '' }])}
              >
                Thêm dòng
              </Button>
            )}
          </div>
        )}

        <Field label="Giải thích đáp án">
          <textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} rows={2} className={FIELD_CLASS} />
        </Field>
        {(fieldError || serverError) && (
          <p className="text-sm text-status-danger font-semibold">{fieldError ?? serverError}</p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Thêm câu hỏi
          </Button>
        </div>
      </form>
    </ExamModal>
  );
};

export default AddQuestionModal;
