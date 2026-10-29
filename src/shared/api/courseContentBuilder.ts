/**
 * courseContentBuilder — Xây payload `contentData` theo từng `contentType`
 * -----------------------------------------------------------
 * Backend (Dev 2) lưu `content_data` dưới dạng **JSONB** và **không validate
 * cấu trúc theo contentType** — mọi thứ đều là JSON tự do. Vì vậy frontend
 * phải tự chịu trách nhiệm gửi đúng shape để màn client đọc được.
 *
 * Shape chuẩn cho từng loại (đã đối chiếu `CourseServiceImpl.buildContentResponse`
 * + `JsonUtil.readBoolean/readString`):
 *
 *   lesson      → { isPreview: boolean, videoUrl?: string, durationMinutes?: number }
 *   homework    → { instructions?, dueDate?, maxScore?, attachmentUrl?,
 *                  rubric: [ { criterion, description?, maxScore? } ] }
 *   vocabulary  → { setIds: string[] }
 *
 * ⚠️ TỪ VỰNG KHÔNG CHỨA TỪ:
 *   Nội dung 'vocabulary' là CON TRỎ tới các bộ trong KHO TỪ VỰNG CHUNG
 *   (`vocabulary_sets`). Mảng `setIds` chứa id của các bộ; backend tự gán
 *   chúng vào khóa học qua bảng `course_vocabulary_sets`.
 *   → Dùng `shared/api/vocabularyService.ts` cho toàn bộ nghiệp vụ từ vựng.
 */

/* =========================================================
 * Types
 * ========================================================= */
import type {
  ContentType,
  HomeworkContentData,
  HomeworkSubmissionType,
  LessonPayloadData,
  RubricCriterion,
} from '@/shared/types/catalog.types';

/* =========================================================
 * LESSON
 * ========================================================= */

export interface LessonPayloadInput {
  isPreview: boolean;
  videoUrl?: string;
  /** Thời lượng (phút). */
  durationMinutes?: number | null;
}

/**
 * Bài học — bám sát `JsonUtil.readBoolean(contentData, "isPreview")`
 * và `JsonUtil.readString(contentData, "videoUrl")` ở backend.
 */
export function buildLessonContentData(
  input: LessonPayloadInput,
): LessonPayloadData {
  const data: LessonPayloadData = { isPreview: Boolean(input.isPreview) };

  const videoUrl = (input.videoUrl ?? '').trim();
  if (videoUrl) data.videoUrl = videoUrl;

  // Chỉ ghi duration khi là số hợp lệ > 0, tránh ghi "abc" hoặc 0.
  const duration = Number(input.durationMinutes);
  if (Number.isFinite(duration) && duration > 0) {
    data.durationMinutes = Math.round(duration);
  }

  return data;
}

/* =========================================================
 * HOMEWORK
 * ========================================================= */

export interface RubricInput {
  criterion: string;
  description?: string;
  /**
   * Điểm tối đa. Kiểu `string | number` vì trong form đang nhập dạng text
   * (để tránh mất dấu chấm/thập phân khi user đang gõ). Khi build payload
   * sẽ ép về number và bỏ qua giá trị không hợp lệ.
   */
  maxScore?: number | string | null;
}

export interface HomeworkPayloadInput {
  /**
   * Hình thức nộp bài.
   *
   * Bám sát `homework_submissions` của backend:
   *   - `text`            → học viên gõ vào `answer_content`
   *   - `file`            → học viên upload vào `file_url`
   *   - `multiple_choice` → làm bài trắc nghiệm trong `Exam` (chấm tự động)
   */
  submissionType?: HomeworkSubmissionType;
  instructions?: string;
  dueDate?: string;
  maxScore?: number | null;
  /**
   * Điểm đạt (0-100). Tương đương `Exam.passingScore` của backend —
   * cùng một khái niệm "phần trăm điểm tối thiểu để đạt".
   */
  passingScore?: number | null;
  /** Thời gian làm bài (phút). */
  timeLimitMinutes?: number | null;
  attachmentUrl?: string;
  /** Tên file tài liệu đính kèm (để hiển thị cho học viên). */
  attachmentName?: string;
  /** Public ID trên Cloudinary (dùng để xoá file khi gỡ tài liệu). */
  attachmentPublicId?: string;
  /**
   * Số lần làm bài tối đa (null = không giới hạn).
   *
   * Backend `content_data` là JSONB tự do nên không có cột riêng; client đọc
   * trực tiếp từ `contentData.maxAttempts` (xem `CourseDetailPage`).
   */
  maxAttempts?: number | null;
  /** `examId` của đề trắc nghiệm liên kết. */
  examId?: string | null;
  rubric?: RubricInput[];
}

/**
 * Bài tập — `rubric` luôn là mảng (kể cả rỗng) để backend/frontend
 * không phải xử lý `null`.
 */
