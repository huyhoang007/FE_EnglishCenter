/**
 * Course Domain Types
 * -----------------------------------------------------------
 * Định nghĩa các kiểu dữ liệu cho module Khóa học, tuân thủ
 * chuẩn DTO ApiResponse<T> của dự án.
 */

import type { ApiResponse } from '@/shared/types';
import type { UserRole } from '@/portals/client/features/auth';

/** Loại chứng chỉ mà khóa học hướng tới */
export type CertificateType = 'IELTS' | 'TOEIC' | 'VSTEP';

/** Cấp độ khóa học */
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

/** Trạng thái của một bài học trong curriculum */
export type LessonStatus = 'PREVIEW' | 'LOCKED' | 'ENROLLED';

export interface Mentor {
  id: string;
  fullName: string;
  avatarUrl?: string;
  title: string; // VD: "Ex-IELTS Examiner · 8.5 Overall"
  rating: number; // 0-5
  studentCount: number;
  experience: string; // "10 năm kinh nghiệm"
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  description?: string;
  durationMinutes: number;
  type: 'VIDEO' | 'READING' | 'QUIZ' | 'LIVE';
  status: LessonStatus;
}

export interface CourseSection {
  id: string;
  order: number;
  title: string;
  lessons: Lesson[];
}

export interface VocabularyCard {
  id: string;
  word: string;
  ipa: string; // Phiên âm IPA
  partOfSpeech: string; // noun / verb / adj ...
  meaning: string; // Nghĩa tiếng Việt
  example: string;
  exampleTranslation: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  certificate: CertificateType;
  level: CourseLevel;
  price: number; // VND
  originalPrice: number; // VND (giá gốc, có thể khác price)
  durationHours: number;
  totalLessons: number;
  rating: number; // 0-5
  ratingCount: number;
  studentEnrolled: number;
  thumbnailUrl: string;
  coverUrl: string; // Ảnh cover lớn cho hero
  shortDescription: string;
  targetDescription: string; // "Cam kết đạt 7.5+ IELTS trong 3 tháng"
  outcomes: string[]; // Mục tiêu đầu ra
  mentor: Mentor;
  curriculum: CourseSection[];
  vocabularyBank: VocabularyCard[];
  /** Roles được phép truy cập (mặc định ai cũng xem được) */
  visibleTo?: UserRole[];
}

/** Response các endpoint liên quan đến course */
export type CourseListResponse = ApiResponse<Course[]>;
export type CourseDetailResponse = ApiResponse<Course>;
