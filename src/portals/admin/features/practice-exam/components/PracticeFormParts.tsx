/**
 * Mảnh form dùng chung của trang Đề luyện tập AI (giống CertificateManagementView): Field, ModalShell, inputCls.
 */

import React from 'react';
import { cn } from '@/shared/utils';

export const inputCls = (invalid: boolean) =>
  cn(
    'w-full h-10 px-3 rounded-xl border text-sm outline-none transition-colors bg-white',
    'placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400',
    invalid ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-[#0052CC]',
  );

export const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
  </div>
);

export const ModalShell: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
  /** Đang tạo đề: không cho bấm nền để đóng */
  isDismissDisabled?: boolean;
}> = ({ children, onClose, maxWidth = 'max-w-lg', isDismissDisabled }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    onClick={() => !isDismissDisabled && onClose()}
    role="presentation"
  >
    <div
      className={cn('bg-white rounded-3xl w-full p-6 shadow-2xl border border-slate-100', 'max-h-[90vh] overflow-y-auto', maxWidth)}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  </div>
);
