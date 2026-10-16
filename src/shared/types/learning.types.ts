/**
 * Learning Domain Types
 * -----------------------------------------------------------
 * Phục vụ màn hình "Khóa học của tôi" (MyCoursesView) và
 * "Phòng học trực tuyến" (StudyRoomView).
 *
 * Toàn bộ mock data bám sát cấu trúc Course / CourseSection / Lesson
 * đã có trong module @/features/courses, đồng thời bổ sung các trường
 * tiến độ cá nhân (progressPercent, completedLessonIds, lastLessonId…)
 * phục vụ cho flow học tập của học viên.
 */

import type {
  Course,
  CourseSection,
  Lesson,
  CertificateType,
  Mentor,
} from '@/shared/types';

/* ============================================================
 *  1. Tiến độ học tập của học viên theo từng khóa
 * ============================================================ */
export type LearningStatus = 'IN_PROGRESS' | 'COMPLETED' | 'NOT_STARTED';

export interface CourseProgress {
  /** Phần trăm hoàn thành (0–100) */
  percent: number;
  /** Danh sách ID bài học đã hoàn thành */
  completedLessonIds: string[];
  /** Bài học hiện tại đang học dở (lesson.id) */
  currentLessonId: string;
  /** Tổng thời lượng đã học tích lũy (giờ) */
  studiedHours: number;
  /** Trạng thái tổng thể của khóa */
  status: LearningStatus;
  /** Ngày ghi danh (ISO) */
  enrolledAt: string;
  /** Ngày hoàn thành (ISO) — chỉ có khi status = 'COMPLETED' */
  completedAt?: string;
}

/* ============================================================
 *  2. EnrolledCourse — Khóa học đã ghi danh (kèm tiến độ)
 * ============================================================ */
export interface EnrolledCourse {
  /** Khóa học gốc */
  course: Course;
  /** Tiến độ của riêng học viên này */
  progress: CourseProgress;
  /** Bài học kế tiếp cần học (đã resolve) */
  nextLesson: Lesson;
  /** Mentor phụ trách (mirror từ course.mentor) */
  mentor: Mentor;
}

/* ============================================================
 *  3. Study Room — chi tiết cho 1 bài học
 * ============================================================ */
export type StudyTabKey = 'overview' | 'vocabulary' | 'homework';

export interface StudyMaterial {
  id: string;
  title: string;
  /** Tên file hiển thị (VD: "ielts-writing-task1-handbook.pdf") */
  fileName: string;
  /** Định dạng: pdf, docx, mp4 … */
  fileType: 'pdf' | 'docx' | 'mp4' | 'zip';
  /** Dung lượng file (KB) */
  sizeKb: number;
}

export interface StudyHomework {
  id: string;
  prompt: string;
  /** Hạn nộp (chuỗi hiển thị) */
  dueLabel: string;
  /** ISO datetime — dùng cho sort */
  dueAt: string;
  /** Điểm đánh giá (nếu đã chấm) */
  gradedScore?: number;
  /** Nhận xét từ giảng viên (nếu đã chấm) */
  gradedFeedback?: string;
  /** Bài làm của học viên (nếu đã nộp) */
  studentAnswer?: string;
  /** File đính kèm (nếu có) */
  attachments?: { name: string; sizeKb: number }[];
}

export interface StudyLesson {
  lesson: Lesson;
  section: CourseSection;
  /** Tóm tắt nội dung bài học */
  summary: string[];
  /** Tài liệu đính kèm */
  materials: StudyMaterial[];
  /** Từ vựng trọng tâm */
  vocabulary: {
    word: string;
    ipa: string;
    partOfSpeech: string;
    meaning: string;
    example: string;
  }[];
  /** Bài tập về nhà (nếu có) */
  homework?: StudyHomework;
}

/* ============================================================
 *  4. Stats — cho MyCoursesView
 * ============================================================ */
export interface LearningStats {
  inProgressCourses: number;
  studiedHours: number;
  pendingHomeworks: number;
}

/* ============================================================
 *  5. Filter cho MyCoursesView
 * ============================================================ */
export type MyCoursesFilter = 'all' | 'in-progress' | 'completed';

/* ============================================================
 *  6. Cert label helper (dùng cho UI)
 * ============================================================ */
export const CERT_LABEL: Record<CertificateType, string> = {
  IELTS: 'IELTS Academic',
  TOEIC: 'TOEIC',
  VSTEP: 'VSTEP B1-B2',
};
