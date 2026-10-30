/**
 * Practice Exam types — khớp DTO BE (Dev 5, TASK-D5-04)
 * API: /api/v1/practice-exams/...
 */

export type PracticeExamType = 'WRITING' | 'SPEAKING';

/** SUBMITTED: đã nộp, chưa chấm. EVALUATED: AI đã chấm */
export type PracticeAnswerStatus = 'SUBMITTED' | 'EVALUATED';

export interface PracticeExam {
  practiceExamId: string;
  title: string;
  /** Đề bài */
  description: string;
  examType: PracticeExamType;
  bankName: string | null;
  courseId: string | null;
  certificateId?: string | null;
  certificateName?: string | null;
  createdByUserId: string;
  createdAt: string;
  lastUpdated: string;
}

/** Bài làm của học viên */
export interface PracticeAnswer {
  answerId: string;
  practiceExamId: string;
  examTitle: string;
  examType: PracticeExamType;
  status: PracticeAnswerStatus;
  wordCount: number;
  content: string;
  submittedAt: string;
  /** Có khi status = EVALUATED */
  evaluationId: string | null;
  bandScore: number | null;
}

export interface CriterionScore {
  band: number;
  comment: string;
}

/** Kết quả AI chấm */
export interface PracticeEvaluation {
  evaluationId: string;
  answerId: string;
  practiceExamId: string;
  examTitle: string;
  examType: PracticeExamType;
  /** Điểm tổng theo thang của chứng chỉ mục tiêu (certificateName, minScore – maxScore) */
  bandScore: number;
  /** null với bài chấm trước khi có thang theo chứng chỉ → hiểu là IELTS 0 – 9 */
  certificateName?: string | null;
  minScore?: number | null;
  maxScore?: number | null;
  /** Level CEFR tương ứng (A1 – C2) */
  cefrLevel?: string | null;
  taskAchievement: CriterionScore;
  coherenceCohesion: CriterionScore;
  lexicalResource: CriterionScore;
  grammaticalAccuracy: CriterionScore;
  feedback: string;
  suggestions: string[];
  model: string;
  evaluatedAt: string;
}

/** Admin tạo / sửa đề luyện tập — POST/PUT /api/v1/admin/practice-exams */
export interface PracticeExamPayload {
  title: string;
  /** Đề bài hiển thị cho học viên và gửi cho AI chấm */
  description: string;
  examType: PracticeExamType;
  bankName?: string;
  courseId?: string;
  certificateId?: string;
}

import type { CourseDto } from './catalog.types';
import type { LearningPath } from './learningPath.types';

export interface RecommendationResponse {
  targetCertificateId: string | null;
  targetCertificateName: string | null;
  currentScore: number | null;
  currentLevel: string | null;
  targetScore: number | null;
  courses: CourseDto[];
  learningPaths: LearningPath[];
  summary: string;
}
