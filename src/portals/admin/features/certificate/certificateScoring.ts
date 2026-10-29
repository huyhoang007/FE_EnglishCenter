/**
 * Certificate Scoring — Dữ liệu tham khảo thang điểm các chứng chỉ
 * -------------------------------------------------------------------------------
 * File này cung cấp CÁC MẪU THAM KHẢO (presets) để admin nhanh chóng thiết lập
 * thang điểm khi tạo chứng chỉ. Admin HOÀN TOÀN tự quyết định giá trị cuối cùng.
 *
 * Các mẫu tham khảo: VSTEP.3–5, IELTS, TOEIC L&R, TOEIC S&W,
 * TOEFL iBT (cũ), TOEFL iBT (2023+), APTIS, CEFR, Thang 100, Tuỳ chỉnh.
 *
 * Lưu ý:
 * - Tất cả giá trị trong presets chỉ là GỢI Ý, admin có thể chỉnh sửa theo nhu cầu.
 * - Các mốc CEFR / benchmark chỉ mang tính tham khảo.
 * - Mục [CẦN XÁC MINH] trong tài liệu gốc được để trống / bỏ qua, không bịa số liệu.
 */

export type ScoreCalculationType = 'AVERAGE' | 'SUM' | 'INDEPENDENT';

export type CertificatePresetId =
  | 'VSTEP'
  | 'IELTS'
  | 'TOEIC_LR'
  | 'TOEIC_SW'
  | 'TOEFL_OLD'
  | 'TOEFL_NEW'
  | 'APTIS'
  | 'CEFR'
  | 'SCALE_100'
  | 'CUSTOM';

export interface CertificateScoringSystem {
  scaleType: ScoreCalculationType;
  minScore: number;
  maxScore: number;
  step: number;
  unit: string;
  preset?: CertificatePresetId;
  roundingRule?: 'IELTS' | 'VSTEP' | 'STANDARD';
  note?: string;
}

/**
 * Thang điểm mặc định khi tạo chứng chỉ mới.
 * Admin tự cấu hình toàn bộ giá trị thực tế trong form.
 */
export const DEFAULT_CERTIFICATE_SCORING: CertificateScoringSystem = {
  scaleType: 'AVERAGE',
  minScore: 0,
  maxScore: 10,
  step: 0.5,
  unit: 'Điểm',
  preset: 'CUSTOM',
};

/**
 * Cấu hình mặc định của Thang 100 (chuẩn nội bộ trung tâm — không có chuẩn quốc tế).
 * Mỗi kỹ năng 0–100, tổng = trung bình thuần; tuỳ chọn trọng số (tổng trọng số = 100%).
 * Làm tròn theo bước nhảy đã đặt (mặc định 1).
 */
export const SCALE_100_SCORING: CertificateScoringSystem = {
  scaleType: 'AVERAGE',
  minScore: 0,
  maxScore: 100,
  step: 1,
  unit: 'Điểm',
  preset: 'SCALE_100',
};

/**
 * Bảng ánh xạ CEFR cho TOEFL iBT thang 1–6 (áp dụng cho từng kỹ năng và cho tổng).
 * Nấc .5 thuộc bậc của nấc nguyên bên dưới: 1.5 → A1, 2.5 → A2, 3.5 → B1, 4.5 → B2, 5.5 → C1.
 */
export const TOEFL_NEW_CEFR_LEVELS: ReadonlyArray<{
  cefr: string;
  minScore: number;
  maxScore: number;
}> = [
  { cefr: 'C2', minScore: 6.0, maxScore: 6.0 },
  { cefr: 'C1', minScore: 5.0, maxScore: 5.5 },
  { cefr: 'B2', minScore: 4.0, maxScore: 4.5 },
  { cefr: 'B1', minScore: 3.0, maxScore: 3.5 },
  { cefr: 'A2', minScore: 2.0, maxScore: 2.5 },
  { cefr: 'A1', minScore: 1.0, maxScore: 1.5 },
];

/**
 * Bảng quy đổi thang TOEFL iBT 1–6 sang thang 0–120 (ETS, bảng chính thức).
 *
 * Nguồn: ETS — "TOEFL iBT Score Scale 1 to 6", bảng "DETAILED SCORE COMPARISON:
 * 1 – 6 AND 0 – 120 TOEFL SCALES".
 * Giá trị là KHOẢNG tương ứng trên thang 0–120 (VD band 5 ⇔ 95–106).
 *
 * Chỉ dùng để tra cứu/tham khảo trong 2 năm chuyển tiếp (01/2026 – 01/2028),
 * khi ETS vẫn in kèm điểm 0–120 trên bảng điểm.
 */
export const TOEFL_NEW_TO_OLD_120_SCALE: ReadonlyArray<{
  /** Điểm band 1–6 (nấc .5). */
  band: number;
  /** Khoảng tương ứng trên thang 0–120. */
  oldRange: string;
  /** Điểm tối thiểu trên thang 0–120. */
  oldMin: number;
}> = [
  { band: 6.0, oldRange: '114 – 120', oldMin: 114 },
  { band: 5.5, oldRange: '107 – 113', oldMin: 107 },
  { band: 5.0, oldRange: '95 – 106', oldMin: 95 },
  { band: 4.5, oldRange: '86 – 94', oldMin: 86 },
  { band: 4.0, oldRange: '72 – 85', oldMin: 72 },
  { band: 3.5, oldRange: '58 – 71', oldMin: 58 },
  { band: 3.0, oldRange: '44 – 57', oldMin: 44 },
  { band: 2.5, oldRange: '34 – 43', oldMin: 34 },
  { band: 2.0, oldRange: '24 – 33', oldMin: 24 },
  { band: 1.5, oldRange: '12 – 23', oldMin: 12 },
  { band: 1.0, oldRange: '0 – 11', oldMin: 0 },
];

/**
 * Quy đổi điểm TOEFL iBT band 1–6 sang khoảng tương ứng trên thang 0–120.
 * Trả về `null` nếu band nằm ngoài thang 1–6.
 */
export function getToeflOld120Equivalent(band: number): { oldRange: string; oldMin: number } | null {
  const hit = TOEFL_NEW_TO_OLD_120_SCALE.find((r) => r.band === band);
  if (!hit) return null;
  return { oldRange: hit.oldRange, oldMin: hit.oldMin };
}

/** Xác định CEFR của một điểm TOEFL iBT thang 1–6. */
export function getToeflNewCefr(score: number): string {
  const hit = TOEFL_NEW_CEFR_LEVELS.find(
    (l) => score >= l.minScore && score <= l.maxScore,
  );
  return hit?.cefr ?? '< A1';
}

/**
 * Quy tắc làm tròn "0.5 gần nhất" (round-half-up) — dùng chung cho:
 * - VSTEP.3–5 overall (Bộ GD&ĐT)
 * - TOEFL iBT thang 1–6 overall
 * - Thang 100 (bước 1) và các thang tuỳ biến bước 0.5
 *
 * Tương đương với quy tắc `.25/.75`:
 *   phần thập phân < .25 → về .0 | [.25, .75) → về .5 | >= .75 → lên 1.0
 * (Ví dụ 7.125 → 7.0 | 7.375 → 7.5 | 6.75 → 7.0)
 */
