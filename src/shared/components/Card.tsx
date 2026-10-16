/**
 * Card — Surface chuẩn của dự án PrepMaster AI
 * -----------------------------------------------------------
 * - Bo góc `rounded-card` (16px)
 * - Nền trắng, border slate-200/80, shadow-elevation
 * - Hỗ trợ prop `hoverable` để có hiệu ứng nổi khi hover
 */

import React from 'react';
import { cn } from '@/shared/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Bật hiệu ứng hover (nổi + border đậm hơn) */
  hoverable?: boolean;
  /** Bỏ padding mặc định */
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  children,
  hoverable = false,
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-card border border-slate-200/80 shadow-elevation transition-all',
        !noPadding && 'p-6',
        hoverable && 'hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
