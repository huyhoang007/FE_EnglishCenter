/**
 * Form atoms — ô input / textarea / select / checkbox dùng chung
 * -----------------------------------------------------------
 * Chuẩn hoá style cho Admin Layout: bo góc rounded-xl, viền slate-200,
 * focus viền #0052CC, viền đỏ khi invalid.
 *
 * Tách riêng file để `CourseContentModal` (dynamic theo contentType) dùng
 * chung, tránh lặp lại class.
 */

import React from 'react';
import { cn } from '@/shared/utils/cn';

/* =========================================================
 * Class helper
 * ========================================================= */
export const formInputCls = (invalid?: boolean) =>
  cn(
    'w-full h-10 px-3 rounded-xl border text-sm outline-none transition-colors',
    'placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400',
    invalid
      ? 'border-rose-300 focus:border-rose-400'
      : 'border-slate-200 focus:border-[#0052CC]',
  );

/* =========================================================
 * Field — nhãn + lỗi
 * ========================================================= */
export interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  required,
  error,
  hint,
  children,
  className,
}) => (
  <div className={className}>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error ? (
      <p className="text-[11px] text-rose-500 mt-1">{error}</p>
    ) : hint ? (
      <p className="text-[11px] text-slate-400 mt-1">{hint}</p>
    ) : null}
  </div>
);

/* =========================================================
 * TextInput
 * ========================================================= */
export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className'> {
  invalid?: boolean;
  className?: string;
}

export const TextInput: React.FC<TextInputProps> = ({
  invalid,
  className,
  ...props
}) => (
  <input
    {...props}
    className={cn(formInputCls(invalid), className)}
  />
);

/* =========================================================
 * TextArea
 * ========================================================= */
export interface TextAreaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    'className'
  > {
  invalid?: boolean;
  className?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  invalid,
  className,
  rows = 3,
  ...props
}) => (
  <textarea
    rows={rows}
    {...props}
    className={cn(
      formInputCls(invalid),
      'h-auto py-2 leading-relaxed resize-y',
      className,
    )}
  />
);

/* =========================================================
 * Select
 * ========================================================= */
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  invalid?: boolean;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  invalid,
  className,
  children,
  ...props
}) => (
  <select
    {...props}
    className={cn(formInputCls(invalid), 'pr-8 cursor-pointer', className)}
  >
    {children}
  </select>
);

/* =========================================================
 * Checkbox
 * ========================================================= */
export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled,
}) => (
  <label
    className={cn(
      'flex items-start gap-2.5 cursor-pointer select-none',
      disabled && 'opacity-50 cursor-not-allowed',
    )}
  >
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]/30 cursor-pointer"
    />
    <span className="min-w-0">
      <span className="block text-sm font-semibold text-slate-700">{label}</span>
      {description && (
        <span className="block text-[11px] text-slate-500 mt-0.5">
          {description}
        </span>
      )}
    </span>
  </label>
);