export function roundToHalfStep(rawScore: number): number {
  if (Number.isNaN(rawScore)) return 0;
  const intPart = Math.floor(rawScore);
  const decimal = Math.round((rawScore - intPart) * 1000) / 1000;

  if (decimal < 0.25) return intPart;
  if (decimal < 0.75) return intPart + 0.5;
  return intPart + 1.0;
}

export interface DefaultSkillPart {
  partName: string;
  partDescription: string;
  minScore: number;
  maxScore: number;
  step?: number;
  weight?: number;
  /**
   * Kỹ năng KHÔNG tính vào điểm tổng của chứng chỉ.
   * Dùng cho Aptis: Grammar & Vocabulary (Core) có điểm riêng,
   * Final Scale Score chỉ gồm 4 kỹ năng ngôn ngữ (0–200).
   */
  excludeFromTotal?: boolean;
}

export interface CefrBenchmarkLevel {
  cefr: string;
  label: string;
  scoreRange: string;
  minScore?: number;
  maxScore?: number;
  note?: string;
}

/**
 * Cut-score CEFR của APTIS General (0–50 mỗi kỹ năng).
 *
 * Nguồn: British Council — "Aptis Scoring System" v2.1, Appendix:
 * "CEFR cut scores for main Aptis variants" (Aptis General, revised 2020).
 *
 * Lưu ý quan trọng: cut-score KHÁC NHAU cho từng kỹ năng — điểm số giữa các
 * kỹ năng KHÔNG thể so sánh trực tiếp với nhau.
 *   Listening : A1 8 | A2 16 | B1 24 | B2 34 | C 42
 *   Reading   : A1 8 | A2 16 | B1 26 | B2 38 | C 46
 *   Writing   : A1 6 | A2 18 | B1 26 | B2 40 | C 48
 *   Speaking  : A1 4 | A2 16 | B1 26 | B2 41 | C 48
 */
export {
  APTIS_CEFR_CUT_SCORES,
  getAptisSkillCefr,
  getAptisOverallCefr,
} from '../../../../shared/constants/aptisCefr.ts';
export type { AptisCefr, AptisSkill } from '../../../../shared/constants/aptisCefr.ts';

export interface CertificatePreset {
  id: CertificatePresetId;
  label: string;
  category: string;
  defaultName: string;
  description: string;
  scoringSystem: CertificateScoringSystem;
  defaultParts: DefaultSkillPart[];
  benchmarks: CefrBenchmarkLevel[];
  /** Ghi chú tham khảo — KHÔNG phải quy tắc bắt buộc, admin tự quyết định. */
  referenceNotes: string[];
}

