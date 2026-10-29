/**
 * HomeworkSubmitModal — modal nộp bài tập của HỌC VIÊN (Dev 2.5)
 * -----------------------------------------------------------
 * Hỗ trợ 3 hình thức nộp:
 *   - `text`           : soạn thảo gõ trả lời (textarea + bộ đếm ký tự)
 *   - `file`           : upload file lên Cloudinary (kéo-thả hoặc chọn file)
 *   - `multiple_choice` : mở phòng thi thật (ExamRoom), nộp xong gửi attemptId về BE
 *
 * Sau khi nộp thành công → hiển thị kết quả (điểm + nhận xét của mentor).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  FileUp,
  Loader2,
  Mic,
  Paperclip,
  Send,
  XCircle,
} from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils/cn';
import { useCloudinaryUpload } from '@/shared/hooks/useCloudinaryUpload';
import { useHomeworkSubmission, useSubmitHomework } from '../hooks/useHomework';
import { useStartHomeworkAttempt } from '../hooks/useHomeworkExam';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { useNavigate } from 'react-router-dom';
import type { CourseContentDto, HomeworkContentData, HomeworkSubmissionType } from '@/shared/types/catalog.types';
import type {
  CloudinaryUploadResult,
  HomeworkSubmission,
} from '@/shared/types/homework.types';

export interface HomeworkSubmitModalProps {
  open: boolean;
  onClose: () => void;
  homework: CourseContentDto;
}

/** Đọc hình thức nộp từ content_data (mặc định `text` cho dữ liệu cũ). */
function readSubmissionType(hw: CourseContentDto): HomeworkSubmissionType {
  const data = hw.contentData as HomeworkContentData | null;
  const type = data?.submissionType;
  return type === 'file' || type === 'multiple_choice' ? type : 'text';
}

const MAX_TEXT_LENGTH = 10_000;

