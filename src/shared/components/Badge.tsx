/**
 * Badge — Nhãn hiển thị trạng thái / role / chứng chỉ
 * -----------------------------------------------------------
 * Variants:
 *   - primary : Deep Academic Blue
 *   - ai      : Electric Violet (gradient nền nhạt)
 *   - ielts   : Đỏ nhạt (#FEE2E2 / text #B91C1C)
 *   - toeic   : Xanh dương nhạt (#EFF6FF / text #1D4ED8)
 *   - vstep   : Xanh ngọc (#ECFDF5 / text #047857)
 *   - success : Xanh lá
 *   - warning : Vàng
 *   - danger  : Đỏ
 *   - neutral : Xám
 */

import React from 'react';
import { cn } from '@/shared/utils/cn';

export type BadgeVariant =
  | 'primary'
  | 'ai'
  | 'ielts'
  | 'toeic'
  | 'vstep'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Icon nhỏ bên trái (Lucide component) */
  icon?: React.ElementType;
  /** Nội dung hiển thị */
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary/10 text-primary border border-primary/20',
  ai: 'bg-ai/10 text-ai border border-ai/20',
  ielts: 'bg-cert-ielts-bg text-cert-ielts-text border border-cert-ielts-border',
  toeic: 'bg-cert-toeic-bg text-cert-toeic-text border border-cert-toeic-border',
  vstep: 'bg-cert-vstep-bg text-cert-vstep-text border border-cert-vstep-border',
  success: 'bg-status-success-bg text-status-success border border-emerald-200',
  warning: 'bg-status-warning-bg text-status-warning border border-amber-200',
  danger: 'bg-status-danger-bg text-status-danger border border-red-200',
  neutral: 'bg-slate-100 text-slate-600 border border-slate-200',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'h-5 px-1.5 text-[10px] gap-1',
  md: 'h-6 px-2 text-xs gap-1.5',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-bold rounded-md uppercase tracking-wide whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  );
};

export default Badge;