export const CERTIFICATE_PRESETS: CertificatePreset[] = [
  {
    id: 'VSTEP',
    label: 'VSTEP.3–5 (0 – 10.0)',
    category: 'Việt Nam (Bộ GD&ĐT)',
    defaultName: 'VSTEP.3–5 (B1 – B2 – C1)',
    description: 'Khung năng lực ngoại ngữ 6 bậc VN, 4 kỹ năng 0-10, điểm tổng = TB làm tròn đến 0.5',
    scoringSystem: {
      scaleType: 'AVERAGE',
      minScore: 0,
      maxScore: 10.0,
      step: 0.5,
      unit: 'Điểm',
      preset: 'VSTEP',
      roundingRule: 'VSTEP',
      note: 'Overall = (L + R + W + S) / 4 làm tròn đến 0.5. Xét bậc theo điểm trung bình 4 kỹ năng.',
    },
    defaultParts: [
      { partName: 'Listening', partDescription: 'Nghe hiểu (3 phần, 35 câu)', minScore: 0, maxScore: 10.0, step: 0.5 },
      { partName: 'Reading', partDescription: 'Đọc hiểu (4 bài đọc, 40 câu)', minScore: 0, maxScore: 10.0, step: 0.5 },
      { partName: 'Writing', partDescription: 'Viết luận (2 bài: thư & luận)', minScore: 0, maxScore: 10.0, step: 0.5 },
      { partName: 'Speaking', partDescription: 'Vấn đáp (3 phần tương tác)', minScore: 0, maxScore: 10.0, step: 0.5 },
    ],
    benchmarks: [
      { cefr: '< B1', label: 'Dưới 4.0 điểm', scoreRange: '0.0 – 3.5', note: 'Chưa đạt bậc 3 (Không cấp chứng chỉ B1-C1)' },
      { cefr: 'B1', label: 'Bậc 3', scoreRange: '4.0 – 5.5', note: 'Đạt năng lực tiếng Anh Bậc 3 (B1)' },
      { cefr: 'B2', label: 'Bậc 4', scoreRange: '6.0 – 8.0', note: 'Đạt năng lực tiếng Anh Bậc 4 (B2)' },
      { cefr: 'C1', label: 'Bậc 5', scoreRange: '8.5 – 10.0', note: 'Đạt năng lực tiếng Anh Bậc 5 (C1 cao cấp)' },
    ],
    referenceNotes: [
      'Điểm bài thi được tính trên thang điểm 10, làm tròn đến 0.5 điểm.',
      'Quy tắc làm tròn: Phần thập phân < 0.25 làm tròn về .0; từ 0.25 đến < 0.75 làm tròn về .5; từ 0.75 trở lên làm tròn lên 1.0.',
      'Bậc trình độ chỉ xác định trên điểm trung bình cuối cùng, không đặt chuẩn riêng cho từng kỹ năng.',
    ],
  },
  {
    id: 'IELTS',
    label: 'IELTS (0 – 9.0 Band)',
    category: 'Quốc tế (IDP & British Council)',
    defaultName: 'IELTS Academic',
    description: 'IELTS Academic & General Training, thang 0-9.0 band, bước 0.5, làm tròn chính thức IELTS',
    scoringSystem: {
      scaleType: 'AVERAGE',
      minScore: 0,
      maxScore: 9.0,
      step: 0.5,
      unit: 'Band',
      preset: 'IELTS',
      roundingRule: 'IELTS',
      note: 'Overall = trung bình 4 kỹ năng làm tròn theo quy tắc chính thức: <.25 xuống .0, [.25, .75) thành .5, >=.75 lên 1.0',
    },
    defaultParts: [
      { partName: 'Listening', partDescription: 'Kỹ năng nghe (40 câu hỏi, 4 phần)', minScore: 0, maxScore: 9.0, step: 0.5 },
      { partName: 'Reading', partDescription: 'Kỹ năng đọc (40 câu hỏi, 3 bài đọc)', minScore: 0, maxScore: 9.0, step: 0.5 },
      { partName: 'Writing', partDescription: 'Kỹ năng viết (Task 1 & Task 2)', minScore: 0, maxScore: 9.0, step: 0.5 },
      { partName: 'Speaking', partDescription: 'Kỹ năng nói phỏng vấn (Part 1, 2, 3)', minScore: 0, maxScore: 9.0, step: 0.5 },
    ],
    benchmarks: [
      { cefr: 'C2', label: 'Band 9.0', scoreRange: '9.0', note: 'Expert User — Thông thạo hoàn toàn' },
      { cefr: 'C1 – C2', label: 'Band 8.0 – 8.5', scoreRange: '8.0 – 8.5', note: 'Very Good User — Rất tốt' },
      { cefr: 'C1', label: 'Band 7.0 – 7.5', scoreRange: '7.0 – 7.5', note: 'Good User — Tốt' },
      { cefr: 'B2', label: 'Band 6.0 – 6.5', scoreRange: '6.0 – 6.5', note: 'Competent User — Khá (Đủ năng lực)' },
      { cefr: 'B1', label: 'Band 5.0 – 5.5', scoreRange: '5.0 – 5.5', note: 'Modest User — Khiêm tốn' },
      { cefr: 'B1 / A2', label: 'Band 4.0 – 4.5', scoreRange: '4.0 – 4.5', note: 'Limited User — Hạn chế' },
      { cefr: '< A2', label: 'Dưới 4.0', scoreRange: '0.0 – 3.5', note: 'Extremely Limited / Non User — Cực kỳ hạn chế' },
    ],
    referenceNotes: [
      'Điểm Overall là trung bình cộng của 4 kỹ năng, làm tròn theo quy tắc chính thức của IELTS.',
      'Quy tắc làm tròn: Phần thập phân < 0.25 làm tròn xuống số nguyên; từ 0.25 đến < 0.75 làm tròn thành 0.5; từ 0.75 làm tròn lên số nguyên tiếp theo.',
      'Các band chỉ mang tính chất tham khảo mức năng lực, điểm chuẩn đầu vào cho phép cấu hình theo từng yêu cầu cụ thể (ví dụ: Overall 6.5, không kỹ năng nào dưới 6.0).',
      'Listening và Reading có 40 câu hỏi. Writing và Speaking chấm theo 4 tiêu chí rubric chính thức.',
    ],
  },
  {
    id: 'TOEIC_LR',
    label: 'TOEIC Listening & Reading (10 – 990)',
    category: 'ETS (Nghe & Đọc)',
    defaultName: 'TOEIC Listening & Reading',
    description: 'Thang điểm 10-990 điểm (Listening 5-495 + Reading 5-495), bước 5 điểm',
    scoringSystem: {
      scaleType: 'SUM',
      minScore: 10,
      maxScore: 990,
      step: 5,
      unit: 'Điểm',
      preset: 'TOEIC_LR',
      note: 'Total Score = Listening (5-495) + Reading (5-495). Bảng quy đổi điểm ETS chính thức.',
    },
    defaultParts: [
      { partName: 'Listening', partDescription: 'Kỹ năng nghe hiểu (100 câu trắc nghiệm)', minScore: 5, maxScore: 495, step: 5 },
      { partName: 'Reading', partDescription: 'Kỹ năng đọc hiểu (100 câu trắc nghiệm)', minScore: 5, maxScore: 495, step: 5 },
    ],
    benchmarks: [
      { cefr: 'C1', label: '945 – 990 điểm', scoreRange: '945 – 990', note: 'Listening 490–495, Reading 455–495' },
      { cefr: 'B2', label: '785 – 940 điểm', scoreRange: '785 – 940', note: 'Listening 400–485, Reading 385–450' },
      { cefr: 'B1', label: '550 – 780 điểm', scoreRange: '550 – 780', note: 'Listening 275–395, Reading 275–380' },
      { cefr: 'A2', label: '225 – 545 điểm', scoreRange: '225 – 545', note: 'Listening 110–270, Reading 115–270' },
      { cefr: 'A1', label: '120 – 215 điểm', scoreRange: '120 – 215', note: 'Listening 60–105, Reading 60–110' },
    ],
    referenceNotes: [
      'Tổng điểm TOEIC L&R là tổng điểm Listening (5–495) và Reading (5–495).',
      'Mỗi phần thi gồm 100 câu hỏi trắc nghiệm, điểm số chuyển đổi theo bảng thang điểm chuẩn ETS.',
      'Các mốc CEFR là điểm tham chiếu theo kỹ năng, không phải điều kiện đậu/rớt bắt buộc chung.',
    ],
  },
  {
    id: 'TOEIC_SW',
    label: 'TOEIC Speaking & Writing (0 – 200/kỹ năng)',
    category: 'ETS (Nói & Viết)',
    defaultName: 'TOEIC Speaking & Writing',
    description: 'Thang điểm 0-200 cho từng kỹ năng Speaking và Writing. Độc lập, KHÔNG cộng tổng',
    scoringSystem: {
      scaleType: 'INDEPENDENT',
      minScore: 0,
      maxScore: 200,
      step: 10,
      unit: 'Điểm',
      preset: 'TOEIC_SW',
      note: 'Không cộng điểm Speaking và Writing để tạo điểm tổng. Mỗi kỹ năng là thang điểm riêng 0-200.',
    },
    defaultParts: [
      { partName: 'Speaking', partDescription: 'Kỹ năng nói (11 câu hỏi phỏng vấn, thang 0-200)', minScore: 0, maxScore: 200, step: 10 },
      { partName: 'Writing', partDescription: 'Kỹ năng viết (8 câu hỏi viết luận, thang 0-200)', minScore: 0, maxScore: 200, step: 10 },
    ],
    benchmarks: [
      { cefr: 'C1', label: 'Speaking 180–200 / Writing 180–200', scoreRange: '180 – 200', note: 'Ngưỡng CEFR C1 cho cả hai kỹ năng' },
      { cefr: 'B2', label: 'Speaking 160–170 / Writing 150–170', scoreRange: '160 – 170', note: 'Ngưỡng CEFR B2 cho từng kỹ năng' },
      { cefr: 'B1', label: 'Speaking 120–150 / Writing 120–140', scoreRange: '120 – 140', note: 'Ngưỡng CEFR B1 cho từng kỹ năng' },
      { cefr: 'A2', label: 'Speaking 90–110 / Writing 70–110', scoreRange: '90 – 110', note: 'Ngưỡng CEFR A2 cho từng kỹ năng' },
      { cefr: 'A1', label: 'Speaking 50–80 / Writing 30–60', scoreRange: '50 – 80', note: 'Ngưỡng CEFR A1: Speaking từ 50, Writing từ 30' },
    ],
    referenceNotes: [
      'Không cộng điểm Speaking và Writing để tạo thành điểm tổng chính thức.',
      'Không gộp điểm của nhóm Speaking & Writing với nhóm Listening & Reading.',
      'Ngưỡng CEFR tối thiểu: Speaking A1 50 | A2 90 | B1 120 | B2 160 | C1 180; Writing A1 30 | A2 70 | B1 120 | B2 150 | C1 180.',
      'Level 1-8 là mức năng lực riêng của ETS, KHÔNG phải CEFR và không đưa vào bảng quy đổi.',
    ],
  },
  {
    id: 'TOEFL_OLD',
    label: 'TOEFL iBT cũ (0 – 120)',
    category: 'ETS (Học thuật — Trước 2023)',
    defaultName: 'TOEFL iBT (Format cũ)',
    description: 'Thang 0-120 điểm, 4 kỹ năng R/L/S/W mỗi phần 0-30, format trước tháng 7/2023',
    scoringSystem: {
      scaleType: 'SUM',
      minScore: 0,
      maxScore: 120,
      step: 1,
      unit: 'Điểm',
      preset: 'TOEFL_OLD',
      note: 'Total Score = Reading (0-30) + Listening (0-30) + Speaking (0-30) + Writing (0-30). Format trước 7/2023.',
    },
    defaultParts: [
      { partName: 'Reading', partDescription: 'Kỹ năng đọc học thuật (0-30 điểm)', minScore: 0, maxScore: 30, step: 1 },
      { partName: 'Listening', partDescription: 'Kỹ năng nghe bài giảng (0-30 điểm)', minScore: 0, maxScore: 30, step: 1 },
      { partName: 'Speaking', partDescription: 'Kỹ năng nói tích hợp (0-30 điểm)', minScore: 0, maxScore: 30, step: 1 },
      { partName: 'Writing', partDescription: 'Kỹ năng viết học thuật (0-30 điểm)', minScore: 0, maxScore: 30, step: 1 },
    ],
    benchmarks: [
      { cefr: 'C1 – C2', label: 'Advanced (Cao cấp)', scoreRange: '95 – 120', note: 'Điểm xuất sắc cho du học và nghiên cứu' },
      { cefr: 'B2', label: 'High-Intermediate', scoreRange: '72 – 94', note: 'Đạt chuẩn đầu vào đại học quốc tế' },
      { cefr: 'B1', label: 'Low-Intermediate', scoreRange: '42 – 71', note: 'Năng lực trung cấp' },
      { cefr: 'A2', label: 'Below Intermediate', scoreRange: '0 – 41', note: 'Chưa đạt mức trung cấp' },
    ],
    referenceNotes: [
      'Format cũ trước tháng 7/2023, gồm 4 phần thi mỗi phần 0-30 điểm.',
      'Tổng điểm TOEFL iBT là tổng điểm của 4 phần: Reading, Listening, Speaking, Writing.',
    ],
  },
  {
    id: 'TOEFL_NEW',
    label: 'TOEFL iBT thang 1–6 (từ 21/01/2026)',
    category: 'ETS (Học thuật — Thang 1–6)',
    defaultName: 'TOEFL iBT (Thang 1–6, từ 21/01/2026)',
    description:
      'Thang 1–6 mỗi kỹ năng, bước 0.5, tổng = trung bình làm tròn 0.5. Thang 0–120 vẫn in kèm trên bảng điểm trong 2 năm chuyển tiếp.',
    scoringSystem: {
      scaleType: 'AVERAGE',
      minScore: 1,
      maxScore: 6,
      step: 0.5,
      unit: 'Điểm',
      preset: 'TOEFL_NEW',
      roundingRule: 'VSTEP',
      note: 'Overall = trung bình 4 kỹ năng làm tròn đến 0.5 gần nhất. Áp dụng cho bài thi từ 21/01/2026.',
    },
    defaultParts: [
      { partName: 'Reading', partDescription: 'Đọc hiểu học thuật (thang 1–6)', minScore: 1, maxScore: 6, step: 0.5 },
      { partName: 'Listening', partDescription: 'Nghe bài giảng (thang 1–6)', minScore: 1, maxScore: 6, step: 0.5 },
      { partName: 'Speaking', partDescription: 'Nói tích hợp (thang 1–6)', minScore: 1, maxScore: 6, step: 0.5 },
      { partName: 'Writing', partDescription: 'Viết học thuật (thang 1–6)', minScore: 1, maxScore: 6, step: 0.5 },
    ],
    benchmarks: [
      { cefr: 'C2', label: '6.0', scoreRange: '6.0', note: 'Thành thạo' },
      { cefr: 'C1', label: '5.0 – 5.5', scoreRange: '5.0 – 5.5', note: 'Nấc .5 thuộc bậc của nấc nguyên bên dưới' },
      { cefr: 'B2', label: '4.0 – 4.5', scoreRange: '4.0 – 4.5', note: 'Độc lập nâng cao' },
      { cefr: 'B1', label: '3.0 – 3.5', scoreRange: '3.0 – 3.5', note: 'Độc lập cơ bản' },
      { cefr: 'A2', label: '2.0 – 2.5', scoreRange: '2.0 – 2.5', note: 'Sơ cấp' },
      { cefr: 'A1', label: '1.0 – 1.5', scoreRange: '1.0 – 1.5', note: 'Nhập môn' },
    ],
    referenceNotes: [
      'Thang 1–6 áp dụng cho bài thi từ 21/01/2026: mỗi kỹ năng 1–6, bước 0.5.',
      'Tổng điểm = trung bình 4 kỹ năng, làm tròn đến 0.5 gần nhất (VD: TB 5.125 → 5.0; TB 5.25 → 5.5).',
      'Bảng điểm vẫn in kèm thang 0–120 cũ trong 2 năm chuyển tiếp (đến khoảng 01/2028) — giá trị là điểm tương đương, KHÔNG phải tổng 4 kỹ năng.',
      'Quy đổi 1–6 → 0–120 (ETS): 6.0→114–120 | 5.5→107–113 | 5.0→95–106 | 4.5→86–94 | 4.0→72–85 | 3.5→58–71 | 3.0→44–57 | 2.5→34–43 | 2.0→24–33 | 1.5→12–23 | 1.0→0–11.',
      'Ánh xạ CEFR áp dụng cho cả từng kỹ năng và tổng; nấc .5 thuộc bậc của nấc nguyên bên dưới.',
    ],
  },
  {
    id: 'APTIS',
    label: 'APTIS (0 – 50 / kỹ năng)',
    category: 'British Council',
    defaultName: 'APTIS General',
    description: 'Thang 0-50 điểm mỗi kỹ năng (5 kỹ năng), mỗi kỹ năng đánh giá CEFR độc lập A1-C',
    scoringSystem: {
      scaleType: 'SUM',
      minScore: 0,
      maxScore: 200,
      step: 1,
      unit: 'Điểm',
      preset: 'APTIS',
      note: 'Final Scale Score = tổng 4 kỹ năng ngôn ngữ (0-200). Grammar & Vocabulary (Core) có điểm riêng, KHÔNG cộng vào tổng.',
    },
    defaultParts: [
      { partName: 'Listening', partDescription: 'Nghe hiểu (0-50 điểm)', minScore: 0, maxScore: 50, step: 1 },
      { partName: 'Reading', partDescription: 'Đọc hiểu (0-50 điểm)', minScore: 0, maxScore: 50, step: 1 },
      { partName: 'Writing', partDescription: 'Kỹ năng viết (0-50 điểm)', minScore: 0, maxScore: 50, step: 1 },
      { partName: 'Speaking', partDescription: 'Kỹ năng nói (0-50 điểm)', minScore: 0, maxScore: 50, step: 1 },
      { partName: 'Grammar & Vocabulary', partDescription: 'Ngữ pháp và từ vựng — Core (0-50 điểm, có điểm riêng)', minScore: 0, maxScore: 50, step: 1, excludeFromTotal: true },
    ],
    benchmarks: [
      { cefr: 'C', label: 'C — Thành thạo', scoreRange: 'Listening 42+ | Reading 46+ | Writing 48+ | Speaking 48+', note: 'Cut-score BC khác nhau theo từng kỹ năng' },
      { cefr: 'B2', label: 'B2 — Độc lập nâng cao', scoreRange: 'Listening 34+ | Reading 38+ | Writing 40+ | Speaking 41+', note: 'Cut-score BC khác nhau theo từng kỹ năng' },
      { cefr: 'B1', label: 'B1 — Độc lập cơ bản', scoreRange: 'Listening 24+ | Reading 26+ | Writing 26+ | Speaking 26+', note: 'Cut-score BC khác nhau theo từng kỹ năng' },
      { cefr: 'A2', label: 'A2 — Sơ cấp', scoreRange: 'Listening 16+ | Reading 16+ | Writing 18+ | Speaking 16+', note: 'Cut-score BC khác nhau theo từng kỹ năng' },
      { cefr: 'A1', label: 'A1 — Nhập môn', scoreRange: 'Listening 8+ | Reading 8+ | Writing 6+ | Speaking 4+', note: 'Cut-score BC khác nhau theo từng kỹ năng' },
    ],
    referenceNotes: [
      'Mỗi kỹ năng được xếp hạng CEFR độc lập theo cut-score RIÊNG của kỹ năng đó (British Council — Aptis Scoring System v2.1).',
      'Thang điểm gốc mỗi kỹ năng 0-50 điểm. Điểm số giữa các kỹ năng KHÔNG thể so sánh trực tiếp với nhau.',
      'Final Scale Score = tổng 4 kỹ năng ngôn ngữ (0-200). Grammar & Vocabulary (Core) có điểm riêng, KHÔNG cộng vào tổng.',
      'G&V (Core) chỉ dùng tham chiếu khi điểm kỹ năng nằm trong vùng "grey area" ngay dưới cut-score (trong 1 SEM của ranh giới bậc) — khi đó có thể nâng lên bậc trên nếu G&V cao.',
      'Bậc CEFR tổng = trung bình làm tròn của bậc CEFR 4 kỹ năng, tính độc lập với Final Scale Score.',
    ],
  },
  {
    id: 'CEFR',
    label: 'CEFR (A1 – C2)',
    category: 'Khung tham chiếu châu Âu',
    defaultName: 'CEFR — Khung năng lực ngôn ngữ chung',
    description: 'Khung tham chiếu chung châu Âu: 6 bậc từ A1 đến C2. Không phải bài thi, chỉ là khung quy chiếu.',
    scoringSystem: {
      scaleType: 'INDEPENDENT',
      minScore: 0,
      maxScore: 6,
      step: 1,
      unit: 'Bậc',
      preset: 'CEFR',
      note: '6 bậc: A1=1, A2=2, B1=3, B2=4, C1=5, C2=6. Không phải bài thi, là khung quy chiếu chung.',
    },
    defaultParts: [
      { partName: 'Listening', partDescription: 'Năng lực nghe hiểu (Bậc 1-6)', minScore: 0, maxScore: 6, step: 1 },
      { partName: 'Reading', partDescription: 'Năng lực đọc hiểu (Bậc 1-6)', minScore: 0, maxScore: 6, step: 1 },
      { partName: 'Writing', partDescription: 'Năng lực viết (Bậc 1-6)', minScore: 0, maxScore: 6, step: 1 },
      { partName: 'Speaking', partDescription: 'Năng lực nói (Bậc 1-6)', minScore: 0, maxScore: 6, step: 1 },
    ],
    benchmarks: [
      { cefr: 'C2', label: 'Mastery — Thông thạo', scoreRange: '6', note: 'Hiểu hầu hết mọi nội dung, diễn đạt tự nhiên, chính xác' },
      { cefr: 'C1', label: 'Effective Operational Proficiency', scoreRange: '5', note: 'Hiểu văn bản dài phức tạp, sử dụng ngôn ngữ linh hoạt cho mục đích học thuật / nghề nghiệp' },
      { cefr: 'B2', label: 'Vantage — Độc lập nâng cao', scoreRange: '4', note: 'Tương tác trôi chảy với người bản ngữ, hiểu ý chính văn bản phức tạp' },
      { cefr: 'B1', label: 'Threshold — Độc lập cơ bản', scoreRange: '3', note: 'Xử lý tình huống du lịch, viết văn bản đơn giản về chủ đề quen thuộc' },
      { cefr: 'A2', label: 'Waystage — Sơ cấp', scoreRange: '2', note: 'Giao tiếp đơn giản về chủ đề quen thuộc, đọc hiểu thông báo ngắn' },
      { cefr: 'A1', label: 'Breakthrough — Nhập môn', scoreRange: '1', note: 'Hiểu câu đơn giản, tự giới thiệu bản thân' },
    ],
    referenceNotes: [
      'CEFR không phải bài thi cụ thể mà là khung quy chiếu chung của Hội đồng Châu Âu.',
      'Các bài thi khác (IELTS, TOEIC, TOEFL, VSTEP, APTIS) đều quy chiếu về khung CEFR.',
      'Admin có thể dùng mẫu này khi tổ chức đánh giá trình độ nội bộ theo chuẩn CEFR.',
    ],
  },
  {
    id: 'SCALE_100',
    label: 'Thang 100 điểm (%)',
    category: 'Chuẩn hoá (%)',
    defaultName: 'Chứng chỉ Tiếng Anh Thang 100',
    description: 'Thang điểm 0 - 100 theo tỷ lệ phần trăm (Tổng 4 kỹ năng, mỗi phần 25 điểm)',
    scoringSystem: {
      scaleType: 'AVERAGE',
      minScore: 0,
      maxScore: 100,
      step: 1,
      unit: 'Điểm',
      preset: 'SCALE_100',
      note: 'Thang 100 chuẩn hoá: mỗi kỹ năng 0-100, tổng = trung bình thuần (tuỳ chọn trọng số). Làm tròn theo bước nhảy đã đặt.',
    },
    defaultParts: [
      { partName: 'Listening', partDescription: 'Nghe hiểu (0-100 điểm)', minScore: 0, maxScore: 100, step: 1 },
      { partName: 'Reading', partDescription: 'Đọc hiểu (0-100 điểm)', minScore: 0, maxScore: 100, step: 1 },
      { partName: 'Writing', partDescription: 'Viết luận (0-100 điểm)', minScore: 0, maxScore: 100, step: 1 },
      { partName: 'Speaking', partDescription: 'Vấn đáp (0-100 điểm)', minScore: 0, maxScore: 100, step: 1 },
    ],
    benchmarks: [
      { cefr: 'Xuất sắc', label: '90 – 100%', scoreRange: '90 – 100', note: 'Hạng A' },
      { cefr: 'Giỏi', label: '80 – 89%', scoreRange: '80 – 89', note: 'Hạng B' },
      { cefr: 'Khá', label: '65 – 79%', scoreRange: '65 – 79', note: 'Hạng C' },
      { cefr: 'Trung bình', label: '50 – 64%', scoreRange: '50 – 64', note: 'Hạng D (Đạt)' },
      { cefr: 'Không đạt', label: '< 50%', scoreRange: '0 – 49', note: 'Cần thi lại' },
    ],
    referenceNotes: ['Thang điểm chuẩn hoá 100 điểm, tính tổng 4 kỹ năng thành phần.'],
  },
  {
    id: 'CUSTOM',
    label: 'Tuỳ chỉnh',
    category: 'Tuỳ biến',
    defaultName: '',
    description: 'Tự định nghĩa thang điểm và phương thức tính toán riêng cho trung tâm',
    scoringSystem: {
      scaleType: 'AVERAGE',
      minScore: 0,
      maxScore: 10,
      step: 0.5,
      unit: 'Điểm',
      preset: 'CUSTOM',
    },
    defaultParts: [],
    benchmarks: [],
    referenceNotes: ['Quản trị viên tự cấu hình các mốc điểm và quy tắc theo nhu cầu của trung tâm.'],
  },
];

