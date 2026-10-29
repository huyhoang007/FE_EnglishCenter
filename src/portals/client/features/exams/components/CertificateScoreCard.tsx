/**
 * CertificateScoreCard — điểm quy đổi theo thang chứng chỉ (Dev 3)
 * -----------------------------------------------------------
 * Mỗi chứng chỉ một giao diện:
 *   IELTS : band từng kỹ năng + Overall band
 *   TOEIC : Listening / Reading (5–495) + tổng 10–990
 *   VSTEP : điểm 0–10 từng kỹ năng + điểm chung + bậc B1 / B2 / C1
 * Phần chờ mentor chấm hiện "Chờ chấm" và chưa tính điểm tổng.
 */

import React from 'react';
import { Hourglass } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import {
  SKILL_LABEL,
  formatScaleScore,
  scaleResult,
  type ScaleInfo,
} from '@/shared/constants/examScales';
import type { SectionScore } from '@/shared/types';
import { cn } from '@/shared/utils/cn';

interface CertificateScoreCardProps {
  scale: ScaleInfo;
  sections: SectionScore[];
}

const OVERALL_LABEL = {
  ielts: 'Overall band',
  toeic: 'Tổng điểm TOEIC',
  vstep: 'Điểm VSTEP',
  toefl: 'Overall TOEFL',
  aptis: 'Final Scale Score',
  raw: '',
} as const;

export const CertificateScoreCard: React.FC<CertificateScoreCardProps> = ({ scale, sections }) => {
  const result = scaleResult(scale, sections);
  const shownSkills =
    scale.kind === 'toeic' || scale.kind === 'aptis'
      ? result.skills
      : result.skills.filter((s) => s.skill !== 'OTHER' || result.skills.length === 1);

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={scale.badge}>{scale.label}</Badge>
        <h2 className="font-extrabold text-slate-900">Điểm quy đổi theo thang {scale.label}</h2>
        <span className="text-xs text-slate-500">{scale.range}</span>
      </div>

      <div className="grid md:grid-cols-[220px,1fr] gap-4 items-stretch">
        <div className={cn('rounded-3xl border-2 p-5 text-center flex flex-col justify-center', scale.accent)}>
          <p className="text-[10px] font-extrabold uppercase tracking-widest">{OVERALL_LABEL[scale.kind]}</p>
          {result.overall !== null ? (
            <>
              <p className="text-5xl font-extrabold tabular-nums mt-2">{formatScaleScore(scale, result.overall)}</p>
              <p className="text-sm font-bold opacity-70">/ {formatScaleScore(scale, result.overallMax)}</p>
              {result.level && <p className="mt-2 text-sm font-extrabold">Bậc {result.level}</p>}
              {result.cefr && <p className="mt-2 text-sm font-extrabold">CEFR {result.cefr}</p>}
            </>
          ) : (
            <p className="text-sm font-semibold mt-3 flex items-center justify-center gap-1.5">
              <Hourglass className="w-4 h-4" /> Chờ chấm phần tự luận
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {shownSkills.map((s, i) => (
            <div key={`${s.skill}-${i}`} className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  {SKILL_LABEL[s.skill]}
                </span>
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {s.pending ? '—' : formatScaleScore(scale, s.score)}
                  <span className="text-xs text-slate-400 font-bold"> / {formatScaleScore(scale, s.range.max)}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">{s.title}</p>
              {s.cefr && (
                <p className="text-[11px] font-extrabold text-[#0052CC]">CEFR {s.cefr}</p>
              )}
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${s.pending ? 0 : Math.min(100, s.percentage)}%` }}
                />
              </div>
              {s.pending && <p className="text-xs text-ai font-semibold">Chờ mentor chấm</p>}
            </div>
          ))}
        </div>
      </div>
      <p className="text-[11px] text-slate-400">
        Điểm quy đổi ước tính theo tỷ lệ đúng từng kỹ năng, dùng để tham khảo trước kỳ thi thật.
      </p>
    </Card>
  );
};

export default CertificateScoreCard;
