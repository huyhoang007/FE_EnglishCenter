/**
 * TrackedVideoPlayer — Video bài học CÓ CHỐNG TUA (V29)
 * -----------------------------------------------------------
 * Yêu cầu nghiệp vụ:
 *   1. Học viên xem hết video → tick "Hoàn thành" ở danh sách bài học;
 *   2. KHÔNG được tua video (fast-forward) để bỏ qua phần chưa xem.
 *
 * Cách chống tua (2 lớp):
 *   - Client: khi người dùng tua → `currentTime` bị CLAMP về
 *     `watchedSeconds + SEEK_GAP_SECONDS` (mốc đã xem + sai số cho phép).
 *     Không cho tua tới đoạn chưa xem.
 *   - Server: `POST /lesson-progress/{id}` chỉ nhận mốc TĂNG LÊN và không
 *     vượt quá phần đã xem → không lách được bằng cách sửa request.
 *
 * Tiến độ được gửi lên mỗi `SAVE_INTERVAL_MS` và khi video kết thúc.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, Lock } from 'lucide-react';
import {
  maxAllowedTime,
  saveLessonProgress,
  SEEK_GAP_SECONDS,
} from '@/shared/api/lessonProgressService';

/* =========================================================
 * Props
 * ========================================================= */
export interface TrackedVideoPlayerProps {
  /** URL video (mp4) — nếu là YouTube thì không chống tua được, dùng player khác. */
  url: string;
  /** Tiêu đề bài học (dùng cho aria-label). */
  title: string;
  /** Id nội dung bài học — dùng để lưu tiến độ. */
  contentId: string;
  /** Mốc giây đã xem tối đa (lấy từ server). */
  initialWatchedSeconds?: number;
  /** Thời lượng video (giây) — đã biết sẵn từ server. */
  initialDurationSeconds?: number;
  /** Gọi khi bài học vừa được đánh dấu hoàn thành (để parent refresh danh sách). */
  onCompleted?: () => void;
}

/** Chu kỳ gửi tiến độ lên server (ms). */
const SAVE_INTERVAL_MS = 5000;

/** Ngưỡng coi là "đã xem đủ" (95% thời lượng) — khớp backend. */
const COMPLETE_RATIO = 0.95;

/* =========================================================
 * Component
 * ========================================================= */
