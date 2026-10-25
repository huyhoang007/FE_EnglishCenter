/**
 * i18n — Provider + hook `useTranslation`
 * -----------------------------------------------------------
 * Dùng React Context để chia sẻ locale hiện tại. Locale được lưu trong
 * localStorage để giữ nguyên lựa chọn của admin khi F5.
 *
 * Cách dùng:
 *   const { t, locale, setLocale, toggleLocale } = useTranslation();
 *   <h1>{t('vocab.modal.title')}</h1>
 *   <button onClick={toggleLocale}>{locale === 'en' ? 'VI' : 'EN'}</button>
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_LOCALE,
  dictionaries,
  LOCALES,
  LOCALE_STORAGE_KEY,
  type Locale,
  type TranslationKey,
} from './config';
import { interpolate, type TranslationValues } from './interpolate';

export interface I18nContextValue {
  /** Ngôn ngữ hiện tại. */
  locale: Locale;
  /** Đổi ngôn ngữ. */
  setLocale: (next: Locale) => void;
  /** Đảo giữa EN ↔ VI (dùng cho nút gạt nhanh). */
  toggleLocale: () => void;
  /** Dịch một key + nội suy placeholder. */
  t: (key: TranslationKey, values?: TranslationValues) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Đọc locale đã lưu, fallback về mặc định nếu dữ liệu hỏng. */
function readStoredLocale(): Locale {
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return raw && (LOCALES as string[]).includes(raw)
      ? (raw as Locale)
      : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  // Ghi lại localStorage mỗi khi đổi.
  useEffect(() => {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* ignore storage failures */
    }
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'en' ? 'vi' : 'en'));
  }, []);

  const t = useCallback(
    (key: TranslationKey, values?: TranslationValues) =>
      interpolate(dictionaries[locale][key], values),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
};

/** Hook lấy hàm dịch. Ném lỗi rõ ràng nếu chưa bọc `<I18nProvider>`. */
export const useTranslation = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error(
      'useTranslation phải được dùng bên trong <I18nProvider>',
    );
  }
  return ctx;
};

export default I18nProvider;