/* =========================================================
 * Các thuật toán tính điểm & làm tròn chính thức
 * ========================================================= */

/**
 * Làm tròn điểm VSTEP.3–5 theo quy định chính thức của Bộ GD&ĐT:
 * - Làm tròn đến 0.5 điểm gần nhất.
 * - Phần thập phân < 0.25 -> làm tròn về .0
 * - 0.25 <= Phần thập phân < 0.75 -> làm tròn về .5
 * - Phần thập phân >= 0.75 -> làm tròn lên 1.0 (số nguyên tiếp theo)
 */
export function roundVstepScore(rawScore: number): number {
  if (Number.isNaN(rawScore) || rawScore <= 0) return 0;
  if (rawScore >= 10) return 10.0;
  return roundToHalfStep(rawScore);
}

/**
 * Xác định Bậc trình độ VSTEP.3–5 dựa trên điểm trung bình 4 kỹ năng:
 * - Dưới 4.0: Chưa đạt bậc 3 (< B1)
 * - 4.0 – 5.5: Bậc 3 (B1)
 * - 6.0 – 8.0: Bậc 4 (B2)
 * - 8.5 – 10.0: Bậc 5 (C1)
 */
export function getVstepProficiency(overallScore: number): {
  level: string;
  cefr: string;
  description: string;
  badgeVariant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
} {
  const rounded = roundVstepScore(overallScore);
  if (rounded < 4.0) {
    return {
      level: 'Chưa đạt bậc 3',
      cefr: '< B1',
      description: 'Dưới 4.0 điểm — Không xét bậc theo khung VSTEP.3–5',
      badgeVariant: 'danger',
    };
  }
  if (rounded <= 5.5) {
    return {
      level: 'Bậc 3',
      cefr: 'B1',
      description: '4.0 – 5.5 điểm — Tương đương Bậc 3 (B1)',
      badgeVariant: 'warning',
    };
  }
  if (rounded <= 8.0) {
    return {
      level: 'Bậc 4',
      cefr: 'B2',
      description: '6.0 – 8.0 điểm — Tương đương Bậc 4 (B2)',
      badgeVariant: 'primary',
    };
  }
  return {
    level: 'Bậc 5',
    cefr: 'C1',
    description: '8.5 – 10.0 điểm — Tương đương Bậc 5 (C1 cao cấp)',
    badgeVariant: 'success',
  };
}

