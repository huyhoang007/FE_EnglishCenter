/**
 * AddSectionForm — thêm section theo kỹ năng của chứng chỉ (Dev 3)
 * -----------------------------------------------------------
 * Loại section đổi theo chứng chỉ của đề:
 *   IELTS / VSTEP : Listening, Reading, Writing, Speaking
 *   TOEIC         : Listening, Reading
 *   khác          : thêm GENERAL
 * Link file nghe chỉ hiện với section Listening.
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import type { ScaleKind } from '@/shared/constants/examScales';
import type { CreateSectionRequest } from '../services/adminExamService';
import { AutoGrowTextarea, FIELD_CLASS, Field } from './ExamFormParts';

const SECTION_TYPES: Record<ScaleKind, string[]> = {
  ielts: ['LISTENING', 'READING', 'WRITING', 'SPEAKING'],
  vstep: ['LISTENING', 'READING', 'WRITING', 'SPEAKING'],
  toeic: ['LISTENING', 'READING'],
  raw: ['LISTENING', 'READING', 'WRITING', 'SPEAKING', 'GENERAL'],
};

interface AddSectionFormProps {
  /** Loại thang của chứng chỉ của đề — quyết định các loại section được chọn */
  scaleKind: ScaleKind;
  isSubmitting: boolean;
  serverError?: string;
  onSubmit: (payload: CreateSectionRequest, reset: () => void) => void;
}

export const AddSectionForm: React.FC<AddSectionFormProps> = ({ scaleKind, isSubmitting, serverError, onSubmit }) => {
  const sectionTypes = SECTION_TYPES[scaleKind];
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
    if (!title.trim()) return setFieldError('Nhập tiêu đề section');
    setFieldError(null);
    onSubmit(
      {
        title: title.trim(),
        sectionType,
        instructions: instructions.trim() || undefined,
        passageText: passageText.trim() || undefined,
        // Chỉ section Listening mới có file nghe
        audioUrl: isListening ? audioUrl.trim() || undefined : undefined,
      },
      reset,
    );
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-3">
        <h3 className="font-extrabold text-slate-900">Thêm section</h3>
        <div className="grid grid-cols-[1fr,150px] gap-3">
          <Field label="Tiêu đề *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={FIELD_CLASS}
              placeholder="VD: Part 1 - Reading"
            />
          </Field>
          <Field label="Loại">
            <select value={sectionType} onChange={(e) => setSectionType(e.target.value)} className={FIELD_CLASS}>
              {sectionTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Hướng dẫn">
          <input value={instructions} onChange={(e) => setInstructions(e.target.value)} className={FIELD_CLASS} />
        </Field>
        <Field label="Đoạn đọc (Reading)">
          <AutoGrowTextarea
            value={passageText}
            onChange={(e) => setPassageText(e.target.value)}
            rows={3}
            className={FIELD_CLASS}
          />
        </Field>
        {isListening && (
          <Field label="Link file nghe (Listening)">
            <input
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              className={FIELD_CLASS}
              placeholder="https://…/audio.mp3"
            />
          </Field>
        )}
        {(fieldError || serverError) && (
          <p className="text-sm text-status-danger font-semibold">{fieldError ?? serverError}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" leftIcon={Plus} isLoading={isSubmitting}>
            Thêm section
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddSectionForm;
