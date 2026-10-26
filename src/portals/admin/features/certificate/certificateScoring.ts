/**
 * Certificate Scoring — Thang điểm chuẩn & Core điểm chi tiết của từng chứng chỉ
 * -------------------------------------------------------------------------------
 * Tuân thủ quy định chuẩn mực chính thức:
 *
 * 1. VSTEP.3–5 (Bộ GD&ĐT Việt Nam):
 *    - 4 kỹ năng: Listening (0–10), Reading (0–10), Writing (0–10), Speaking (0–10).
 *    - Overall = (Listening + Reading + Writing + Speaking) / 4.
 *    - Làm tròn: Làm tròn đến 0.5 điểm gần nhất:
 *      * thập phân < 0.25 -> .0
 *      * 0.25 <= thập phân < 0.75 -> .5
 *      * thập phân >= 0.75 -> làm tròn lên 1.0 (số nguyên tiếp theo).
 *    - Bậc trình độ:
 *      * Dưới 4.0: Chưa đạt bậc 3 (< B1, không cấp chứng chỉ bậc 3-5)
 *      * 4.0 – 5.5: Bậc 3 (Tương ứng B1)
 *      * 6.0 – 8.0: Bậc 4 (Tương ứng B2)
 *      * 8.5 – 10.0: Bậc 5 (Tương ứng C1)
 *    - Lưu ý: Không tự đặt điểm chuẩn riêng từng kỹ năng vì xác định bậc VSTEP.3-5
 *      hoàn toàn dựa trên điểm trung bình 4 kỹ năng.
 *
 * 2. IELTS (Academic & General Training):
 *    - Thang điểm: Listening (0–9), Reading (0–9), Writing (0–9), Speaking (0–9).
 *    - Bước điểm: 0.5 band.
 *    - Overall = trung bình cộng 4 kỹ năng, làm tròn chính thức của IELTS:
 *      * thập phân < 0.25 -> làm tròn xuống số nguyên (vd: 6.125 -> 6.0)
 *      * 0.25 <= thập phân < 0.75 -> làm tròn về 0.5 (vd: 6.25 -> 6.5, 6.375 -> 6.5)
 *      * thập phân >= 0.75 -> làm tròn lên số nguyên tiếp theo (vd: 6.75 -> 7.0)
 *    - Mức năng lực tham khảo (Band descriptors):
 *      * Band 9.0: Expert User (Thông thạo)
 *      * Band 8.0 – 8.5: Very Good User (Rất tốt)
 *      * Band 7.0 – 7.5: Good User (Tốt)
 *      * Band 6.0 – 6.5: Competent User (Khá)
 *      * Band 5.0 – 5.5: Modest User (Khiêm tốn)
 *      * Band 4.0 – 4.5: Limited User (Hạn chế)
 *      * Band < 4.0: Cực kỳ hạn chế / Dưới chuẩn
 *    - Lưu ý: Không coi các band trên là điểm chuẩn đậu/rớt chung. Điểm chuẩn đầu vào
 *      cho phép cấu hình theo yêu cầu cụ thể (VD: Overall >= 6.5, không kỹ năng nào < 6.0).
 *      Listening & Reading có 40 câu; Writing & Speaking chấm theo tiêu chí rubric.
 *
 * 3. TOEIC Listening & Reading:
 *    - Thang điểm: Listening (5–495 điểm), Reading (5–495 điểm).
 *    - Tổng điểm: 10–990 điểm (bước 5 điểm).
 *    - Total Score = Listening + Reading.
 *    - Mốc CEFR tham chiếu tối thiểu của ETS:
 *      * C1: 945–990 (L: 490–495, R: 455–495)
 *      * B2: 785–940 (L: 400–485, R: 385–450)
 *      * B1: 550–780 (L: 275–395, R: 275–380)
 *      * A2: 225–545 (L: 110–270, R: 115–270)
 *      * A1: 120–215 (L: 60–105, R: 60–110)
 *
 * 4. TOEIC Speaking & Writing:
 *    - Thang điểm: Speaking (0–200 điểm), Writing (0–200 điểm), bước 10 điểm.
 *    - QUAN TRỌNG: Không cộng điểm Speaking và Writing để tạo điểm tổng. Không gộp
 *      với Listening & Reading. Mỗi kỹ năng là một thang đo độc lập (INDEPENDENT).
 *    - Mốc CEFR tham chiếu ETS theo từng kỹ năng:
 *      * Speaking: C1 (180–200), B2 (160–170), B1 (120–150), A2 (90–110), A1 (50–80).
 *      * Writing:  C1 (180–200), B2 (150–170), B1 (120–140), A2 (70–110), A1 (40–60).
 */

