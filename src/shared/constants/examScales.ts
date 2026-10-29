/**
 * Thang điểm theo chứng chỉ (Dev 3 — Exam)
 * -----------------------------------------------------------
 * Backend chấm theo điểm thô (points của từng câu) và trả tỷ lệ % từng phần. FE quy đổi sang thang của
 * chứng chỉ để hiển thị và để mentor chấm đúng thang.
 *
 * Thang KHÔNG viết cứng ở đây: lấy từ cấu hình admin khai báo ở trang Chứng chỉ (Dev 2):
 *   - certificates.description  (JSON "scoring": AVERAGE / SUM / INDEPENDENT, min, max, step, làm tròn, preset)
 *   - certificate_parts.properties  (min / max / step / weight của từng phần thi)
 *   - mốc CEFR / mức năng lực: benchmarks của preset Dev 2 (IELTS, VSTEP, TOEIC, TOEFL, thang 100…)
 * Đọc qua các hàm của Dev 2 (getCertificateScoring, getPartScoreInfo, CERTIFICATE_PRESETS) nên thêm chứng chỉ
 * mới hay đổi thang ở trang Chứng chỉ là đề thi tự theo, không phải sửa code.
 * Đề không gắn chứng chỉ: giữ thang % (raw).
 */

import {
  CERTIFICATE_PRESETS,
  formatScoringSummary,
  getCertificateScoring,
  getPartScoreInfo,
  type CefrBenchmarkLevel,
  type ScoreCalculationType,
} from '@/portals/admin/features/certificate/certificateScoring';
import type { BadgeVariant } from '@/shared/components/Badge';
import type { CertificateDto } from '@/shared/types/catalog.types';

/** Màu thẻ theo preset Dev 2; other = chứng chỉ khác / tuỳ chỉnh; raw = đề không thuộc chứng chỉ */
export type ScaleKind = 'ielts' | 'toeic' | 'vstep' | 'other' | 'raw';
export type Skill = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING' | 'OTHER';

/** Thang của một phần thi (một certificate_part) */
export interface PartScale {
  partId?: string;
  name: string;
  skill: Skill;
  min: number;
  max: number;
  step: number;
  weight?: number;
}

export interface ScaleInfo {
  kind: ScaleKind;
  /** Tên chứng chỉ */
  label: string;
  unit: string;
  scaleType: ScoreCalculationType | 'PERCENT';
  /** Thang điểm tổng của chứng chỉ */
  min: number;
  max: number;
  step: number;
  /** Làm tròn điểm tổng: half = quy tắc IELTS / VSTEP (.25 / .75), step = theo bước điểm */
  rounding: 'half' | 'step';
  parts: PartScale[];
  benchmarks: CefrBenchmarkLevel[];
  /** Loại section được dùng cho đề của chứng chỉ (theo các phần thi) */
  sectionTypes: string[];
  /** Mô tả ngắn: "0 - 9 Band (Trung bình)" */
  range: string;
  /** Ô nhập điểm đạt */
  passLabel: string;
  passMin: number;
  passMax: number;
  passStep: number;
  defaultPass: number;
  badge: BadgeVariant;
  /** Lớp màu nhấn cho header / thẻ điểm */
  accent: string;
}

const ALL_SECTION_TYPES = ['LISTENING', 'READING', 'WRITING', 'SPEAKING', 'GENERAL'];

const LOOK: Record<ScaleKind, { badge: BadgeVariant; accent: string }> = {
  ielts: { badge: 'ielts', accent: 'bg-cert-ielts-bg border-cert-ielts-border text-cert-ielts-text' },
  toeic: { badge: 'toeic', accent: 'bg-cert-toeic-bg border-cert-toeic-border text-cert-toeic-text' },
  vstep: { badge: 'vstep', accent: 'bg-cert-vstep-bg border-cert-vstep-border text-cert-vstep-text' },
  other: { badge: 'primary', accent: 'bg-primary/5 border-primary/20 text-primary' },
  raw: { badge: 'primary', accent: 'bg-primary/5 border-primary/20 text-primary' },
};

