/**
 * PracticeView — Phòng luyện đề Writing/Speaking có AI chấm (Dev 5 — TASK-D5-04)
 * -----------------------------------------------------------
 * Tab "Kho đề":
 *   1. Chọn đề trong danh sách (lọc Writing/Speaking, tìm theo tên)
 *   2. Writing: gõ bài vào ô. Speaking: CHỈ ghi âm — trình duyệt chuyển giọng nói thành chữ
 *      (Web Speech API), ô phiên âm chỉ đọc, không gõ / dán được. Muốn làm lại thì "Ghi lại từ đầu".
 *      Trình duyệt không hỗ trợ ghi âm (Firefox, Safari cũ) thì không làm được đề Speaking.
 *   3. Bấm "Nộp bài & AI chấm" → gọi submit rồi ai-evaluate (mất 10 - 60 giây)
 *   4. Hiện kết quả 4 tiêu chí bên phải
 *   Nếu AI chấm lỗi (502/5016) thì bài đã nộp vẫn được giữ → bấm "Chấm lại" không phải nộp lại.
 * Tab "Lịch sử": các bài đã làm, xem lại kết quả hoặc chấm bài chưa chấm.
 *
 * Lưu nháp & mất mạng:
 *   - Bài làm / phiên âm tự lưu nháp vào máy (localStorage) theo học viên + đề, mở lại đề thì khôi phục.
 *     Nộp bài thành công thì xóa nháp.
 *   - Mất mạng: hiện cảnh báo, khóa nút nộp, dừng ghi âm (phần đã nói vẫn giữ). Writing vẫn viết tiếp được.
 *     Có mạng lại thì báo để học viên nộp bài / bấm "Ghi âm tiếp".
 *
 * URL hỗ trợ ?examId=... để mở sẵn 1 đề (dùng từ trang Lộ trình học),
 * ?tab=history để mở sẵn tab Lịch sử (dùng khi bấm thông báo kết quả chấm).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  FileText,
  History,
  Loader2,
  Mic,
  PenLine,
  RotateCcw,
  Search,
  Sparkles,
  Save,
  Square,
  Wand2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { cn, countWords } from '@/shared/utils';
import { useRole } from '@/portals/client/features/auth';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { getErrorMessage } from '@/shared/api/axiosClient';
import type {
  PracticeAnswer,
  PracticeEvaluation,
  PracticeExam,
  PracticeExamType,
} from '@/shared/types';
import {
  useEvaluatePracticeAnswer,
  useMyPracticeAnswers,
  usePracticeEvaluation,
  usePracticeExams,
  useSubmitPracticeAnswer,
} from '../hooks/usePractice';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { practiceDraftKey, readPracticeDraft, usePracticeDraftAutosave } from '../hooks/usePracticeDraft';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { EvaluationResult } from './EvaluationResult';

/** BE yêu cầu bài làm 50 - 20000 ký tự */
const MIN_CHARS = 50;
const MAX_CHARS = 20000;

type Tab = 'bank' | 'history';
type TypeFilter = 'ALL' | PracticeExamType;
/** idle: chưa làm gì, submitting: đang nộp, evaluating: AI đang chấm */
type Phase = 'idle' | 'submitting' | 'evaluating';