export type ScoreCalculationType = 'AVERAGE' | 'SUM' | 'INDEPENDENT';

export type CertificatePresetId =
  | 'VSTEP'
  | 'IELTS'
  | 'TOEIC_LR'
  | 'TOEIC_SW'
  | 'TOEFL'
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

export interface DefaultSkillPart {
  partName: string;
  partDescription: string;
  minScore: number;
  maxScore: number;
  step?: number;
  weight?: number;
}

export interface CefrBenchmarkLevel {
  cefr: string;
  label: string;
  scoreRange: string;
  minScore?: number;
  maxScore?: number;
  note?: string;
}

export interface CertificatePreset {
  id: CertificatePresetId;
  label: string;
  category: string;
  defaultName: string;
  description: string;
  scoringSystem: CertificateScoringSystem;
  defaultParts: DefaultSkillPart[];
  benchmarks: CefrBenchmarkLevel[];
  officialRules: string[];
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
    officialRules: [
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
    officialRules: [
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
    officialRules: [
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
      { cefr: 'C1', label: 'Speaking 180–200 / Writing 180–200', scoreRange: '180 – 200', note: 'Level 8 (Cả Speaking và Writing)' },
      { cefr: 'B2', label: 'Speaking 160–170 / Writing 150–170', scoreRange: '150 – 170', note: 'Level 7' },
      { cefr: 'B1', label: 'Speaking 120–150 / Writing 120–140', scoreRange: '120 – 150', note: 'Level 5 – 6' },
      { cefr: 'A2', label: 'Speaking 90–110 / Writing 70–110', scoreRange: '70 – 110', note: 'Level 4' },
      { cefr: 'A1', label: 'Speaking 50–80 / Writing 40–60', scoreRange: '40 – 80', note: 'Level 2 – 3' },
    ],
    officialRules: [
      'Không cộng điểm Speaking và Writing để tạo thành điểm tổng chính thức.',
      'Không gộp điểm của nhóm Speaking & Writing với nhóm Listening & Reading.',
      'Mỗi kỹ năng được đánh giá độc lập theo các Level (1 đến 8) và quy chiếu CEFR riêng biệt của ETS.',
    ],
  },
  {
    id: 'TOEFL',
    label: 'TOEFL iBT (0 – 120 Điểm)',
    category: 'ETS (Học thuật)',
    defaultName: 'TOEFL iBT',
    description: 'Thang 0-120 điểm, tổng 4 kỹ năng Reading, Listening, Speaking, Writing (mỗi phần 0-30)',
    scoringSystem: {
      scaleType: 'SUM',
      minScore: 0,
      maxScore: 120,
      step: 1,
      unit: 'Điểm',
      preset: 'TOEFL',
      note: 'Total Score = Reading (0-30) + Listening (0-30) + Speaking (0-30) + Writing (0-30)',
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
    officialRules: [
      'Tổng điểm TOEFL iBT là tổng điểm của 4 phần thi: Reading, Listening, Speaking, Writing.',
      'Mỗi phần thi có thang điểm từ 0 đến 30 điểm. Tổng điểm tối đa là 120 điểm.',
    ],
  },
  {
    id: 'SCALE_100',
    label: 'Thang 100 điểm (%)',
    category: 'Chuẩn hoá (%)',
    defaultName: 'Chứng chỉ Tiếng Anh Thang 100',
    description: 'Thang điểm 0 - 100 theo tỷ lệ phần trăm (Tổng 4 kỹ năng, mỗi phần 25 điểm)',
    scoringSystem: {
      scaleType: 'SUM',
      minScore: 0,
      maxScore: 100,
      step: 1,
      unit: 'Điểm',
      preset: 'SCALE_100',
    },
    defaultParts: [
      { partName: 'Listening', partDescription: 'Nghe hiểu (0-25 điểm)', minScore: 0, maxScore: 25, step: 1 },
      { partName: 'Reading', partDescription: 'Đọc hiểu (0-25 điểm)', minScore: 0, maxScore: 25, step: 1 },
      { partName: 'Writing', partDescription: 'Viết luận (0-25 điểm)', minScore: 0, maxScore: 25, step: 1 },
      { partName: 'Speaking', partDescription: 'Vấn đáp (0-25 điểm)', minScore: 0, maxScore: 25, step: 1 },
    ],
    benchmarks: [
      { cefr: 'Xuất sắc', label: '90 – 100%', scoreRange: '90 – 100', note: 'Hạng A' },
      { cefr: 'Giỏi', label: '80 – 89%', scoreRange: '80 – 89', note: 'Hạng B' },
      { cefr: 'Khá', label: '65 – 79%', scoreRange: '65 – 79', note: 'Hạng C' },
      { cefr: 'Trung bình', label: '50 – 64%', scoreRange: '50 – 64', note: 'Hạng D (Đạt)' },
      { cefr: 'Không đạt', label: '< 50%', scoreRange: '0 – 49', note: 'Cần thi lại' },
    ],
    officialRules: ['Thang điểm chuẩn hoá 100 điểm, tính tổng 4 kỹ năng thành phần.'],
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
    officialRules: ['Quản trị viên tự cấu hình các mốc điểm và quy tắc theo nhu cầu của trung tâm.'],
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

  const intPart = Math.floor(rawScore);
  const decimal = Math.round((rawScore - intPart) * 1000) / 1000;

  if (decimal < 0.25) return intPart;
  if (decimal < 0.75) return intPart + 0.5;
  return intPart + 1.0;
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

  const intPart = Math.floor(rawAvg);
  const decimal = Math.round((rawAvg - intPart) * 1000) / 1000;

  if (decimal < 0.25) return intPart;
  if (decimal < 0.75) return intPart + 0.5;
  return intPart + 1.0;
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
  if (skill === 'Speaking') {
    if (score >= 180) return { cefr: 'C1', level: 'Level 8 (180–200)', badgeVariant: 'success' };
    if (score >= 160) return { cefr: 'B2', level: 'Level 7 (160–170)', badgeVariant: 'primary' };
    if (score >= 120) return { cefr: 'B1', level: 'Level 5–6 (120–150)', badgeVariant: 'warning' };
    if (score >= 90) return { cefr: 'A2', level: 'Level 4 (90–110)', badgeVariant: 'warning' };
    if (score >= 50) return { cefr: 'A1', level: 'Level 3 (50–80)', badgeVariant: 'danger' };
    return { cefr: '< A1', level: 'Level 1–2 (0–40)', badgeVariant: 'danger' };
  }

  // Writing
  if (score >= 180) return { cefr: 'C1', level: 'Level 8 (180–200)', badgeVariant: 'success' };
  if (score >= 150) return { cefr: 'B2', level: 'Level 7 (150–170)', badgeVariant: 'primary' };
  if (score >= 120) return { cefr: 'B1', level: 'Level 6 (120–140)', badgeVariant: 'warning' };
  if (score >= 70) return { cefr: 'A2', level: 'Level 4–5 (70–110)', badgeVariant: 'warning' };
  if (score >= 40) return { cefr: 'A1', level: 'Level 2–3 (40–60)', badgeVariant: 'danger' };
  return { cefr: '< A1', level: 'Level 1 (0–30)', badgeVariant: 'danger' };
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
    return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEFL')!.scoringSystem;
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
} {
  if (!properties || typeof properties !== 'object') {
    return { minScore: null, maxScore: null, step: null, weight: null, scaleType: null, unit: null };
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

  return { minScore, maxScore, step, weight, scaleType, unit };
}

export function formatScoringSummary(scoring: CertificateScoringSystem): string {
  if (scoring.scaleType === 'INDEPENDENT') {
    return `0 - ${scoring.maxScore} ${scoring.unit}/kỹ năng (Độc lập)`;
  }
  const typeLabel = scoring.scaleType === 'AVERAGE' ? 'Trung bình' : 'Tổng';
  return `${scoring.minScore} - ${scoring.maxScore} ${scoring.unit} (${typeLabel})`;
}

/* =========================================================
 * Validation điểm kỹ năng so với core điểm chứng chỉ
 * ========================================================= */

export interface ScoreValidationResult {
  isValid: boolean;
  globalError: string;
  partErrors: string[];
  currentTotal: number;
  expectedTotal: number;
}

export function validateSkillScores(
  scoring: CertificateScoringSystem,
  parts: Array<{
    partName: string;
    minScore: string | number;
    maxScore: string | number;
  }>,
): ScoreValidationResult {
  const partErrors: string[] = [];
  let currentTotal = 0;
  let hasPartError = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const maxVal = typeof part.maxScore === 'number' ? part.maxScore : parseFloat(part.maxScore);
    const minVal = typeof part.minScore === 'number' ? part.minScore : parseFloat(part.minScore);

    if (Number.isNaN(maxVal) || maxVal <= 0) {
      partErrors.push('Điểm tối đa kỹ năng phải là số dương lớn hơn 0');
      hasPartError = true;
      continue;
    }

    if (!Number.isNaN(minVal) && minVal > maxVal) {
      partErrors.push('Điểm tối thiểu không được lớn hơn điểm tối đa');
      hasPartError = true;
      continue;
    }

    if (scoring.scaleType === 'AVERAGE') {
      // Đối với VSTEP.3-5 (10.0) hoặc IELTS (9.0 band):
      // Điểm tối đa mỗi kỹ năng phải đúng bằng điểm tối đa của chứng chỉ
      if (Math.abs(maxVal - scoring.maxScore) > 0.001) {
        partErrors.push(
          `Với tính điểm Trung bình, điểm tối đa kỹ năng phải bằng thang chứng chỉ (${scoring.maxScore} ${scoring.unit})`,
        );
        hasPartError = true;
        continue;
      }
    } else if (scoring.scaleType === 'SUM') {
      // Đối với TOEIC L&R (Tổng 990: Listening 495 + Reading 495), TOEFL iBT (Tổng 120: 4 x 30):
      if (maxVal > scoring.maxScore) {
        partErrors.push(
          `Điểm kỹ năng không được vượt quá điểm tối đa chứng chỉ (${scoring.maxScore} ${scoring.unit})`,
        );
        hasPartError = true;
        continue;
      }
      currentTotal += maxVal;
    } else if (scoring.scaleType === 'INDEPENDENT') {
      // Đối với TOEIC Speaking & Writing: Mỗi kỹ năng có thang 0 - 200, không cộng tổng!
      if (Math.abs(maxVal - scoring.maxScore) > 0.001) {
        partErrors.push(
          `Mỗi kỹ năng độc lập có thang điểm tối đa là ${scoring.maxScore} ${scoring.unit}`,
        );
        hasPartError = true;
        continue;
      }
    }

    partErrors.push('');
  }

  let globalError = '';
  if (scoring.scaleType === 'SUM' && parts.length > 0) {
    const roundedCurrent = Math.round(currentTotal * 100) / 100;
    const roundedExpected = Math.round(scoring.maxScore * 100) / 100;

    if (Math.abs(roundedCurrent - roundedExpected) > 0.001) {
      const diff = Math.round((roundedExpected - roundedCurrent) * 100) / 100;
      if (diff > 0) {
        globalError = `Tổng điểm các kỹ năng hiện tại là ${roundedCurrent} / ${roundedExpected} ${scoring.unit} (Còn thiếu ${diff} ${scoring.unit}).`;
      } else {
        globalError = `Tổng điểm các kỹ năng hiện tại là ${roundedCurrent} / ${roundedExpected} ${scoring.unit} (Vượt quá ${Math.abs(diff)} ${scoring.unit}).`;
      }
    }
  }

  const isValid = !hasPartError && !globalError;

  return {
    isValid,
    globalError,
    partErrors,
    currentTotal,
    expectedTotal: scoring.maxScore,
  };
}
