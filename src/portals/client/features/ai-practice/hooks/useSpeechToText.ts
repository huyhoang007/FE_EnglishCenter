/**
 * useSpeechToText — ghi âm và chuyển giọng nói thành chữ ngay trên trình duyệt (Dev 5 — TASK-D5-04)
 * -----------------------------------------------------------
 * Dùng Web Speech API (SpeechRecognition) có sẵn trong Chrome / Edge, không gọi BE, không tốn phí.
 * task.md: học viên nộp "văn bản phiên âm từ bài nói" → hook này tạo phiên âm, học viên sửa lại rồi nộp.
 * - onFinalText: gọi mỗi khi có 1 đoạn đã nhận dạng xong (để nối vào ô bài làm).
 * - interimText: đoạn đang nói dở (chỉ để hiển thị).
 * - Chrome tự dừng khi im lặng lâu → nếu người dùng chưa bấm Dừng thì tự bật lại.
 * Trình duyệt không hỗ trợ (Firefox, Safari cũ) → isSupported = false, học viên tự gõ phiên âm.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

/* Kiểu tối thiểu cho Web Speech API (TS không có sẵn bản webkit) */
interface SttAlternative {
  transcript: string;
}
interface SttResult {
  isFinal: boolean;
  0: SttAlternative;
}
interface SttResultEvent {
  resultIndex: number;
  results: ArrayLike<SttResult>;
}
interface SttErrorEvent {
  error: string;
}
interface SttRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SttResultEvent) => void) | null;
  onerror: ((e: SttErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type SttConstructor = new () => SttRecognition;

const getRecognitionClass = (): SttConstructor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SttConstructor;
    webkitSpeechRecognition?: SttConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

const ERROR_MESSAGE: Record<string, string> = {
  'not-allowed': 'Bạn chưa cho phép dùng micro. Hãy bật quyền micro cho trang này rồi thử lại.',
  'service-not-allowed': 'Trình duyệt chặn dịch vụ nhận dạng giọng nói.',
  'audio-capture': 'Không tìm thấy micro. Kiểm tra lại thiết bị ghi âm.',
  network: 'Mất kết nối mạng, không nhận dạng được giọng nói.',
};

export function useSpeechToText(onFinalText: (text: string) => void, lang = 'en-US') {
  const RecognitionClass = getRecognitionClass();
  const isSupported = !!RecognitionClass;

  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const recognitionRef = useRef<SttRecognition | null>(null);
  /** true khi người dùng muốn tiếp tục ghi (dùng để tự bật lại khi Chrome tự dừng) */
  const wantRecordingRef = useRef(false);
  const onFinalRef = useRef(onFinalText);
  onFinalRef.current = onFinalText;

  // Đếm thời gian ghi âm
  useEffect(() => {
    if (!isRecording) return undefined;
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [isRecording]);

  const stop = useCallback(() => {
    wantRecordingRef.current = false;
    recognitionRef.current?.stop();
    setIsRecording(false);
    setInterimText('');
  }, []);

  const start = useCallback(() => {
    if (!RecognitionClass || wantRecordingRef.current) return;
    const recognition = new RecognitionClass();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          if (text.trim()) onFinalRef.current(text.trim());
        } else {
          interim += text;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (e) => {
      // "no-speech" / "aborted" là bình thường (im lặng, tự dừng) → để onend tự bật lại
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      wantRecordingRef.current = false;
      setError(ERROR_MESSAGE[e.error] ?? `Lỗi nhận dạng giọng nói (${e.error}).`);
    };

    recognition.onend = () => {
      if (wantRecordingRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          wantRecordingRef.current = false;
        }
      }
      setIsRecording(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    wantRecordingRef.current = true;
    setError(null);
    setSeconds(0);
    setInterimText('');
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      wantRecordingRef.current = false;
      setError('Không bật được ghi âm. Hãy thử lại.');
    }
  }, [RecognitionClass, lang]);

  // Rời trang / đổi đề thì tắt micro
  useEffect(
    () => () => {
      wantRecordingRef.current = false;
      recognitionRef.current?.abort();
    },
    [],
  );

  return { isSupported, isRecording, interimText, error, seconds, start, stop };
}
