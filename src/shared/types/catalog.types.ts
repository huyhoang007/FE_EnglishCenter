/**
 * Dev 2 Domain Types — Course / Certificate / CourseContent
 * -----------------------------------------------------------
 * Định nghĩa CHÍNH XÁC theo DTO của Backend (Dev 2):
 *   - CourseResponse
 *   - CertificateResponse / CertificatePartResponse
 *   - CourseContentResponse
 *   - Create/Update request payloads
 *
 * LƯU Ý QUAN TRỌNG:
 *   Khác với `Course` trong `course.types.ts` (dùng cho mock Gold Flow),
 *   các kiểu ở đây bám sát thực tế JSONB trả về từ API:
 *   - ID đều là UUID (string) — không có `slug`.
 *   - `status` trả về lowercase: 'draft' | 'active' | 'archived'.
 *   - `contentType` lowercase: 'lesson' | 'vocabulary' | 'homework'.
 *   - `contentData` là object JSONB đã parse sẵn (không phải string).
 */

/* =========================================================
 * Certificate
 * ========================================================= */

export interface CertificatePartDto {
  partId: string;
  certificateId: string;
  partName: string;
  partDescription: string | null;
  partOrder: number;
  /** JSONB — backend đã parse thành object, frontend dùng trực tiếp. */
  properties: Record<string, unknown> | null;
}

export interface CertificateDto {
  certificateId: string;
  certificateName: string;
  description: string | null;
  partCount: number;
  parts: CertificatePartDto[] | null;
  createdAt: string | null;
  lastUpdated: string | null;
}

/* =========================================================
 * Course
 * ========================================================= */

/** Trạng thái khóa học — backend lưu lowercase trong DB enum. */
export type CourseStatus = 'draft' | 'active' | 'archived';

export interface CourseDto {
  courseId: string;
  code: string;
  title: string;
  description: string | null;
  level: string | null;
  price: number;
  targetScore: number | null;
  thumbnailUrl: string | null;
  status: CourseStatus;
  certificateId: string | null;
  certificateName: string | null;
  certificatePartId: string | null;
  certificatePartName: string | null;
  /** null = khóa VOD tự học, không gắn mentor. */
  mentorId: string | null;
  mentorName: string | null;
  createdByUserId: string | null;
  createdAt: string | null;
  lastUpdated: string | null;
}

/* =========================================================
 * Course Content
 * ========================================================= */

export type ContentType = 'lesson' | 'vocabulary' | 'homework';

/** Payload JSONB của bài học. */
export interface LessonContentData {
  isPreview?: boolean;
  videoUrl?: string;
  durationMinutes?: number;
  [key: string]: unknown;
}

/** Payload JSONB của flashcard từ vựng. */
export interface VocabularyContentData {
  word?: string;
  phonetic?: string;
  audioUrl?: string;
  meaning?: string;
  partOfSpeech?: string;
  example?: string;
  exampleTranslation?: string;
  [key: string]: unknown;
}

/** Payload JSONB của bài tập về nhà (kèm rubric chấm điểm). */
export interface HomeworkContentData {
  instructions?: string;
  dueDate?: string;
  rubric?: RubricCriterion[];
  maxScore?: number;
  attachmentUrl?: string;
  [key: string]: unknown;
}

export interface RubricCriterion {
  criterion: string;
  description?: string;
  maxScore?: number;
  [key: string]: unknown;
}

export type ContentData =
  | LessonContentData
  | VocabularyContentData
  | HomeworkContentData;

export interface CourseContentDto {
  contentId: string;
  courseId: string;
  contentType: ContentType;
  parentContentId: string | null;
  title: string;
  description: string | null;
  contentOrder: number;
  contentData: ContentData | null;
  /** Bài học thử — ai cũng xem được videoUrl. */
  isPreview: boolean;
  /** Bài bị khóa — server KHÔNG trả videoUrl. */
  isLocked: boolean;
  /** Chỉ có giá trị khi !isLocked. */
  videoUrl: string | null;
}

/** Cây bài học đã group theo parentContentId cho UI syllabus. */
export interface CourseContentNode extends CourseContentDto {
  children: CourseContentNode[];
}

/* =========================================================
 * Query filters (map 1-1 với @RequestParam của CourseController)
 * ========================================================= */

export interface CourseQueryParams {
  keyword?: string;
  certificateId?: string;
  certificatePartId?: string;
  /** Backend nhận `level` (không phải `minLevel`). */
  level?: string;
  targetScore?: number;
  status?: CourseStatus;
  page?: number;
  size?: number;
  sort?: string;
}

/* =========================================================
 * Request payloads
 * ========================================================= */

export interface CreateCoursePayload {
  code: string;
  title: string;
  description?: string;
  level?: string;
  price?: number;
  targetScore?: number;
  thumbnailUrl?: string;
  certificateId?: string;
  certificatePartId?: string;
  mentorId?: string;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  level?: string;
  price?: number;
  targetScore?: number;
  thumbnailUrl?: string;
  certificateId?: string;
  certificatePartId?: string;
  mentorId?: string;
  status?: CourseStatus;
}

export interface CreateCourseContentPayload {
  contentType: ContentType;
  title: string;
  description?: string;
  contentOrder?: number;
  parentContentId?: string;
  /** JSON **string** — backend nhận string rồi normalize vào cột JSONB. */
  contentData?: string;
}

export interface UpdateCourseContentPayload {
  title?: string;
  description?: string;
  contentOrder?: number;
  parentContentId?: string;
  contentData?: string;
}

export interface CertificatePartPayload {
  partName: string;
  partDescription?: string;
  properties?: string;
}

export interface CreateCertificatePayload {
  certificateName: string;
  description?: string;
  parts?: CertificatePartPayload[];
}

export interface UpdateCertificatePayload {
  certificateName?: string;
  description?: string;
}