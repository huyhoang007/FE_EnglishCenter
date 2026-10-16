/**
 * useExamTimer — Hook đếm ngược dùng cho phòng thi
 * -----------------------------------------------------------
 * Trả về:
 *   - secondsLeft: số giây còn lại
 *   - minutes / seconds: định dạng mm:ss
 *   - isExpired: true khi đã hết giờ
 *   - formatted: chuỗi mm:ss cho UI
 *   - progress: 0..1 (đã làm bao nhiêu phần)
 *   - reset: khởi động lại timer với duration mới
 *
 * Hỗ trợ auto-pause khi tab ẩn (Page Visibility API).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseExamTimerOptions {
  /** Tổng thời gian tính bằng giây */
  durationSeconds: number;
  /** Tự động pause khi tab ẩn (mặc định true) */
  pauseOnHidden?: boolean;
  /** Callback khi hết giờ */
  onExpire?: () => void;
}

export interface UseExamTimerReturn {
  secondsLeft: number;
  minutes: string;
  seconds: string;
  formatted: string;
  progress: number;
  isExpired: boolean;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (newDuration?: number) => void;
}

export function useExamTimer(
  options: UseExamTimerOptions,
): UseExamTimerReturn {
  const {
    durationSeconds,
    pauseOnHidden = true,
    onExpire,
  } = options;

  const [secondsLeft, setSecondsLeft] = useState<number>(durationSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const totalRef = useRef<number>(durationSeconds);
  const onExpireRef = useRef<(() => void) | undefined>(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Tick every second
  useEffect(() => {
    if (!isRunning) return;
    if (secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, secondsLeft]);

  // Pause when tab hidden
  useEffect(() => {
    if (!pauseOnHidden) return;
    const onVisibility = () => {
      if (document.hidden) {
        setIsRunning(false);
      } else {
        setIsRunning(true);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [pauseOnHidden]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(
    (newDuration?: number) => {
      const d = newDuration ?? totalRef.current;
      totalRef.current = d;
      setSecondsLeft(d);
      setIsRunning(true);
    },
    [],
  );

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const seconds = String(secondsLeft % 60).padStart(2, '0');

  return {
    secondsLeft,
    minutes,
    seconds,
    formatted: `${minutes}:${seconds}`,
    progress:
      totalRef.current > 0
        ? Math.max(0, Math.min(1, 1 - secondsLeft / totalRef.current))
        : 0,
    isExpired: secondsLeft <= 0,
    isRunning,
    start,
    pause,
    reset,
  };
}
