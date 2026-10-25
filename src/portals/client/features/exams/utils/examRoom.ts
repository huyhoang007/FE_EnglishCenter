/**
 * Tiện ích phòng thi (Dev 3)
 */

import type { ExamDetail, ExamQuestion } from '@/shared/types';

/** Đáp án đang làm ở client (chưa chắc đã lưu lên server). */
export interface DraftAnswer {
  selectedOptionId?: string | null;
  /** fill_blank / essay: chữ; matching: JSON {"trái": "phải"}. */
  answerText?: string | null;
}

/** Toàn bộ câu hỏi theo thứ tự hiển thị (displayNumber do backend đánh). */
export function orderedQuestions(exam: ExamDetail): ExamQuestion[] {
  const all = [...exam.sections.flatMap((s) => s.questions ?? []), ...(exam.unsectionedQuestions ?? [])];
  return all.sort((a, b) => (a.displayNumber ?? 0) - (b.displayNumber ?? 0));
}

export function parseMatching(text?: string | null): Record<string, string> {
  if (!text) return {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed as Record<string, unknown>).filter(
          (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1] !== '',
        ),
      );
    }
  } catch {
    /* JSON hỏng = chưa trả lời */
  }
  return {};
}

export function isAnswered(question: ExamQuestion, draft?: DraftAnswer): boolean {
  if (!draft) return false;
  switch (question.questionType) {
    case 'multiple_choice':
    case 'true_false':
      return Boolean(draft.selectedOptionId);
    case 'matching':
      return Object.keys(parseMatching(draft.answerText)).length > 0;
    default:
      return Boolean(draft.answerText && draft.answerText.trim());
  }
}

/** Số giây → "mm:ss" hoặc "h:mm:ss". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Ngày giờ kiểu Việt Nam: "24/10/2026 14:05". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;