/**
 * Làm tròn điểm IELTS chính thức:
 * Overall = trung bình cộng 4 kỹ năng.
 * - Phần thập phân < 0.25: làm tròn xuống (round down to integer)
 * - 0.25 <= Phần thập phân < 0.75: làm tròn về 0.5
 * - Phần thập phân >= 0.75: làm tròn lên số nguyên tiếp theo
 */
export function roundIeltsScore(rawAvg: number): number {
  if (Number.isNaN(rawAvg) || rawAvg <= 0) return 0;
  if (rawAvg >= 9.0) return 9.0;
  return roundToHalfStep(rawAvg);
}

/**
 * Xác định mức năng lực tham khảo (IELTS Band descriptors):
 */
export function getIeltsProficiency(band: number): {
  title: string;
  userLevel: string;
  cefrReference: string;
  badgeVariant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
} {
  const rounded = roundIeltsScore(band);
  if (rounded >= 9.0) {
    return { title: 'Expert User', userLevel: 'Thông thạo hoàn toàn', cefrReference: 'C2', badgeVariant: 'success' };
  }
  if (rounded >= 8.0) {
    return { title: 'Very Good User', userLevel: 'Rất tốt', cefrReference: 'C1 – C2', badgeVariant: 'success' };
  }
  if (rounded >= 7.0) {
    return { title: 'Good User', userLevel: 'Tốt', cefrReference: 'C1', badgeVariant: 'primary' };
  }
  if (rounded >= 6.0) {
    return { title: 'Competent User', userLevel: 'Khá (Đủ năng lực)', cefrReference: 'B2', badgeVariant: 'primary' };
  }
  if (rounded >= 5.0) {
    return { title: 'Modest User', userLevel: 'Khiêm tốn', cefrReference: 'B1', badgeVariant: 'warning' };
  }
  if (rounded >= 4.0) {
    return { title: 'Limited User', userLevel: 'Hạn chế', cefrReference: 'B1 / A2', badgeVariant: 'warning' };
  }
  return { title: 'Extremely Limited / Non User', userLevel: 'Cực kỳ hạn chế / Dưới chuẩn', cefrReference: '< A2', badgeVariant: 'danger' };
}

