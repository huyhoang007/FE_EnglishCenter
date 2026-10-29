/**
 * Cut-score CEFR của APTIS General (British Council)
 * -----------------------------------------------------------
 * Thang 0–50 điểm mỗi kỹ năng, xếp hạng CEFR độc lập cho từng kỹ năng.
 *
 * Nguồn: British Council — "Aptis Scoring System" v2.1, Appendix
 * "CEFR cut scores for main Aptis variants" (Aptis General, revised 2020).
 *
 * Lưu ý quan trọng: cut-score KHÁC NHAU cho từng kỹ năng — điểm số giữa các
 * kỹ năng KHÔNG thể so sánh trực tiếp với nhau.
 *
 *   Listening : A1 8 | A2 16 | B1 24 | B2 34 | C 42
 *   Reading   : A1 8 | A2 16 | B1 26 | B2 38 | C 46
 *   Writing   : A1 6 | A2 18 | B1 26 | B2 40 | C 48
 *   Speaking  : A1 4 | A2 16 | B1 26 | B2 41 | C 48
 *
 * Grammar & Vocabulary (Core) KHÔNG có bậc CEFR riêng — chỉ dùng làm căn cứ
 * tham chiếu khi điểm một kỹ năng rơi vào "grey area" ngay dưới cut-score.
 */

export type AptisSkill = 'Listening' | 'Reading' | 'Writing' | 'Speaking';

/** Bậc CEFR của APTIS — dùng "C" (không phải C1/C2) đúng như British Council. */
export type AptisCefr = '< A1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C';

export interface AptisCefrCutScore {
  skill: AptisSkill;
  cefr: AptisCefr;
  /** Điểm bắt đầu của bậc trên thang 0–50 của kỹ năng này. */
  minScore: number;
}

export const APTIS_CEFR_CUT_SCORES: ReadonlyArray<AptisCefrCutScore> = [
  { skill: 'Listening', cefr: 'A1', minScore: 8 },
  { skill: 'Listening', cefr: 'A2', minScore: 16 },
  { skill: 'Listening', cefr: 'B1', minScore: 24 },
  { skill: 'Listening', cefr: 'B2', minScore: 34 },
  { skill: 'Listening', cefr: 'C', minScore: 42 },
  { skill: 'Reading', cefr: 'A1', minScore: 8 },
  { skill: 'Reading', cefr: 'A2', minScore: 16 },
  { skill: 'Reading', cefr: 'B1', minScore: 26 },
  { skill: 'Reading', cefr: 'B2', minScore: 38 },
  { skill: 'Reading', cefr: 'C', minScore: 46 },
  { skill: 'Writing', cefr: 'A1', minScore: 6 },
  { skill: 'Writing', cefr: 'A2', minScore: 18 },
  { skill: 'Writing', cefr: 'B1', minScore: 26 },
  { skill: 'Writing', cefr: 'B2', minScore: 40 },
  { skill: 'Writing', cefr: 'C', minScore: 48 },
  { skill: 'Speaking', cefr: 'A1', minScore: 4 },
  { skill: 'Speaking', cefr: 'A2', minScore: 16 },
  { skill: 'Speaking', cefr: 'B1', minScore: 26 },
  { skill: 'Speaking', cefr: 'B2', minScore: 41 },
  { skill: 'Speaking', cefr: 'C', minScore: 48 },
];

/**
 * Xác định bậc CEFR của một kỹ năng APTIS theo cut-score RIÊNG của kỹ năng đó.
 *
 * @param skill Kỹ năng (Listening / Reading / Writing / Speaking)
 * @param score Điểm scale 0–50 của kỹ năng
 * @returns     Bậc CEFR, hoặc '< A1' nếu dưới ngưỡng A1 của kỹ năng đó
 */
export function getAptisSkillCefr(skill: AptisSkill, score: number): AptisCefr {
  let result: AptisCefr = '< A1';
  for (const cut of APTIS_CEFR_CUT_SCORES) {
    if (cut.skill === skill && score >= cut.minScore) result = cut.cefr;
  }
  return result;
}

/** Thứ tự bậc CEFR của APTIS để tính bậc tổng. */
const APTIS_CEFR_ORDER: ReadonlyArray<AptisCefr> = ['< A1', 'A1', 'A2', 'B1', 'B2', 'C'];

/**
 * Bậc CEFR tổng của APTIS: trung bình làm tròn của bậc CEFR 4 kỹ năng.
 *
 * Nguồn: Aptis Scoring System v2.1 §3.2 — "Overall CEFR levels are calculated by
 * averaging the CEFR levels achieved across all four skill components".
 * Lưu ý: bậc tổng được tính ĐỘC LẬP với Final Scale Score (tổng điểm 0–200).
 */
export function getAptisOverallCefr(skillCefrs: readonly AptisCefr[]): AptisCefr {
  const grades = skillCefrs
    .map((c) => APTIS_CEFR_ORDER.indexOf(c))
    .filter((i) => i >= 0);
  if (grades.length === 0) return '< A1';
  const avg = grades.reduce((a, b) => a + b, 0) / grades.length;
  const rounded = Math.round(avg);
  return APTIS_CEFR_ORDER[Math.min(rounded, APTIS_CEFR_ORDER.length - 1)];
}
