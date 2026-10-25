/**
 * CreateExamModal — tạo đề mới, luôn ở trạng thái nháp (Dev 3)
 * trial: bắt buộc chọn chứng chỉ; course: bắt buộc chọn khóa học.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { EXAM_TYPE_LABEL, type ExamScope, type ExamType } from '@/shared/types';
import { useCreateExam, useExamFormOptions } from '../hooks/useAdminExams';
import { Checkbox, ExamModal, FIELD_CLASS, Field } from './ExamFormParts';

const EMPTY = {
  examScope: 'trial' as ExamScope,
  certificateId: '',
  courseId: '',
  examCode: '',
  examType: 'placement_test' as ExamType,
  examTitle: '',
  description: '',
  durationMinutes: '60',
  passingScore: '50',
  maxAttempts: '1',
  recommendedLevel: '',
  isFree: true,
  price: '0',
  showAnswers: true,
  showScore: true,
};

export const CreateExamModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const { certificates, courses } = useExamFormOptions();
  const create = useCreateExam();
  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.examTitle.trim()) return setFieldError('Nhập tiêu đề đề thi');
    if (form.examScope === 'trial' && !form.certificateId) return setFieldError('Đề thi thử phải chọn chứng chỉ');
    if (form.examScope === 'course' && !form.courseId) return setFieldError('Đề khóa học phải chọn khóa học');
    if (Number(form.durationMinutes) < 1) return setFieldError('Thời lượng tối thiểu 1 phút');
    setFieldError(null);
    const isTrial = form.examScope === 'trial';
    create.mutate(
      {
        examScope: form.examScope,
        certificateId: form.certificateId || undefined,
        courseId: isTrial ? undefined : form.courseId,
        examCode: form.examCode.trim() || undefined,
        examType: form.examType,
        examTitle: form.examTitle.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: Number(form.durationMinutes),
        passingScore: Number(form.passingScore),
        maxAttempts: Number(form.maxAttempts),
        recommendedLevel: form.recommendedLevel.trim() || undefined,
        isFree: isTrial ? form.isFree : undefined,
        price: isTrial && !form.isFree ? Number(form.price) : undefined,
        showAnswers: form.showAnswers,
        showScore: form.showScore,
      },
      {
        onSuccess: (exam) => {
          toast.success('Đã tạo đề nháp');
          onClose();
          navigate(ADMIN_ROUTES.examEditor(exam.exam.examId));
        },
      },
    );
  };

  return (
    <ExamModal title="Tạo đề thi mới" onClose={onClose} isDismissDisabled={create.isPending}>
      <form onSubmit={handleSubmit} className="p-6 pt-2 grid sm:grid-cols-2 gap-4">
        <Field label="Phạm vi">
          <select
            value={form.examScope}
            onChange={(e) => set('examScope', e.target.value as ExamScope)}
            className={FIELD_CLASS}
          >
            <option value="trial">Thi thử theo chứng chỉ</option>
            <option value="course">Đề của khóa học</option>
          </select>
        </Field>
        {form.examScope === 'trial' ? (
          <Field label="Chứng chỉ *">
            <select value={form.certificateId} onChange={(e) => set('certificateId', e.target.value)} className={FIELD_CLASS}>
              <option value="">— Chọn chứng chỉ —</option>
              {(certificates.data ?? []).map((c) => (
                <option key={c.certificateId} value={c.certificateId}>
                  {c.certificateName}
                </option>
              ))}
            </select>
          </Field>
        ) : (
          <Field label="Khóa học *">
            <select value={form.courseId} onChange={(e) => set('courseId', e.target.value)} className={FIELD_CLASS}>
              <option value="">— Chọn khóa học —</option>
              {(courses.data ?? []).map((c) => (
                <option key={c.courseId} value={c.courseId}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Tiêu đề *" className="sm:col-span-2">
          <input value={form.examTitle} onChange={(e) => set('examTitle', e.target.value)} className={FIELD_CLASS} />
        </Field>
        <Field label="Mã đề">
          <input
            value={form.examCode}
            onChange={(e) => set('examCode', e.target.value)}
            className={FIELD_CLASS}
            placeholder="VD: IELTS-MOCK-02"
          />
        </Field>
        <Field label="Loại đề">
          <select value={form.examType} onChange={(e) => set('examType', e.target.value as ExamType)} className={FIELD_CLASS}>
            {(Object.keys(EXAM_TYPE_LABEL) as ExamType[]).map((t) => (
              <option key={t} value={t}>
                {EXAM_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Thời lượng (phút) *">
          <input
            type="number"
            min={1}
            value={form.durationMinutes}
            onChange={(e) => set('durationMinutes', e.target.value)}
            className={FIELD_CLASS}
          />
        </Field>
        <Field label="Điểm đạt (%)">
          <input
            type="number"
            min={0}
            max={100}
            value={form.passingScore}
            onChange={(e) => set('passingScore', e.target.value)}
            className={FIELD_CLASS}
          />
        </Field>
        <Field label="Số lượt tối đa (0 = không giới hạn)">
          <input
            type="number"
            min={0}
            value={form.maxAttempts}
            onChange={(e) => set('maxAttempts', e.target.value)}
            className={FIELD_CLASS}
          />
        </Field>
        <Field label="Level gợi ý">
          <input
            value={form.recommendedLevel}
            onChange={(e) => set('recommendedLevel', e.target.value)}
            className={FIELD_CLASS}
            placeholder="VD: B1"
          />
        </Field>
        <Field label="Mô tả" className="sm:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={2}
            className={FIELD_CLASS}
          />
        </Field>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-4 text-sm text-slate-700">
          {form.examScope === 'trial' && <Checkbox label="Miễn phí" checked={form.isFree} onChange={(v) => set('isFree', v)} />}
          {form.examScope === 'trial' && !form.isFree && (
            <input
              type="number"
              min={0}
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className={`${FIELD_CLASS} !w-36`}
              aria-label="Giá (VND)"
              placeholder="Giá (VND)"
            />
          )}
          <Checkbox label="Cho xem điểm" checked={form.showScore} onChange={(v) => set('showScore', v)} />
          <Checkbox label="Cho xem đáp án" checked={form.showAnswers} onChange={(v) => set('showAnswers', v)} />
        </div>
        {(fieldError || create.error) && (
          <p className="sm:col-span-2 text-sm text-status-danger font-semibold">{fieldError ?? create.error?.message}</p>
        )}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Hủy
          </Button>
          <Button type="submit" isLoading={create.isPending}>
            Tạo đề
          </Button>
        </div>
      </form>
    </ExamModal>
  );
};

export default CreateExamModal;
