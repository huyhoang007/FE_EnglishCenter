/**
 * EditContentModal — sửa nội dung hiển thị của câu hỏi / phần thi (Dev 3)
 * -----------------------------------------------------------
 * Dùng được cả khi đề đã công khai và có lượt thi: chỉ sửa chữ, giải thích, đoạn đọc, link audio / ảnh.
 * Đáp án, điểm, dạng câu không sửa ở đây (đổi sẽ làm lệch kết quả cũ) — cần sửa thì nhân bản đề.
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
}

interface EditContentModalProps {
  title: string;
  fields: ContentField[];
  isSaving: boolean;
  serverError?: string;
  onSave: (values: Record<string, string>) => void;
  onClose: () => void;
}

export const EditContentModal: React.FC<EditContentModalProps> = ({
  title,
  fields,
  isSaving,
  serverError,
  onSave,
  onClose,
}) => {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value ?? ''])),
  );
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !values[f.key]?.trim());
    if (missing) return setFieldError(`Nhập ${missing.label.toLowerCase()}`);
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
        <p className="text-xs text-slate-500">
          Sửa được cả khi đề đã có lượt thi. Đáp án, điểm và dạng câu không đổi ở đây; muốn đổi thì dùng “Nhân bản đề”.
        </p>
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
                value={values[f.key]}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className={`${FIELD_CLASS} h-10`}
              />
            )}
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
