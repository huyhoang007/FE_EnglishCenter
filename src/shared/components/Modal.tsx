/**
 * Modal — hộp thoại dùng chung
 * -----------------------------------------------------------
 * Chuẩn hoá cho toàn hệ thống:
 *   - Backdrop mờ (slate-900/50) + blur nhẹ
 *   - Panel bo góc 24px (rounded-3xl), viền slate-100, shadow-2xl
 *   - Tự khoá cuộn body khi mở + đóng bằng phím ESC
 *   - Click backdrop để đóng (trừ khi `dismissible={false}`)
 *
 * Dùng:
 *   <Modal open={open} onClose={close} title="..." >
 *     …
 *   </Modal>
 */

import React, { useCallback, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Tiêu đề hiển thị ở header. */
  title?: React.ReactNode;
  /** Mô tả phụ dưới tiêu đề. */
  subtitle?: React.ReactNode;
  /** Icon hiển thị bên trái tiêu đề. */
  icon?: React.ElementType;
  /** Class cho icon wrapper (màu nền + màu chữ). */
  iconClassName?: string;
  /** Bề rộng tối đa — xem `maxWidthMap`. */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Cho phép đóng bằng ESC / click backdrop. */
  dismissible?: boolean;
  /** Ẩn nút X ở góc trên. */
  hideCloseButton?: boolean;
  /** Class thêm cho panel. */
  panelClassName?: string;
  /** Class thêm cho phần body (bỏ padding mặc định). */
  bodyClassName?: string;
}

const maxWidthMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
} as const;

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  children,
  title,
  subtitle,
  icon: Icon,
  iconClassName = 'bg-blue-50 text-[#0052CC]',
  maxWidth = 'md',
  dismissible = true,
  hideCloseButton = false,
  panelClassName,
  bodyClassName,
}) => {
  // Đóng bằng ESC.
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, dismissible, onClose]);

  // Khoá cuộn trang nền khi modal mở.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const handleBackdrop = useCallback(() => {
    if (dismissible) onClose();
  }, [dismissible, onClose]);

  if (!open) return null;

  const hasHeader = Boolean(title || subtitle || Icon || !hideCloseButton);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      onClick={handleBackdrop}
      role="presentation"
    >
      <div
        className={cn(
          'bg-white rounded-3xl w-full shadow-2xl border border-slate-100',
          'max-h-[90vh] flex flex-col overflow-hidden',
          maxWidthMap[maxWidth],
          panelClassName,
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {hasHeader && (
          <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    iconClassName,
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
              )}
              {(title || subtitle) && (
                <div className="min-w-0">
                  {title && (
                    <h3 className="text-lg font-bold text-slate-900 truncate">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-slate-500 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>

            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className={cn('px-6 py-5 overflow-y-auto flex-1', bodyClassName)}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