export const PracticeView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const role = useRole();
  const isStudent = role === 'STUDENT';

  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'history' ? 'history' : 'bank');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');

  const [selectedExamId, setSelectedExamId] = useState<string | null>(searchParams.get('examId'));
  const [content, setContent] = useState('');
  /** Bài đã nộp nhưng AI chấm lỗi → giữ lại để chấm lại */
  const [pendingAnswerId, setPendingAnswerId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  /** Kết quả vừa chấm xong */
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);
  /** Kết quả đang xem lại từ tab Lịch sử */
  const [viewEvaluationId, setViewEvaluationId] = useState<string | null>(null);

  /* ---------------- Data (hooks) ---------------- */
  const examsQuery = usePracticeExams(typeFilter === 'ALL' ? undefined : typeFilter, keyword);
  const exams: PracticeExam[] = examsQuery.data ?? [];
  const selectedExam = exams.find((e) => e.practiceExamId === selectedExamId) ?? null;

  const historyQuery = useMyPracticeAnswers(isStudent && tab === 'history');
  const viewedEvaluationQuery = usePracticeEvaluation(viewEvaluationId);
  const submitMutation = useSubmitPracticeAnswer();
  const evaluateMutation = useEvaluatePracticeAnswer();

  const shownEvaluation = evaluation ?? viewedEvaluationQuery.data ?? null;

  // Speaking: mỗi đoạn nói đã nhận dạng xong được nối vào cuối ô bài làm
  const stt = useSpeechToText((text) => {
    setContent((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text));
    setPendingAnswerId(null);
  });

  /* ---------------- Lưu nháp ---------------- */
  const userId = useAuthStore((s) => s.user?.id);
  const draftKey = isStudent && userId && selectedExamId ? practiceDraftKey(userId, selectedExamId) : null;
  /** Thời điểm của bản nháp vừa khôi phục (để báo cho học viên) */
  const [restoredAt, setRestoredAt] = useState<string | null>(null);

  // Mở đề (hoặc tải lại trang) → khôi phục nháp của đề đó. Phải đặt TRƯỚC hook tự lưu.
  useEffect(() => {
    setRestoredAt(null);
    if (!draftKey) return;
    const draft = readPracticeDraft(draftKey);
    if (draft?.content.trim()) {
      setContent(draft.content);
      setRestoredAt(draft.savedAt);
    }
  }, [draftKey]);

  const draft = usePracticeDraftAutosave(draftKey, content);

  /* ---------------- Trạng thái mạng ---------------- */
  const isOnline = useOnlineStatus();
  const wasOfflineRef = useRef(false);
  /** Vừa có mạng lại (hiện thông báo vài giây) */
  const [backOnline, setBackOnline] = useState(false);
  const stopRecording = stt.stop;

  useEffect(() => {
    if (!isOnline) {
      // Nhận dạng giọng nói cần mạng → dừng hẳn, phần đã nói vẫn nằm trong ô phiên âm
      stopRecording();
      wasOfflineRef.current = true;
      setBackOnline(false);
      return undefined;
    }
    if (!wasOfflineRef.current) return undefined;
    wasOfflineRef.current = false;
    setBackOnline(true);
    const id = window.setTimeout(() => setBackOnline(false), 6000);
    return () => window.clearTimeout(id);
  }, [isOnline, stopRecording]);

  /* ---------------- Actions ---------------- */
  const resetWorkspace = () => {
    setContent('');
    setPendingAnswerId(null);
    setEvaluation(null);
    setViewEvaluationId(null);
    setError(null);
  };

  const handleSelectExam = (examId: string) => {
    // Bấm lại đúng đề đang làm thì giữ nguyên bài (tránh xóa trắng rồi ghi đè nháp)
    if (phase !== 'idle' || examId === selectedExamId) return;
    stt.stop();
    setSelectedExamId(examId);
    resetWorkspace();
  };

  /** Chấm 1 bài đã nộp */
  const runEvaluate = async (answerId: string) => {
    setPhase('evaluating');
    setError(null);
    setViewEvaluationId(null);
    try {
      const result = await evaluateMutation.mutateAsync(answerId);
      setEvaluation(result);
      setPendingAnswerId(null);
    } catch (err) {
      setPendingAnswerId(answerId);
      setError(getErrorMessage(err));
    } finally {
      setPhase('idle');
    }
  };

  /** Nộp bài (nếu chưa nộp) rồi gọi AI chấm */
  const handleSubmitAndEvaluate = async () => {
    if (!selectedExam) return;
    stt.stop();
    if (pendingAnswerId) {
      await runEvaluate(pendingAnswerId);
      return;
    }
    setPhase('submitting');
    setError(null);
    setEvaluation(null);
    setViewEvaluationId(null);
    try {
      const answer = await submitMutation.mutateAsync({
        examId: selectedExam.practiceExamId,
        content: content.trim(),
      });
      // Bài đã lưu trên BE (kể cả nếu AI chấm lỗi vẫn chấm lại được từ Lịch sử) → xóa nháp
      draft.discard();
      setRestoredAt(null);
      await runEvaluate(answer.answerId);
    } catch (err) {
      setError(getErrorMessage(err));
      setPhase('idle');
    }
  };

  /** Tab lịch sử: xem kết quả bài đã chấm */
  const handleViewEvaluation = (answer: PracticeAnswer) => {
    if (!answer.evaluationId) return;
    setError(null);
    setEvaluation(null);
    setViewEvaluationId(answer.evaluationId);
  };

  /** Speaking: xóa phiên âm cũ để ghi lại từ đầu */
  const handleResetRecording = () => {
    stt.stop();
    setContent('');
    setPendingAnswerId(null);
    setRestoredAt(null);
  };

  /** Bỏ bản nháp vừa khôi phục, làm lại từ đầu */
  const handleDiscardDraft = () => {
    stt.stop();
    draft.discard();
    setContent('');
    setPendingAnswerId(null);
    setRestoredAt(null);
  };

  /* ---------------- Render ---------------- */
  const isSpeaking = selectedExam?.examType === 'SPEAKING';
  const charCount = content.trim().length;
  const wordCount = content.trim() ? countWords(content) : 0;
  const canSubmit =
    isStudent &&
    isOnline &&
    !!selectedExam &&
    phase === 'idle' &&
    !stt.isRecording &&
    charCount >= MIN_CHARS &&
    charCount <= MAX_CHARS;

  return (
    <div className="space-y-6">
      {/* ============== HEADER ============== */}
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <Sparkles className="w-3.5 h-3.5" />
          Luyện đề với AI
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Phòng luyện Writing & Speaking
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Chọn đề, viết bài (Writing) hoặc ghi âm bài nói (Speaking) và nhận điểm theo 4 tiêu chí IELTS kèm nhận xét
          bằng tiếng Việt.
        </p>
      </header>

      {/* ============== TABS ============== */}
      <div className="inline-flex p-1 rounded-full bg-slate-100">
        <TabButton active={tab === 'bank'} onClick={() => setTab('bank')} icon={FileText}>
          Kho đề
        </TabButton>
        {isStudent && (
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={History}>
            Lịch sử làm bài
          </TabButton>
        )}
      </div>

      {!isStudent && (
        <Card className="bg-amber-50 border-amber-200 text-sm text-amber-800">
          Chỉ tài khoản Học viên (STUDENT) đăng nhập bằng Backend mới nộp bài và được AI chấm. Bạn vẫn xem được
          kho đề.
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-5 items-start">
        {/* ============== CỘT TRÁI ============== */}
        <div className="space-y-5 min-w-0">
          {tab === 'bank' ? (
            <>
              {/* Bộ lọc */}
              <Card className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {(['ALL', 'WRITING', 'SPEAKING'] as TypeFilter[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTypeFilter(t)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                        typeFilter === t
                          ? 'bg-[#0052CC] border-[#0052CC] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
                      )}
                    >
                      {t === 'ALL' ? 'Tất cả' : t === 'WRITING' ? 'Writing' : 'Speaking'}
                    </button>
                  ))}
                </div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setKeyword(keywordInput.trim());
                  }}
                >
                  <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-input border border-slate-200 focus-within:border-primary">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Tìm theo tên đề…"
                      className="flex-1 text-sm outline-none bg-transparent"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="md">
                    Tìm
                  </Button>
                </form>
              </Card>

              {/* Danh sách đề */}
              <ExamList
                exams={exams}
                isLoading={examsQuery.isLoading}
                errorMessage={examsQuery.isError ? getErrorMessage(examsQuery.error) : null}
                selectedExamId={selectedExamId}
                onSelect={handleSelectExam}
              />

              {/* Khu làm bài */}
              {selectedExam && (
                <Card noPadding>
                  <div className="p-5 border-b border-slate-100 space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      <ExamTypeBadge type={selectedExam.examType} />
                      {selectedExam.bankName && (
                        <Badge variant="neutral" size="sm">
                          {selectedExam.bankName}
                        </Badge>
                      )}
                    </div>
                    <h2 className="font-extrabold text-slate-900">{selectedExam.title}</h2>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {selectedExam.description}
                    </p>
                  </div>

                  <div className="p-5">
                    {isStudent && (
                      <DraftNetworkNotice
                        isOnline={isOnline}
                        backOnline={backOnline}
                        isSpeaking={isSpeaking}
                        restoredAt={restoredAt}
                        onDiscardDraft={handleDiscardDraft}
                      />
                    )}
                    {isSpeaking && isStudent && (
                      <SpeakingRecorder
                        isSupported={stt.isSupported}
                        isRecording={stt.isRecording}
                        seconds={stt.seconds}
                        interimText={stt.interimText}
                        error={stt.error}
                        disabled={phase !== 'idle' || !isOnline}
                        hasTranscript={content.trim().length > 0}
                        onStart={stt.start}
                        onStop={stt.stop}
                        onReset={handleResetRecording}
                      />
                    )}
                    <textarea
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        // Sửa bài sau khi nộp lỗi → coi như bài mới
                        setPendingAnswerId(null);
                      }}
                      disabled={!isStudent || phase !== 'idle' || stt.isRecording}
                      // Speaking: ô phiên âm chỉ đọc, không gõ / dán / kéo thả chữ vào được
                      readOnly={isSpeaking}
                      onPaste={isSpeaking ? (e) => e.preventDefault() : undefined}
                      onDrop={isSpeaking ? (e) => e.preventDefault() : undefined}
                      rows={12}
                      maxLength={MAX_CHARS}
                      placeholder={
                        isSpeaking
                          ? 'Bấm "Bắt đầu ghi âm" và nói bằng tiếng Anh — phiên âm bài nói sẽ tự hiện ở đây…'
                          : 'Viết bài của bạn tại đây…'
                      }
                      className={cn(
                        'w-full rounded-input border border-slate-200 p-3.5 text-sm text-slate-800 leading-relaxed resize-y focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:bg-slate-50',
                        isSpeaking && 'bg-slate-50 cursor-default',
                      )}
                    />

                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        <span className="font-bold text-slate-800 tabular-nums">{wordCount}</span> từ ·{' '}
                        <span className="tabular-nums">{charCount}</span> ký tự
                        {charCount < MIN_CHARS && (
                          <span className="ml-2 text-amber-600">(tối thiểu {MIN_CHARS} ký tự)</span>
                        )}
                        {isStudent && draft.lastSavedAt && charCount > 0 && !pendingAnswerId && !evaluation && (
                          <span className="ml-2 inline-flex items-center gap-1 text-slate-400">
                            <Save className="w-3 h-3" />
                            Đã lưu nháp {formatClock(draft.lastSavedAt)}
                          </span>
                        )}
                      </p>
                      <Button
                        variant="ai"
                        size="md"
                        leftIcon={Wand2}
                        isLoading={phase !== 'idle'}
                        disabled={!canSubmit}
                        onClick={handleSubmitAndEvaluate}
                      >
                        {phase === 'submitting'
                          ? 'Đang nộp bài…'
                          : phase === 'evaluating'
                            ? 'AI đang chấm…'
                            : pendingAnswerId
                              ? 'Chấm lại'
                              : 'Nộp bài & AI chấm'}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </>
          ) : (
            <HistoryList
              answers={historyQuery.data ?? []}
              isLoading={historyQuery.isLoading}
              errorMessage={historyQuery.isError ? getErrorMessage(historyQuery.error) : null}
              busy={phase !== 'idle'}
              onView={handleViewEvaluation}
              onEvaluate={(a) => runEvaluate(a.answerId)}
            />
          )}
        </div>

        {/* ============== CỘT PHẢI: KẾT QUẢ ============== */}
        <div className="lg:sticky lg:top-[112px] space-y-4">
          {viewedEvaluationQuery.isError && (
            <Card className="bg-red-50 border-red-200 text-sm text-red-700">
              {getErrorMessage(viewedEvaluationQuery.error)}
            </Card>
          )}

          {error && (
            <Card className="bg-red-50 border-red-200">
              <p className="text-sm font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Không thành công
              </p>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              {pendingAnswerId && tab === 'bank' && (
                <p className="mt-2 text-xs text-red-600">
                  Bài của bạn đã được lưu. Bấm "Chấm lại" để thử chấm lần nữa.
                </p>
              )}
            </Card>
          )}

          {phase === 'evaluating' || viewedEvaluationQuery.isFetching ? (
            <Card className="text-center py-10">
              <Loader2 className="w-8 h-8 mx-auto text-violet-600 animate-spin" />
              {phase === 'evaluating' ? (
                <>
                  <p className="mt-3 font-bold text-slate-900">AI đang chấm bài…</p>
                  <p className="mt-1 text-sm text-slate-500">Thường mất 10 - 60 giây, đừng tải lại trang.</p>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Đang tải kết quả…</p>
              )}
            </Card>
          ) : shownEvaluation ? (
            <EvaluationResult evaluation={shownEvaluation} />
          ) : (
            <Card className="text-center py-10 border-dashed">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">
                {tab === 'bank'
                  ? 'Chọn đề và nộp bài để xem kết quả AI chấm tại đây.'
                  : 'Chọn "Xem kết quả" ở một bài đã chấm.'}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
 *  Sub components
 * ============================================================ */

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ active, onClick, icon: Icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors',
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
    )}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

