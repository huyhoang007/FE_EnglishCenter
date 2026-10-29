/**
 * EvaluationResult — hiển thị kết quả AI chấm (band tổng + 4 tiêu chí + nhận xét + gợi ý)
 * Dữ liệu: PracticeEvaluation từ BE (Dev 5).
 */

import React from 'react';
import { Lightbulb, MessageSquareText, Sparkles } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import type { CriterionScore, PracticeEvaluation } from '@/shared/types';

interface CriterionRow {
  label: string;
  score: CriterionScore;
}

export const EvaluationResult: React.FC<{ evaluation: PracticeEvaluation }> = ({ evaluation }) => {
  const criteria: CriterionRow[] = [
    { label: 'Task Achievement / Response', score: evaluation.taskAchievement },
    { label: 'Coherence & Cohesion', score: evaluation.coherenceCohesion },
    { label: 'Lexical Resource', score: evaluation.lexicalResource },
    { label: 'Grammatical Range & Accuracy', score: evaluation.grammaticalAccuracy },
  ];
  const isMock = evaluation.model === 'mock';
  // Thang theo chứng chỉ mục tiêu; bài chấm cũ không có thang → IELTS 0 – 9
  const scale: ScoreScale = {
    name: evaluation.certificateName || 'IELTS',
    min: Number(evaluation.minScore ?? 0),
    max: Number(evaluation.maxScore ?? 9),
  };

  return (
    <Card noPadding className="overflow-hidden">
      {/* Band tổng */}
      <div className="p-5 bg-gradient-to-br from-blue-50 via-white to-violet-50 border-b border-slate-100 flex items-center gap-4">
        <BandRing band={Number(evaluation.bandScore)} scale={scale} />
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
            Kết quả AI chấm
          </p>
          <p className="mt-1 font-bold text-slate-900 truncate">{evaluation.examTitle}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="ai" size="sm" icon={Sparkles}>
              {evaluation.examType === 'SPEAKING' ? 'Speaking' : 'Writing'}
            </Badge>
            <Badge variant="primary" size="sm">
              {scale.name} · {formatScore(Number(evaluation.bandScore), scale)}/{formatScore(scale.max, scale)}
            </Badge>
            {evaluation.cefrLevel && (
              <Badge variant="success" size="sm">
                Level {evaluation.cefrLevel}
              </Badge>
            )}
            <Badge variant={isMock ? 'warning' : 'neutral'} size="sm">
              {isMock ? 'Chấm giả lập (mock)' : evaluation.model}
            </Badge>
          </div>
        </div>
      </div>

      {/* 4 tiêu chí */}
      <div className="p-5 space-y-4">
        {criteria.map((c) => (
          <div key={c.label}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-slate-800">{c.label}</p>
              <span className="text-sm font-extrabold text-[#0052CC] tabular-nums">
                {formatScore(Number(c.score.band), scale)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED]"
                style={{ width: `${ratio(Number(c.score.band), scale) * 100}%` }}
              />
            </div>
            {c.score.comment && (
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{c.score.comment}</p>
            )}
          </div>
        ))}
      </div>

      {/* Nhận xét chung */}
      {evaluation.feedback && (
        <div className="px-5 pb-4">
          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MessageSquareText className="w-4 h-4 text-[#0052CC]" />
            Nhận xét chung
          </p>
          <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{evaluation.feedback}</p>
        </div>
      )}

      {/* Gợi ý cải thiện */}
      {evaluation.suggestions?.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            Gợi ý cải thiện
          </p>
          <ul className="mt-2 space-y-1.5">
            {evaluation.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-amber-500 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="px-5 py-3 border-t border-slate-100 text-[11px] text-slate-400">
        Chấm lúc {new Date(evaluation.evaluatedAt).toLocaleString('vi-VN')}
      </p>
    </Card>
  );
};

interface ScoreScale {
  name: string;
  min: number;
  max: number;
}

/** Tỷ lệ 0 – 1 của điểm trên thang (cho thanh tiến độ / vòng tròn). */
const ratio = (score: number, scale: ScoreScale) =>
  scale.max > scale.min ? Math.max(0, Math.min(1, (score - scale.min) / (scale.max - scale.min))) : 0;

/** Thang ≤ 10 (IELTS, VSTEP…) hiện 1 chữ số thập phân; thang lớn (TOEIC 0 – 200) hiện số nguyên. */
const formatScore = (score: number, scale: ScoreScale) =>
  scale.max <= 10 ? score.toFixed(1) : String(Math.round(score));

/* Vòng tròn điểm tổng theo thang chứng chỉ */
const BandRing: React.FC<{ band: number; scale: ScoreScale }> = ({ band, scale }) => {
  const radius = 38;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - ratio(band, scale));
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth={8} />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="url(#practiceBandGradient)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <defs>
          <linearGradient id="practiceBandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-900 tabular-nums leading-none">
          {formatScore(band, scale)}
        </span>
        <span className="max-w-[64px] truncate text-[9px] font-extrabold uppercase tracking-wider text-slate-500 mt-0.5">
          {scale.name}
        </span>
      </div>
    </div>
  );
};

export default EvaluationResult;
