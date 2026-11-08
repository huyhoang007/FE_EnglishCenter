/**
 * Thang điểm của chứng chỉ — đọc từ JSON `{"scoring": {...}}` trong
 * `certificates.description` (trang Chứng chỉ lưu).
 *
 * Dùng để validate điểm đầu vào / mục tiêu của khóa học ở form admin,
 * khớp với `CourseRules.validateScores` ở backend.
 */
export interface CertificateScale {
  min: number;
  max: number;
  step: number;
}

const toNumber = (value: unknown): number | null => {
  const n = typeof value === 'string' ? Number(value.trim()) : Number(value);
  return Number.isFinite(n) ? n : null;
};

/**
 * `null` khi chứng chỉ chưa cấu hình thang điểm.
 * Hỗ trợ nhận cả certificate object (có minScore, maxScore, scoreStep từ DB)
 * hoặc description string (dự phòng legacy JSON).
 */
export const parseCertificateScale = (
  certOrDescription:
    | {
        description?: string | null;
        minScore?: number | null;
        maxScore?: number | null;
        scoreStep?: number | null;
      }
    | string
    | null
    | undefined,
): CertificateScale | null => {
  if (!certOrDescription) return null;

  if (typeof certOrDescription === 'object') {
    const max = toNumber(certOrDescription.maxScore);
    if (max != null && max > 0) {
      const min = toNumber(certOrDescription.minScore) ?? 0;
      const rawStep = toNumber(certOrDescription.scoreStep);
      const step = rawStep != null && rawStep > 0 ? rawStep : 1;
      return min < max ? { min, max, step } : null;
    }
    return parseCertificateScale(certOrDescription.description);
  }

  const desc = certOrDescription;
  if (!desc || !desc.trim().startsWith('{')) return null;
  try {
    const scoring = JSON.parse(desc)?.scoring;
    if (!scoring || typeof scoring !== 'object') return null;
    const max = toNumber(scoring.maxScore);
    if (max == null || max <= 0) return null;
    const min = toNumber(scoring.minScore) ?? 0;
    const rawStep = toNumber(scoring.step);
    const step = rawStep != null && rawStep > 0 ? rawStep : 1;
    return min < max ? { min, max, step } : null;
  } catch {
    return null;
  }
};

/** Kiểm tra 1 điểm theo thang; trả về thông báo lỗi hoặc '' nếu hợp lệ. */
export const validateScoreOnScale = (
  label: string,
  raw: string,
  scale: CertificateScale | null,
): string => {
  if (!raw.trim()) return '';
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return `${label} phải là số ≥ 0`;
  if (!scale) return '';
  if (value < scale.min || value > scale.max) {
    return `${label} phải trong khoảng ${scale.min} – ${scale.max}`;
  }
  // So sánh theo số nguyên để tránh lỗi làm tròn (VD 6.5 / 0.5).
  const factor = 1000;
  const offset = Math.round((value - scale.min) * factor);
  const step = Math.round(scale.step * factor);
  if (step > 0 && offset % step !== 0) {
    return `${label} phải theo bước ${scale.step}`;
  }
  return '';
};