/**
 * Xác định mốc CEFR tham chiếu tối thiểu TOEIC Listening & Reading của ETS:
 */
export function getToeicLrProficiency(totalScore: number): {
  cefr: string;
  label: string;
  note: string;
  badgeVariant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
} {
  if (totalScore >= 945) {
    return { cefr: 'C1', label: 'C1 — Thành thạo xuất sắc', note: 'Listening >= 490, Reading >= 455', badgeVariant: 'success' };
  }
  if (totalScore >= 785) {
    return { cefr: 'B2', label: 'B2 — Độc lập nâng cao', note: 'Listening >= 400, Reading >= 385', badgeVariant: 'primary' };
  }
  if (totalScore >= 550) {
    return { cefr: 'B1', label: 'B1 — Độc lập cơ bản', note: 'Listening >= 275, Reading >= 275', badgeVariant: 'warning' };
  }
  if (totalScore >= 225) {
    return { cefr: 'A2', label: 'A2 — Sơ cấp', note: 'Listening >= 110, Reading >= 115', badgeVariant: 'warning' };
  }
  if (totalScore >= 120) {
    return { cefr: 'A1', label: 'A1 — Nhập môn', note: 'Listening >= 60, Reading >= 60', badgeVariant: 'danger' };
  }
  return { cefr: '< A1', label: 'Dưới A1', note: 'Dưới mốc tham chiếu ETS', badgeVariant: 'danger' };
}

/**
 * Xác định mốc CEFR tham chiếu TOEIC Speaking & Writing theo từng kỹ năng:
 */
export function getToeicSwProficiency(
  skill: 'Speaking' | 'Writing',
  score: number,
): {
  cefr: string;
  level: string;
  badgeVariant: 'default' | 'primary' | 'success' | 'warning' | 'danger';
} {
  // Ngưỡng CEFR tối thiểu theo ETS — Level 1-8 là mức năng lực riêng của ETS, KHÔNG phải CEFR.
  if (skill === 'Speaking') {
    if (score >= 180) return { cefr: 'C1', level: 'C1 (180–200)', badgeVariant: 'success' };
    if (score >= 160) return { cefr: 'B2', level: 'B2 (160–170)', badgeVariant: 'primary' };
    if (score >= 120) return { cefr: 'B1', level: 'B1 (120–150)', badgeVariant: 'warning' };
    if (score >= 90) return { cefr: 'A2', level: 'A2 (90–110)', badgeVariant: 'warning' };
    if (score >= 50) return { cefr: 'A1', level: 'A1 (50–80)', badgeVariant: 'danger' };
    return { cefr: '< A1', level: '< A1 (0–40)', badgeVariant: 'danger' };
  }

  // Writing
  if (score >= 180) return { cefr: 'C1', level: 'C1 (180–200)', badgeVariant: 'success' };
  if (score >= 150) return { cefr: 'B2', level: 'B2 (150–170)', badgeVariant: 'primary' };
  if (score >= 120) return { cefr: 'B1', level: 'B1 (120–140)', badgeVariant: 'warning' };
  if (score >= 70) return { cefr: 'A2', level: 'A2 (70–110)', badgeVariant: 'warning' };
  if (score >= 30) return { cefr: 'A1', level: 'A1 (30–60)', badgeVariant: 'danger' };
  return { cefr: '< A1', level: '< A1 (0–20)', badgeVariant: 'danger' };
}

