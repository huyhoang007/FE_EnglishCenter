/**
 * lessonProgressService — Tiến độ xem video bài học (V29)
 * -----------------------------------------------------------
 * Backend:
 *   POST /api/v1/lesson-progress/{contentId}  → báo tiến độ (chống tua)
 *   GET  /api/v1/lesson-progress/{contentId}  → lấy mốc giây đã xem
 *
 * Mục đích:
 *   1. Tick "Hoàn thành" khi học viên xem hết video;
 *   2. Chống tua — BE chỉ nhận mốc đã xem TĂNG LÊN và không vượt quá
 *      phần đã xem thật (cộng sai số cho phép), client cũng clamp playback.
 */

import axiosClient, { type BeResponse } from './axiosClient';
import { toApiError } from './courseService';

const BASE = '/api/v1';

/** Tiến độ xem video của học viên với 1 bài học. */
export interface LessonProgressDto {
  contentId: string;
  studentId: string | null;
  /** Mốc giây đã xem tối đa (client không được phát quá mốc này). */
  watchedSeconds: number;
  /** Tổng thời lượng video (giây). */
  durationSeconds: number;
  /** Đã xem xong → tick hoàn thành. */
  completed: boolean;
  completedAt: string | null;
}

/** Payload báo tiến độ. */
export interface SaveLessonProgressPayload {
  /** Giây hiện tại của video. */
  currentTime: number;
  /** Tổng thời lượng video (giây). */
  durationSeconds: number;
}

/**
 * Báo tiến độ xem video.
 *
 * BE sẽ tự chặn "tua": mốc mới không được vượt quá mốc đã xem + sai số cho phép.
 * Vì vậy client có thể gửi thẳng `currentTime` hiện tại.
 */
export async function saveLessonProgress(
  contentId: string,
  payload: SaveLessonProgressPayload,
): Promise<LessonProgressDto> {
  try {
    const { data } = await axiosClient.post<BeResponse<LessonProgressDto>>(
      `${BASE}/lesson-progress/${contentId}`,
      payload,
    );
    if (!data?.result) throw new Error(data?.message || 'Không lưu được tiến độ');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Không lưu được tiến độ xem video');
  }
}

/** Lấy tiến độ hiện tại của học viên với 1 bài học. */
export async function fetchLessonProgress(
  contentId: string,
): Promise<LessonProgressDto> {
  try {
    const { data } = await axiosClient.get<BeResponse<LessonProgressDto>>(
      `${BASE}/lesson-progress/${contentId}`,
    );
    if (!data?.result) throw new Error('Chưa có dữ liệu tiến độ');
    return data.result;
  } catch (err) {
    throw toApiError(err, 'Không tải được tiến độ xem video');
  }
}

/**
 * Sai số cho phép (giây) giữa mốc đã xem và `currentTime` mà client gửi lên.
 *
 * Khớp với `LessonProgressService.MAX_SEEK_GAP_SECONDS` của backend.
 */
export const SEEK_GAP_SECONDS = 10;

/**
 * Ngưỡng xem xong: đạt 95% thời lượng thì coi như hoàn thành.
 *
 * Khớp với `LessonProgressService.COMPLETE_RATIO` của backend.
 */
export const COMPLETE_RATIO = 0.95;

/** Mốc giây đã xem tối đa mà client được phép phát tới. */
export function maxAllowedTime(watchedSeconds: number): number {
  return (watchedSeconds ?? 0) + SEEK_GAP_SECONDS;
}

/** Đã xem đủ để tick hoàn thành chưa? */
export function isVideoCompleted(
  currentTime: number,
  durationSeconds: number,
): boolean {
  if (!durationSeconds || durationSeconds <= 0) return false;
  return currentTime >= durationSeconds * COMPLETE_RATIO;
}
