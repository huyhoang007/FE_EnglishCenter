/**
 * Exam Domain Types
 * -----------------------------------------------------------
 * Định nghĩa cấu trúc đề thi & câu hỏi phục vụ Gold Flow #4
 * (Phòng thi trực tuyến chuẩn Cambridge/IDP).
 */

import type { ApiResponse } from '@/shared/types';

/** Loại câu hỏi hỗ trợ */
export type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE_NOTGIVEN' | 'FILL_BLANK';

/** Lựa chọn cho trắc nghiệm */
export interface McqOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

/** Đáp án của một câu hỏi (dùng cho chấm điểm) */
export type AnswerValue = string | boolean | null;

export interface Question {
  id: string;
  order: number;
  type: QuestionType;
  prompt: string; // Câu hỏi / yêu cầu
  options?: McqOption[]; // Cho MULTIPLE_CHOICE
  /** Đáp án đúng (chỉ dùng phía client để demo chấm) */
  correctAnswer: AnswerValue;
  /** Giải thích ngắn sau khi nộp */
  explanation?: string;
}

export interface ExamPassage {
  id: string;
  title: string;
  paragraphs: { heading?: string; text: string }[];
}

export interface Exam {
  id: string;
  slug: string;
  title: string;
  skill: 'READING' | 'LISTENING' | 'WRITING' | 'SPEAKING';
  certificate: 'IELTS' | 'TOEIC' | 'VSTEP';
  durationSeconds: number;
  totalQuestions: number;
  passages: ExamPassage[];
  questions: Question[];
}

export type ExamListResponse = ApiResponse<Exam[]>;
export type ExamDetailResponse = ApiResponse<Exam>;

/** Kết quả làm bài (tính phía client cho demo) */
export interface ExamResult {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  /** Band score 0.0 - 9.0 (IELTS) hoặc thang 10 (TOEIC) — tùy certificate */
  bandScore: number;
  maxBand: number;
  feedback: string;
  perQuestion: { questionId: string; isCorrect: boolean; chosen: AnswerValue }[];
}