export const TrackedVideoPlayer: React.FC<TrackedVideoPlayerProps> = ({
  url,
  title,
  contentId,
  initialWatchedSeconds = 0,
  initialDurationSeconds = 0,
  onCompleted,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  /** Mốc giây đã xem tối đa (nguồn sự thật phía client để clamp). */
  const watchedRef = useRef<number>(Math.max(0, initialWatchedSeconds));
  /** Thời lượng video (giây). */
  const durationRef = useRef<number>(Math.max(0, initialDurationSeconds));
  /** Đánh dấu đã báo hoàn thành — tránh gọi lại nhiều lần. */
  const completedRef = useRef<boolean>(false);
  /** Thời điểm gửi tiến độ gần nhất. */
  const lastSavedAtRef = useRef<number>(0);
  /** Cờ đang tua (dùng để phân biệt seek do người dùng vs do code). */
  const seekingRef = useRef<boolean>(false);

  const [completed, setCompleted] = useState(false);
  const [blockedSeek, setBlockedSeek] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (payload: { currentTime: number; durationSeconds: number }) =>
      saveLessonProgress(contentId, payload),
    onSuccess: (data) => {
      // Đồng bộ mốc đã xem với server (server có thể từ chối mốc quá xa).
      if (typeof data?.watchedSeconds === 'number') {
        watchedRef.current = data.watchedSeconds;
      }
      if (data?.completed && !completedRef.current) {
        completedRef.current = true;
        setCompleted(true);
        onCompleted?.();
      }
    },
  });

  /** Gửi tiến độ (bỏ qua lỗi mạng — tiến độ sẽ gửi lại ở lần sau). */
  const persist = useCallback(
    (currentTime: number, durationSeconds: number) => {
      if (!contentId) return;
      saveMutation.mutate({ currentTime, durationSeconds });
    },
    [contentId, saveMutation],
  );

  /* ---------- Khi đổi bài học → reset mốc ---------- */
  useEffect(() => {
    watchedRef.current = Math.max(0, initialWatchedSeconds);
    durationRef.current = Math.max(0, initialDurationSeconds);
    completedRef.current = false;
    lastSavedAtRef.current = 0;
    setCompleted(false);
    setBlockedSeek(false);
  }, [contentId, initialWatchedSeconds, initialDurationSeconds]);

  /* ---------- Khi video load metadata ---------- */
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    durationRef.current = Math.floor(video.duration);
    // Cho phép tua tới mốc đã xem + sai số cho phép (để học viên xem lại đoạn cũ).
    const resumeAt = Math.min(
      watchedRef.current,
      Math.max(0, Math.floor(video.duration) - 1),
    );
    if (resumeAt > 0) {
      video.currentTime = resumeAt;
    }
  }, []);

  /* ---------- CHỐNG TUA ---------- */
  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    seekingRef.current = true;

    const limit = maxAllowedTime(watchedRef.current);
    if (video.currentTime > limit) {
      // Người dùng cố tua vượt quá phần đã xem → kéo về mốc cho phép.
      video.currentTime = limit;
      setBlockedSeek(true);
      window.setTimeout(() => setBlockedSeek(false), 2500);
    }
  }, []);

  const handleSeeked = useCallback(() => {
    seekingRef.current = false;
  }, []);

  /* ---------- Tiến trình phát → gửi tiến độ định kỳ ---------- */
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || seekingRef.current) return;

    const current = Math.floor(video.currentTime);
    const duration = Math.floor(video.duration || durationRef.current || 0);
    if (duration > 0) durationRef.current = duration;

    // Chỉ tiến mốc đã xem khi video đang phát (không phải đang tua).
    if (!video.paused && current > watchedRef.current) {
      watchedRef.current = current;
    }

    const now = Date.now();
    if (now - lastSavedAtRef.current >= SAVE_INTERVAL_MS) {
      lastSavedAtRef.current = now;
      persist(current, duration || durationRef.current);
    }

    // Đạt ngưỡng xem xong → tick hoàn thành ngay (không đợi hết video).
    if (
      !completedRef.current &&
      duration > 0 &&
      watchedRef.current >= duration * COMPLETE_RATIO
    ) {
      completedRef.current = true;
      setCompleted(true);
      persist(watchedRef.current, duration);
      onCompleted?.();
    }
  }, [persist, onCompleted]);

  /* ---------- Kết thúc video → lưu lần cuối ---------- */
  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const duration = Math.floor(video.duration || durationRef.current || 0);
    if (duration > 0) durationRef.current = duration;
    watchedRef.current = Math.max(watchedRef.current, duration);
    persist(duration, duration || durationRef.current);
    if (!completedRef.current) {
      completedRef.current = true;
      setCompleted(true);
      onCompleted?.();
    }
  }, [persist, onCompleted]);

  /* ---------- Dừng video khi đổi bài ---------- */
  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, [contentId]);

  return (
    <div className="space-y-2">
      <div className="aspect-video rounded-xl overflow-hidden bg-black relative">
        <video
          ref={videoRef}
          src={url}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          preload="metadata"
          className="w-full h-full"
          aria-label={title}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeking={handleSeeking}
          onSeeked={handleSeeked}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        >
          Trình duyệt của bạn không hỗ trợ phát video.
        </video>

        {completed && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600/95 text-white text-[11px] font-bold shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành
          </div>
        )}

        {blockedSeek && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold shadow-lg">
            <Lock className="w-3.5 h-3.5" />
            Không thể tua — hãy xem hết phần trước
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        {completed
          ? 'Bạn đã xem xong bài này. Bài thi cuối kỳ sẽ mở khoá khi đủ điều kiện.'
          : `Không thể tua video. Chỉ được tua trong vùng đã xem (tối đa ${SEEK_GAP_SECONDS}s sai số).`}
      </p>
    </div>
  );
};

export default TrackedVideoPlayer;
