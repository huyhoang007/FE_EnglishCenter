/**
 * AddSectionForm — thêm phần thi theo kỹ năng của chứng chỉ (Dev 3)
 * -----------------------------------------------------------
 * Mở ra khi bấm "Thêm phần thi" trên trang soạn đề. Loại phần thi đổi theo chứng chỉ:
 *   IELTS / VSTEP : Listening, Reading, Writing, Speaking
 *   TOEIC         : Listening, Reading
 *   khác          : thêm GENERAL
 * Link file nghe chỉ hiện với phần Listening.
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { SECTION_TYPES_BY_SCALE, type ScaleKind } from '@/shared/constants/examScales';
import type { CreateSectionRequest } from '../services/adminExamService';
import { AutoGrowTextarea, FIELD_CLASS, Field } from './ExamFormParts';

interface AddSectionFormProps {
  /** Loại thang của chứng chỉ của đề — quyết định các loại phần thi được chọn */
  scaleKind: ScaleKind;
  isSubmitting: boolean;
  serverError?: string;
  onSubmit: (payload: CreateSectionRequest, reset: () => void) => void;
  onCancel?: () => void;
}

export const AddSectionForm: React.FC<AddSectionFormProps> = ({
  scaleKind,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}) => {
  const sectionTypes = SECTION_TYPES_BY_SCALE[scaleKind];
  const [title, setTitle] = useState('');
  const [sectionType, setSectionType] = useState(sectionTypes.includes('READING') ? 'READING' : sectionTypes[0]);
  const [instructions, setInstructions] = useState('');
  const [passageText, setPassageText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const isListening = sectionType === 'LISTENING';

  const reset = () => {
    setTitle('');
    setInstructions('');
    setPassageText('');
    setAudioUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setFieldError('Nhập tên phần thi');
    setFieldError(null);
    onSubmit(
      {
        title: title.trim(),
        sectionType,
        instructions: instructions.trim() || undefined,
        passageText: passageText.trim() || undefined,
        // Chỉ phần Listening mới có file nghe
        audioUrl: isListening ? audioUrl.trim() || undefined : undefined,
      },
      reset,
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-[1fr,180px] gap-4">
        <Field label="Tên phần thi *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${FIELD_CLASS} h-10`}
            placeholder="VD: Part 1 - Reading"
            autoFocus
          />
        </Field>
        <Field label="Kỹ năng">
          <select value={sectionType} onChange={(e) => setSectionType(e.target.value)} className={`${FIELD_CLASS} h-10`}>
            {sectionTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Hướng dẫn">
        <input
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className={`${FIELD_CLASS} h-10`}
          placeholder="VD: Đọc đoạn văn và trả lời câu hỏi"
        />
      </Field>
      <Field label="Đoạn đọc (không bắt buộc)">
        <AutoGrowTextarea value={passageText} onChange={(e) => setPassageText(e.target.value)} rows={3} className={FIELD_CLASS} />
      </Field>
      {isListening && (
        <Field label="Link file nghe">
          <input
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            className={`${FIELD_CLASS} h-10`}
            placeholder="https://…/audio.mp3"
          />
        </Field>
      )}
      {(fieldError || serverError) && (
        <p className="text-sm text-status-danger font-semibold" role="alert">
          {fieldError ?? serverError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Hủy
          </Button>
        )}
        <Button type="submit" leftIcon={Plus} isLoading={isSubmitting}>
          Thêm phần thi
        </Button>
      </div>
    </form>
  );
};

export default AddSectionForm;
