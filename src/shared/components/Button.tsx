/**
 * Button — Nút bấm chuẩn của dự án PrepMaster AI
 * -----------------------------------------------------------
 * Variants:
 *   - primary : Deep Academic Blue (#2563EB), text trắng
 *   - ai      : Gradient Blue→Violet (#2563EB→#7C3AED), text trắng, có glow
 *   - outline : Viền slate, nền trắng
 *   - ghost   : Trong suốt, hover nền nhạt
 *   - danger  : Đỏ, dùng cho thao tác phá hoại (xóa, đăng xuất…)
 *
 * Sizes:
 *   - sm | md | lg | icon
 *
 * Border-radius: rounded-input (10px)
 */

import React from 'react';
import { cn } from '@/shared/utils/cn';

export type ButtonVariant =
  | 'primary'
  | 'ai'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'secondary'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Hiển thị spinner và disable khi đang loading */
  isLoading?: boolean;
  /** Icon bên trái (Lucide component) */
  leftIcon?: React.ElementType;
  /** Icon bên phải (Lucide component) */
  rightIcon?: React.ElementType;
  /** Full width */
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md focus:ring-2 focus:ring-primary/30',
  ai:
    'bg-ai-gradient text-white shadow-ai-glow hover:opacity-95 focus:ring-2 focus:ring-ai/30',
  outline:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-2 focus:ring-slate-200',
  ghost:
    'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-2 focus:ring-slate-200',
  danger:
    'bg-status-danger text-white hover:bg-red-600 shadow-sm focus:ring-2 focus:ring-red-300',
  secondary:
    'bg-primary-tint text-primary hover:bg-blue-100 focus:ring-2 focus:ring-primary/20',
  success:
    'bg-status-success text-white hover:bg-emerald-600 shadow-sm focus:ring-2 focus:ring-emerald-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-10 w-10 p-0 justify-center',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  fullWidth = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        // Base
        'inline-flex items-center justify-center font-semibold rounded-input whitespace-nowrap select-none',
        'transition-all duration-150 ease-out',
        'focus:outline-none',
        'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
        // Variant
        variantClasses[variant],
        // Size
        sizeClasses[size],
        // Width
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <span
            className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin"
            aria-hidden="true"
          />
          <span>Đang xử lý…</span>
        </>
      ) : (
        <>
          {LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" aria-hidden="true" />}
          {children}
          {RightIcon && <RightIcon className="w-4 h-4 shrink-0" aria-hidden="true" />}
        </>
      )}
    </button>
  );
};

export default Button;
