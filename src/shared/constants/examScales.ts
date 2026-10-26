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

import type { BadgeVariant } from '@/shared/components/Badge';

export type ScaleKind = 'ielts' | 'toeic' | 'vstep' | 'raw';
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

export function detectScale(certificateName?: string | null): ScaleInfo {
  const name = (certificateName ?? '').toUpperCase();
  if (name.includes('IELTS')) return SCALE_INFO.ielts;
  if (name.includes('TOEIC')) return SCALE_INFO.toeic;
  if (name.includes('VSTEP')) return SCALE_INFO.vstep;
  return SCALE_INFO.raw;
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
}

export interface ScaledResult {
  scale: ScaleInfo;
  skills: SkillScore[];
  /** IELTS / VSTEP: overall; TOEIC: tổng L + R; null nếu chưa đủ điểm */
  overall: number | null;
  overallMax: number;
  /** VSTEP: bậc đạt được */
  level?: string;
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

export function scaleResult(scale: ScaleInfo, sections: SectionLike[]): ScaledResult {
  const skills: SkillScore[] = sections.map((s) => {
    const skill = toSkill(s.sectionType);
    return {
      skill,
      title: s.title,
      score: s.pendingManualGrading ? null : percentToSkillScore(scale, skill, s.percentage),
      range: skillRange(scale, skill),
      percentage: s.percentage,
      pending: s.pendingManualGrading,
    };
  });
  const graded = skills.filter((s) => s.score !== null).map((s) => s.score as number);
  const hasPending = skills.some((s) => s.pending);

  switch (scale.kind) {
    case 'ielts': {
      const overall = !hasPending && graded.length ? roundTo(graded.reduce((a, b) => a + b, 0) / graded.length, 0.5) : null;
      return { scale, skills, overall, overallMax: 9 };
    }
    case 'vstep': {
      const overall = !hasPending && graded.length ? roundTo(graded.reduce((a, b) => a + b, 0) / graded.length, 0.5) : null;
      return { scale, skills, overall, overallMax: 10, level: overall !== null ? vstepLevel(overall) : undefined };
    }
    case 'toeic': {
      const lr = skills.filter((s) => s.skill === 'LISTENING' || s.skill === 'READING');
      const overall = lr.length && lr.every((s) => s.score !== null) ? lr.reduce((a, s) => a + (s.score ?? 0), 0) : null;
      return { scale, skills, overall, overallMax: lr.length * 495 || 990 };
    }
    default:
      return { scale, skills, overall: null, overallMax: 0 };
  }
}

/** "6.5", "785", "7.0" — IELTS/VSTEP luôn 1 chữ số thập phân. */
export function formatScaleScore(scale: ScaleInfo, value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return scale.kind === 'ielts' || scale.kind === 'vstep' ? value.toFixed(1) : String(Math.round(value));
}