/** Đề không gắn chứng chỉ: điểm %, mọi loại section */
export const RAW_SCALE: ScaleInfo = {
  kind: 'raw',
  label: 'Điểm đề',
  unit: '%',
  scaleType: 'PERCENT',
  min: 0,
  max: 100,
  step: 1,
  rounding: 'step',
  parts: [],
  benchmarks: [],
  sectionTypes: ALL_SECTION_TYPES,
  range: 'Theo tổng điểm các câu hỏi',
  passLabel: 'Điểm đạt (%)',
  passMin: 0,
  passMax: 100,
  passStep: 1,
  defaultPass: 50,
  ...LOOK.raw,
};

export function toSkill(sectionType?: string | null): Skill {
  const t = (sectionType ?? '').toUpperCase();
  if (t.includes('LISTEN')) return 'LISTENING';
  if (t.includes('READ')) return 'READING';
  if (t.includes('WRIT')) return 'WRITING';
  if (t.includes('SPEAK')) return 'SPEAKING';
  return 'OTHER';
}

/** Loại section ứng với kỹ năng của phần thi */
export const skillToSectionType = (skill: Skill) => (skill === 'OTHER' ? 'GENERAL' : skill);

export const SKILL_LABEL: Record<Skill, string> = {
  LISTENING: 'Listening',
  READING: 'Reading',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
  OTHER: 'Khác',
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const roundTo = (v: number, step: number) => Math.round(Math.round(v / step) * step * 1000) / 1000;

/** Làm tròn .25 / .75 (IELTS, VSTEP): < .25 xuống, [.25, .75) thành .5, >= .75 lên */
const roundHalf = (v: number) => {
  const int = Math.floor(v);
  const dec = Math.round((v - int) * 1000) / 1000;
  return dec < 0.25 ? int : dec < 0.75 ? int + 0.5 : int + 1;
};

/** Số đầu tiên trong "6.0 – 6.5" / "< 4.0" / "945 – 990" của benchmark Dev 2 */
const benchmarkMin = (b: CefrBenchmarkLevel): number | null => {
  if (typeof b.minScore === 'number') return b.minScore;
  const m = b.scoreRange.match(/\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
};

/* ---------- Dựng thang từ cấu hình chứng chỉ (Dev 2) ---------- */

export function scaleFromCertificate(cert?: CertificateDto | null): ScaleInfo {
  if (!cert) return RAW_SCALE;
  const scoring = getCertificateScoring(cert);
  const preset = CERTIFICATE_PRESETS.find((p) => p.id === scoring.preset);
  const kind: ScaleKind =
    scoring.preset === 'IELTS'
      ? 'ielts'
      : scoring.preset === 'VSTEP'
        ? 'vstep'
        : scoring.preset === 'TOEIC_LR' || scoring.preset === 'TOEIC_SW'
          ? 'toeic'
          : 'other';

  const certParts = [...(cert.parts ?? [])].sort((a, b) => a.partOrder - b.partOrder);
  const count = certParts.length || preset?.defaultParts.length || 1;
  // Phần thi chưa khai báo min / max: lấy theo preset, rồi theo thang chung của chứng chỉ
  const fallback = {
    min: scoring.scaleType === 'SUM' ? 0 : scoring.minScore,
    max: scoring.scaleType === 'SUM' ? scoring.maxScore / count : scoring.maxScore,
    step: scoring.step,
  };
  const parts: PartScale[] = certParts.length
    ? certParts.map((p) => {
        const info = getPartScoreInfo(p.properties);
        const def = preset?.defaultParts.find((d) => d.partName.toLowerCase() === p.partName.toLowerCase());
        return {
          partId: p.partId,
          name: p.partName,
          skill: toSkill(p.partName),
          min: info.minScore ?? def?.minScore ?? fallback.min,
          max: info.maxScore ?? def?.maxScore ?? fallback.max,
          step: info.step ?? def?.step ?? fallback.step,
          weight: info.weight ?? def?.weight,
        };
      })
    : (preset?.defaultParts ?? []).map((d) => ({
        name: d.partName,
        skill: toSkill(d.partName),
        min: d.minScore,
        max: d.maxScore,
        step: d.step ?? fallback.step,
        weight: d.weight,
      }));

  const sectionTypes = parts.length
    ? Array.from(new Set(parts.map((p) => skillToSectionType(p.skill))))
    : ALL_SECTION_TYPES;
  const benchmarks = preset?.benchmarks ?? [];
  // INDEPENDENT (VD TOEIC Speaking & Writing) không có điểm tổng → điểm đạt theo %
  const byPercent = scoring.scaleType === 'INDEPENDENT';
  const b1 = benchmarks.find((b) => b.cefr === 'B1');
  const b1Min = b1 ? benchmarkMin(b1) : null;

  return {
    kind,
    label: cert.certificateName,
    unit: scoring.unit,
    scaleType: scoring.scaleType,
    min: scoring.minScore,
    max: scoring.maxScore,
    step: scoring.step,
    rounding: scoring.roundingRule === 'IELTS' || scoring.roundingRule === 'VSTEP' ? 'half' : 'step',
    parts,
    benchmarks,
    sectionTypes,
    range: formatScoringSummary(scoring),
    passLabel: byPercent ? 'Điểm đạt (%)' : `Điểm đạt (${scoring.unit})`,
    passMin: byPercent ? 0 : scoring.minScore,
    passMax: byPercent ? 100 : scoring.maxScore,
    passStep: byPercent ? 1 : scoring.step,
    // Gợi ý: mốc B1 của chứng chỉ, không có thì giữa thang
    defaultPass: byPercent
      ? 50
      : (b1Min ?? roundTo(scoring.minScore + (scoring.maxScore - scoring.minScore) / 2, scoring.step)),
    ...LOOK[kind],
  };
}

/** Tìm chứng chỉ theo id (ưu tiên) hoặc tên trong danh sách GET /certificates */
export function findCertificate(
  certificates: CertificateDto[] | undefined,
  certificateId?: string | null,
  certificateName?: string | null,
): CertificateDto | undefined {
  if (!certificates?.length) return undefined;
  if (certificateId) {
    const byId = certificates.find((c) => c.certificateId === certificateId);
    if (byId) return byId;
  }
  return certificateName ? certificates.find((c) => c.certificateName === certificateName) : undefined;
}

/* ---------- Điểm đạt: thang chứng chỉ <-> % (backend lưu passing_score dạng %) ---------- */

export function passToPercent(scale: ScaleInfo, value: number): number {
  if (scale.passMax === scale.passMin) return 0;
  return Math.round(((value - scale.passMin) / (scale.passMax - scale.passMin)) * 100);
}

export function percentToPass(scale: ScaleInfo, percent: number): number {
  const p = clamp(percent, 0, 100) / 100;
  return roundTo(scale.passMin + p * (scale.passMax - scale.passMin), scale.passStep);
}

/** "Band đạt 5.5" / "60%" — điểm đạt để hiển thị */
export function formatPass(scale: ScaleInfo, percent: number): string {
  if (scale.passLabel === 'Điểm đạt (%)') return `${percent}%`;
  return `${scale.label} ${formatScore(percentToPass(scale, percent), scale.passStep)}`;
}

/* ---------- Thang của một section: theo phần thi của chứng chỉ ---------- */

/** Phần thi của section: theo certificatePartId, không có thì theo kỹ năng của section */
export function sectionPart(
  scale: ScaleInfo,
  section: { certificatePartId?: string | null; sectionType?: string | null; title?: string },
): PartScale {
  const skill = toSkill(section.sectionType);
  const part =
    (section.certificatePartId && scale.parts.find((p) => p.partId === section.certificatePartId)) ||
    scale.parts.find((p) => p.skill === skill);
  if (part) return part;
  if (scale.kind === 'raw' || !scale.parts.length) {
    return { name: SKILL_LABEL[skill], skill, min: 0, max: 100, step: 1 };
  }
  // Section không khớp phần thi nào của chứng chỉ: dùng thang của phần đầu tiên
  return { ...scale.parts[0], partId: undefined, name: section.title ?? SKILL_LABEL[skill], skill };
}

export function percentToScore(part: PartScale, percent: number): number {
  const p = clamp(percent, 0, 100) / 100;
  return clamp(roundTo(part.min + p * (part.max - part.min), part.step), part.min, part.max);
}

/** Mentor nhập điểm theo thang (VD band 6.5) → points lưu ở backend. */
export function scoreToPoints(part: PartScale, score: number, points: number): number {
  if (part.max === part.min) return 0;
  const ratio = (clamp(score, part.min, part.max) - part.min) / (part.max - part.min);
  return Math.round(ratio * points * 100) / 100;
}

/** Points đã chấm → điểm theo thang để hiển thị lại trong form. */
export function pointsToScore(part: PartScale, earned: number, points: number): number {
  if (points <= 0) return part.min;
  return percentToScore(part, (earned / points) * 100);
}

/* ---------- Mức năng lực / CEFR theo benchmarks của chứng chỉ ---------- */

export interface Benchmark {
  cefr: string;
  /** "Competent User — Khá", "Đạt năng lực tiếng Anh Bậc 4 (B2)"… */
  level: string;
}

/** Mốc cao nhất mà điểm đạt tới */
export function benchmarkFor(scale: ScaleInfo, value: number | null | undefined): Benchmark | undefined {
  if (value === null || value === undefined || !scale.benchmarks.length) return undefined;
  let best: { b: CefrBenchmarkLevel; min: number } | undefined;
  for (const b of scale.benchmarks) {
    const min = benchmarkMin(b);
    if (min === null || value < min) continue;
    if (!best || min > best.min) best = { b, min };
  }
  // Dưới mọi mốc: mốc thấp nhất (VD "< B1")
  const pick =
    best?.b ??
    [...scale.benchmarks].sort((x, y) => (benchmarkMin(x) ?? 0) - (benchmarkMin(y) ?? 0))[0];
  return pick ? { cefr: pick.cefr, level: pick.note ?? pick.label } : undefined;
}

/* ---------- Điểm tổng theo thang chứng chỉ ---------- */

export interface SkillScore {
  skill: Skill;
  title: string;
  part: PartScale;
  /** Điểm theo thang; null khi phần này còn chờ mentor chấm */
  score: number | null;
  percentage: number;
  pending: boolean;
  /** CEFR của riêng kỹ năng (thang trung bình / độc lập) */
  cefr?: string;
}

export interface ScaledResult {
  scale: ScaleInfo;
  skills: SkillScore[];
  /** AVERAGE: overall; SUM: tổng các phần; null nếu chưa đủ điểm hoặc thang độc lập */
  overall: number | null;
  overallMax: number;
  level?: string;
  cefr?: string;
}

export interface SectionLike {
  sectionType: string;
  title: string;
  percentage: number;
  pendingManualGrading: boolean;
  certificatePartId?: string | null;
}

export function scaleResult(scale: ScaleInfo, sections: SectionLike[]): ScaledResult {
  const perSkillCefr = scale.scaleType === 'AVERAGE' || scale.scaleType === 'INDEPENDENT';
  const skills: SkillScore[] = sections.map((s) => {
    const part = sectionPart(scale, s);
    const score = s.pendingManualGrading ? null : percentToScore(part, s.percentage);
    return {
      skill: part.skill,
      title: s.title,
      part,
      score,
      percentage: s.percentage,
      pending: s.pendingManualGrading,
      cefr: perSkillCefr && score !== null ? benchmarkFor(scale, score)?.cefr : undefined,
    };
  });
  const ready = skills.length > 0 && skills.every((s) => s.score !== null);

  let overall: number | null = null;
  let overallMax = scale.max;
  if (scale.scaleType === 'AVERAGE' && ready) {
    const weighted = skills.every((s) => s.part.weight);
    const total = weighted ? skills.reduce((a, s) => a + (s.part.weight ?? 0), 0) : skills.length;
    const avg = skills.reduce((a, s) => a + (s.score ?? 0) * (weighted ? (s.part.weight ?? 0) : 1), 0) / total;
    overall = clamp(scale.rounding === 'half' ? roundHalf(avg) : roundTo(avg, scale.step), scale.min, scale.max);
  } else if (scale.scaleType === 'SUM') {
    overallMax = skills.reduce((a, s) => a + s.part.max, 0) || scale.max;
    if (ready) overall = skills.reduce((a, s) => a + (s.score ?? 0), 0);
  } else if (scale.scaleType !== 'AVERAGE') {
    overallMax = 0;
  }

  // Mốc năng lực của điểm tổng chỉ đúng khi đề có đủ các phần thi của chứng chỉ
  const b = overall !== null && overallMax === scale.max ? benchmarkFor(scale, overall) : undefined;
  return { scale, skills, overall, overallMax, level: b?.level, cefr: b?.cefr };
}

/** Số chữ số thập phân theo bước điểm: 0.5 → "6.5", 5 → "785" */
export function formatScore(value: number | null | undefined, step = 1): string {
  if (value === null || value === undefined) return '—';
  return step < 1 ? value.toFixed(1) : String(Math.round(value));
}

/** Điểm theo thang tổng của chứng chỉ */
export const formatScaleScore = (scale: ScaleInfo, value: number | null | undefined) => formatScore(value, scale.step);
