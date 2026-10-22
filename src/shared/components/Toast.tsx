/**
 * Toast — hệ thống thông báo nhẹ, không phụ thuộc thư viện ngoài
 * -----------------------------------------------------------
 * Dự án chưa cài sonner / react-hot-toast nên tự build một store
 * nhỏ gắn qua React Context, giữ đúng ngôn ngữ thị giác của
 * Layout mới (bo góc 16px, shadow mềm, font Be Vietnam Pro).
 *
 * Cách dùng:
 *   const toast = useToast();
 *   toast.success('Đã lưu');
 *   toast.error(err.message);
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: React.ElementType; iconClass: string; ringClass: string }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
    ringClass: 'border-emerald-200',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-500',
    ringClass: 'border-rose-200',
  },
  info: {
    icon: Info,
    iconClass: 'text-[#0052CC]',
    ringClass: 'border-blue-200',
  },
};

const AUTO_DISMISS_MS = 4000;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, variant, message }]);
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (m: string) => push('success', m),
      error: (m: string) => push('error', m),
      info: (m: string) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const { icon: Icon, iconClass, ringClass } =
            VARIANT_STYLES[t.variant];
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-2xl bg-white',
                'border px-4 py-3 shadow-lg animate-[fadeIn_.18s_ease-out]',
                ringClass,
              )}
            >
              <Icon className={cn('w-5 h-5 shrink-0 mt-px', iconClass)} />
              <p className="text-sm text-slate-700 leading-snug flex-1">
                {t.message}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-slate-400 hover:text-slate-600 shrink-0"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

/** Hook lấy toast. Ném lỗi rõ ràng nếu chưa bọc ToastProvider. */
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast phải được dùng bên trong <ToastProvider>');
  }
  return ctx;
};