export function buildHomeworkContentData(
  input: HomeworkPayloadInput,
): HomeworkContentData {
  const data: HomeworkContentData = { rubric: [] };

  // Luôn ghi `submissionType` — backend/client đọc để biết form nộp bài nào
  // cần hiển thị (gõ chữ / upload file / làm trắc nghiệm).
  data.submissionType = input.submissionType ?? 'text';

  const instructions = (input.instructions ?? '').trim();
  if (instructions) data.instructions = instructions;

  const dueDate = (input.dueDate ?? '').trim();
  if (dueDate) data.dueDate = dueDate;

  const attachmentUrl = (input.attachmentUrl ?? '').trim();
  if (attachmentUrl) data.attachmentUrl = attachmentUrl;

  const attachmentName = (input.attachmentName ?? '').trim();
  if (attachmentName) data.attachmentName = attachmentName;

  const attachmentPublicId = (input.attachmentPublicId ?? '').trim();
  if (attachmentPublicId) data.attachmentPublicId = attachmentPublicId;

  const maxScore = Number(input.maxScore);
  if (Number.isFinite(maxScore) && maxScore > 0) {
    data.maxScore = Math.round(maxScore);
  }

  const passingScore = Number(input.passingScore);
  if (Number.isFinite(passingScore) && passingScore >= 0) {
    data.passingScore = Math.round(passingScore);
  }

  const timeLimit = Number(input.timeLimitMinutes);
  if (Number.isFinite(timeLimit) && timeLimit > 0) {
    data.timeLimitMinutes = Math.round(timeLimit);
  }

  const maxAttempts = Number(input.maxAttempts);
  if (Number.isFinite(maxAttempts) && maxAttempts > 0) {
    data.maxAttempts = Math.round(maxAttempts);
  }

  const examId = (input.examId ?? '').trim();
  if (examId) data.examId = examId;

  (input.rubric ?? []).forEach((r) => {
    const criterion = (r.criterion ?? '').trim();
    if (!criterion) return;

    const criterionItem: RubricCriterion = { criterion };

    const description = (r.description ?? '').trim();
    if (description) criterionItem.description = description;

    const score = Number(r.maxScore);
    if (Number.isFinite(score) && score > 0) {
      criterionItem.maxScore = Math.round(score);
    }

    data.rubric!.push(criterionItem);
  });

  return data;
}

/* =========================================================
 * VOCABULARY
 * ========================================================= */

/**
 * Nội dung 'vocabulary' — danh sách id bộ từ vựng CHUNG được tham chiếu.
 *
 * Nội dung này KHÔNG chứa từ vựng. Nó trỏ tới các bộ trong kho chung
 * (`vocabulary_sets`); backend sẽ gán chúng vào khóa học qua bảng
 * `course_vocabulary_sets` và trả về `vocabularySetIds` ở response.
 */
export interface VocabularyPayloadInput {
  /** Id các bộ trong kho từ vựng chung. */
  setIds: string[];
}

/** Xây `contentData` cho nội dung 'vocabulary'. */
export function buildVocabularyContentData(
  input: VocabularyPayloadInput,
): { setIds: string[] } {
  const setIds = Array.from(
    new Set(
      (input.setIds ?? [])
        .map((id) => (id ?? '').trim())
        .filter((id) => id.length > 0),
    ),
  );
  return { setIds };
}

/**
 * Tiêu đề TỰ ĐỘNG cho nội dung 'vocabulary'.
 *
 * Nội dung 'vocabulary' KHÔNG có tiêu đề do admin gõ — form chỉ cho tick
 * các bộ trong kho chung. Backend cho phép `title` = null, nhưng danh sách
 * nội dung ở trang admin vẫn hiển thị cột tiêu đề → ta tự tổng hợp từ tên
 * các bộ đã tick để danh sách dễ đọc.
 *
 * @param setIds       Danh sách id bộ đã tick.
 * @param setTitles    Map `setId` → tên bộ (lấy từ kho chung).
 * @param fallbackLabel Nhãn dự phòng khi chưa biết tên bộ nào.
 */
export function buildVocabularyTitle(
  setIds: string[],
  setTitles: Record<string, string> = {},
  fallbackLabel = 'Vocabulary',
): string {
  const names = (setIds ?? [])
    .map((id) => (setTitles?.[id] ?? '').trim())
    .filter((name) => name.length > 0);

  if (names.length === 0) return fallbackLabel;
  if (names.length === 1) return `${fallbackLabel}: ${names[0]}`;
  return `${fallbackLabel}: ${names[0]} (+${names.length - 1})`;
}

/* =========================================================
 * Dispatcher
 * ========================================================= */

/**
 * Xây `contentData` (đã là JSON **string**) theo `contentType`.
 *
 * Backend nhận `contentData` là **String** rồi `JsonUtil.normalize()` parse
 * vào cột JSONB — nên ta phải `JSON.stringify` trước khi gửi.
 */
export function buildContentDataForType(
  contentType: ContentType,
  payload: unknown,
): string {
  switch (contentType) {
    case 'lesson':
      return JSON.stringify(buildLessonContentData(payload as LessonPayloadInput));
    case 'homework':
      return JSON.stringify(
        buildHomeworkContentData(payload as HomeworkPayloadInput),
      );
    case 'vocabulary':
      return JSON.stringify(
        buildVocabularyContentData(payload as VocabularyPayloadInput),
      );
    default:
      return JSON.stringify(payload ?? {});
  }
}
