/**
 * Thang điểm theo chứng chỉ (Dev 3 — Exam)
 * -----------------------------------------------------------
 * Backend chấm theo điểm thô (points của từng câu). FE quy đổi sang thang của chứng chỉ
 * để hiển thị và để mentor chấm đúng thang:
 *   IELTS : band 0–9 (bước 0.5) mỗi kỹ năng, overall = trung bình làm tròn 0.5
 *   TOEIC : Listening 5–495 + Reading 5–495 = 10–990; Speaking / Writing 0–200
 *   VSTEP : 0–10 (bước 0.5) mỗi kỹ năng, overall = trung bình → bậc B1 / B2 / C1
 *   raw   : chứng chỉ khác — giữ điểm thô của đề
 * Loại thang nhận diện theo tên chứng chỉ (IELTS / TOEIC / VSTEP).
 */

import type { BadgeVariant } from '../types/badge.types';
import { roundToHalfStep } from '../utils/format';
import { getAptisOverallCefr, getAptisSkillCefr, type AptisCefr } from './aptisCefr.ts';

export type ScaleKind = 'ielts' | 'toeic' | 'vstep' | 'toefl' | 'aptis' | 'raw';
export type Skill = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING' | 'OTHER';

export interface ScaleInfo {
  kind: ScaleKind;
  /** Tên hiển thị của thang */
  label: string;
  /** Mô tả ngắn: "Band 0 – 9.0" */
  range: string;
  /** Nhãn đơn vị cho ô nhập điểm đạt */
  passLabel: string;
  passMin: number;
  passMax: number;
  passStep: number;
  /** Điểm đạt gợi ý khi chọn chứng chỉ */
  defaultPass: number;
  badge: BadgeVariant;
  /** Lớp màu nhấn cho header / thẻ điểm */
  accent: string;
}

export const SCALE_INFO: Record<ScaleKind, ScaleInfo> = {
  ielts: {
    kind: 'ielts',
    label: 'IELTS',
    range: 'Band 0 – 9.0 (bước 0.5)',
    passLabel: 'Band đạt',
    passMin: 0,
    passMax: 9,
    passStep: 0.5,
    defaultPass: 5.5,
    badge: 'ielts',
    accent: 'bg-cert-ielts-bg border-cert-ielts-border text-cert-ielts-text',
  },
  toeic: {
    kind: 'toeic',
    label: 'TOEIC',
    range: '10 – 990 (Listening 5–495 + Reading 5–495)',
    passLabel: 'Điểm TOEIC đạt',
    passMin: 10,
    passMax: 990,
    passStep: 5,
    defaultPass: 450,
    badge: 'toeic',
    accent: 'bg-cert-toeic-bg border-cert-toeic-border text-cert-toeic-text',
  },
  vstep: {
    kind: 'vstep',
    label: 'VSTEP',
    range: '0 – 10 mỗi kỹ năng (B1 ≥ 4.0, B2 ≥ 6.0, C1 ≥ 8.5)',
    passLabel: 'Điểm VSTEP đạt',
    passMin: 0,
    passMax: 10,
    passStep: 0.5,
    defaultPass: 4,
    badge: 'vstep',
    accent: 'bg-cert-vstep-bg border-cert-vstep-border text-cert-vstep-text',
  },
  toefl: {
    kind: 'toefl',
    label: 'TOEFL iBT',
    range: '1 – 6 mỗi kỹ năng (bước 0.5, từ 21/01/2026)',
    passLabel: 'Điểm TOEFL đạt',
    passMin: 1,
    passMax: 6,
    passStep: 0.5,
    defaultPass: 4,
    badge: 'primary',
    accent: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  },
  aptis: {
    kind: 'aptis',
    label: 'APTIS',
    range: '0 – 50 mỗi kỹ năng; Final Scale Score 0 – 200 (4 kỹ năng)',
    passLabel: 'Điểm đạt / kỹ năng',
    passMin: 0,
    passMax: 50,
    passStep: 1,
    defaultPass: 25,
    badge: 'primary',
    accent: 'bg-teal-50 border-teal-200 text-teal-700',
  },
  raw: {
    kind: 'raw',
    label: 'Điểm đề',
    range: 'Theo tổng điểm các câu hỏi',
    passLabel: 'Điểm đạt (%)',
    passMin: 0,
    passMax: 100,
    passStep: 1,
    defaultPass: 50,
    badge: 'primary',
    accent: 'bg-primary/5 border-primary/20 text-primary',
  },
};

