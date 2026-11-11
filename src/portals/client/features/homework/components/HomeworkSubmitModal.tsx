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
  FileText,
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
import { formatDateOnly } from '@/shared/utils/format';
import { useCloudinaryUpload } from '@/shared/hooks/useCloudinaryUpload';
import { HomeworkExamPreviewModal } from './HomeworkExamPreviewModal';
import { useHomeworkSubmission, useSubmitHomework } from '../hooks/useHomework';
import { useStartHomeworkAttempt } from '../hooks/useHomeworkExam';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { useNavigate } from 'react-router-dom';
import type {
  CourseContentDto,
  HomeworkContentData,
  HomeworkSubmissionType,
  RubricCriterion,
} from '@/shared/types/catalog.types';
import type {
  CloudinaryUploadResult,
  HomeworkSubmission,
} from '@/shared/types/homework.types';

/** Dung lượng tối đa file tài liệu bài nộp — khớp `HomeworkSubmissionServiceImpl.MAX_PDF_BYTES`. */
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
/** Dung lượng tối đa file âm thanh bài nộp — khớp giới hạn audio/video của Cloudinary. */
const MAX_AUDIO_BYTES = 100 * 1024 * 1024;

export interface HomeworkSubmitModalProps {
  open: boolean;
  onClose: () => void;
  homework: CourseContentDto;
  /**
   * Chỉ xem (không nộp bài) — dùng khi bài tập bị khoá (học viên CHƯA mua
   * khóa học). Backend vẫn chặn nộp khi thiếu enrollment.
   */
  readOnly?: boolean;
}

/** Đọc hình thức nộp từ content_data (mặc định `text` cho dữ liệu cũ). */
function readSubmissionType(hw: CourseContentDto): HomeworkSubmissionType {
  const data = hw.contentData as HomeworkContentData | null;
  const type = data?.submissionType;
  if (
    type === 'file' ||
    type === 'multiple_choice' ||
    type === 'text' ||
    type === 'audio'
  ) {
    return type;
  }
  return 'text';
}

const MAX_TEXT_LENGTH = 10_000;

