/**
 * Mảnh form dùng chung trong feature quản lý đề (Dev 3): Field, Checkbox, ExamModal.
 */

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export const FIELD_CLASS =
  'w-full px-3 py-2 rounded-input border border-slate-200 bg-white text-sm font-normal text-slate-800 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary';

export const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({
  label,
  className,
  children,
}) => (
  <label className={cn('block text-xs font-bold text-slate-600 space-y-1', className)}>
    <span>{label}</span>
    {children}
  </label>
);

export const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({
  label,
  checked,
  onChange,
}) => (
  <label className="inline-flex items-center gap-2 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-4 h-4 accent-primary"
    />
    {label}
  </label>
);

/** Textarea tự cao lên theo nội dung để người soạn thấy hết đoạn đang viết. */
export const AutoGrowTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({
  className,
  value,
  ...props
}) => {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} value={value} className={cn(className, 'resize-none overflow-hidden')} {...props} />;
};

interface ExamModalProps {
  title: string;
  onClose: () => void;
  /** Khóa đóng khi đang gửi */
  isDismissDisabled?: boolean;
  children: React.ReactNode;
}

export const ExamModal: React.FC<ExamModalProps> = ({ title, onClose, isDismissDisabled, children }) => (
  <div
    className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={() => !isDismissDisabled && onClose()}
  >
    <div
      className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          disabled={isDismissDisabled}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </div>
  </div>
);
