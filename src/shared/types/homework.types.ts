/**
 * Types cho tính năng BÀI TẬP (Homework) — Dev 2.5
 * -----------------------------------------------------------
 * Bám sát contract của backend:
 *   POST /api/v1/uploads/signature            → UploadSignature
 *   POST /api/v1/homework-submissions         → HomeworkSubmission
 *   GET  /api/v1/homework-submissions/me      → HomeworkSubmission[]
 *   GET  /api/v1/homework-submissions/homework/{id}/mine → HomeworkSubmission[]
 *   GET  /api/v1/mentor/homework-submissions  → Page<HomeworkSubmission>
 *   PUT  /api/v1/mentor/homework-submissions/{id}/grade → HomeworkSubmission
 *   GET  /api/v1/mentor/homework-submissions/{id}/history → GradeHistory[]
 */

import type { HomeworkSubmissionType } from './catalog.types';

/**
 * Trạng thái bài nộp của học viên:
 * - `not_started` — chưa nộp
 * - `pending`     — đã nộp, đang chờ mentor chấm
 * - `graded`      — đã có điểm
 */
export type HomeworkStatus = 'not_started' | 'pending' | 'graded';

/** Mục đích xin chữ ký upload — BE quyết định resource_type + folder. */
export type UploadPurpose =
  | 'attachment'
  | 'submission'
  | 'submission_audio'
  | 'multiple_choice';

/** Chữ ký upload Cloudinary (API secret KHÔNG có trong response này). */
export interface UploadSignature {
  apiKey: string;
  signature: string;
  timestamp: number;
  cloudName: string;
  /** image | raw | video — do BE quyết định. */
  resourceType: 'image' | 'raw' | 'video';
  /**
   * Delivery type của file: `authenticated` (private — bài nộp học viên) hoặc
   * `upload` (public — tài liệu đính kèm của bài tập).
   * <p>
   * BẮT BUỘC gửi kèm `type` này khi POST upload, nếu không Cloudinary sẽ mặc định
   * `upload` (public) → bài nộp của học viên bị lộ công khai.
   */
  deliveryType?: 'authenticated' | 'upload';
  /** Thư mục đích trên Cloudinary. */
  folder: string;
  /** Tham số phụ cần gửi kèm lúc upload. */
  params?: Record<string, unknown>;
}

/** Kết quả upload trả về từ Cloudinary (sau khi FE POST thẳng). */
export interface CloudinaryUploadResult {
  public_id: string;
  resource_type?: string;
  format?: string;
  bytes?: number;
  original_filename?: string;
  secure_url?: string;
  error?: { message?: string };
}

/** Một dòng lịch sử chấm / sửa điểm. */
export interface HomeworkGradeHistory {
  historyId: string;
  gradedByUserId?: string | null;
  gradedByName?: string | null;
  /** Điểm trước khi sửa (null ở lần chấm đầu). */
  oldScore?: number | null;
  newScore?: number | null;
  passed?: boolean | null;
  feedback?: string | null;
  gradedAt?: string | null;
}

/** Một bài nộp bài tập. */
export interface HomeworkSubmission {
  submissionId: string;
  homeworkContentId: string;
  homeworkTitle?: string | null;

  studentId?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;

  /** Nội dung trả lời (bài tự luận). */
  answerContent?: string | null;
  /**
   * URL xem file ĐÃ CÓ THỜI HẠN (bài nộp file).
   * Chỉ có khi backend dựng được (cần cấu hình Cloudinary).
   */
  fileUrl?: string | null;

  score?: number | null;
  feedback?: string | null;
  submittedDate?: string | null;
  gradedDate?: string | null;

  /** true = đã chấm. */
  graded?: boolean;
  /** true = đạt; null = chưa chấm. */
  passed?: boolean | null;
  /** not_started | pending | graded */
  status?: HomeworkStatus | null;
  /** Snapshot hình thức nộp tại lúc nộp. */
  submissionType?: HomeworkSubmissionType | null;
  /** Lượt thi thật (bài trắc nghiệm). */
  examAttemptId?: string | null;

  /** Metadata file trên Cloudinary. */
  filePublicId?: string | null;
  fileResourceType?: string | null;
  fileFormat?: string | null;
  fileBytes?: number | null;
  fileOriginalName?: string | null;

  /** Lịch sử chấm — chỉ mentor/admin thấy. */
  gradeHistory?: HomeworkGradeHistory[] | null;
}

/** Body nộp bài. */
export interface SubmitHomeworkPayload {
  homeworkContentId: string;
  /** Bài tự luận. */
  answerContent?: string;
  /** Hình thức nộp. */
  submissionType?: HomeworkSubmissionType;
  /** Bài trắc nghiệm — lượt thi đã nộp. */
  examAttemptId?: string;
  /** Bài nộp file — public_id từ Cloudinary. */
  filePublicId?: string;
  fileResourceType?: string;
  fileFormat?: string;
  fileBytes?: number;
  fileOriginalName?: string;
}

/** Body xin chữ ký upload. */
export interface UploadSignaturePayload {
  purpose: UploadPurpose;
  homeworkContentId?: string;
  fileFormat?: string;
  fileBytes?: number;
  fileName?: string;
}

/** Body chấm điểm. */
export interface GradeHomeworkPayload {
  score: number;
  feedback?: string;
}

/** Giới hạn file theo resource_type (byte) — khớp với BE. */
export const HOMEWORK_FILE_LIMITS = {
  image: 5 * 1024 * 1024,
  raw: 20 * 1024 * 1024,
  video: 100 * 1024 * 1024,
} as const;

/** Định dạng file được phép theo resource_type. */
export const HOMEWORK_ALLOWED_EXTENSIONS = {
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif'],
  raw: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
  video: ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'mp4', 'mov', 'webm', 'mkv'],
} as const;

/** Lấy đuôi file (không có dấu chấm, chữ thường). */
export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  if (dot < 0 || dot >= fileName.length - 1) return '';
  return fileName.slice(dot + 1).toLowerCase();
}

/**
 * Suy ra resource_type từ đuôi file — KHỚP với quy tắc của backend
 * (`UploadService.resolveResourceType`).
 */
export function resolveResourceType(
  fileName: string,
): 'image' | 'raw' | 'video' | null {
  const ext = getFileExtension(fileName);
  if (!ext) return null;
  if ((HOMEWORK_ALLOWED_EXTENSIONS.image as readonly string[]).includes(ext)) {
    return 'image';
  }
  if ((HOMEWORK_ALLOWED_EXTENSIONS.video as readonly string[]).includes(ext)) {
    return 'video';
  }
  if ((HOMEWORK_ALLOWED_EXTENSIONS.raw as readonly string[]).includes(ext)) {
    return 'raw';
  }
  return null;
}

/** Kiểm tra dung lượng file có vượt giới hạn của resource_type không. */
export function isFileSizeAllowed(
  resourceType: 'image' | 'raw' | 'video',
  bytes: number,
): boolean {
  return bytes <= HOMEWORK_FILE_LIMITS[resourceType];
}
