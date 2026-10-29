/**
 * CertificateScoreCard — điểm quy đổi theo thang chứng chỉ (Dev 3)
 * -----------------------------------------------------------
 * Thang lấy từ cấu hình chứng chỉ ở trang Chứng chỉ (Dev 2):
 *   Trung bình (IELTS, VSTEP…) : điểm từng phần thi + điểm chung + mức năng lực / CEFR
 *   Tổng (TOEIC L&R, TOEFL…)    : điểm từng phần thi + tổng điểm
 *   Độc lập (TOEIC S&W…)       : chỉ điểm từng phần thi, không cộng tổng
 * Phần chờ mentor chấm hiện "Chờ chấm" và chưa tính điểm tổng.
 */

import React from 'react';
import { Hourglass } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Card } from '@/shared/components/Card';
import { formatScaleScore, formatScore, scaleResult, type ScaleInfo } from '@/shared/constants/examScales';
import type { SectionScore } from '@/shared/types';
import { cn } from '@/shared/utils/cn';

interface CertificateScoreCardProps {
  scale: ScaleInfo;
  sections: SectionScore[];
}

const OVERALL_LABEL: Record<string, string> = { AVERAGE: 'Điểm chung', SUM: 'Tổng điểm' };

export const CertificateScoreCard: React.FC<CertificateScoreCardProps> = ({ scale, sections }) => {
  const result = scaleResult(scale, sections);
  const hasOverall = scale.scaleType === 'AVERAGE' || scale.scaleType === 'SUM';

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={scale.badge}>{scale.label}</Badge>
        <h2 className="font-extrabold text-slate-900">Điểm quy đổi theo thang {scale.label}</h2>
        <span className="text-xs text-slate-500">{scale.range}</span>
      </div>

      <div className={cn('grid gap-4 items-stretch', hasOverall && 'md:grid-cols-[220px,1fr]')}>
        {hasOverall && (
          <div className={cn('rounded-3xl border-2 p-5 text-center flex flex-col justify-center', scale.accent)}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest">
              {OVERALL_LABEL[scale.scaleType]} {scale.label}
            </p>
            {result.overall !== null ? (
              <>
                <p className="text-5xl font-extrabold tabular-nums mt-2">{formatScaleScore(scale, result.overall)}</p>
                <p className="text-sm font-bold opacity-70">
                  / {formatScaleScore(scale, result.overallMax)} {scale.unit}
                </p>
                {result.cefr && <p className="mt-2 text-sm font-extrabold">{result.cefr}</p>}
                {result.level && <p className="text-xs font-semibold opacity-80">{result.level}</p>}
              </>
            ) : (
              <p className="text-sm font-semibold mt-3 flex items-center justify-center gap-1.5">
                <Hourglass className="w-4 h-4" /> Chờ chấm phần tự luận
              </p>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {result.skills.map((s, i) => (
            <div key={`${s.part.name}-${i}`} className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{s.part.name}</span>
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {s.pending ? '—' : formatScore(s.score, s.part.step)}
                  <span className="text-xs text-slate-400 font-bold"> / {formatScore(s.part.max, s.part.step)}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {s.title}
                {s.cefr && <span className="font-bold text-slate-700"> · CEFR {s.cefr}</span>}
              </p>
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
        Điểm quy đổi ước tính theo tỷ lệ đúng từng phần, theo thang admin cấu hình cho chứng chỉ; dùng để tham khảo
        trước kỳ thi thật.
      </p>
    </Card>
  );
};

export default CertificateScoreCard;
