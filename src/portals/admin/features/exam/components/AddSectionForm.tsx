/**
 * AddSectionForm — thêm phần thi theo các phần của chứng chỉ (Dev 3)
 * -----------------------------------------------------------
 * Mở ra khi bấm "Thêm phần thi" trên trang soạn đề. Danh sách phần thi lấy từ cấu hình chứng chỉ ở trang
 * Chứng chỉ (Dev 2): IELTS 4 phần, TOEIC L&R 2 phần, chứng chỉ tuỳ chỉnh theo các phần admin khai báo.
 * Section lưu kèm certificatePartId để chấm / quy đổi điểm theo thang của phần đó.
 * Đề không thuộc chứng chỉ: chọn loại kỹ năng (có GENERAL).
 * Link file nghe chỉ hiện với phần Listening.
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { formatScore, skillToSectionType, type ScaleInfo } from '@/shared/constants/examScales';
import type { CreateSectionRequest } from '../services/adminExamService';
import { AutoGrowTextarea, FIELD_CLASS, Field } from './ExamFormParts';

interface AddSectionFormProps {
  /** Thang của chứng chỉ của đề — quyết định các phần thi được chọn */
  scale: ScaleInfo;
  isSubmitting: boolean;
  serverError?: string;
  onSubmit: (payload: CreateSectionRequest, reset: () => void) => void;
  onCancel?: () => void;
}

/** Lựa chọn trong ô "Phần thi": một phần của chứng chỉ, hoặc một loại kỹ năng (đề không thuộc chứng chỉ) */
interface PartOption {
  value: string;
  label: string;
  sectionType: string;
  certificatePartId?: string;
}

export const AddSectionForm: React.FC<AddSectionFormProps> = ({
  scale,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}) => {
  const linkedParts = scale.parts.filter((p) => p.partId);
  const options: PartOption[] = linkedParts.length
    ? linkedParts.map((p) => ({
        value: p.partId as string,
        label: `${p.name} (${formatScore(p.min, p.step)} – ${formatScore(p.max, p.step)})`,
        sectionType: skillToSectionType(p.skill),
        certificatePartId: p.partId,
      }))
    : scale.sectionTypes.map((t) => ({ value: t, label: t, sectionType: t }));
  const [optionValue, setOptionValue] = useState(
    (options.find((o) => o.sectionType === 'READING') ?? options[0])?.value ?? '',
  );
  const option = options.find((o) => o.value === optionValue) ?? options[0];
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [passageText, setPassageText] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const isListening = option?.sectionType === 'LISTENING';

  const reset = () => {
    setTitle('');
    setInstructions('');
    setPassageText('');
    setAudioUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setFieldError('Nhập tên phần thi');
    if (!option) return setFieldError('Chứng chỉ chưa có phần thi nào — thêm phần thi ở trang Chứng chỉ');
    setFieldError(null);
    onSubmit(
      {
        title: title.trim(),
        sectionType: option.sectionType,
        certificatePartId: option.certificatePartId,
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
      <div className="grid sm:grid-cols-[1fr,220px] gap-4">
        <Field label="Tên phần thi *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${FIELD_CLASS} h-10`}
            placeholder="VD: Part 1 - Reading"
            autoFocus
          />
        </Field>
        <Field label={linkedParts.length ? `Phần thi của ${scale.label}` : 'Kỹ năng'}>
          <select value={option?.value ?? ''} onChange={(e) => setOptionValue(e.target.value)} className={`${FIELD_CLASS} h-10`}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
