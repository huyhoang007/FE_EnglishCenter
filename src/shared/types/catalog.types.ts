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
  /** Phiên âm IPA (alias của `phonetic` — cả hai được ghi để tương thích). */
  ipa?: string;
  phonetic?: string;
  audioUrl?: string;
  meaning?: string;
  partOfSpeech?: string;
  example?: string;
  exampleTranslation?: string;
  [key: string]: unknown;
}

/**
 * Một flashcard nằm trong mảng `contentData.items` của một BỘ từ vựng.
 *
 * Khác với `VocabularyContentData`: đây là shape của *phần tử* trong mảng,
 * không phải shape của cả `contentData`.
 */
export interface VocabularyItem {
  word: string;
  /** Phiên âm IPA (ghi kèm `phonetic` để tương thích màn client). */
  ipa?: string;
  phonetic?: string;
  audioUrl?: string;
  meaning?: string;
  partOfSpeech?: string;
  example?: string;
  [key: string]: unknown;
}

/**
 * Payload JSONB của một BỘ từ vựng — gom nhiều flashcard vào 1 content row.
 *
 * ```json
 * { "items": [{ "word": "academic", "ipa": "/…/", "meaning": "Học thuật" }] }
 * ```
 */
export interface VocabularySetContentData {
  items: VocabularyItem[];
  /**
   * `contentId` của các bộ từ vựng nguồn đã được liên kết (thư viện từ vựng).
   *
   * Backend KHÔNG có bảng "vocabulary library" riêng — toàn bộ từ vựng đều là
   * `course_content` có `contentType = 'vocabulary'`. Vì vậy "liên kết bộ từ vựng"
   * = copy các flashcard của bộ nguồn vào `items` + ghi lại id bộ nguồn để
   * truy vết (bộ nguồn có thể bị gỡ khỏi bộ này mà không mất dữ liệu).
   */
  vocabularySetIds?: string[];
  [key: string]: unknown;
}

/**
 * Hình thức nộp bài của một bài tập.
 *
 * Bám sát cột `homework_submissions` của backend, vốn chỉ có 2 cột nội dung:
 *   - `answer_content` (TEXT)  → học viên gõ trả lời  → `text`
 *   - `file_url` (VARCHAR 500) → học viên upload file  → `file`
 *
 * `multiple_choice` là bài trắc nghiệm chấm tự động, gắn với một `Exam`
 * (ngân hàng câu hỏi + `ExamGrader` của backend).
 */
export type HomeworkSubmissionType = 'text' | 'file' | 'multiple_choice';

/** Payload JSONB của bài tập về nhà (kèm rubric chấm điểm). */
export interface HomeworkContentData {
  /** Hình thức nộp — luôn được ghi khi lưu. */
  submissionType?: HomeworkSubmissionType;
  instructions?: string;
  dueDate?: string;
  rubric?: RubricCriterion[];
  maxScore?: number;
  /** Điểm đạt (0-100) — tương đương `Exam.passingScore`. */
  passingScore?: number;
  /** Thời gian làm bài (phút). */
  timeLimitMinutes?: number;
  attachmentUrl?: string;
  /** Số lần làm bài tối đa (thiếu = không giới hạn). */
  maxAttempts?: number;
  /** `examId` của đề trắc nghiệm liên kết (khi `submissionType = multiple_choice`). */
  examId?: string;
  [key: string]: unknown;
}

/** Payload JSONB của bài học — hợp nhất `isPreview` + `videoUrl` + `durationMinutes`. */
export interface LessonPayloadData {
  isPreview: boolean;
  videoUrl?: string;
  durationMinutes?: number;
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
  /** Đề thi liên kết (nội dung 'homework' trắc nghiệm). */
  examId?: string | null;
  /** Tên đề thi liên kết. */
  examTitle?: string | null;
  /**
   * Danh sách id bộ từ vựng CHUNG được tham chiếu —
   * chỉ có giá trị khi `contentType = 'vocabulary'`.
   */
  vocabularySetIds?: string[] | null;
}

