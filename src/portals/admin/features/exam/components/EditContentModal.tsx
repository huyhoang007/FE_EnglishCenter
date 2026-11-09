/**
 * EditContentModal — sửa nội dung hiển thị của câu hỏi / phần thi (Dev 3)
 * -----------------------------------------------------------
 * Dùng được cả khi đề đã công khai và có lượt thi: chỉ sửa chữ, giải thích, đoạn đọc, link audio / ảnh.
 * Đề nháp chưa có lượt thi: thêm ô điểm (điểm câu / điểm mỗi câu của cả phần) — ô kiểu number.
 * Đáp án, dạng câu không sửa ở đây; đề đã có lượt thi thì không đổi điểm (lệch kết quả cũ) — cần thì nhân bản đề.
 */

import React, { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { AutoGrowTextarea, ExamModal, FIELD_CLASS, Field } from './ExamFormParts';

export interface ContentField {
  key: string;
  label: string;
  value?: string;
  multiline?: boolean;
  /** Không được để trống (VD nội dung câu hỏi, tên phần thi) */
  required?: boolean;
  /** Ô số (VD điểm): phải là số > 0 nếu có nhập */
  numeric?: boolean;
  placeholder?: string;
  hint?: string;
}

interface EditContentModalProps {
  title: string;
  fields: ContentField[];
  isSaving: boolean;
  serverError?: string;
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
  /** Dòng ghi chú đầu form */
  note?: string;
}

export const EditContentModal: React.FC<EditContentModalProps> = ({
  title,
  fields,
  isSaving,
  serverError,
  onSave,
  onClose,
  note = 'Sửa được cả khi đề đã có lượt thi. Đáp án, điểm và dạng câu không đổi ở đây; muốn đổi thì dùng “Nhân bản đề”.',
}) => {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value ?? ''])),
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !values[f.key]?.trim());
    if (missing) return setFieldError(`Nhập ${missing.label.toLowerCase()}`);
    const badNumber = fields.find((f) => f.numeric && values[f.key]?.trim() && !(Number(values[f.key]) > 0));
    if (badNumber) return setFieldError(`${badNumber.label} phải là số lớn hơn 0`);
    setFieldError(null);
    // Chỉ gửi các ô đã đổi
    const changed = Object.fromEntries(
      fields.filter((f) => (values[f.key] ?? '') !== (f.value ?? '')).map((f) => [f.key, values[f.key].trim()]),
    );
    if (Object.keys(changed).length === 0) return onClose();
    onSave(changed);
  };

  return (
    <ExamModal title={title} onClose={onClose} isDismissDisabled={isSaving}>
      <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
        <p className="text-xs text-slate-500">{note}</p>
        {fields.map((f) => (
          <Field key={f.key} label={f.label + (f.required ? ' *' : '')}>
            {f.multiline ? (
              <AutoGrowTextarea
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                rows={3}
                className={FIELD_CLASS}
              />
            ) : (
              <input
                type={f.numeric ? 'number' : 'text'}
                min={f.numeric ? 0.5 : undefined}
                step={f.numeric ? 0.5 : undefined}
                placeholder={f.placeholder}
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className={`${FIELD_CLASS} h-10`}
              />
            )}
            {f.hint && <span className="mt-1 block text-xs text-slate-500">{f.hint}</span>}
          </Field>
        ))}
        {(fieldError || serverError) && (
          <p className="text-sm text-status-danger font-semibold" role="alert">
            {fieldError ?? serverError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Lưu
          </Button>
        </div>
      </form>
    </ExamModal>
  );
};

export default EditContentModal;
