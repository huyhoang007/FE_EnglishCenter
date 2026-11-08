/**
 * RubricGradePanel — Bảng tiêu chuẩn Rubrics + ô điểm & nhận xét 1-1 (PHẢI của màn chấm)
 * -----------------------------------------------------------
 * Mỗi tiêu chí rubric có:
 *   - 1 ô điểm (có chặn trong khoảng min/max)
 *   - 1 khung nhận xét riêng
 *
 * Nút "Xem gợi ý chấm từ AI" gọi AI để lấy điểm gợi ý + nhận xét tham khảo.
 * AI KHÔNG ghi điểm vào hệ thống — mentor vẫn chốt điểm chính thức.
 */

import React from 'react';
import { Bot, Lightbulb, ListChecks } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';
import type {
  HomeworkAiSuggestion,
  RubricScore,
} from '@/shared/types/homework.types';
import type { RubricCriterion } from '@/shared/types/catalog.types';

interface RubricGradePanelProps {
  rubric: RubricCriterion[];
  values: Record<string, RubricScore>;
  onChange: (criterion: string, patch: Partial<RubricScore>) => void;
  /** Điểm tối đa của bài (null = không giới hạn) — dùng cho tiêu chí chưa cấu hình maxScore. */
  maxScore?: number | null;
  /** Điểm AI gợi ý (null = chưa xem gợi ý). */
  aiSuggestion?: HomeworkAiSuggestion | null;
  onRequestAiSuggestion?: () => void;
  aiLoading?: boolean;
  /** true = đang xem bài đã chấm (không sửa). */
  readOnly?: boolean;
}

export const RubricGradePanel: React.FC<RubricGradePanelProps> = ({
  rubric,
  values,
  onChange,
  maxScore,
  aiSuggestion,
  onRequestAiSuggestion,
  aiLoading = false,
  readOnly = false,
}) => {
  if (rubric.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center">
        <p className="text-xs font-bold text-slate-600">
          Bài tập này không có rubric
        </p>
        <p className="text-[11px] text-slate-400 mt-1">
          Chấm tổng điểm + nhận xét ở khung bên dưới.
        </p>
      </div>
    );
  }

  /** Trần điểm của 1 tiêu chí: ưu tiên maxScore của rubric, không có thì dùng điểm tối đa bài. */
  const capOf = (c: RubricCriterion) =>
    c.maxScore != null && c.maxScore > 0
      ? c.maxScore
      : (maxScore != null && maxScore > 0
          ? maxScore
          : undefined);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5" />
          Tiêu chuẩn Rubrics ({rubric.length})
        </p>
        {onRequestAiSuggestion && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={aiLoading ? undefined : Lightbulb}
            isLoading={aiLoading}
            onClick={onRequestAiSuggestion}
            disabled={readOnly}
            className="ml-auto"
          >
            Xem gợi ý chấm từ AI
          </Button>
        )}
      </div>

      {/* Gợi ý AI (tham khảo) */}
      {aiSuggestion && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 space-y-1.5">
          <p className="text-[11px] font-bold text-violet-800 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            Gợi ý chấm từ AI
            {aiSuggestion.suggestedScore != null && (
              <Badge variant="primary" size="sm">
                Điểm gợi ý: {aiSuggestion.suggestedScore}
                {maxScore != null && maxScore > 0 ? `/${maxScore}` : ''}
              </Badge>
            )}
            {aiSuggestion.scaleLabel && (
              <span className="text-[10px] font-normal text-violet-600">
                ({aiSuggestion.scaleLabel})
              </span>
            )}
          </p>
          {aiSuggestion.feedback && (
            <p className="text-xs text-violet-900 leading-relaxed whitespace-pre-line">
              {aiSuggestion.feedback}
            </p>
          )}
          {aiSuggestion.weaknesses?.length ? (
            <div>
              <p className="text-[11px] font-bold text-violet-700 mt-1">
                Điểm yếu:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                {aiSuggestion.weaknesses.map((w, i) => (
                  <li key={i} className="text-[11px] text-violet-800">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {aiSuggestion.suggestions?.length ? (
            <div>
              <p className="text-[11px] font-bold text-violet-700 mt-1">
                Gợi ý sửa:
              </p>
              <ul className="list-disc pl-4 space-y-0.5">
                {aiSuggestion.suggestions.map((s, i) => (
                  <li key={i} className="text-[11px] text-violet-800">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="text-[10px] text-violet-500 italic">
            AI chỉ tham khảo — điểm chính thức do bạn chấm và quyết định.
          </p>
        </div>
      )}

      {/* Bảng tiêu chí */}
      <div className="space-y-2">
        {rubric.map((c) => {
          const key = c.criterion;
          const value = values[key] ?? { criterion: key };
          const cap = capOf(c);
          const invalid =
            value.score != null &&
            cap != null &&
            (value.score < 0 || value.score > cap);

          return (
            <div
              key={key}
              className="rounded-xl border border-slate-200 bg-white p-3 space-y-2"
            >
              <div className="flex items-start gap-2 flex-wrap">
                <p className="text-xs font-bold text-slate-800 flex-1 min-w-0">
                  {c.criterion}
                </p>
                {cap != null && (
                  <span className="text-[10px] text-slate-400 shrink-0">
                    tối đa {cap}
                  </span>
                )}
              </div>
              {c.description && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {c.description}
                </p>
              )}

              <div className="grid sm:grid-cols-[110px,1fr] gap-2">
                <label className="text-[11px] font-bold text-slate-600 space-y-1">
                  Điểm
                  <input
                    type="number"
                    min={0}
                    max={cap}
                    step="0.5"
                    disabled={readOnly}
                    value={value.score ?? ''}
                    onChange={(e) =>
                      onChange(key, {
                        score:
                          e.target.value === ''
                            ? null
                            : Number(e.target.value),
                      })
                    }
                    className={cn(
                      'w-full h-9 px-2.5 rounded-input border text-sm font-normal',
                      invalid
                        ? 'border-rose-300 focus:border-rose-400'
                        : 'border-slate-200',
                    )}
                    placeholder="0"
                  />
                </label>
                <label className="text-[11px] font-bold text-slate-600 space-y-1">
                  Nhận xét tiêu chí này
                  <textarea
                    disabled={readOnly}
                    value={value.comment ?? ''}
                    onChange={(e) =>
                      onChange(key, { comment: e.target.value })
                    }
                    rows={2}
                    placeholder="Nhận xét 1-1 cho tiêu chí…"
                    className="w-full px-2.5 py-2 rounded-input border border-slate-200 text-sm font-normal resize-y"
                  />
                </label>
              </div>
              {invalid && (
                <p className="text-[11px] text-rose-600 font-semibold">
                  Điểm phải từ 0 đến {cap}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RubricGradePanel;
