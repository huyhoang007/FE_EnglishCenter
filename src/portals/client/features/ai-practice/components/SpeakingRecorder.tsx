/**
 * SpeakingRecorder — nút ghi âm + trạng thái cho câu Speaking (Dev 5)
 * -----------------------------------------------------------
 * Giọng nói được chuyển thành chữ ngay trên trình duyệt (useSpeechToText); bản phiên âm là bài làm gửi AI chấm
 * (Claude không nhận file âm thanh). Dùng trong phòng làm bài của đề luyện tập.
 */

import React from 'react';
import { Mic, RotateCcw, Square } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils';

/** Định dạng giây → mm:ss */
export const formatRecordDuration = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

export const SpeakingRecorder: React.FC<{
  isSupported: boolean;
  isRecording: boolean;
  seconds: number;
  interimText: string;
  error: string | null;
  disabled: boolean;
  hasTranscript: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}> = ({ isSupported, isRecording, seconds, interimText, error, disabled, hasTranscript, onStart, onStop, onReset }) => {
  if (!isSupported) {
    return (
      <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        Trình duyệt này chưa hỗ trợ ghi âm và chuyển giọng nói thành chữ. Hãy mở trang bằng Chrome hoặc Edge để làm
        phần Speaking.
      </div>
    );
  }
  return (
    <div
      className={cn('mb-3 p-3 rounded-lg border', isRecording ? 'bg-red-50 border-red-200' : 'bg-violet-50/60 border-violet-200')}
    >
      <div className="flex flex-wrap items-center gap-3">
        {isRecording ? (
          <Button variant="danger" size="sm" leftIcon={Square} onClick={onStop}>
            Dừng ghi âm
          </Button>
        ) : (
          <>
            <Button variant="ai" size="sm" leftIcon={Mic} disabled={disabled} onClick={onStart}>
              {hasTranscript ? 'Ghi âm tiếp' : 'Bắt đầu ghi âm'}
            </Button>
            {hasTranscript && (
              <Button variant="outline" size="sm" leftIcon={RotateCcw} disabled={disabled} onClick={onReset}>
                Ghi lại từ đầu
              </Button>
            )}
          </>
        )}
        {isRecording ? (
          <span className="inline-flex items-center gap-2 text-sm font-bold text-red-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
            Đang ghi · <span className="tabular-nums">{formatRecordDuration(seconds)}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-600">
            Nói bằng tiếng Anh, hệ thống tự chuyển thành chữ. Phần thi nói chỉ nhận ghi âm, không gõ chữ.
          </span>
        )}
      </div>
      {isRecording && interimText && <p className="mt-2 text-sm italic text-slate-500">{interimText}…</p>}
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
};

export default SpeakingRecorder;
