/**
 * Skeleton & State placeholders — dùng chung cho mọi màn hình
 * -----------------------------------------------------------
 * Loading: hiển thị khung xám shimmer thay vì spinner trần, giữ
 * đúng nhịp thị giác với card thật (cùng chiều cao/bố cục).
 */

import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';

/** Khối xám shimmer. */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-lg bg-slate-200/70',
      'after:absolute after:inset-0 after:-translate-x-full',
      'after:animate-[shimmer_1.6s_infinite]',
      'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
      className,
    )}
    aria-hidden="true"
  />
);

/** Skeleton thẻ khóa học — giữ đúng tỷ lệ với CourseCard thật. */
export const SkeletonCourseCard: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
    <Skeleton className="h-40 rounded-none" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="h-3.5 w-3/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
    </div>
  </div>
);

/** Trạng thái rỗng — có icon + mô tả + hành động tuỳ chọn. */
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}> = ({ title, description, actionLabel, onAction, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center',
      'py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-300',
      className,
    )}
  >
    <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Inbox className="w-6 h-6 text-slate-400" />
    </div>
    <p className="font-bold text-slate-900 text-sm">{title}</p>
    {description && (
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
        {description}
      </p>
    )}
    {actionLabel && onAction && (
      <Button
        variant="outline"
        size="sm"
        className="mt-5"
        onClick={onAction}
        leftIcon={RefreshCw}
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

/** Trạng thái lỗi API — hiện message thật từ backend. */
export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ message, onRetry, className }) => (
  <div
    className={cn(
      'flex flex-col items-center justify-center text-center',
      'py-14 px-6 bg-white rounded-2xl border border-rose-200',
      className,
    )}
    role="alert"
  >
    <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
      <AlertTriangle className="w-6 h-6 text-rose-500" />
    </div>
    <p className="font-bold text-slate-900 text-sm">
      Không tải được dữ liệu
    </p>
    <p className="text-xs text-slate-500 mt-1.5 max-w-md leading-relaxed">
      {message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.'}
    </p>
    {onRetry && (
      <Button
        variant="outline"
        size="sm"
        className="mt-5"
        onClick={onRetry}
        leftIcon={RefreshCw}
      >
        Thử lại
      </Button>
    )}
  </div>
);

/** Phân trang — khớp PageResponse của backend (currentPage 0-based). */
export const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}> = ({ currentPage, totalPages, onChange, className }) => {
  if (totalPages <= 1) return null;

  // Cửa sổ trang: luôn giữ trang đầu/cuối, rút gọn giữa bằng …
  const pages: (number | 'gap')[] = [];
  const push = (n: number | 'gap') => pages.push(n);
  const windowSize = 1;
  for (let p = 0; p < totalPages; p++) {
    if (
      p === 0 ||
      p === totalPages - 1 ||
      Math.abs(p - currentPage) <= windowSize
    ) {
      push(p);
    } else if (pages[pages.length - 1] !== 'gap') {
      push('gap');
    }
  }

  return (
    <nav
      className={cn('flex items-center justify-center gap-1.5', className)}
      aria-label="Phân trang"
    >
      <button
        type="button"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 0}
        className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Trước
      </button>

      {pages.map((p, i) =>
        p === 'gap' ? (
          <span
            key={`gap-${i}`}
            className="w-7 text-center text-slate-400 text-xs select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            className={cn(
              'h-9 min-w-9 px-2.5 rounded-xl text-xs font-bold transition-colors',
              p === currentPage
                ? 'bg-[#0052CC] text-white shadow-xs'
                : 'text-slate-600 border border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            {p + 1}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage >= totalPages - 1}
        className="h-9 px-3 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Sau
      </button>
    </nav>
  );
};