/**
 * HomeworkFormModal — Mentor tạo / sửa bài tập riêng (Dev 5, V27)
 * -----------------------------------------------------------
 * Thường mở sau "Import PDF": AI đã điền sẵn tên, đề bài, hình thức nộp, điểm tối đa;
 * file PDF gốc được đính kèm để học viên xem → mentor chỉ cần chỉnh hạn nộp / điểm đạt rồi lưu.
 * - Hạn nộp tính theo SỐ NGÀY kể từ khi học viên ghi danh lộ trình chứa bài (bài dùng chung cho cả lộ trình).
 * - Đã có học viên nộp: không đổi hình thức nộp / điểm tối đa (BE trả HOMEWORK_LOCKED).
 * Khớp validate BE MentorHomeworkRequest.
 */

import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import { AttachmentUpload } from '@/portals/admin/features/course/components/AttachmentUpload';
import type {
  HomeworkAiDraft,
  MentorHomework,
  MentorHomeworkPayload,
  MentorHomeworkSubmissionType,
} from '@/shared/types/homework.types';
import { useSaveMentorHomework } from './hooks/useMentorHomework';

const INPUT_CLASS =
  'w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#0052CC] disabled:bg-slate-50 disabled:text-slate-500';
const LABEL_CLASS = 'text-xs text-slate-500 font-semibold uppercase tracking-wider';

export const SUBMISSION_TYPE_LABEL: Record<MentorHomeworkSubmissionType, string> = {
  text: 'Gõ bài trả lời',
  file: 'Nộp file',
  audio: 'Ghi âm (Speaking)',
};

/** Đề bài đính kèm (file PDF gốc) */
export interface HomeworkAttachment {
  url: string;
  publicId: string;
  name: string;
}

interface FormState {
  title: string;
  instructions: string;
  submissionType: MentorHomeworkSubmissionType;
  maxScore: string;
  passingScore: string;
  dueDays: string;
  maxAttempts: string;
  allowedFileTypes: string;
  attachment: HomeworkAttachment | null;
}

const fromHomework = (hw: MentorHomework): FormState => ({
  title: hw.title,
  instructions: hw.instructions ?? '',
  submissionType: hw.submissionType,
  maxScore: String(hw.maxScore ?? 10),
  passingScore: hw.passingScore != null ? String(hw.passingScore) : '',
  dueDays: hw.dueDays != null ? String(hw.dueDays) : '',
  maxAttempts: hw.maxAttempts != null ? String(hw.maxAttempts) : '',
  allowedFileTypes: (hw.allowedFileTypes ?? ['pdf']).join(', '),
  attachment: hw.attachmentUrl
    ? { url: hw.attachmentUrl, publicId: hw.attachmentPublicId ?? '', name: hw.attachmentName ?? 'De-bai.pdf' }
    : null,
});

const fromDraft = (draft: HomeworkAiDraft | null, attachment: HomeworkAttachment | null): FormState => ({
  title: draft?.title ?? attachment?.name.replace(/\.pdf$/i, '') ?? '',
  instructions: draft?.instructions ?? '',
  submissionType: draft?.submissionType ?? 'text',
  maxScore: String(draft?.maxScore ?? 10),
  passingScore: '',
  dueDays: '7',
  maxAttempts: '',
  allowedFileTypes: 'pdf',
  attachment,
});