/** Định dạng giây → mm:ss */
const formatDuration = (sec: number) =>
  `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

/** "20:15:03" theo giờ máy */
const formatClock = (iso: string) =>
  new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** Cảnh báo mất mạng / vừa có mạng lại / đã khôi phục bản nháp */
const DraftNetworkNotice: React.FC<{
  isOnline: boolean;
  backOnline: boolean;
  isSpeaking: boolean;
  restoredAt: string | null;
  onDiscardDraft: () => void;
}> = ({ isOnline, backOnline, isSpeaking, restoredAt, onDiscardDraft }) => (
  <>
    {!isOnline && (
      <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
        <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <span className="font-bold">Đang mất kết nối mạng.</span> Bài làm đã được lưu nháp trên máy này, không bị
          mất.{' '}
          {isSpeaking
            ? 'Ghi âm tạm dừng (phần đã nói vẫn được giữ) — có mạng lại hãy bấm "Ghi âm tiếp".'
            : 'Bạn vẫn viết tiếp được, có mạng lại hãy bấm nộp bài.'}
        </span>
      </div>
    )}
    {isOnline && backOnline && (
      <div className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
        <Wifi className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Đã có mạng trở lại.{' '}
          {isSpeaking ? 'Bấm "Ghi âm tiếp" để nói tiếp phần còn lại.' : 'Bạn có thể nộp bài.'}
        </span>
      </div>
    )}
    {restoredAt && (
      <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Save className="w-4 h-4 shrink-0" />
          Đã khôi phục bản nháp lưu lúc {formatClock(restoredAt)} {new Date(restoredAt).toLocaleDateString('vi-VN')}.
        </span>
        <button type="button" onClick={onDiscardDraft} className="font-bold hover:underline shrink-0">
          Bỏ nháp
        </button>
      </div>
    )}
  </>
);

/** Thanh ghi âm cho đề Speaking — nhận dạng giọng nói trên trình duyệt */
const SpeakingRecorder: React.FC<{
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
}> = ({
  isSupported,
  isRecording,
  seconds,
  interimText,
  error,
  disabled,
  hasTranscript,
  onStart,
  onStop,
  onReset,
}) => {
  if (!isSupported) {
    return (
      <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
        Trình duyệt này chưa hỗ trợ ghi âm và chuyển giọng nói thành chữ. Hãy mở trang bằng Chrome hoặc Edge
        để làm đề Speaking.
      </div>
    );
  }
  return (
    <div
      className={cn(
        'mb-3 p-3 rounded-lg border',
        isRecording ? 'bg-red-50 border-red-200' : 'bg-violet-50/60 border-violet-200',
      )}
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
            Đang ghi · <span className="tabular-nums">{formatDuration(seconds)}</span>
          </span>
        ) : (
          <span className="text-xs text-slate-600">
            Nói bằng tiếng Anh, hệ thống tự chuyển thành chữ. Phần thi nói chỉ nhận ghi âm, không gõ chữ.
          </span>
        )}
      </div>
      {isRecording && interimText && (
        <p className="mt-2 text-sm italic text-slate-500">{interimText}…</p>
      )}
      {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
    </div>
  );
};

const ExamTypeBadge: React.FC<{ type: PracticeExamType }> = ({ type }) =>
  type === 'SPEAKING' ? (
    <Badge variant="ai" size="sm" icon={Mic}>
      Speaking
    </Badge>
  ) : (
    <Badge variant="primary" size="sm" icon={PenLine}>
      Writing
    </Badge>
  );

const ExamList: React.FC<{
  exams: PracticeExam[];
  isLoading: boolean;
  errorMessage: string | null;
  selectedExamId: string | null;
  onSelect: (examId: string) => void;
}> = ({ exams, isLoading, errorMessage, selectedExamId, onSelect }) => {
  if (isLoading) {
    return (
      <Card className="flex justify-center py-8 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </Card>
    );
  }
  if (errorMessage) {
    return <Card className="text-sm text-red-600">{errorMessage}</Card>;
  }
  if (exams.length === 0) {
    return (
      <Card className="text-sm text-slate-500 text-center py-8">
        Chưa có đề luyện tập nào. Mentor hoặc Admin cần tạo đề trước.
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {exams.map((exam) => (
        <button
          key={exam.practiceExamId}
          type="button"
          onClick={() => onSelect(exam.practiceExamId)}
          className={cn(
            'text-left p-4 rounded-card border bg-white transition-all',
            exam.practiceExamId === selectedExamId
              ? 'border-[#0052CC] ring-2 ring-[#0052CC]/15'
              : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <div className="flex flex-wrap gap-1.5">
            <ExamTypeBadge type={exam.examType} />
            {exam.bankName && (
              <Badge variant="neutral" size="sm">
                {exam.bankName}
              </Badge>
            )}
          </div>
          <p className="mt-2 font-bold text-slate-900 line-clamp-1">{exam.title}</p>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{exam.description}</p>
        </button>
      ))}
    </div>
  );
};

const HistoryList: React.FC<{
  answers: PracticeAnswer[];
  isLoading: boolean;
  errorMessage: string | null;
  busy: boolean;
  onView: (a: PracticeAnswer) => void;
  onEvaluate: (a: PracticeAnswer) => void;
}> = ({ answers, isLoading, errorMessage, busy, onView, onEvaluate }) => {
  if (isLoading) {
    return (
      <Card className="flex justify-center py-8 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </Card>
    );
  }
  if (errorMessage) {
    return <Card className="text-sm text-red-600">{errorMessage}</Card>;
  }
  if (answers.length === 0) {
    return <Card className="text-sm text-slate-500 text-center py-8">Bạn chưa làm bài nào.</Card>;
  }
  return (
    <Card noPadding>
      <ul className="divide-y divide-slate-100">
        {answers.map((a) => (
          <li key={a.answerId} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <ExamTypeBadge type={a.examType} />
                {a.status === 'EVALUATED' ? (
                  <Badge variant="success" size="sm">
                    Đã chấm
                  </Badge>
                ) : (
                  <Badge variant="warning" size="sm">
                    Chưa chấm
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 font-bold text-slate-900 truncate">{a.examTitle}</p>
              <p className="text-xs text-slate-500">
                {new Date(a.submittedAt).toLocaleString('vi-VN')} · {a.wordCount} từ
              </p>
            </div>
            {a.status === 'EVALUATED' && a.bandScore != null && (
              <span className="text-2xl font-extrabold text-[#0052CC] tabular-nums">
                {Number(a.bandScore).toFixed(1)}
              </span>
            )}
            {a.status === 'EVALUATED' ? (
              <Button variant="outline" size="sm" onClick={() => onView(a)}>
                Xem kết quả
              </Button>
            ) : (
              <Button variant="ai" size="sm" leftIcon={Wand2} disabled={busy} onClick={() => onEvaluate(a)}>
                AI chấm
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default PracticeView;
