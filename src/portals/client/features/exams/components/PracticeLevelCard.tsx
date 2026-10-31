/**
 * PracticeLevelCard — trình độ sau khi làm đề luyện tập AI (Dev 5)
 * -----------------------------------------------------------
 * Chỉ hiện thứ người học cần biết: điểm theo thang chứng chỉ mục tiêu (VD IELTS Band 5.5) + level CEFR,
 * và điểm từng kỹ năng. Số liệu do BE tính (practiceLevel), trùng với trình độ lưu ở trang Hồ sơ.
 */

import React from 'react';
import { BookOpen, Headphones, Layers, Mic, PenLine } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import type { PracticeLevel } from '@/shared/types';
import { cn } from '@/shared/utils/cn';

/** Mô tả ngắn từng level CEFR */
export const CEFR_LABEL: Record<string, string> = {
  A1: 'Mới bắt đầu',
  A2: 'Sơ cấp',
  B1: 'Trung cấp',
  B2: 'Trung cao cấp',
  C1: 'Cao cấp',
  C2: 'Thành thạo',
};

const CEFR_COLOR: Record<string, string> = {
  A1: 'bg-rose-50 text-rose-700 border-rose-200',
  A2: 'bg-orange-50 text-orange-700 border-orange-200',
  B1: 'bg-amber-50 text-amber-700 border-amber-200',
  B2: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  C1: 'bg-blue-50 text-blue-700 border-blue-200',
  C2: 'bg-violet-50 text-violet-700 border-violet-200',
};

const SKILL_VIEW: Record<PracticeLevel['skills'][number]['skill'], { label: string; icon: React.ElementType }> = {
  LISTENING: { label: 'Listening', icon: Headphones },
  READING: { label: 'Reading', icon: BookOpen },
  WRITING: { label: 'Writing', icon: PenLine },
  SPEAKING: { label: 'Speaking', icon: Mic },
  OTHER: { label: 'Khác', icon: Layers },
};

/** Thang ≤ 10 (IELTS, VSTEP…) hiện 1 chữ số thập phân; thang lớn (TOEIC) hiện số nguyên */
const fmt = (value: number, max: number) => (max <= 10 ? Number(value).toFixed(1) : String(Math.round(value)));

/** "IELTS Academic" → "Band"; TOEIC / TOEFL → "Điểm" */
const unitOf = (name: string) => (name.toUpperCase().includes('IELTS') ? 'Band' : 'Điểm');

export const PracticeLevelCard: React.FC<{ level: PracticeLevel }> = ({ level }) => (
  <Card className="space-y-5">
    <div className="grid md:grid-cols-[auto,1fr] gap-5 items-center">
      {/* Điểm tổng + CEFR */}
      <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-blue-50 to-white p-6 text-center min-w-[220px]">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
          {level.certificateName} · {unitOf(level.certificateName)}
        </p>
        <p className="text-5xl font-extrabold text-slate-900 tabular-nums mt-2">
          {fmt(level.overallScore, level.maxScore)}
        </p>
        <p className="text-sm text-slate-400 font-bold">/ {fmt(level.maxScore, level.maxScore)}</p>
        <span
          className={cn(
            'inline-flex items-center mt-3 px-3 py-1 rounded-full border text-sm font-extrabold',
            CEFR_COLOR[level.cefrLevel] ?? 'bg-slate-50 text-slate-700 border-slate-200',
          )}
        >
          Trình độ {level.cefrLevel}
          {CEFR_LABEL[level.cefrLevel] ? ` · ${CEFR_LABEL[level.cefrLevel]}` : ''}
        </span>
      </div>

      {/* Từng kỹ năng */}
      <div className="grid sm:grid-cols-2 gap-3">
        {level.skills.map((s) => {
          const view = SKILL_VIEW[s.skill];
          const Icon = view.icon;
          return (
            <div key={s.skill} className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  <Icon className="w-4 h-4" /> {view.label}
                </span>
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {fmt(s.score, s.maxScore)}
                  <span className="text-xs text-slate-400 font-bold"> / {fmt(s.maxScore, s.maxScore)}</span>
                </span>
              </div>
              {s.cefrLevel && (
                <p className="text-xs text-slate-500">
                  Trình độ <b className="text-slate-800">{s.cefrLevel}</b>
                  {CEFR_LABEL[s.cefrLevel] ? ` · ${CEFR_LABEL[s.cefrLevel]}` : ''}
                </p>
              )}
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, s.percentage)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
    <p className="text-[11px] text-slate-400">
      Điểm ước tính theo thang {level.certificateName}: Listening / Reading quy từ tỷ lệ câu đúng, Writing / Speaking
      theo band AI chấm. Trình độ này đã được lưu vào hồ sơ của bạn.
    </p>
  </Card>
);

export default PracticeLevelCard;