/** Loại section được dùng theo chứng chỉ (TOEIC chỉ có Listening / Reading). */
export const SECTION_TYPES_BY_SCALE: Record<ScaleKind, string[]> = {
  ielts: ['LISTENING', 'READING', 'WRITING', 'SPEAKING'],
  vstep: ['LISTENING', 'READING', 'WRITING', 'SPEAKING'],
  toeic: ['LISTENING', 'READING'],
  toefl: ['READING', 'LISTENING', 'SPEAKING', 'WRITING'],
  aptis: ['LISTENING', 'READING', 'WRITING', 'SPEAKING', 'OTHER'],
  raw: ['LISTENING', 'READING', 'WRITING', 'SPEAKING', 'GENERAL'],
};

export function detectScale(certificateName?: string | null): ScaleInfo {
  const name = (certificateName ?? '').toUpperCase();
  if (name.includes('IELTS')) return SCALE_INFO.ielts;
  if (name.includes('TOEIC')) return SCALE_INFO.toeic;
  if (name.includes('VSTEP')) return SCALE_INFO.vstep;
  if (name.includes('TOEFL')) return SCALE_INFO.toefl;
  if (name.includes('APTIS')) return SCALE_INFO.aptis;
  return SCALE_INFO.raw;
}

/**
 * Suy ra thang điểm từ CẤU HÌNH thật của chứng chỉ trong DB (`description` JSON).
 * Ưu tiên cấu hình này trước `detectScale` (đoán theo tên) để tôn trọng
 * thang điểm mà admin đã cấu hình, kể cả khi tên chứng chỉ không khớp chuẩn.
 */
export function detectScaleFromCertificate(cert?: {
  certificateName?: string | null;
  description?: string | null;
} | null): ScaleInfo {
  if (!cert) return SCALE_INFO.raw;

  const desc = (cert.description ?? '').trim();
  if (desc.startsWith('{') && desc.endsWith('}')) {
    try {
      const parsed = JSON.parse(desc) as {
        scoring?: { maxScore?: number; minScore?: number; step?: number; scaleType?: string };
      };
      const s = parsed.scoring;
      if (s && typeof s.maxScore === 'number' && s.maxScore > 0) {
        const name = (cert.certificateName ?? '').toUpperCase();
        const base = detectScale(cert.certificateName);

        // Bản thang chuẩn của nhóm vẫn giữ định dạng hiển thị; chỉ dùng cấu hình
        // để biết kỹ năng nào được chấm và tổng tính thế nào.
        if (s.scaleType === 'AVERAGE' && name.includes('TOEFL')) {
          return { ...base, passMin: s.minScore ?? 1, passMax: s.maxScore, passStep: s.step ?? 0.5 };
        }
        if (s.scaleType === 'SUM' && name.includes('APTIS')) {
          return base;
        }
      }
    } catch {
      // Không parse được → rơi về detectScale theo tên.
    }
  }

  return detectScale(cert.certificateName);
}

export function toSkill(sectionType?: string | null): Skill {
  const t = (sectionType ?? '').toUpperCase();
  if (t.includes('LISTEN')) return 'LISTENING';
  if (t.includes('READ')) return 'READING';
  if (t.includes('WRIT')) return 'WRITING';
  if (t.includes('SPEAK')) return 'SPEAKING';
  return 'OTHER';
}

