/**
 * usePracticeDraft — tự lưu nháp bài luyện đề AI vào máy (localStorage) (Dev 5 — TASK-D5-04)
 * -----------------------------------------------------------
 * Mỗi học viên + mỗi đề 1 bản nháp: key "practice-draft:{userId}:{examId}".
 * - Lưu sau ~1 giây kể từ lần sửa cuối (Writing: bài viết, Speaking: phiên âm).
 * - Đổi đề / rời trang / F5 / đóng tab: lưu ngay phần còn đang chờ.
 * - Không cần mạng → mất wifi vẫn lưu được.
 * - Nộp bài thành công thì gọi discard() để xóa nháp.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface PracticeDraft {
  content: string;
  /** ISO time lúc lưu */
  savedAt: string;
}

export const practiceDraftKey = (userId: string, examId: string) => `practice-draft:${userId}:${examId}`;

export function readPracticeDraft(key: string): PracticeDraft | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as PracticeDraft;
    return typeof draft?.content === 'string' ? draft : null;
  } catch {
    return null;
  }
}

function writePracticeDraft(key: string, content: string): string | null {
  try {
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(key, JSON.stringify({ content, savedAt } satisfies PracticeDraft));
    return savedAt;
  } catch {
    // Hết dung lượng / chặn storage → bỏ qua, không làm hỏng trang
    return null;
  }
}

export function clearPracticeDraft(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/**
 * Tự lưu `content` cho `key` (null = không lưu, vd chưa chọn đề / không phải học viên).
 * Trả về thời điểm lưu gần nhất và hàm discard() để xóa nháp.
 */
export function usePracticeDraftAutosave(key: string | null, content: string, delayMs = 1000) {
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  /** Phần đã sửa nhưng chưa kịp lưu (đang chờ hết thời gian debounce) */
  const pendingRef = useRef<{ key: string; content: string } | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const flush = useCallback(() => {
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending && pending.content.trim()) writePracticeDraft(pending.key, pending.content);
  }, []);

  // Lưu sau khi ngừng sửa ~1 giây; ô trống thì xóa nháp
  useEffect(() => {
    if (!key) return undefined;
    pendingRef.current = { key, content };
    timerRef.current = window.setTimeout(() => {
      pendingRef.current = null;
      if (content.trim()) {
        setLastSavedAt(writePracticeDraft(key, content));
      } else {
        clearPracticeDraft(key);
        setLastSavedAt(null);
      }
    }, delayMs);
    return () => window.clearTimeout(timerRef.current);
  }, [key, content, delayMs]);

  // Đổi đề / rời trang trong lúc còn phần chưa lưu → lưu ngay cho đề cũ
  useEffect(() => () => flush(), [key, flush]);

  // F5 / đóng tab: cleanup của React không chạy → nghe sự kiện của trình duyệt
  useEffect(() => {
    window.addEventListener('beforeunload', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('beforeunload', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [flush]);

  /** Xóa nháp (sau khi nộp bài thành công hoặc học viên bấm "Bỏ nháp") */
  const discard = useCallback(() => {
    // Hủy cả lần lưu đang chờ để nháp không bị ghi lại ngay sau khi xóa
    window.clearTimeout(timerRef.current);
    pendingRef.current = null;
    if (key) clearPracticeDraft(key);
    setLastSavedAt(null);
  }, [key]);

  return { lastSavedAt, discard };
}