/** Cây bài học đã group theo parentContentId cho UI syllabus. */
export interface CourseContentNode extends CourseContentDto {
  children: CourseContentNode[];
}

/* =========================================================
 * Vocabulary Bank (kho tu vung chung)
 * ========================================================= */

/**
 * Một từ trong KHO TỪ VỰNG CHUNG — bám sát `VocabularyWordResponse` của backend.
 */
export interface VocabularyWordDto {
  /** Id từ trong kho chung (dùng làm khoá duy nhất). */
  wordId: string;
  word: string;
  /** Phiên âm IPA. */
  ipa?: string | null;
  /** Alias của `ipa` — màn client đọc key này. */
  phonetic?: string | null;
  meaning?: string | null;
  audioUrl?: string | null;
  partOfSpeech?: string | null;
  example?: string | null;
}

/**
 * Một BỘ từ vựng trong KHO TỪ VỰNG CHUNG.
 *
 * Bộ được tạo độc lập — KHÔNG mang `courseId`. Việc gán vào khóa học
 * thực hiện qua endpoint gán (`PUT /api/v1/vocabulary-sets/courses/{courseId}`).
 */
export interface VocabularySetDto {
  /** Id bộ trong kho chung. */
  setId: string;
  title: string;
  description: string | null;
  /** Các từ thuộc bộ. */
  words: VocabularyWordDto[];
  /** Số từ trong bộ. */
  wordCount: number;
  createdByUserId: string | null;
  createdByUserName: string | null;
  /** Số khóa học đang dùng bộ này. */
  usedInCourseCount: number;
}

/**
 * Một bộ từ vựng đã được GÁN vào một khóa học.
 *
 * Dùng cho endpoint `GET /api/v1/courses/{courseId}/vocabularies` —
 * học viên xem được các bộ đã gán cho khóa học mình đang học.
 */
export interface CourseVocabularySetDto {
  setId: string;
  /** Id của liên kết trong bảng `course_vocabulary_sets`. */
  assignmentId: string;
  title: string;
  description: string | null;
  /** Thứ tự hiển thị trong khóa học. */
  displayOrder: number;
  words: VocabularyWordDto[];
  wordCount: number | null;
  /** true = học viên chưa ghi danh → danh sách từ bị khoá (rỗng). */
  locked: boolean;
}

/** Payload tạo / cập nhật một bộ trong kho chung. */
export interface VocabularySetPayload {
  title: string;
  description?: string;
  /** Danh sách từ của bộ. */
  words: {
    word: string;
    ipa?: string;
    meaning?: string;
    audioUrl?: string;
    partOfSpeech?: string;
    example?: string;
  }[];
}

/** Payload gán bộ từ vựng chung vào một khóa học (mô hình "tick chọn"). */
export interface AssignVocabularySetsPayload {
  /** Danh sách id bộ được gán — bộ không có trong list sẽ bị gỡ. */
  setIds: string[];
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
  /**
   * Danh sách id bộ từ vựng CHUNG được tham chiếu — chỉ dùng khi
   * `contentType = 'vocabulary'`.
   */
  vocabularySetIds?: string[];
  /**
   * Id đề thi liên kết — chỉ dùng khi `contentType = 'homework'`
   * và bài tập là trắc nghiệm.
   */
  examId?: string;
  /** JSON **string** — backend nhận string rồi normalize vào cột JSONB. */
  contentData?: string;
}

export interface UpdateCourseContentPayload {
  title?: string;
  description?: string;
  contentOrder?: number;
  parentContentId?: string;
  /** Chỉ dùng khi nội dung có `contentType = 'vocabulary'`. */
  vocabularySetIds?: string[];
  /** Chỉ dùng khi nội dung có `contentType = 'homework'`. */
  examId?: string;
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