export const SKILL_LABEL: Record<Skill, string> = {
  LISTENING: 'Listening',
  READING: 'Reading',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
  OTHER: 'Khác',
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const roundTo = (v: number, step: number) => Math.round(v / step) * step;

/* ---------- Điểm đạt: thang chứng chỉ <-> % (backend lưu passing_score dạng %) ---------- */

export function passToPercent(scale: ScaleInfo, value: number): number {
  switch (scale.kind) {
    case 'ielts':
      return Math.round((value / 9) * 100);
    case 'toeic':
      return Math.round(((value - 10) / 980) * 100);
    case 'vstep':
      return Math.round((value / 10) * 100);
    case 'toefl':
      return Math.round(((value - 1) / 5) * 100);
    case 'aptis':
      return Math.round((value / 50) * 100);
    default:
      return Math.round(value);
  }
}

export function percentToPass(scale: ScaleInfo, percent: number): number {
  const p = clamp(percent, 0, 100) / 100;
  switch (scale.kind) {
    case 'ielts':
      return roundTo(p * 9, 0.5);
    case 'toeic':
      return roundTo(10 + p * 980, 5);
    case 'vstep':
      return roundTo(p * 10, 0.5);
    case 'toefl':
      return roundTo(1 + p * 5, 0.5);
    case 'aptis':
      return roundTo(p * 50, 1);
    default:
      return Math.round(percent);
  }
}

/* ---------- Điểm một kỹ năng theo thang chứng chỉ (từ tỷ lệ 0–100%) ---------- */

export interface SkillRange {
  min: number;
  max: number;
  step: number;
}

/** Khoảng điểm của một kỹ năng trong thang chứng chỉ (dùng cho kết quả và form chấm). */
export function skillRange(scale: ScaleInfo, skill: Skill): SkillRange {
  switch (scale.kind) {
    case 'ielts':
      return { min: 0, max: 9, step: 0.5 };
    case 'toeic':
      return skill === 'LISTENING' || skill === 'READING'
        ? { min: 5, max: 495, step: 5 }
        : { min: 0, max: 200, step: 10 };
    case 'vstep':
      return { min: 0, max: 10, step: 0.5 };
    case 'toefl':
      return { min: 1, max: 6, step: 0.5 };
    case 'aptis':
      return { min: 0, max: 50, step: 1 };
    default:
      return { min: 0, max: 100, step: 1 };
  }
}

export function percentToSkillScore(scale: ScaleInfo, skill: Skill, percent: number): number {
  const r = skillRange(scale, skill);
  const p = clamp(percent, 0, 100) / 100;
  return clamp(roundTo(r.min + p * (r.max - r.min), r.step), r.min, r.max);
}

/* ---------- Chấm tay theo thang: điểm thang <-> points của câu ---------- */

/** Mentor nhập điểm theo thang (VD band 6.5) → points lưu ở backend. */
export function scaleScoreToPoints(scale: ScaleInfo, skill: Skill, score: number, points: number): number {
  const r = skillRange(scale, skill);
  const ratio = (clamp(score, r.min, r.max) - r.min) / (r.max - r.min);
  return Math.round(ratio * points * 100) / 100;
}

/** Points đã chấm → điểm theo thang để hiển thị lại trong form. */
export function pointsToScaleScore(scale: ScaleInfo, skill: Skill, earned: number, points: number): number {
  if (points <= 0) return skillRange(scale, skill).min;
  return percentToSkillScore(scale, skill, (earned / points) * 100);
}

/* ---------- Điểm tổng theo thang chứng chỉ ---------- */

export interface SkillScore {
   skill: Skill;
  title: string;
  /** Điểm theo thang; null khi phần này còn chờ mentor chấm */
  score: number | null;
  range: SkillRange;
  percentage: number;
  pending: boolean;
  /** Bậc CEFR của riêng kỹ năng này (chỉ có với APTIS — cut-score khác nhau theo kỹ năng). */
  cefr?: string;
}

export interface ScaledResult {
  scale: ScaleInfo;
  skills: SkillScore[];
  /** IELTS / VSTEP: overall; TOEIC: tổng L + R; null nếu chưa đủ điểm */
  overall: number | null;
  overallMax: number;
  /** VSTEP: bậc đạt được */
  level?: string;
  /** APTIS: bậc CEFR tổng (TB làm tròn của bậc 4 kỹ năng) — tính độc lập với Final Scale Score. */
  cefr?: string;
}

interface SectionLike {
  sectionType: string;
  title: string;
  percentage: number;
  pendingManualGrading: boolean;
}

export function vstepLevel(score: number): string {
  if (score >= 8.5) return 'C1';
  if (score >= 6) return 'B2';
  if (score >= 4) return 'B1';
  return 'Chưa đạt bậc';
}

/**
 * Bậc CEFR của một kỹ năng APTIS.
 *
 * Cut-score khác nhau theo từng kỹ năng (BC Aptis Scoring System v2.1), nên
 * Grammar & Vocabulary (Core) không có bậc CEFR riêng.
 */
function aptisCefrForSkill(skill: Skill, score: number): AptisCefr | undefined {
  if (skill === 'LISTENING') return getAptisSkillCefr('Listening', score);
  if (skill === 'READING') return getAptisSkillCefr('Reading', score);
  if (skill === 'WRITING') return getAptisSkillCefr('Writing', score);
  if (skill === 'SPEAKING') return getAptisSkillCefr('Speaking', score);
  return undefined;
}

export function scaleResult(scale: ScaleInfo, sections: SectionLike[]): ScaledResult {
  const skills: SkillScore[] = sections.map((s) => {
    const skill = toSkill(s.sectionType);
    const score = s.pendingManualGrading ? null : percentToSkillScore(scale, skill, s.percentage);
    return {
      skill,
      title: s.title,
      score,
      range: skillRange(scale, skill),
      percentage: s.percentage,
      pending: s.pendingManualGrading,
      // APTIS: bậc CEFR theo cut-score RIÊNG của từng kỹ năng (BC Aptis Scoring System v2.1).
      ...(scale.kind === 'aptis' && score !== null
        ? { cefr: aptisCefrForSkill(skill, score) }
        : {}),
    };
  });
  const graded = skills.filter((s) => s.score !== null).map((s) => s.score as number);
  const hasPending = skills.some((s) => s.pending);

  switch (scale.kind) {
    case 'ielts': {
      // Overall: quy tắc .25/.75 (round-half-up) — dùng CHUNG roundToHalfStep.
      const overall = !hasPending && graded.length ? roundToHalfStep(graded.reduce((a, b) => a + b, 0) / graded.length) : null;
      return { scale, skills, overall, overallMax: 9 };
    }
    case 'vstep': {
      // Tổng = trung bình 4 kỹ năng, làm tròn 0.5 gần nhất; điểm giữa làm tròn lên.
      const overall = !hasPending && graded.length ? roundToHalfStep(graded.reduce((a, b) => a + b, 0) / graded.length) : null;
      return { scale, skills, overall, overallMax: 10, level: overall !== null ? vstepLevel(overall) : undefined };
    }
    case 'toeic': {
      const lr = skills.filter((s) => s.skill === 'LISTENING' || s.skill === 'READING');
      const overall = lr.length && lr.every((s) => s.score !== null) ? lr.reduce((a, s) => a + (s.score ?? 0), 0) : null;
      return { scale, skills, overall, overallMax: lr.length * 495 || 990 };
    }
    case 'toefl': {
      // TOEFL iBT thang 1–6 (từ 21/01/2026): Overall = trung bình 4 kỹ năng, làm tròn 0.5
      const overall =
        !hasPending && graded.length === 4 ? roundToHalfStep(graded.reduce((a, b) => a + b, 0) / 4) : null;
      return { scale, skills, overall, overallMax: 6 };
    }
    case 'aptis': {
      // APTIS: Final Scale Score = tổng 4 kỹ năng ngôn ngữ (0–200), KHÔNG gồm Grammar & Vocabulary.
      const languageSkills = skills.filter((s) => s.skill !== 'OTHER');
      const canTotal = languageSkills.length === 4 && languageSkills.every((s) => s.score !== null);
      const overall = canTotal ? languageSkills.reduce((a, s) => a + (s.score ?? 0), 0) : null;
      // Bậc CEFR tổng: TB làm tròn của bậc CEFR 4 kỹ năng (BC Aptis Scoring System v2.1 §3.2).
      const skillCefrs = languageSkills
        .map((s) => s.cefr)
        .filter((c): c is AptisCefr => typeof c === 'string');
      const cefr =
        canTotal && skillCefrs.length === 4 ? getAptisOverallCefr(skillCefrs) : undefined;
      return { scale, skills, overall, overallMax: 200, cefr };
    }
    default:
      return { scale, skills, overall: null, overallMax: 0 };
  }
}

/** "6.5", "785", "7.0" — IELTS/VSTEP/TOEFL luôn 1 chữ số thập phân. */
export function formatScaleScore(scale: ScaleInfo, value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return scale.kind === 'ielts' || scale.kind === 'vstep' || scale.kind === 'toefl'
    ? value.toFixed(1)
    : String(Math.round(value));
}
