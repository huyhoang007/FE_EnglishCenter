/**
 * CreateExamModal — tạo đề mới, luôn ở trạng thái nháp (Dev 3)
 * -----------------------------------------------------------
 * Luôn chọn chứng chỉ trước (IELTS / TOEIC / VSTEP…) → hiện thang điểm của chứng chỉ.
 * Thang điểm và điểm đạt lấy tự động theo chứng chỉ (VD IELTS 5.5), admin không nhập; FE đổi sang % cho backend.
 * trial: chỉ cần chứng chỉ, chỉ dùng cho Kiểm tra đầu vào (thi thử đầy đủ nằm ở Luyện tập AI);
 * course: chọn thêm khóa học thuộc chứng chỉ đó, loại đề là Quiz / Giữa kỳ / Cuối kỳ (đề đầu ra của khóa, mở nối tiếp).
 * Mô tả bắt buộc, tối thiểu MIN_DESCRIPTION ký tự — BE chặn tương tự (5028 / 5029).
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { passToPercent } from '@/shared/constants/examScales';
import { useCertificateScale } from '@/portals/client/features/exams/hooks/useCertificateScale';
import { EXAM_TYPE_LABEL, type ExamScope, type ExamType } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { useCreateExam, useExamFormOptions } from '../hooks/useAdminExams';
import { Checkbox, ExamModal, FIELD_CLASS, Field } from './ExamFormParts';

/** Khớp ExamServiceImpl.MIN_DESCRIPTION_LENGTH */
const MIN_DESCRIPTION = 30;

/** Loại đề được phép theo phạm vi — khớp ExamServiceImpl.validateType */
const TYPES_BY_SCOPE: Partial<Record<ExamScope, ExamType[]>> = {
  trial: ['placement_test'],
  course: ['quiz', 'midterm', 'final'],
};

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
  const scale = useCertificateScale(form.certificateId);
  const courseOptions = useMemo(
    () => (courses.data ?? []).filter((c) => c.certificateId === form.certificateId),
    [courses.data, form.certificateId],
  );

  /** Đổi chứng chỉ: bỏ khóa học không còn thuộc chứng chỉ. */
  const changeCertificate = (certificateId: string) => setForm((f) => ({ ...f, certificateId, courseId: '' }));
  /** Đổi phạm vi: loại đề về loại đầu tiên hợp lệ của phạm vi mới. */
  const changeScope = (examScope: ExamScope) =>
    setForm((f) => ({ ...f, examScope, examType: (TYPES_BY_SCOPE[examScope] ?? ['placement_test'])[0] }));
  const typeOptions = TYPES_BY_SCOPE[form.examScope] ?? [];
  const descriptionLength = form.description.trim().length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.certificateId) return setFieldError('Chọn chứng chỉ của đề');
    if (form.examScope === 'course' && !form.courseId) return setFieldError('Đề khóa học phải chọn khóa học');
    if (!form.examTitle.trim()) return setFieldError('Nhập tiêu đề đề thi');
    if (descriptionLength < MIN_DESCRIPTION) {
      return setFieldError(`Mô tả tối thiểu ${MIN_DESCRIPTION} ký tự: ghi rõ đề gồm những phần nào, dành cho ai`);
    }
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
        description: form.description.trim(),
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
            onChange={(e) => changeScope(e.target.value as ExamScope)}
            className={FIELD_CLASS}
          >
            <option value="trial">Kiểm tra đầu vào</option>
            <option value="course">Đề đầu ra của khóa học</option>
          </select>
        </Field>
        <p className="sm:col-span-2 -mt-2 text-xs text-slate-500">
          {form.examScope === 'trial'
            ? 'Học viên làm để xác định năng lực hiện tại. Đề thi thử đầy đủ tạo ở mục Luyện tập AI.'
            : 'Chỉ học viên đã mua khóa mới thấy đề. Thi nối tiếp: Giữa kỳ mở khi đã đạt hết Quiz của khóa; Cuối kỳ mở khi đã đạt Giữa kỳ và đạt đủ bài tập.'}
        </p>

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
          <select
            value={form.examType}
            onChange={(e) => set('examType', e.target.value as ExamType)}
            className={FIELD_CLASS}
            disabled={typeOptions.length < 2}
          >
            {typeOptions.map((t) => (
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
        <Field label="Mô tả *" className="sm:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className={FIELD_CLASS}
            placeholder="VD: Đề cuối kỳ khóa IELTS Foundation: Listening 2 part, Reading 1 bài đọc, Writing Task 2. Làm trong 60 phút, đạt từ band 5.0."
          />
          <span
            className={cn(
              'mt-1 block text-xs',
              descriptionLength >= MIN_DESCRIPTION ? 'text-emerald-600' : 'text-slate-500',
            )}
          >
            {descriptionLength}/{MIN_DESCRIPTION} ký tự tối thiểu — ghi rõ đề gồm những phần nào, dành cho ai
          </span>
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
