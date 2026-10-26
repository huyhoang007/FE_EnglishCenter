/**
 * CreateExamModal — tạo đề mới, luôn ở trạng thái nháp (Dev 3)
 * -----------------------------------------------------------
 * Luôn chọn chứng chỉ trước (IELTS / TOEIC / VSTEP…) → hiện thang điểm của chứng chỉ.
 * Thang điểm và điểm đạt lấy tự động theo chứng chỉ (VD IELTS 5.5), admin không nhập; FE đổi sang % cho backend.
 * trial: chỉ cần chứng chỉ; course: chọn thêm khóa học thuộc chứng chỉ đó.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { detectScale, passToPercent } from '@/shared/constants/examScales';
import { EXAM_TYPE_LABEL, type ExamScope, type ExamType } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
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
  maxAttempts: '1',
  recommendedLevel: '',
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

  const certificate = (certificates.data ?? []).find((c) => c.certificateId === form.certificateId);
  const scale = detectScale(certificate?.certificateName);
  const courseOptions = useMemo(
    () => (courses.data ?? []).filter((c) => c.certificateId === form.certificateId),
    [courses.data, form.certificateId],
  );

  /** Đổi chứng chỉ: bỏ khóa học không còn thuộc chứng chỉ. */
  const changeCertificate = (certificateId: string) => setForm((f) => ({ ...f, certificateId, courseId: '' }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.certificateId) return setFieldError('Chọn chứng chỉ của đề');
    if (form.examScope === 'course' && !form.courseId) return setFieldError('Đề khóa học phải chọn khóa học');
    if (!form.examTitle.trim()) return setFieldError('Nhập tiêu đề đề thi');
    if (Number(form.durationMinutes) < 1) return setFieldError('Thời lượng tối thiểu 1 phút');
    setFieldError(null);
    const isTrial = form.examScope === 'trial';
    create.mutate(
      {
        examScope: form.examScope,
        certificateId: form.certificateId,
        courseId: isTrial ? undefined : form.courseId,
        examCode: form.examCode.trim() || undefined,
        examType: form.examType,
        examTitle: form.examTitle.trim(),
        description: form.description.trim() || undefined,
        durationMinutes: Number(form.durationMinutes),
        // Điểm đạt lấy tự động theo chứng chỉ, backend lưu dạng %
        passingScore: passToPercent(scale, scale.defaultPass),
        maxAttempts: Number(form.maxAttempts),
        recommendedLevel: form.recommendedLevel.trim() || undefined,
        // Chưa có luồng thanh toán đề thi → đề thi thử luôn miễn phí
        isFree: isTrial ? true : undefined,
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
        <Field label="Chứng chỉ *">
          <select
            value={form.certificateId}
            onChange={(e) => changeCertificate(e.target.value)}
            className={FIELD_CLASS}
          >
            <option value="">— Chọn chứng chỉ —</option>
            {(certificates.data ?? []).map((c) => (
              <option key={c.certificateId} value={c.certificateId}>
                {c.certificateName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Phạm vi">
          <select
            value={form.examScope}
            onChange={(e) => set('examScope', e.target.value as ExamScope)}
            className={FIELD_CLASS}
          >
            <option value="trial">Thi thử chứng chỉ</option>
            <option value="course">Đề của khóa học</option>
          </select>
        </Field>

        {form.examScope === 'course' && (
          <Field label="Khóa học *" className="sm:col-span-2">
            <select
              value={form.courseId}
              onChange={(e) => set('courseId', e.target.value)}
              className={FIELD_CLASS}
              disabled={!form.certificateId}
            >
              <option value="">
                {!form.certificateId
                  ? '— Chọn chứng chỉ trước —'
                  : courseOptions.length
                    ? '— Chọn khóa học —'
                    : '— Chứng chỉ này chưa có khóa học —'}
              </option>
              {courseOptions.map((c) => (
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
            placeholder="VD: TOEIC-MOCK-01"
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
        <Field label="Điểm đạt (theo chứng chỉ)">
          <div className={cn(FIELD_CLASS, 'bg-slate-50 text-slate-600 font-semibold')}>
            {certificate ? `${scale.passLabel}: ${scale.defaultPass} / ${scale.passMax}` : 'Chọn chứng chỉ trước'}
          </div>
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