export const HomeworkSubmitModal: React.FC<HomeworkSubmitModalProps> = ({
  open,
  onClose,
  homework,
}) => {
  const navigate = useNavigate();
  const submissionType = useMemo(() => readSubmissionType(homework), [homework]);
  const data = homework.contentData as HomeworkContentData | null;

  const { latest, submissions, hasSubmitted, isLoading } = useHomeworkSubmission(
    open ? homework.contentId : undefined,
  );
  const submitMutation = useSubmitHomework();
  const startAttempt = useStartHomeworkAttempt(homework.contentId);
  const { upload, isUploading, progress } = useCloudinaryUpload();

  const [answer, setAnswer] = useState('');
  const [uploaded, setUploaded] = useState<CloudinaryUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset mỗi lần mở modal.
  useEffect(() => {
    if (!open) return;
    setAnswer(latest?.answerContent ?? '');
    setUploaded(null);
    setError(null);
  }, [open, latest?.answerContent]);

  const maxScore = data?.maxScore ?? null;
  const dueDate = data?.dueDate ?? null;
  const isOverdue = useMemo(() => {
    if (!dueDate) return false;
    return new Date(dueDate).getTime() < Date.now();
  }, [dueDate]);

  /**
   * Bài tập giới hạn số lần nộp (`maxAttempts`):
   *   - `null`/0  → không giới hạn → luôn cho nộp lại;
   *   - > 0      → chỉ cho nộp lại khi số lần đã nộp < `maxAttempts`.
   */
  const maxAttempts = data?.maxAttempts ?? null;
  const usedAttempts = submissions.length;
  const canSubmitAgain = useMemo(() => {
    if (maxAttempts == null || maxAttempts <= 0) return true;
    return usedAttempts < maxAttempts;
  }, [maxAttempts, usedAttempts]);

  /** Đã nộp và hết lượt → chỉ xem kết quả, không cho nộp lại. */
  const showResultOnly = hasSubmitted && !canSubmitAgain;

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    const ok = await upload({
      file,
      purpose: 'submission',
      homeworkContentId: homework.contentId,
      onUploaded: (result) => setUploaded(result),
    });
    if (!ok) setUploaded(null);
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      if (submissionType === 'text') {
        if (!answer.trim()) {
          setError('Vui lòng nhập nội dung trả lời.');
          return;
        }
        await submitMutation.mutateAsync({
          homeworkContentId: homework.contentId,
          submissionType: 'text',
          answerContent: answer.trim(),
        });
        onClose();
        return;
      }

      if (submissionType === 'file') {
        if (!uploaded) {
          setError('Vui lòng chọn file trước khi nộp.');
          return;
        }
        await submitMutation.mutateAsync({
          homeworkContentId: homework.contentId,
          submissionType: 'file',
          filePublicId: uploaded.public_id,
          fileResourceType: uploaded.resource_type,
          fileFormat: uploaded.format,
          fileBytes: uploaded.bytes,
          fileOriginalName: uploaded.original_filename,
        });
        onClose();
        return;
      }

      // Trắc nghiệm: mở lượt thi của bài tập rồi chuyển sang màn làm bài riêng.
      if (!homework.examId) {
        setError('Bài trắc nghiệm chưa được liên kết đề thi.');
        return;
      }
      const attempt = await startAttempt.mutateAsync(homework.contentId);
      onClose();
      navigate(CLIENT_ROUTES.homeworkAttempt(attempt.attemptId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nộp bài thất bại.');
    }
  };

  const isBusy =
    submitMutation.isPending || isUploading || startAttempt.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={homework.title}
      subtitle={
        submissionType === 'text'
          ? 'Tự luận — viết câu trả lời của bạn'
          : submissionType === 'file'
            ? 'Nộp file — PDF, Word, audio hoặc video'
            : 'Trắc nghiệm — làm bài trong phòng thi'
      }
      icon={submissionType === 'file' ? FileUp : Send}
      maxWidth="lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* ---- Thông tin bài ---- */}
          <div className="flex flex-wrap items-center gap-2">
            {maxScore != null && (
              <Badge variant="primary" size="sm">
                {maxScore} điểm
              </Badge>
            )}
            {data?.passingScore != null && (
              <Badge variant="neutral" size="sm">
                Đạt từ {data.passingScore}%
              </Badge>
            )}
            {dueDate && (
              <Badge
                variant={isOverdue ? 'danger' : 'neutral'}
                size="sm"
                icon={Clock}
              >
                Hạn nộp: {dueDate}
              </Badge>
            )}
            {data?.maxAttempts != null && (
              <Badge variant="neutral" size="sm">
                Đã nộp {usedAttempts}/{data.maxAttempts} lần
              </Badge>
            )}
          </div>

          {isOverdue && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">
                Bài này đã quá hạn nộp — backend sẽ từ chối nộp mới.
              </p>
            </div>
          )}

          {/* ---- Đã nộp rồi ---- */}
          {hasSubmitted && (
            <SubmissionResult submission={latest} maxScore={maxScore} />
          )}

          {/* ---- Hết lượt nộp ---- */}
          {showResultOnly && maxAttempts != null && maxAttempts > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs">
                Bạn đã dùng hết {maxAttempts} lượt nộp cho bài này.
              </p>
            </div>
          )}

          {/* ---- Form nộp ---- */}
          {!showResultOnly && (
            <>
              {submissionType === 'text' && (
                <div className="space-y-2">
                  <label
                    htmlFor="hw-answer"
                    className="block text-xs font-bold text-slate-700"
                  >
                    Câu trả lời
                  </label>
                  <textarea
                    id="hw-answer"
                    value={answer}
                    onChange={(e) =>
                      setAnswer(e.target.value.slice(0, MAX_TEXT_LENGTH))
                    }
                    rows={10}
                    placeholder="Nhập câu trả lời của bạn…"
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0052CC] focus:ring-2 focus:ring-[#0052CC]/15 resize-y"
                  />
                  <p className="text-[11px] text-slate-400 text-right">
                    {answer.length} / {MAX_TEXT_LENGTH} ký tự
                  </p>
                </div>
              )}

              {submissionType === 'file' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.gif,.mp3,.wav,.m4a,.aac,.ogg,.mp4,.mov,.webm,.mkv"
                  />
                  {uploaded ? (
                    <div className="flex items-center gap-3 p-3.5 rounded-xl border border-emerald-200 bg-emerald-50">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-emerald-900 truncate">
                          {uploaded.original_filename ?? 'File đã upload'}
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          {uploaded.format?.toUpperCase()} ·{' '}
                          {formatBytes(uploaded.bytes)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setUploaded(null)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full flex flex-col items-center justify-center gap-2 py-9 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 hover:border-[#0052CC]/40 hover:bg-blue-50/30 transition-colors disabled:opacity-60"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin text-[#0052CC]" />
                          <p className="text-xs font-semibold text-[#0052CC]">
                            Đang tải lên… {progress}%
                          </p>
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-6 h-6 text-slate-400" />
                          <p className="text-xs font-bold text-slate-700">
                            Chọn file để nộp
                          </p>
                          <p className="text-[11px] text-slate-400">
                            PDF, Word, ảnh, audio, video — tối đa 100 MB
                          </p>
                        </>
                      )}
                    </button>
                  )}

                  {isUploading && progress > 0 && (
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#0052CC] transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Mic className="w-3 h-3" />
                    Ghi âm trực tiếp: hãy dùng chức năng ghi âm của thiết bị rồi
                    tải file lên đây.
                  </p>
                </div>
              )}

              {submissionType === 'multiple_choice' && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Bài trắc nghiệm sẽ mở màn làm bài riêng của bài tập. Bạn làm
                    xong rồi bấm &quot;Nộp bài&quot; — điểm sẽ được chấm tự động
                    và lưu vào bài nộp của bạn.
                    {data?.timeLimitMinutes
                      ? ` Thời gian: ${data.timeLimitMinutes} phút.`
                      : ''}
                  </p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-xs">{error}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" onClick={onClose}>
                  Huỷ
                </Button>
                <Button
                  onClick={handleSubmit}
                  isLoading={isBusy}
                  leftIcon={
                    submissionType === 'multiple_choice' ? Send : undefined
                  }
                >
                  {submissionType === 'multiple_choice'
                    ? 'Bắt đầu làm bài'
                    : 'Nộp bài'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

/* =========================================================
 * Kết quả bài nộp (điểm + nhận xét)
 * ========================================================= */
const SubmissionResult: React.FC<{
  submission?: HomeworkSubmission;
  maxScore: number | null;
}> = ({ submission, maxScore }) => {
  if (!submission) return null;
  const graded = Boolean(submission.graded);
  const passed = submission.passed;

  return (
    <div
      className={cn(
        'space-y-3 p-4 rounded-xl border',
        !graded
          ? 'bg-amber-50/70 border-amber-200'
          : passed
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-rose-50/70 border-rose-200',
      )}
    >
      <div className="flex items-center gap-2">
        {!graded ? (
          <>
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-sm font-bold text-amber-900">
              Đã nộp — đang chờ mentor chấm
            </p>
          </>
        ) : passed ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-bold text-emerald-900">Đã đạt</p>
          </>
        ) : (
          <>
            <XCircle className="w-4 h-4 text-rose-600" />
            <p className="text-sm font-bold text-rose-900">Chưa đạt</p>
          </>
        )}
        {graded && submission.score != null && (
          <span className="ml-auto text-sm font-extrabold text-slate-900">
            {submission.score}
            {maxScore != null ? ` / ${maxScore}` : ''} điểm
          </span>
        )}
      </div>

      {submission.feedback && (
        <div className="p-3 rounded-lg bg-white/70 border border-slate-200/70">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Nhận xét của mentor
          </p>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
            {submission.feedback}
          </p>
        </div>
      )}

      {/* ---- File đã nộp (bài nộp file) ---- */}
      {submission.submissionType === 'file' && (
        <div className="p-3 rounded-lg bg-white/70 border border-slate-200/70 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            File đã nộp
          </p>
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5" />
            {submission.fileOriginalName ?? 'File bài tập'}
          </p>
          <p className="text-[11px] text-slate-500">
            Định dạng: {submission.fileFormat?.toUpperCase() ?? '—'} · Dung
            lượng: {formatBytes(submission.fileBytes)}
          </p>
          {submission.fileUrl ? (
            <a
              href={submission.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              Xem file (URL có thời hạn)
            </a>
          ) : (
            <p className="text-[11px] text-amber-600">
              Chưa có URL xem file — backend cần cấu hình Cloudinary.
            </p>
          )}
        </div>
      )}

      {submission.submittedDate && (
        <p className="text-[11px] text-slate-500">
          Thời điểm nộp:{' '}
          {new Date(submission.submittedDate).toLocaleString('vi-VN')}
        </p>
      )}
    </div>
  );
};

/** Định dạng dung lượng cho người dùng. */
function formatBytes(bytes?: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default HomeworkSubmitModal;
