/**
 * Exam Domain Types (Dev 3 — Exam / Test Management)
 * -----------------------------------------------------------
 * Khớp DTO Spring Boot của module Exam. Enum gửi/nhận dạng chữ thường
 * đúng như backend: "multiple_choice", "in_progress"...
 * Dùng chung cho Client (làm bài), Mentor (chấm tay) và Admin (quản lý đề).
 */

/** practice: đề luyện tập AI nhiều kỹ năng (trang Luyện tập AI) */
export type ExamScope = 'trial' | 'course' | 'practice';
export type ExamType = 'quiz' | 'midterm' | 'final' | 'placement_test';
export type ExamStatus = 'draft' | 'published' | 'archived';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'essay';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'real_test_level';
export type AttemptStatus = 'in_progress' | 'submitted' | 'graded' | 'expired';

export interface ExamSummary {
  examId: string;
  examCode?: string;
  examTitle: string;
  description?: string;
  examScope: ExamScope;
  examType?: ExamType;
  status: ExamStatus;
  certificateId?: string;
  certificateName?: string;
  courseId?: string;
  courseTitle?: string;
  durationMinutes: number;
  totalQuestions: number;
  totalParts: number;
  passingScore?: number;
  maxAttempts?: number;
  showAnswers?: boolean;
  showScore?: boolean;
  isFree?: boolean;
  price?: number;
  difficultyLevel?: DifficultyLevel;
  recommendedLevel?: string;
  availableFrom?: string;
  availableUntil?: string;
  publishedDate?: string;
  requiresEnrollment?: boolean;
  /** Chỉ có khi người xem là admin. */
  totalAttempts?: number;
  averageScore?: number;
  createdAt?: string;
  lastUpdated?: string;
}

export interface QuestionOption {
  optionId: string;
  optionText: string;
  optionOrder: number;
  /** Chỉ có khi người xem là admin. */
  isCorrect?: boolean;
  explanation?: string;
}

export interface ExamQuestion {
  questionId: string;
  sectionId?: string;
  questionOrder?: number;
  /** Số thứ tự hiển thị liên tục trong toàn đề. */
  displayNumber?: number;
  timeLimitSeconds?: number;
  questionType: QuestionType;
  questionText: string;
  points: number;
  difficultyLevel?: DifficultyLevel;
  topic?: string;
  audioUrl?: string;
  imageUrl?: string;
  explanation?: string;
  usageCount?: number;
  options?: QuestionOption[];
  /** matching (góc nhìn học viên): vế trái theo thứ tự, vế phải đã sắp xếp lại. */
  matchingLeft?: string[];
  matchingRight?: string[];
}

export interface ExamSection {
  sectionId: string;
  sectionType: string;
  title: string;
  instructions?: string;
  passageText?: string;
  audioUrl?: string;
  sectionOrder: number;
  durationMinutes?: number;
  certificatePartId?: string;
  certificatePartName?: string;
  questionCount: number;
  maxScore?: number;
  questions?: ExamQuestion[];
}

export interface ExamDetail {
  exam: ExamSummary;
  /** Có được làm đề không (không có khi chưa đăng nhập). */
  accessible?: boolean;
  accessMessage?: string;
  questionsIncluded: boolean;
  maxScore: number;
  sections: ExamSection[];
  unsectionedQuestions?: ExamQuestion[];
}

export interface SavedAnswer {
  questionId: string;
  selectedOptionId?: string;
  answerText?: string;
  timeSpentSeconds?: number;
  answeredDate?: string;
}

export interface AttemptDetail {
  attemptId: string;
  examId: string;
  examTitle: string;
  attemptNumber: number;
  status: AttemptStatus;
  startTime: string;
  expiresAt: string;
  /** Giây còn lại theo giờ server. */
  remainingSeconds: number;
  endTime?: string;
  durationMinutes: number;
  autoSubmitted?: boolean;
  exam?: ExamDetail;
  answers: SavedAnswer[];
}

export interface AttemptSummary {
  attemptId: string;
  examId: string;
  examTitle: string;
  examCode?: string;
  attemptNumber: number;
  status: AttemptStatus;
  startTime: string;
  expiresAt?: string;
  endTime?: string;
  timeSpentSeconds?: number;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  pendingManualGrading?: boolean;
  autoSubmitted?: boolean;
  studentId?: string;
  studentName?: string;
  studentEmail?: string;
}