/** Tên file hiển thị luôn có đuôi .pdf (Cloudinary trả original_filename không kèm đuôi) */
export const withPdfExtension = (name?: string | null): string => {
  const base = (name ?? '').trim() || 'De-bai';
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`;
};

/** Số nguyên trong [min, max]; '' = không nhập */
const intError = (value: string, min: number, max: number, label: string): string => {
  if (!value.trim()) return '';
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? '' : `${label} từ ${min} đến ${max}`;
};

export const HomeworkFormModal: React.FC<{
  open: boolean;
  /** Bài đang sửa; null = tạo mới */
  editing: MentorHomework | null;
  /** Bản nháp AI đọc từ PDF (tạo mới) */
  draft?: HomeworkAiDraft | null;
  /** File PDF đề vừa upload (tạo mới) */
  attachment?: HomeworkAttachment | null;
  onClose: () => void;
}> = ({ open, editing, draft = null, attachment = null, onClose }) => {
  const toast = useToast();
  const saveMutation = useSaveMentorHomework();
  const [form, setForm] = useState<FormState>(() => fromDraft(draft, attachment));
  const [touched, setTouched] = useState(false);
  const locked = (editing?.submissionCount ?? 0) > 0;

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromHomework(editing) : fromDraft(draft, attachment));
    setTouched(false);
  }, [open, editing, draft, attachment]);

  const update = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }));

  /* ---------- Validate (khớp BE) ---------- */
  const maxScoreNumber = Number(form.maxScore);
  const errors = {
    title: !form.title.trim() ? 'Nhập tên bài tập' : form.title.trim().length > 255 ? 'Tối đa 255 ký tự' : '',
    instructions:
      !form.instructions.trim() && !form.attachment
        ? 'Nhập đề bài hoặc đính kèm file PDF đề'
        : form.instructions.length > 20000
          ? 'Tối đa 20000 ký tự'
          : '',
    maxScore: !(maxScoreNumber >= 1 && maxScoreNumber <= 100) ? 'Điểm tối đa từ 1 đến 100' : '',
    passingScore:
      form.passingScore.trim() && !(Number(form.passingScore) >= 0 && Number(form.passingScore) <= 100)
        ? 'Điểm đạt từ 0 đến 100%'
        : '',
    dueDays: intError(form.dueDays, 1, 365, 'Hạn nộp'),
    maxAttempts: intError(form.maxAttempts, 1, 10, 'Số lần nộp'),
  };
  const hasError = Object.values(errors).some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;
    const fileTypes = form.allowedFileTypes
      .split(',')
      .map((t) => t.trim().replace(/^\./, '').toLowerCase())
      .filter(Boolean);
    const payload: MentorHomeworkPayload = {
      title: form.title.trim(),
      instructions: form.instructions.trim() || undefined,
      submissionType: form.submissionType,
      maxScore: maxScoreNumber,
      passingScore: form.passingScore.trim() ? Number(form.passingScore) : undefined,
      dueDays: form.dueDays.trim() ? Number(form.dueDays) : undefined,
      maxAttempts: form.maxAttempts.trim() ? Number(form.maxAttempts) : undefined,
      allowedFileTypes: form.submissionType === 'file' && fileTypes.length > 0 ? fileTypes : undefined,
      attachmentUrl: form.attachment?.url,
      attachmentName: form.attachment?.name,
      attachmentPublicId: form.attachment?.publicId || undefined,
    };
    saveMutation.mutate(
      { contentId: editing?.contentId, payload },
      {
        onSuccess: () => {
          toast.success(editing ? 'Đã cập nhật bài tập' : 'Đã tạo bài tập, giờ có thể gắn vào lộ trình');
          onClose();
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const fieldError = (msg: string) =>
    touched && msg ? <p className="text-[11px] text-rose-600 font-semibold mt-1">{msg}</p> : null;

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Sửa bài tập' : 'Tạo bài tập'} maxWidth="xl"
      subtitle="Chỉ học viên đã mua gói kèm 1-1 và ghi danh lộ trình chứa bài mới thấy bài này; mentor 1-1 của học viên chấm tay.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-3">
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Tên bài tập *</span>
            <input
              value={form.title}
              maxLength={255}
              onChange={(e) => update({ title: e.target.value })}
              className={cn(INPUT_CLASS, touched && errors.title && 'border-rose-400')}
            />
            {fieldError(errors.title)}
          </label>
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Hình thức nộp *</span>
            <select
              value={form.submissionType}
              disabled={locked}
              onChange={(e) => update({ submissionType: e.target.value as MentorHomeworkSubmissionType })}
              className={INPUT_CLASS}
            >
              {(Object.keys(SUBMISSION_TYPE_LABEL) as MentorHomeworkSubmissionType[]).map((t) => (
                <option key={t} value={t}>
                  {SUBMISSION_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Điểm tối đa *</span>
            <input type="number" min={1} max={100} value={form.maxScore} disabled={locked}
              onChange={(e) => update({ maxScore: e.target.value })}
              className={cn(INPUT_CLASS, touched && errors.maxScore && 'border-rose-400')} />
            {fieldError(errors.maxScore)}
          </label>
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Điểm đạt (%)</span>
            <input type="number" min={0} max={100} value={form.passingScore} placeholder="50"
              onChange={(e) => update({ passingScore: e.target.value })}
              className={cn(INPUT_CLASS, touched && errors.passingScore && 'border-rose-400')} />
            {fieldError(errors.passingScore)}
          </label>
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Hạn nộp (ngày)</span>
            <input type="number" min={1} max={365} value={form.dueDays} placeholder="Không hạn"
              onChange={(e) => update({ dueDays: e.target.value })}
              className={cn(INPUT_CLASS, touched && errors.dueDays && 'border-rose-400')} />
            {fieldError(errors.dueDays)}
          </label>
          <label className="space-y-1">
            <span className={LABEL_CLASS}>Số lần nộp</span>
            <input type="number" min={1} max={10} value={form.maxAttempts} placeholder="Không giới hạn"
              onChange={(e) => update({ maxAttempts: e.target.value })}
              className={cn(INPUT_CLASS, touched && errors.maxAttempts && 'border-rose-400')} />
            {fieldError(errors.maxAttempts)}
          </label>
        </div>
        <p className="text-[11px] text-slate-500 -mt-2">
          Hạn nộp tính từ ngày học viên ghi danh lộ trình chứa bài (VD 7 = trong 7 ngày sau khi ghi danh).
          {locked && ' Bài đã có học viên nộp nên không đổi được hình thức nộp và điểm tối đa.'}
        </p>

        {form.submissionType === 'file' && (
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Định dạng file được nộp</span>
            <input value={form.allowedFileTypes} onChange={(e) => update({ allowedFileTypes: e.target.value })}
              placeholder="pdf, docx" className={INPUT_CLASS} />
          </label>
        )}

        <div className="space-y-1">
          <span className={LABEL_CLASS}>File đề (PDF)</span>
          <AttachmentUpload
            label=""
            purpose="attachment"
            accept=".pdf"
            value={form.attachment?.url}
            fileName={form.attachment?.name}
            emptyLabel="Đính kèm file PDF đề"
            hint="Học viên xem / tải file này khi làm bài"
            onChange={(a) =>
              update({ attachment: { url: a.url, publicId: a.publicId, name: withPdfExtension(a.originalName) } })
            }
            onClear={() => update({ attachment: null })}
          />
        </div>

        <label className="block space-y-1">
          <span className={LABEL_CLASS}>Đề bài {form.attachment ? '(AI chấm dựa vào phần này)' : '*'}</span>
          <textarea
            rows={10}
            value={form.instructions}
            maxLength={20000}
            onChange={(e) => update({ instructions: e.target.value })}
            placeholder="Nội dung đề bài: câu hỏi, yêu cầu số từ, ghi chú…"
            className={cn(
              'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-[#0052CC]',
              touched && errors.instructions && 'border-rose-400',
            )}
          />
          {fieldError(errors.instructions)}
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="ghost" size="md" onClick={onClose}>
            Đóng
          </Button>
          <Button type="submit" variant="primary" size="md" leftIcon={Save} isLoading={saveMutation.isPending}>
            {editing ? 'Lưu thay đổi' : 'Tạo bài tập'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default HomeworkFormModal;