/* =========================================================
 * Phân tích & Serialization dữ liệu chứng chỉ
 * ========================================================= */

export function parseCertificateMeta(description: string | null | undefined): {
  description: string;
  scoring: CertificateScoringSystem | null;
} {
  if (!description) {
    return { description: '', scoring: null };
  }

  const trimmed = description.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        const text = typeof parsed.description === 'string' ? parsed.description : '';
        const scoring =
          parsed.scoring && typeof parsed.scoring === 'object'
            ? (parsed.scoring as CertificateScoringSystem)
            : null;
        if (scoring && typeof scoring.maxScore === 'number') {
          return { description: text, scoring };
        }
      }
    } catch {
      // Fallback xuống text thường
    }
  }

  return { description: trimmed, scoring: null };
}

export function getCertificateScoring(cert: {
  certificateName: string;
  description?: string | null;
}): CertificateScoringSystem {
  const meta = parseCertificateMeta(cert.description);
  if (meta.scoring) {
    return meta.scoring;
  }

  const nameUpper = (cert.certificateName || '').toUpperCase();
  if (nameUpper.includes('VSTEP')) {
    return CERTIFICATE_PRESETS.find((p) => p.id === 'VSTEP')!.scoringSystem;
  }
  if (nameUpper.includes('IELTS')) {
    return CERTIFICATE_PRESETS.find((p) => p.id === 'IELTS')!.scoringSystem;
  }
  if (
    nameUpper.includes('TOEIC') &&
    (nameUpper.includes('SPEAKING') || nameUpper.includes('WRITING') || nameUpper.includes('S&W'))
  ) {
    return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEIC_SW')!.scoringSystem;
  }
  if (nameUpper.includes('TOEIC')) {
    return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEIC_LR')!.scoringSystem;
  }
  if (nameUpper.includes('TOEFL')) {
    // Thang 1–6 (từ 21/01/2026) là thang mới; ưu tiên khi tên có gợi ý năm/định dạng mới.
    if (
      nameUpper.includes('2026') ||
      nameUpper.includes('1-6') ||
      nameUpper.includes('1–6') ||
      nameUpper.includes('THANG 1') ||
      nameUpper.includes('NEW') ||
      nameUpper.includes('MỚI')
    ) {
      return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEFL_NEW')!.scoringSystem;
    }
    return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEFL_OLD')!.scoringSystem;
  }
  if (nameUpper.includes('APTIS')) {
    return CERTIFICATE_PRESETS.find((p) => p.id === 'APTIS')!.scoringSystem;
  }
  if (nameUpper.includes('CEFR')) {
    return CERTIFICATE_PRESETS.find((p) => p.id === 'CEFR')!.scoringSystem;
  }

  return {
    scaleType: 'AVERAGE',
    minScore: 0,
    maxScore: 10,
    step: 0.5,
    unit: 'Điểm',
    preset: 'CUSTOM',
  };
}

export function serializeCertificateDescription(
  descriptionText: string,
  scoring: CertificateScoringSystem,
): string {
  return JSON.stringify({
    description: descriptionText.trim(),
    scoring,
  });
}

export function getDisplayDescription(cert: {
  description?: string | null;
}): string {
  const meta = parseCertificateMeta(cert.description);
  return meta.description;
}