export interface SectionScore {
  sectionId: string;
  /** Phần thi của chứng chỉ (Dev 2) mà section thuộc về — để lấy thang điểm của phần */
  certificatePartId?: string;
  sectionType: string;
  title: string;
  questionCount: number;
  correctCount: number;
  earnedScore: number;
  maxScore: number;
  percentage: number;
  pendingManualGrading: boolean;
}

export interface AnswerResult {
  questionId: string;
  sectionId?: string;
  displayNumber: number;
  questionType: QuestionType;
  questionText: string;
  points: number;
  answered: boolean;
  selectedOptionId?: string;
  selectedOptionText?: string;
  answerText?: string;
  correct?: boolean;
  earnedScore?: number;
  pendingManualGrading?: boolean;
  correctOptionIds?: string[];
  correctAnswers?: string[];
  explanation?: string;
  mentorFeedback?: string;
  gradedDate?: string;
  /** Đề luyện tập: kết quả AI chấm câu Writing / Speaking */
  aiEvaluation?: EssayAiEvaluation;
}

/** Điểm + nhận xét của 1 tiêu chí AI chấm */
export interface AiCriterionScore {
  band: number;
  comment: string;
}

/** Kết quả AI chấm 1 câu Writing / Speaking, theo thang của chứng chỉ mục tiêu [minScore, maxScore] */
export interface EssayAiEvaluation {
  skill: 'WRITING' | 'SPEAKING';
  bandScore: number;
  cefrLevel?: string;
  certificateName: string;
  minScore: number;
  maxScore: number;
  taskAchievement: AiCriterionScore;
  coherenceCohesion: AiCriterionScore;
  lexicalResource: AiCriterionScore;
  grammaticalAccuracy: AiCriterionScore;
  feedback: string;
  suggestions: string[];
  model?: string;
  evaluatedAt?: string;
}

/** Trình độ từ đề luyện tập theo chứng chỉ mục tiêu (cũng là giá trị lưu vào hồ sơ) */
export interface PracticeLevel {
  certificateName: string;
  overallScore: number;
  minScore: number;
  maxScore: number;
  step: number;
  /** A1 – C2 */
  cefrLevel: string;
  skills: {
    skill: 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING' | 'OTHER';
    score: number;
    maxScore: number;
    cefrLevel?: string;
    percentage: number;
  }[];
}

export interface AttemptResult {
  /** Chỉ có ở đề luyện tập đã chấm xong */
  practiceLevel?: PracticeLevel;
  attempt: AttemptSummary;
  correctCount?: number;
  incorrectCount?: number;
  unansweredCount: number;
  scoreVisible: boolean;
  answersVisible: boolean;
  sectionScores?: SectionScore[];
  answers: AnswerResult[];
}

export interface AnswerItemRequest {
  questionId: string;
  selectedOptionId?: string | null;
  answerText?: string | null;
  timeSpentSeconds?: number;
}

/** Kết quả bài kiểm tra năng lực (placement_test) gần nhất theo chứng chỉ — GET /me/proficiency.
 *  Backend trả % từng phần; FE quy đổi theo thang của chứng chỉ (scaleResult). */
export interface Proficiency {
  certificateId: string;
  certificateName: string;
  examId: string;
  examTitle: string;
  attemptId: string;
  takenAt?: string;
  /** assessed: đã đủ điểm; pending_grading: còn phần Writing / Speaking chờ mentor chấm */
  status: 'assessed' | 'pending_grading';
  /** Tỷ lệ % cả bài */
  percentage?: number;
  sections: SectionScore[];
}

export const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  quiz: 'Quiz',
  midterm: 'Giữa kỳ',
  final: 'Cuối kỳ',
  placement_test: 'Kiểm tra đầu vào',
};

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  multiple_choice: 'Trắc nghiệm',
  true_false: 'Đúng / Sai',
  fill_blank: 'Điền từ',
  matching: 'Nối cặp',
  essay: 'Tự luận (Writing / Speaking)',
};

export const ATTEMPT_STATUS_LABEL: Record<AttemptStatus, string> = {
  in_progress: 'Đang làm',
  submitted: 'Chờ chấm',
  graded: 'Đã chấm',
  expired: 'Hết giờ (tự nộp)',
};

export const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  draft: 'Nháp',
  published: 'Đã công khai',
  archived: 'Lưu trữ',
};

/** Mã lỗi backend Exam (5001-5023) cần xử lý riêng ở FE. */
export const EXAM_ERROR_CODE = {
  ATTEMPT_ALREADY_SUBMITTED: '5013',
  ATTEMPT_TIME_EXPIRED: '5014',
} as const;