export const HomeworkSubmitModal: React.FC<HomeworkSubmitModalProps> = ({
  open,
  onClose,
  homework,
  readOnly = false,
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
  /** Đang kéo file vào vùng upload → đổi viền + nhãn. */
  const [isDragging, setIsDragging] = useState(false);
  /** Mở modal XEM ĐỀ (bài trắc nghiệm) — không mất lượt làm bài. */
  const [showExamPreview, setShowExamPreview] = useState(false);
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
  /** Mô tả bài (Admin gõ ở ô "Mô tả" của form nội dung). */
  const description = (homework.description ?? '').trim();
  /** Hướng dẫn / đề bài (Admin gõ ở ô "Hướng dẫn"). */
  const instructions = (data?.instructions ?? '').trim();
  /** Tài liệu đính kèm kèm theo đề. */
  const attachmentUrl = data?.attachmentUrl ?? '';
  const attachmentName = data?.attachmentName ?? '';
  const isOverdue = useMemo(() => {
    if (!dueDate) return false;
    // `dueDate` là ngày (yyyy-MM-dd), hết hạn CUỐI NGÀY đó.
    // Backend dùng `LocalDate.now().isAfter(dueDate)` → vẫn cho nộp cả ngày đến hạn.
    // → FE phải so với đầu ngày MAI, không phải đầu ngày đến hạn.
    const endOfDueDate = new Date(`${dueDate}T00:00:00`);
    endOfDueDate.setDate(endOfDueDate.getDate() + 1);
    return endOfDueDate.getTime() <= Date.now();
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

  /** Số lượt nộp còn lại (null = không giới hạn). */
  const remainingAttempts =
    maxAttempts != null && maxAttempts > 0
      ? Math.max(0, maxAttempts - usedAttempts)
      : null;

  /**
   * Rubric chấm điểm do admin cấu hình.
   *
   * Lọc bỏ tiêu chí trùng nội dung với mô tả / hướng dẫn của bài — Admin hay
   * nhập cùng nội dung vào cả 3 nơi, hiện lặp lại rất khó chịu.
   */
  const rubric = useMemo(() => {
    const list = Array.isArray(data?.rubric)
      ? (data?.rubric as RubricCriterion[])
      : [];
    const seen = new Set(
      [description, instructions]
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0),
    );
    return list.filter((r) => {
      const text = (r.criterion ?? '').trim().toLowerCase();
      if (!text) return false;
      return !seen.has(text);
    });
  }, [data?.rubric, description, instructions]);

  /**
   * Định dạng file được phép nộp — do Admin cấu hình.
   *
   * Thiếu → mặc định `['pdf']` (backend cũng chỉ nhận PDF cho bài nộp).
   */
  const allowedFileTypes = useMemo<string[]>(() => {
    const raw = data?.allowedFileTypes;
    if (Array.isArray(raw) && raw.length > 0) {
      const cleaned = raw
        .map((t) => String(t).trim().toLowerCase().replace(/^\./, ''))
        .filter(Boolean);
      if (cleaned.length > 0) return cleaned;
    }
    // Bài ghi âm → mặc định các định dạng audio; còn lại → chỉ PDF.
    if (submissionType === 'audio') {
      return ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'];
    }
    return ['pdf'];
  }, [data?.allowedFileTypes, submissionType]);

  /** Chuỗi `accept` cho thẻ `<input type="file">`. */
  const acceptAttr = useMemo(
    () => allowedFileTypes.map((t) => `.${t}`).join(','),
    [allowedFileTypes],
  );

  /** Mô tả định dạng cho người dùng. */
  const allowedLabel = useMemo(
    () =>
      allowedFileTypes
        .map((t) => t.toUpperCase())
        .join(', '),
    [allowedFileTypes],
  );

  /** Đã nộp và hết lượt → chỉ xem kết quả, không cho nộp lại. */
  const showResultOnly = hasSubmitted && !canSubmitAgain;

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    // Định dạng được phép do Admin cấu hình (mặc định chỉ PDF).
    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    if (!allowedFileTypes.includes(ext)) {
      setError(`Bài nộp chỉ nhận file ${allowedLabel}.`);
      return;
    }
    if (file.size > maxBytesForFile(file)) {
      setError(
        submissionType === 'audio'
          ? 'File âm thanh tối đa 100 MB.'
          : 'File tài liệu tối đa 20 MB.',
      );
      return;
    }
    await uploadFile(file);
  };

  /**
   * Giới hạn dung lượng theo loại bài nộp.
   * - Bài ghi âm → 100 MB (khớp Cloudinary audio/video).
   * - Bài nộp tài liệu → 20 MB.
   */
  const maxBytesForFile = (file: File): number => {
    if (submissionType === 'audio') return MAX_AUDIO_BYTES;
    const ext = file.name.toLowerCase().split('.').pop() ?? '';
    return ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'mp4', 'mov'].includes(ext)
      ? MAX_AUDIO_BYTES
      : MAX_DOCUMENT_BYTES;
  };

  /** Upload 1 file bài nộp lên Cloudinary (dùng chung cho file / audio). */
  const uploadFile = async (file: File) => {
    const ok = await upload({
      file,
      purpose: submissionType === 'audio' ? 'submission_audio' : 'submission',
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

      if (submissionType === 'file' || submissionType === 'audio') {
        if (!uploaded) {
          setError(
            submissionType === 'audio'
              ? 'Vui lòng chọn file âm thanh trước khi nộp.'
              : 'Vui lòng chọn file trước khi nộp.',
          );
          return;
        }
        await submitMutation.mutateAsync({
          homeworkContentId: homework.contentId,
          submissionType,
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
      // Truyền `courseId` qua state để màn làm bài quay lại ĐÚNG khóa học này.
      navigate(CLIENT_ROUTES.homeworkAttempt(attempt.attemptId), {
        state: { courseId: homework.courseId },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nộp bài thất bại.');
    }
  };

  const isBusy =
    submitMutation.isPending || isUploading || startAttempt.isPending;

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title={homework.title}
      subtitle={
        hasSubmitted
          ? 'Bài đã nộp — xem kết quả và nhận xét'
          : submissionType === 'text'
            ? 'Nhập văn bản trực tiếp — viết câu trả lời của bạn'
            : submissionType === 'file'
              ? `Nộp file ${allowedLabel} — tối đa 20 MB`
              : submissionType === 'audio'
              ? `Nộp file âm thanh (${allowedLabel}) — tối đa 100 MB`
                : 'Trắc nghiệm — làm bài trong phòng thi'
      }
      icon={
        submissionType === 'file'
          ? FileUp
          : submissionType === 'audio'
            ? Mic
            : Send
      }
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
                Hạn nộp: {formatDateOnly(dueDate)}
              </Badge>
            )}
            {data?.maxAttempts != null && (
              <Badge variant="neutral" size="sm">
                Đã nộp {usedAttempts}/{data.maxAttempts} lần
                {remainingAttempts != null && remainingAttempts > 0
                  ? ` · còn ${remainingAttempts} lượt`
                  : ''}
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

          {/* ---- MÔ TẢ + HƯỚNG DẪN + TÀI LIỆU ----
           * Modal nộp bài phải có đề để học viên biết làm cái gì:
           *   - `description`   → mô tả bài (Admin gõ ở ô "Mô tả" của form nội dung);
           *   - `instructions`  → hướng dẫn / đề bài (Admin gõ ở ô "Hướng dẫn");
           *   - `attachmentUrl` → tài liệu đính kèm (đề, file đọc kèm).
           *
           * LƯU Ý: Admin hay nhập CÙNG một nội dung vào cả `description` lẫn
           * `instructions` (và đôi khi cả rubric) → hiển thị lặp 3 lần rất
           * khó chịu. → Chỉ hiện khối "Hướng dẫn" khi nội dung KHÁC `description`;
           * nếu trùng thì bỏ qua (đề bài đã hiện ở "Mô tả bài" phía trên). */}
          <div className="space-y-3">
            {description && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mô tả bài
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {instructions && instructions !== description && (
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Hướng dẫn
                </p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {instructions}
                </p>
              </div>
            )}

            {attachmentUrl && (
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#0052CC]/25 bg-blue-50/60 hover:bg-blue-50 transition-colors"
              >
                <Paperclip className="w-4 h-4 text-[#0052CC] shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tài liệu đính kèm
                  </span>
                  <span className="block text-xs font-bold text-[#0052CC] truncate">
                    {attachmentName
                      ? `Tải ${attachmentName}`
                      : 'Tải tài liệu đính kèm'}
                  </span>
                </span>
                <Download className="w-4 h-4 text-[#0052CC] shrink-0 ml-auto" />
              </a>
            )}

            {/* ---- Rubric chấm điểm (admin cấu hình) ---- */}
            {rubric.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rubric chấm điểm
                </p>
                <ul className="space-y-2">
                  {rubric.map((r, ri) => (
                    <li
                      key={ri}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800">
                          {r.criterion}
                        </p>
                        {r.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {r.description}
                          </p>
                        )}
                      </div>
                      {r.maxScore != null && (
                        <span className="text-[10px] font-bold text-[#0052CC] bg-blue-50 rounded px-1.5 py-0.5 shrink-0">
                          {r.maxScore}đ
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!description && !instructions && !attachmentUrl && (
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <p className="text-xs text-amber-800">
                  Bài tập này chưa có đề bài. Vui lòng liên hệ mentor để được
                  hướng dẫn trước khi nộp.
                </p>
              </div>
            )}
          </div>

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

          {/* ---- Chỉ xem (bài tập bị khoá — người chưa mua khóa học) ---- */}
          {readOnly && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                Bài tập này đang <strong>khoá</strong> — bạn chưa mua khóa học nên
                chưa thể xem đề và nộp bài. Đăng ký khóa học để nộp bài và được
                mentor chấm.
              </p>
            </div>
          )}

          {/* ---- Form nộp ---- */}
          {!showResultOnly && !readOnly && (
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

              {(submissionType === 'file' || submissionType === 'audio') && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                    accept={acceptAttr}
                  />

                  {/* ---- File đã upload ---- */}
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
                        {/* Bài ghi âm → cho nghe lại trước khi nộp. */}
                        {submissionType === 'audio' && uploaded.secure_url && (
                          <audio
                            src={uploaded.secure_url}
                            controls
                            className="mt-2 w-full h-9"
                          />
                        )}
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
                    <>
                      {/* ---- Vùng kéo-thả / chọn file ---- */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          void handleFileChange(e.dataTransfer.files?.[0]);
                        }}
                        disabled={isUploading}
                        className={cn(
                          'w-full flex flex-col items-center justify-center gap-2 py-9 rounded-xl border-2 border-dashed transition-colors disabled:opacity-60',
                          isDragging
                            ? 'border-[#0052CC] bg-blue-50'
                            : 'border-slate-200 bg-slate-50/60 hover:border-[#0052CC]/40 hover:bg-blue-50/30',
                        )}
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
                              {isDragging
                                ? 'Thả file vào đây'
                                : `Chọn hoặc kéo-thả file ${allowedLabel}`}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Chỉ nhận {allowedLabel} — tối đa{' '}
                              {submissionType === 'audio' ? '100' : '20'} MB
                            </p>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  {isUploading && progress > 0 && (
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#0052CC] transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              {submissionType === 'multiple_choice' && (
                <div className="space-y-2">
                  {homework.examTitle && (
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-start gap-2.5">
                      <FileText className="w-4 h-4 shrink-0 mt-0.5 text-[#0052CC]" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Đề thi
                        </p>
                        <p className="text-sm font-bold text-slate-800">
                          {homework.examTitle}
                        </p>
                      </div>
                      {homework.examId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={FileText}
                          className="shrink-0"
                          onClick={() => setShowExamPreview(true)}
                        >
                          Xem đề
                        </Button>
                      )}
                    </div>
                  )}
                  {!homework.examId && (
                    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="text-xs">
                        Bài trắc nghiệm này chưa được liên kết đề thi. Vui lòng
                        liên hệ mentor.
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed">
                      Bài trắc nghiệm sẽ mở màn làm bài riêng của bài tập. Bạn làm
                      xong rồi bấm &quot;Nộp bài&quot; — điểm sẽ được chấm tự động
                      và lưu vào bài nộp của bạn.
                    </p>
                  </div>
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
                    : 'Xác nhận nộp bài'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>

    {/* ---- Modal XEM ĐỀ (bài trắc nghiệm) — mở đè lên modal nộp bài ---- */}
    {showExamPreview && (
      <HomeworkExamPreviewModal
        open={showExamPreview}
        onClose={() => setShowExamPreview(false)}
        examId={homework.examId}
        examTitle={homework.examTitle}
      />
    )}
    </>
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
