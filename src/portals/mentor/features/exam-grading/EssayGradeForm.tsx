/**
 * EssayGradeForm — bài viết / ghi âm của học viên + ô chấm điểm và nhận xét (Dev 3)
 * -----------------------------------------------------------
 * Chấm theo thang chứng chỉ của đề: IELTS band 0–9, TOEIC Writing/Speaking 0–200, VSTEP 0–10;
 * đề không thuộc chứng chỉ chấm thẳng theo điểm của câu. Ô điểm tự chặn trong thang,
 * khi lưu quy đổi sang điểm của câu (backend lưu theo points).
 */

import React, { useState } from 'react';
import { CheckCircle2, Save } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import {
  SKILL_LABEL,
  formatScaleScore,
  pointsToScaleScore,
  scaleScoreToPoints,
  skillRange,
  type ScaleInfo,
  type Skill,
} from '@/shared/constants/examScales';
import type { AnswerResult } from '@/shared/types';
import { countWords } from '@/shared/utils';
import { useGradeAnswer } from './hooks/useExamGrading';

interface EssayGradeFormProps {
  attemptId: string;
  answer: AnswerResult;
  scale: ScaleInfo;
  skill: Skill;
}

const AUDIO_URL = /^https?:\/\/\S+\.(mp3|wav|m4a|ogg|webm)$/i;

export const EssayGradeForm: React.FC<EssayGradeFormProps> = ({ attemptId, answer, scale, skill }) => {
  const grade = useGradeAnswer();
  const toast = useToast();
  const isRaw = scale.kind === 'raw';
  // Thang chấm: theo chứng chỉ, hoặc điểm của câu nếu đề không thuộc chứng chỉ
  const range = isRaw ? { min: 0, max: answer.points, step: 0.25 } : skillRange(scale, skill);
  const hasScore = answer.earnedScore !== undefined && answer.earnedScore !== null && !answer.pendingManualGrading;
  const [score, setScore] = useState(
    hasScore
      ? isRaw
        ? String(answer.earnedScore)
        : formatScaleScore(scale, pointsToScaleScore(scale, skill, answer.earnedScore ?? 0, answer.points))
      : '',
  );
  /** Tự chặn trong thang khi nhập */
  const changeScore = (raw: string) => {
    if (raw === '') return setScore('');
    const v = Number(raw);
    if (Number.isNaN(v)) return;
    setScore(String(Math.min(range.max, Math.max(range.min, v))));
  };
  const [feedback, setFeedback] = useState(answer.mentorFeedback ?? '');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const isAudio = AUDIO_URL.test(answer.answerText?.trim() ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(score);
    if (score === '' || Number.isNaN(value) || value < range.min || value > range.max) {
      setFieldError(`Điểm phải từ ${range.min} đến ${range.max}`);
      return;
    }
    setFieldError(null);
    const points = isRaw ? value : scaleScoreToPoints(scale, skill, value, answer.points);
    grade.mutate(
      { attemptId, questionId: answer.questionId, score: points, feedback: feedback.trim() || undefined },
      {
        onSuccess: () => toast.success(`Đã lưu điểm câu ${answer.displayNumber}`),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="w-7 h-7 rounded-full text-xs font-extrabold flex items-center justify-center shrink-0 bg-slate-900 text-white">
          {answer.displayNumber}
        </span>
        <p className="flex-1 text-sm font-semibold text-slate-800 whitespace-pre-line [overflow-wrap:anywhere]">{answer.questionText}</p>
        {answer.pendingManualGrading ? (
          <Badge variant="warning" size="sm">Chờ chấm</Badge>
        ) : (
          <Badge variant="success" size="sm" icon={CheckCircle2}>
            Đã chấm
          </Badge>
        )}
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
        {!answer.answered ? (
          <p className="text-sm italic text-slate-400">Học viên bỏ trống câu này.</p>
        ) : isAudio ? (
          <audio controls src={answer.answerText?.trim()} className="w-full" />
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line [overflow-wrap:anywhere]">{answer.answerText}</p>
            <p className="text-[11px] text-slate-400 text-right mt-1">{countWords(answer.answerText ?? '')} từ</p>
          </>
        )}
      </div>

      <div className="grid sm:grid-cols-[180px,1fr] gap-3">
        <label className="text-xs font-bold text-slate-600 space-y-1">
          {isRaw
            ? `Điểm (tối đa ${answer.points})`
            : `${scale.label} ${SKILL_LABEL[skill]} (${range.min} – ${range.max})`}
          <input
            type="number"
            step={range.step}
            min={range.min}
            max={range.max}
            value={score}
            onChange={(e) => changeScore(e.target.value)}
            className="w-full h-10 px-3 rounded-input border border-slate-200 text-sm font-normal"
          />
        </label>
        <label className="text-xs font-bold text-slate-600 space-y-1">
          Nhận xét cho học viên
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-input border border-slate-200 text-sm font-normal resize-y"
          />
        </label>
      </div>
      {fieldError && <p className="text-sm text-status-danger font-semibold">{fieldError}</p>}
      <div className="flex justify-end">
        <Button type="submit" leftIcon={Save} isLoading={grade.isPending}>
          Lưu điểm
        </Button>
      </div>
    </form>
  );
};

export default EssayGradeForm;