export function getPartScoreInfo(properties: unknown): {
  minScore: number | null;
  maxScore: number | null;
  step: number | null;
  weight: number | null;
  scaleType: ScoreCalculationType | null;
  unit: string | null;
  excludeFromTotal: boolean;
} {
  if (!properties || typeof properties !== 'object') {
    return {
      minScore: null,
      maxScore: null,
      step: null,
      weight: null,
      scaleType: null,
      unit: null,
      excludeFromTotal: false,
    };
  }

  const obj = properties as Record<string, unknown>;

  const parseNum = (v: unknown): number | null => {
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string') {
      const parsed = parseFloat(v);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const maxScore = parseNum(obj.maxScore);
  const minScore = parseNum(obj.minScore);
  const step = parseNum(obj.step);
  const weight = parseNum(obj.weight);
  const scaleType =
    obj.scaleType === 'AVERAGE' || obj.scaleType === 'SUM' || obj.scaleType === 'INDEPENDENT'
      ? (obj.scaleType as ScoreCalculationType)
      : null;
  const unit = typeof obj.unit === 'string' ? obj.unit : null;
  const excludeFromTotal = obj.excludeFromTotal === true;

  return { minScore, maxScore, step, weight, scaleType, unit, excludeFromTotal };
}

export function formatScoringSummary(scoring: CertificateScoringSystem): string {
  if (scoring.scaleType === 'INDEPENDENT') {
    return `0 - ${scoring.maxScore} ${scoring.unit}/kỹ năng (Độc lập)`;
  }
  const typeLabel = scoring.scaleType === 'AVERAGE' ? 'Trung bình' : 'Tổng';
  return `${scoring.minScore} - ${scoring.maxScore} ${scoring.unit} (${typeLabel})`;
}

/* =========================================================
 * Tính điểm tổng theo cấu hình chứng chỉ
 * ========================================================= */

export interface SkillScoreEntry {
  score: number;
  weight?: number | null;
  excludeFromTotal?: boolean;
}

/**
 * Tính điểm tổng của chứng chỉ theo `scaleType`:
 * - SUM: tổng các kỹ năng (bỏ qua kỹ năng có `excludeFromTotal`).
 * - AVERAGE: trung bình thuần; nếu có trọng số (tổng = 100%) thì dùng trọng số.
 * - INDEPENDENT: không có điểm tổng (trả về null).
 *
 * Với AVERAGE có bước nhảy 0.5, kết quả được làm tròn về 0.5 gần nhất
 * (quy tắc chung của VSTEP.3–5 / IELTS Overall / TOEFL iBT thang 1–6).
 */
export function computeCertificateTotal(
  scoring: CertificateScoringSystem,
  skills: SkillScoreEntry[],
): number | null {
  if (scoring.scaleType === 'INDEPENDENT') return null;

  const included = skills.filter((s) => s.excludeFromTotal !== true);
  if (included.length === 0) return 0;

  if (scoring.scaleType === 'SUM') {
    const total = included.reduce((acc, s) => acc + (Number.isNaN(s.score) ? 0 : s.score), 0);
    return Math.round(total * 100) / 100;
  }

  // AVERAGE
  const weighted = included.filter((s) => typeof s.weight === 'number' && s.weight > 0);
  const sumWeights = weighted.reduce((acc, s) => acc + (s.weight ?? 0), 0);

  let raw: number;
  if (weighted.length > 0 && Math.abs(sumWeights - 100) < 0.001) {
    raw = weighted.reduce((acc, s) => acc + s.score * ((s.weight ?? 0) / 100), 0);
  } else {
    raw = included.reduce((acc, s) => acc + s.score, 0) / included.length;
  }

  // Làm tròn theo bước nhảy đã cấu hình (mặc định 1)
  const step = scoring.step && scoring.step > 0 ? scoring.step : 1;
  if (step === 0.5) return roundToHalfStep(raw);
  return Math.round(raw / step) * step;
}

/* =========================================================
 * Validation điểm kỹ năng — Chỉ kiểm tra tính hợp lệ cơ bản
 * Không ép buộc tỷ lệ hay điểm kỹ năng phải khớp cứng với mẫu,
 * Admin hoàn toàn tự quyết định giá trị của từng kỹ năng.
 * ========================================================= */

export interface ScoreValidationResult {
  isValid: boolean;
  globalError: string;
  globalWarning?: string;
  partErrors: string[];
  partWarnings?: string[];
  currentTotal: number;
  expectedTotal: number;
}

export function validateSkillScores(
  scoring: CertificateScoringSystem,
  parts: Array<{
    partName: string;
    minScore: string | number;
    maxScore: string | number;
    step?: string | number;
    weight?: string | number;
    excludeFromTotal?: boolean;
  }>,
): ScoreValidationResult {
  const partErrors: string[] = [];
  const partWarnings: string[] = [];
  let currentTotal = 0;
  let hasPartError = false;
  let globalError = '';

  const parseNum = (v: string | number | undefined): number | null => {
    if (v === undefined || v === null || v === '') return null;
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isNaN(n) ? null : n;
  };

  /** Chấm lệch bước nhảy (step) — dùng cho cảnh báo, không chặn. */
  const offStep = (value: number, step: number | null): boolean => {
    if (!step || step <= 0) return false;
    const ratio = value / step;
    return Math.abs(ratio - Math.round(ratio)) > 1e-6;
  };

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const maxVal = parseNum(part.maxScore);
    const minVal = parseNum(part.minScore);
    const stepVal = parseNum(part.step);
    const weightVal = parseNum(part.weight);

    // ---- Lỗi nhập liệu thực sự ----
    if (maxVal === null || maxVal <= 0) {
      partErrors.push('Điểm tối đa kỹ năng phải là số dương lớn hơn 0');
      partWarnings.push('');
      hasPartError = true;
      continue;
    }

    if (minVal !== null && minVal > maxVal) {
      partErrors.push('Điểm tối thiểu không được lớn hơn điểm tối đa');
      partWarnings.push('');
      hasPartError = true;
      continue;
    }

    if (stepVal !== null && stepVal <= 0) {
      partErrors.push('Bước điểm phải lớn hơn 0');
      partWarnings.push('');
      hasPartError = true;
      continue;
    }

    if (weightVal !== null && (weightVal < 0 || weightVal > 100)) {
      partErrors.push('Trọng số phải nằm trong khoảng 0 – 100 (%)');
      partWarnings.push('');
      hasPartError = true;
      continue;
    }

    // ---- Kiểm tra theo loại thang điểm ----
    const excluded = part.excludeFromTotal === true;

    if (scoring.scaleType === 'AVERAGE') {
      // Thang trung bình: mọi kỹ năng dùng CHUNG thang điểm của chứng chỉ.
      if (Math.abs(maxVal - scoring.maxScore) > 0.001) {
        partErrors.push(
          `Thang trung bình: điểm tối đa kỹ năng phải bằng ${scoring.maxScore} ${scoring.unit} (đang là ${maxVal})`,
        );
        partWarnings.push('');
        hasPartError = true;
        continue;
      }
      if (minVal !== null && Math.abs(minVal - scoring.minScore) > 0.001) {
        partErrors.push(
          `Thang trung bình: điểm tối thiểu kỹ năng phải bằng ${scoring.minScore} ${scoring.unit} (đang là ${minVal})`,
        );
        partWarnings.push('');
        hasPartError = true;
        continue;
      }
      partWarnings.push('');
    } else if (scoring.scaleType === 'SUM') {
      // Thang tổng: tổng các kỹ năng (trừ kỹ năng loại trừ) phải khớp thang chứng chỉ.
      if (!excluded) currentTotal += maxVal;

      if (maxVal > scoring.maxScore) {
        partErrors.push(
          `Điểm tối đa kỹ năng không được lớn hơn điểm tối đa chứng chỉ (${scoring.maxScore} ${scoring.unit})`,
        );
        partWarnings.push('');
        hasPartError = true;
        continue;
      }
      partWarnings.push('');
    } else {
      // INDEPENDENT: mỗi kỹ năng là một thang riêng, không ràng buộc tổng.
      partWarnings.push('');
    }

    // ---- Cảnh báo (không chặn) ----
    if (stepVal !== null && offStep(maxVal, stepVal)) {
      partWarnings.push(
        `Gợi ý: điểm tối đa ${maxVal} không nằm trên bước nhảy ${stepVal}`,
      );
    } else if (weightVal !== null && weightVal > 0) {
      partWarnings.push(
        `Gợi ý: trọng số ${weightVal}% chưa được dùng để tính điểm tổng của thang hiện tại`,
      );
    }
  }

  // ---- Kiểm tra tổng thể theo loại thang ----
  const roundedCurrent = Math.round(currentTotal * 100) / 100;
  const roundedExpected = Math.round(scoring.maxScore * 100) / 100;
  let globalWarning = '';

  if (scoring.scaleType === 'SUM' && parts.length > 0) {
    if (Math.abs(roundedCurrent - roundedExpected) > 0.001) {
      const diff = Math.round((roundedExpected - roundedCurrent) * 100) / 100;
      globalError =
        diff > 0
          ? `Tổng điểm các kỹ năng là ${roundedCurrent} ${scoring.unit}, thiếu ${diff} ${scoring.unit} so với thang chứng chỉ (${roundedExpected} ${scoring.unit}).`
          : `Tổng điểm các kỹ năng là ${roundedCurrent} ${scoring.unit}, vượt ${Math.abs(diff)} ${scoring.unit} so với thang chứng chỉ (${roundedExpected} ${scoring.unit}).`;
      hasPartError = true;
    }
  }

  if (scoring.scaleType === 'AVERAGE' && parts.length > 1) {
    const hasWeights = parts.some((p) => {
      const w = parseNum(p.weight);
      return w !== null && w > 0;
    });
    if (hasWeights) {
      const sumWeights = parts.reduce((acc, p) => acc + (parseNum(p.weight) ?? 0), 0);
      if (Math.abs(sumWeights - 100) > 0.001) {
        globalWarning = `Tổng trọng số đang là ${Math.round(sumWeights * 100) / 100}%, cần đúng 100% khi dùng trọng số.`;
      }
    }
  }

  // isValid = không có lỗi cấu hình (sai thang) + không có lỗi tổng điểm
  const isValid = !hasPartError;

  return {
    isValid,
    globalError,
    globalWarning,
    partErrors,
    partWarnings,
    currentTotal,
    expectedTotal: scoring.maxScore,
  };
}
