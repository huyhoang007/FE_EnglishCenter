/**
 * LanguageToggle — nút gạt nhanh EN ↔ VI
 * -----------------------------------------------------------
 * Dùng chung cho Admin Layout (và có thể dùng ở Client Header).
 * Đặt trong nhóm `flex items-center` với nền trắng + viền slate để khớp
 * phong cách Admin Layout (bo góc hiện đại, shadow-2xs).
 *
 * Không dùng `useTranslation` bên trong để tránh phụ thuộc vòng lặp:
 * component nhận props đơn giản, hoặc dùng hook trực tiếp — ở đây ta
 * dùng hook để component tự quản lý được hoàn toàn.
 */

import React from 'react';
import { Languages } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import { LOCALE_LABEL, type Locale } from '@/shared/i18n/config';

export interface LanguageToggleProps {
  className?: string;
  /** Ẩn icon Globe (mặc định hiện). */
  hideIcon?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  className,
  hideIcon = false,
}) => {
  const { locale, toggleLocale, t } = useTranslation();

  const next: Locale = locale === 'en' ? 'vi' : 'en';
  const title =
    next === 'en' ? t('lang.switchToEn') : t('lang.switchToVi');

  return (
    <button
      type="button"
      onClick={toggleLocale}
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl',
        'bg-white border border-slate-200/80 text-slate-600',
        'hover:text-[#0052CC] hover:border-[#0052CC]/40 hover:bg-slate-50',
        'transition-colors shadow-2xs',
        className,
      )}
    >
      {!hideIcon && (
        <Languages className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
      )}
      <span className="text-[10px] font-extrabold uppercase tracking-wider">
        {LOCALE_LABEL[locale]}
      </span>
    </button>
  );
};

export default LanguageToggle;
