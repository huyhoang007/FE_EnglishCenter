/**
 * i18n — cấu hình ngôn ngữ
 * -----------------------------------------------------------
 * Kiểu uốn ngữ (locale) được hỗ trợ: 'en' | 'vi'.
 *
 * `dictionary` map 1-1 với key của `en.ts`; `vi.ts` bắt buộc implement
 * đúng `TranslationKey` nên không thể thiếu/thừa key mà không bị TS báo lỗi.
 */

import en, { type TranslationKey } from './dictionaries/en';
import vi from './dictionaries/vi';

export type Locale = 'en' | 'vi';

export const LOCALES: Locale[] = ['en', 'vi'];

export const DEFAULT_LOCALE: Locale = 'en';

/** Key lưu locale hiện tại trong localStorage. */
export const LOCALE_STORAGE_KEY = 'prepmaster-locale';

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  vi,
};

/** Nhãn hiển thị trên nút gạt ngôn ngữ. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  vi: 'VI',
};

export type { TranslationKey };
