/**
 * AudioRecorder — GHI ÂM TRỰC TIẾP cho bài tập Speaking
 * -----------------------------------------------------------
 * Dùng `MediaRecorder` của trình duyệt để ghi âm từ microphone, sau đó
 * xuất ra file (m4a/webm/mp3 tuỳ trình duyệt) để học viên nộp lên Cloudinary
 * qua chữ ký do BE cấp (`purpose = submission_audio`).
 *
 * Giao diện:
 *   - Chưa ghi : nút "Bắt đầu ghi âm" + trạng thái quyền mic;
 *   - Đang ghi  : nút "Dừng ghi" + timer đếm tăng + nút "Huỷ";
 *   - Đã ghi    : player nghe lại + nút "Ghi lại" / "Dùng bản này".
 *
 * Ghi chú: trình duyệt chỉ cho ghi khi trang chạy qua HTTPS hoặc localhost.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils/cn';

export interface AudioRecorderProps {
  /** Được gọi khi có bản ghi mới (File + định dạng). */
  onRecorded: (file: File, format: string) => void;
  /** Đang upload → disable các nút. */
  disabled?: boolean;
  /** Định dạng ưu tiên khi trình duyệt hỗ trợ. */
  preferredFormat?: string;
}

/** Định dạng MediaRecorder hỗ trợ, theo thứ tự ưu tiên. */
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecorded,
  disabled = false,
  preferredFormat,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  // Dọn tài nguyên khi unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setPermissionDenied(false);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt này không hỗ trợ ghi âm. Hãy dùng Chrome/Edge.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Chọn mimeType mà trình duyệt hỗ trợ.
      const candidates = preferredFormat
        ? [`audio/${preferredFormat}`, ...MIME_CANDIDATES]
        : MIME_CANDIDATES;
      const mimeType =
        candidates.find((m) => MediaRecorder.isTypeSupported?.(m)) ?? '';

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        if (blob.size > 0) {
          const ext = resolveExtension(recorder.mimeType);
          const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
          const file = new File([blob], `ghi-am-${stamp}.${ext}`, {
            type: blob.type,
          });
          onRecorded(file, ext);
        }
      };

      recorder.start();
      setIsRecording(true);
      setElapsed(0);
      timerRef.current = window.setInterval(
        () => setElapsed((s) => s + 1),
        1000,
      );
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setPermissionDenied(true);
        setError(
          'Bạn chưa cấp quyền sử dụng microphone. Hãy cho phép trong trình duyệt rồi thử lại.',
        );
      } else {
        setError('Không mở được microphone. Hãy thử lại hoặc tải file âm thanh lên.');
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === 'recording') {
      // Dừng nhưng không gửi dữ liệu ra ngoài.
      recorderRef.current.onstop = null;
      recorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
    setElapsed(0);
  };

  return (
    <div className="space-y-2">
      {!isRecording ? (
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="w-full flex flex-col items-center justify-center gap-2 py-7 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:border-[#0052CC]/40 hover:bg-blue-50/30 transition-colors disabled:opacity-60"
        >
          <span className="w-11 h-11 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </span>
          <p className="text-xs font-bold text-slate-700">
            Ghi âm trực tiếp
          </p>
          <p className="text-[11px] text-slate-400">
            Cho phép trình duyệt dùng microphone để ghi bài nói
          </p>
        </button>
      ) : (
        <div className="rounded-xl border-2 border-rose-200 bg-rose-50/60 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="text-sm font-extrabold text-rose-700 tabular-nums">
              {formatElapsed(elapsed)}
            </span>
            <span className="text-[11px] text-rose-600">đang ghi…</span>
            <Button
              variant="outline"
              size="sm"
              onClick={cancelRecording}
              className="ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Huỷ
            </Button>
            <Button size="sm" onClick={stopRecording} leftIcon={Square}>
              Dừng ghi
            </Button>
          </div>
          <p className="text-[11px] text-rose-700/80">
            Hãy nói rõ ràng vào microphone. Bấm &quot;Dừng ghi&quot; khi xong.
          </p>
        </div>
      )}

      {error && (
        <p
          className={cn(
            'text-[11px]',
            permissionDenied ? 'text-amber-600' : 'text-rose-600',
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
};

/** Suy ra đuôi file từ mimeType của MediaRecorder. */
function resolveExtension(mimeType: string): string {
  if (!mimeType) return 'webm';
  if (mimeType.includes('mp4')) return 'm4a';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mpeg')) return 'mp3';
  return 'webm';
}

/** Định dạng giây → mm:ss. */
function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default AudioRecorder;
