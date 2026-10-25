/**
 * i18n — thay placeholder `{name}` trong chuỗi dịch.
 * -----------------------------------------------------------
 * `t('vocab.confirmDeleteBody', { word: 'Academic' })`
 *   → "“Academic” sẽ bị xoá vĩnh viễn khỏi khóa học. …"
 */

export type TranslationValues = Record<string, string | number>;

const PLACEHOLDER_RE = /\{(\w+)\}/g;

/**
 * Thay `{key}` bằng giá trị tương ứng trong `values`.
 * Placeholder không có giá trị sẽ được giữ nguyên (dễ phát hiện lỗi khi dev).
 */
export function interpolate(
  template: string,
  values?: TranslationValues,
): string {
  if (!values) return template;
  return template.replace(PLACEHOLDER_RE, (match, key: string) => {
    const value = values[key];
    return value === undefined || value === null ? match : String(value);
  });
}
