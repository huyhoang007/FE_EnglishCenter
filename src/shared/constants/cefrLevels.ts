/**
 * CEFR Levels — Khung tham chiếu ngôn ngữ chung châu Âu
 * -----------------------------------------------------------
 * Dùng chung cho dropdown "Trình độ" ở form khóa học (admin),
 * bộ lọc marketplace (client) và mọi nơi hiển thị level.
 *
 * Giá trị `value` lưu vào DB (string, max 100 chars).
 * Giá trị `''` (rỗng) = "Không phân cấp" — backend nhận null/undefined.
 */

export interface CefrOption {
  /** Giá trị lưu DB — '' nghĩa là "không phân cấp". */
  value: string;
  /** Nhãn hiển thị: "A1 — Sơ cấp", "B1 — Trung cấp", v.v. */
  label: string;
  /** Nhãn ngắn dùng cho badge / chip (không có "—"). */
  shortLabel: string;
  /** Thứ tự sắp xếp (0 = không phân cấp, 1 = A1, …, 6 = C2). */
  order: number;
}

/**
 * Danh sách CEFR options — thứ tự cố định từ thấp → cao.
 * Option đầu tiên (`''`) dùng khi khóa học không cần gắn cấp độ.
 */
export const CEFR_OPTIONS: readonly CefrOption[] = [
  { value: '',   label: 'Không phân cấp',  shortLabel: 'Không phân cấp', order: 0 },
  { value: 'A1', label: 'A1 — Sơ cấp',     shortLabel: 'A1',             order: 1 },
  { value: 'A2', label: 'A2 — Sơ trung',   shortLabel: 'A2',             order: 2 },
  { value: 'B1', label: 'B1 — Trung cấp',  shortLabel: 'B1',             order: 3 },
  { value: 'B2', label: 'B2 — Trung cao',  shortLabel: 'B2',             order: 4 },
  { value: 'C1', label: 'C1 — Cao cấp',    shortLabel: 'C1',             order: 5 },
  { value: 'C2', label: 'C2 — Thành thạo', shortLabel: 'C2',             order: 6 },
] as const;

/** Tra cứu nhanh value → CefrOption. */
export const CEFR_MAP: ReadonlyMap<string, CefrOption> = new Map(
  CEFR_OPTIONS.map((o) => [o.value, o]),
);

/** Các giá trị CEFR hợp lệ (không bao gồm ''). */
export const CEFR_VALUES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_VALUES)[number];

/**
 * Lấy nhãn hiển thị cho một giá trị level.
 *
 * Xử lý cả dữ liệu cũ (BEGINNER, INTERMEDIATE, …) và dữ liệu mới (A1–C2).
 * Nếu không nhận ra → trả về chính chuỗi đó (graceful fallback).
 */
const LEGACY_MAP: Record<string, string> = {
  BEGINNER:           'A1',
  ELEMENTARY:         'A2',
  PRE_INTERMEDIATE:   'A2',
  INTERMEDIATE:       'B1',
  UPPER_INTERMEDIATE: 'B2',
  ADVANCED:           'C1',
};

export function cefrLabel(level: string | null | undefined): string {
  if (!level) return 'Không phân cấp';
  const upper = level.toUpperCase().trim();

  // Dữ liệu mới — CEFR value
  const found = CEFR_MAP.get(upper);
  if (found) return found.label;

  // Dữ liệu cũ — map sang CEFR rồi lấy label
  const mapped = LEGACY_MAP[upper];
  if (mapped) {
    const cefrOpt = CEFR_MAP.get(mapped);
    return cefrOpt ? `${cefrOpt.shortLabel} (${level})` : level;
  }

  // Không nhận ra → trả nguyên gốc
  return level;
}

/**
 * Nhãn ngắn cho badge / chip (VD: "A1", "B2").
 * Dữ liệu cũ → map sang CEFR tương đương.
 */
export function cefrShortLabel(level: string | null | undefined): string {
  if (!level) return '—';
  const upper = level.toUpperCase().trim();

  const found = CEFR_MAP.get(upper);
  if (found) return found.shortLabel;

  const mapped = LEGACY_MAP[upper];
  if (mapped) return mapped;

  return level;
}

/**
 * Thứ tự sắp xếp (dữ liệu cũ cũng được map sang thứ tự CEFR tương ứng).
 * Trả -1 nếu không nhận ra — xếp cuối.
 */
export function cefrOrder(level: string | null | undefined): number {
  if (!level) return 0;
  const upper = level.toUpperCase().trim();

  const found = CEFR_MAP.get(upper);
  if (found) return found.order;

  const mapped = LEGACY_MAP[upper];
  if (mapped) {
    const cefrOpt = CEFR_MAP.get(mapped);
    return cefrOpt ? cefrOpt.order : -1;
  }

  return -1;
}

/**
 * Chuẩn hóa giá trị level khi nạp vào form sửa:
 * - Nếu là mã CEFR hợp lệ (A1-C2) → giữ nguyên.
 * - Nếu là giá trị cũ trong LEGACY_MAP (BEGINNER, INTERMEDIATE...) → tự map sang CEFR.
 * - Nếu là rỗng/null/undefined → trả về '' (Không phân cấp).
 * - Nếu là giá trị tự do khác → trả về chính nó để form hiển thị option giá trị cũ.
 */
export function toFormLevel(level: string | null | undefined): string {
  if (!level) return '';
  const trimmed = level.trim();
  const upper = trimmed.toUpperCase();
  if (CEFR_VALUES.includes(upper as CefrLevel)) return upper;
  if (LEGACY_MAP[upper]) return LEGACY_MAP[upper];
  return trimmed;
}

/**
 * Migration mapping — liệt kê giá trị cũ → CEFR đề xuất.
 * Dùng cho script migration hoặc hiển thị bảng đối chiếu cho admin duyệt.
 */
export const LEGACY_MIGRATION_MAP: ReadonlyArray<{
  oldValue: string;
  newValue: CefrLevel;
  note: string;
}> = [
  { oldValue: 'BEGINNER',           newValue: 'A1', note: 'Beginner → A1 Sơ cấp' },
  { oldValue: 'ELEMENTARY',         newValue: 'A2', note: 'Elementary → A2 Sơ trung' },
  { oldValue: 'PRE_INTERMEDIATE',   newValue: 'A2', note: 'Pre-Intermediate → A2 Sơ trung' },
  { oldValue: 'INTERMEDIATE',       newValue: 'B1', note: 'Intermediate → B1 Trung cấp' },
  { oldValue: 'UPPER_INTERMEDIATE', newValue: 'B2', note: 'Upper-Intermediate → B2 Trung cao' },
  { oldValue: 'ADVANCED',           newValue: 'C1', note: 'Advanced → C1 Cao cấp' },
];
