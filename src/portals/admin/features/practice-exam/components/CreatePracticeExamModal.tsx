/**
 * CreatePracticeExamModal — tạo 1 đề luyện tập AI gồm nhiều phần thi (Listening / Reading / Writing / Speaking)
 * -----------------------------------------------------------
 * 1. Thông tin đề: tiêu đề, chứng chỉ (không bắt buộc); thời gian cả đề = tổng thời gian các phần thi
 * 2. "+ Thêm phần thi": mỗi phần chọn kỹ năng + thời gian (gợi ý theo chứng chỉ, sửa được)
 *    + file đề (PDF / Word / .txt) hoặc dán nội dung;
 *    Listening: dán link file nghe hoặc bấm "Tải mp3 lên" (upload thẳng lên Cloudinary, tự điền link)
 * 3. "Đọc đề": file theo mẫu đọc thẳng, còn lại Claude đọc → xem trước câu hỏi + đáp án
 * 4. "Tạo đề": tạo đề (exam_scope = practice) → section → câu hỏi → xuất bản cho học viên
 * Reading / Listening chấm tự động theo đáp án; Writing / Speaking do AI chấm khi học viên nộp bài.
 */

import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Headphones,
  Loader2,
  Mic,
  PenLine,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { uploadToCloudinary } from '@/shared/hooks/useCloudinaryUpload';
import { getErrorMessage, unwrapOrThrow } from '@/shared/api/axiosClient';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { SKILL_LABEL, scaleFromCertificate } from '@/shared/constants/examScales';
import { QUESTION_TYPE_LABEL } from '@/shared/types';
import { cn } from '@/shared/utils';
import {
  addQuestionApi,
  createExamApi,
  createSectionApi,
  publishExamApi,
} from '@/portals/admin/features/exam/services/adminExamService';
import type { ImportQuestion } from '@/portals/admin/features/exam/utils/examImport';
import {
  MAX_EXAM_MINUTES,
  MAX_SECTION_MINUTES,
  MIN_SECTION_MINUTES,
  PRACTICE_SKILLS,
  defaultDuration,
  readSectionSource,
  splitMinutes,
  type PracticeSkill,
  type SectionReadResult,
  type SectionSource,
} from '../utils/practiceImport';
import { Field, ModalShell, inputCls } from './PracticeFormParts';

const SKILL_ICON: Record<PracticeSkill, React.ElementType> = {
  LISTENING: Headphones,
  READING: BookOpen,
  WRITING: PenLine,
  SPEAKING: Mic,
};

const SKILL_HINT: Record<PracticeSkill, string> = {
  LISTENING: 'Câu hỏi + đáp án, tự chấm. File đề không có file nghe thì dán link hoặc bấm "Tải mp3 lên".',
  READING: 'Đoạn đọc + câu hỏi + đáp án, tự chấm.',
  WRITING: 'Đề bài viết (Task 1 / Task 2…), AI chấm khi học viên nộp.',
  SPEAKING: 'Câu hỏi nói, học viên ghi âm → phiên âm, AI chấm.',
};

interface SectionRow extends SectionSource {
  id: number;
  /** Thời gian làm phần thi (phút) — chuỗi để admin xoá / gõ lại trong ô nhập */
  duration: string;
  /** true = admin đã tự sửa thời gian → đổi kỹ năng / chứng chỉ không ghi đè */
  durationEdited: boolean;
  status: 'idle' | 'reading' | 'done' | 'error';
  result?: SectionReadResult;
  error?: string;
}

const SECTION_DURATION_ERROR = `Từ ${MIN_SECTION_MINUTES} đến ${MAX_SECTION_MINUTES} phút`;

/** Thời gian 1 phần thi hợp lệ: số nguyên trong khoảng cho phép */
const isValidMinutes = (value: string) => {
  const n = Number(value);
  return value.trim() !== '' && Number.isInteger(n) && n >= MIN_SECTION_MINUTES && n <= MAX_SECTION_MINUTES;
};

const answerText = (q: ImportQuestion) =>
  (q.request.options ?? [])
    .filter((o) => o.isCorrect)
    .map((o) => o.optionText.replace('::', ' → '))
    .join(' · ');

export const CreatePracticeExamModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const nextId = useRef(2);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [certificateId, setCertificateId] = useState('');
  const [publishNow, setPublishNow] = useState(true);
  const [rows, setRows] = useState<SectionRow[]>([
    {
      id: 1,
      skill: 'READING',
      file: null,
      text: '',
      audioUrl: '',
      duration: String(defaultDuration(undefined, 'READING')),
      durationEdited: false,
      status: 'idle',
    },
  ]);
  const [touched, setTouched] = useState(false);
  const [isReading, setReading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [createError, setCreateError] = useState<{ message: string; examId?: string } | null>(null);
  const isCreating = progress !== null && createError === null;
  const isBusy = isReading || isCreating;

  const { data: certificates = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 5 * 60_000,
  });
  const certificate = certificates.find((c) => c.certificateId === certificateId) ?? null;
  const scale = useMemo(() => scaleFromCertificate(certificate), [certificate]);

  /* ---------- Sửa danh sách phần thi ---------- */
  const updateRow = (id: number, patch: Partial<SectionRow>) =>
    // Đổi nguồn đề / kỹ năng thì phải đọc lại; đổi kỹ năng thì gợi ý lại thời gian nếu admin chưa tự sửa
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next: SectionRow = { ...r, status: 'idle', result: undefined, error: undefined, ...patch };
        if (patch.skill && !r.durationEdited) next.duration = String(defaultDuration(scale.preset, patch.skill));
        return next;
      }),
    );

  /** Đổi thời gian không cần đọc lại đề */
  const updateDuration = (id: number, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, duration: value, durationEdited: true } : r)));

  /** Đổi link file nghe không cần đọc lại đề: thay cho các section đang dùng link cũ / chưa có file nghe */
  const updateAudio = (id: number, url: string) =>
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const oldUrl = r.audioUrl.trim() || undefined;
        const newUrl = url.trim() || undefined;
        const result = r.result && {
          ...r.result,
          sections: r.result.sections.map((s) =>
            !s.request.audioUrl || s.request.audioUrl === oldUrl
              ? { ...s, request: { ...s.request, audioUrl: newUrl } }
              : s,
          ),
        };
        return { ...r, audioUrl: url, result };
      }),
    );

  const addRow = () => {
    const used = new Set(rows.map((r) => r.skill));
    const skill = PRACTICE_SKILLS.find((s) => !used.has(s)) ?? 'READING';
    setRows((prev) => [
      ...prev,
      {
        id: nextId.current++,
        skill,
        file: null,
        text: '',
        audioUrl: '',
        duration: String(defaultDuration(scale.preset, skill)),
        durationEdited: false,
        status: 'idle',
      },
    ]);
  };

  const removeRow = (id: number) => setRows((prev) => prev.filter((r) => r.id !== id));

  /* ---------- Kiểm tra form ---------- */
  const titleError = !title.trim() ? 'Tiêu đề là bắt buộc' : title.trim().length > 255 ? 'Tối đa 255 ký tự' : '';
  // Thời gian cả đề = tổng thời gian các phần thi
  const totalMinutes = rows.reduce((n, r) => n + (isValidMinutes(r.duration) ? Number(r.duration) : 0), 0);
  const durationError = rows.some((r) => !isValidMinutes(r.duration))
    ? 'Kiểm tra lại thời gian từng phần thi'
    : totalMinutes > MAX_EXAM_MINUTES
      ? `Tổng thời gian tối đa ${MAX_EXAM_MINUTES} phút`
      : '';
  const rowsError = rows.length === 0
    ? 'Thêm ít nhất 1 phần thi'
    : rows.some((r) => !r.file && !r.text.trim())
      ? 'Mỗi phần thi cần 1 file đề hoặc nội dung dán vào'
      : '';

  const allRead = rows.length > 0 && rows.every((r) => r.status === 'done');
  const totalQuestions = rows.reduce((n, r) => n + (r.result?.questionCount ?? 0), 0);
  const totalSections = rows.reduce((n, r) => n + (r.result?.sections.length ?? 0), 0);

  /* ---------- Đọc đề (lần lượt từng phần chưa đọc) ---------- */
  const handleRead = async () => {
    setTouched(true);
    if (rowsError) return;
    setReading(true);
    setCreateError(null);
    for (const row of rows) {
      if (row.status === 'done') continue;
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: 'reading', error: undefined } : r)));
      try {
        const result = await readSectionSource(row, scale, certificate?.certificateName);
        const empty = result.questionCount === 0;
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  status: empty ? 'error' : 'done',
                  result,
                  error: empty ? 'Không đọc được câu hỏi nào từ đề này' : undefined,
                }
              : r,
          ),
        );
      } catch (err) {
        setRows((prev) =>
          prev.map((r) => (r.id === row.id ? { ...r, status: 'error', error: getErrorMessage(err) } : r)),
        );
      }
    }
    setReading(false);
  };

  /* ---------- Tạo đề → section → câu hỏi → xuất bản ---------- */
  const handleCreate = async () => {
    setTouched(true);
    if (titleError || durationError || rowsError || !allRead) return;
    const total = 1 + totalSections + totalQuestions;
    let done = 0;
    let examId: string | undefined;
    setCreateError(null);
    setProgress({ done, total });
    try {
      const exam = unwrapOrThrow(
        await createExamApi({
          examScope: 'practice',
          certificateId: certificateId || undefined,
          examTitle: title.trim(),
          description: description.trim() || undefined,
          durationMinutes: totalMinutes,
          // Luyện tập: không giới hạn lượt, miễn phí, cho xem điểm và đáp án
          maxAttempts: 0,
          isFree: true,
          showAnswers: true,
          showScore: true,
        }),
      );
      examId = exam.exam.examId;
      setProgress({ done: ++done, total });
      for (const row of rows) {
        const sections = row.result?.sections ?? [];
        // Thời gian của phần thi chia cho các section con đọc ra từ file đề
        const minutes = splitMinutes(Number(row.duration), sections.length);
        for (let i = 0; i < sections.length; i++) {
          const s = sections[i];
          const section = unwrapOrThrow(
            await createSectionApi(examId, { ...s.request, durationMinutes: minutes[i] }),
          );
          setProgress({ done: ++done, total });
          for (const q of s.questions) {
            unwrapOrThrow(await addQuestionApi(examId, { ...q.request, sectionId: section.sectionId }));
            setProgress({ done: ++done, total });
          }
        }
      }
      if (publishNow) {
        try {
          unwrapOrThrow(await publishExamApi(examId));
        } catch (err) {
          // VD câu Listening AI chưa biết đáp án: đề vẫn được tạo dạng nháp để admin sửa
          setCreateError({
            message: `Đã tạo đề nhưng chưa xuất bản được: ${getErrorMessage(err)}. Mở trang soạn đề để sửa rồi xuất bản.`,
            examId,
          });
          return;
        }
      }
      toast.success(publishNow ? 'Đã tạo và xuất bản đề luyện tập' : 'Đã tạo đề luyện tập (nháp)');
      onClose();
    } catch (err) {
      setCreateError({
        message: `${getErrorMessage(err)} — đã tạo được ${done}/${total} mục.`,
        examId,
      });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['exam'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.examOptions });
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-3xl" isDismissDisabled={isBusy}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Tạo đề luyện tập mới</h3>
            <p className="text-xs text-slate-500">
              Reading / Listening chấm theo đáp án, Writing / Speaking do AI (Claude) chấm
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={isBusy}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg disabled:opacity-40"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-5 pt-4">
        {/* ---------- 1. Thông tin đề ---------- */}
        <Field label="Tiêu đề" required error={touched ? titleError : ''}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: IELTS Practice Test 1"
            className={inputCls(Boolean(touched && titleError))}
            disabled={isBusy}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Chứng chỉ liên quan">
            <select
              value={certificateId}
              onChange={(e) => {
                const nextCert = certificates.find((c) => c.certificateId === e.target.value) ?? null;
                const nextPreset = scaleFromCertificate(nextCert).preset;
                setCertificateId(e.target.value);
                // Đổi chứng chỉ thì phần thi gắn theo chứng chỉ khác → đọc lại; gợi ý lại thời gian các phần chưa tự sửa
                setRows((prev) =>
                  prev.map((r) => ({
                    ...r,
                    status: 'idle',
                    result: undefined,
                    error: undefined,
                    duration: r.durationEdited ? r.duration : String(defaultDuration(nextPreset, r.skill)),
                  })),
                );
              }}
              className={inputCls(false)}
              disabled={isBusy}
            >
              <option value="">-- Không gắn chứng chỉ (dùng cho mọi mục tiêu) --</option>
              {certificates.map((cert) => (
                <option key={cert.certificateId} value={cert.certificateId}>
                  {cert.certificateName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Thời gian làm bài (phút)" error={touched ? durationError : ''}>
            <div
              className={cn(
                inputCls(Boolean(touched && durationError)),
                'flex items-center gap-2 bg-slate-50 text-slate-700',
              )}
            >
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="font-bold">{totalMinutes}</span>
              <span className="text-xs text-slate-400">phút · tự cộng từ các phần thi</span>
            </div>
          </Field>
        </div>

        <Field label="Mô tả">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Không bắt buộc — hiển thị cho học viên trong kho đề"
            className={cn(inputCls(false), 'h-auto py-2 resize-y')}
            disabled={isBusy}
          />
        </Field>

        {/* ---------- 2. Các phần thi ---------- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Phần thi <span className="text-rose-500">*</span>
            </p>
            <Button variant="outline" size="sm" leftIcon={Plus} onClick={addRow} disabled={isBusy}>
              Thêm phần thi
            </Button>
          </div>
          {touched && rowsError && <p className="text-[11px] text-rose-500">{rowsError}</p>}

          {rows.map((row, index) => (
            <SectionRowCard
              key={row.id}
              index={index}
              row={row}
              disabled={isBusy}
              canRemove={rows.length > 1}
              durationError={touched && !isValidMinutes(row.duration) ? SECTION_DURATION_ERROR : ''}
              onChange={(patch) => updateRow(row.id, patch)}
              onDurationChange={(value) => updateDuration(row.id, value)}
              onAudioChange={(url) => updateAudio(row.id, url)}
              onRemove={() => removeRow(row.id)}
            />
          ))}
        </div>

        {rows.some((r) => r.result?.fromAi) && (
          <p className="rounded-xl border border-ai/30 bg-ai/5 p-3 text-xs text-slate-700 flex gap-2">
            <Sparkles className="w-4 h-4 text-ai shrink-0" />
            <span>
              Có phần do AI đọc từ file: kiểm tra lại đáp án đúng (✓) trước khi tạo. Sau khi tạo vẫn sửa được từng câu ở
              trang soạn đề.
            </span>
          </p>
        )}

        {createError && (
          <p className="text-sm text-status-danger font-semibold">
            {createError.message}{' '}
            {createError.examId && (
              <Link to={ADMIN_ROUTES.examEditor(createError.examId)} className="underline">
                Mở trang soạn đề
              </Link>
            )}
          </p>
        )}

        {/* ---------- 3. Nút ---------- */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 mr-auto cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              disabled={isBusy}
              className="w-4 h-4 accent-[#0052CC]"
            />
            Xuất bản ngay cho học viên
          </label>
          {progress && !createError && (
            <span className="text-xs text-slate-500">
              Đang tạo {progress.done}/{progress.total}…
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isBusy}>
            Huỷ
          </Button>
          {!allRead ? (
            <Button variant="primary" size="sm" leftIcon={Sparkles} isLoading={isReading} onClick={handleRead}>
              Đọc đề
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              isLoading={isCreating}
              onClick={handleCreate}
              className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
            >
              Tạo đề ({totalSections} phần, {totalQuestions} câu)
            </Button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};

/* =========================================================
 * Một phần thi: kỹ năng + file / nội dung + xem trước
 * ========================================================= */
const SectionRowCard: React.FC<{
  index: number;
  row: SectionRow;
  disabled: boolean;
  canRemove: boolean;
  durationError: string;
  onChange: (patch: Partial<SectionRow>) => void;
  onDurationChange: (value: string) => void;
  onAudioChange: (url: string) => void;
  onRemove: () => void;
}> = ({ index, row, disabled, canRemove, durationError, onChange, onDurationChange, onAudioChange, onRemove }) => {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  /** null = không upload; 0 - 100 = % đang upload file nghe */
  const [audioProgress, setAudioProgress] = useState<number | null>(null);
  const result = row.result;
  // Phần thi đọc ra nhiều section (VD 3 passage) → hiện thời gian chia cho từng section
  const sectionMinutes = splitMinutes(Number(row.duration), result?.sections.length ?? 0);
  const showSplit = isValidMinutes(row.duration) && sectionMinutes.length > 1;

  /** Upload file nghe lên Cloudinary (chữ ký do BE cấp) rồi điền link vào ô */
  const uploadAudio = async (file: File) => {
    setAudioProgress(0);
    try {
      await uploadToCloudinary(
        {
          file,
          purpose: 'exam_audio',
          notifyError: toast.error,
          onUploaded: (uploaded) => {
            if (uploaded.secure_url) {
              onAudioChange(uploaded.secure_url);
              toast.success('Đã tải file nghe lên');
            }
          },
        },
        setAudioProgress,
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAudioProgress(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-extrabold text-slate-400">#{index + 1}</span>
        <div className="flex flex-wrap gap-1.5 flex-1">
          {PRACTICE_SKILLS.map((skill) => {
            const Icon = SKILL_ICON[skill];
            return (
              <button
                key={skill}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ skill })}
                className={cn(
                  'h-8 px-3 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 transition-colors',
                  row.skill === skill
                    ? 'border-[#0052CC] bg-blue-50 text-[#0052CC]'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {SKILL_LABEL[skill]}
              </button>
            );
          })}
        </div>
        <RowStatus row={row} />
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-40"
            aria-label="Xóa phần thi"
            title="Xóa phần thi"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[11px] text-slate-500 flex-1 min-w-[200px]">{SKILL_HINT[row.skill]}</p>
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          Thời gian
          <input
            type="number"
            min={MIN_SECTION_MINUTES}
            max={MAX_SECTION_MINUTES}
            value={row.duration}
            onChange={(e) => onDurationChange(e.target.value)}
            disabled={disabled}
            aria-label="Thời gian phần thi (phút)"
            className={cn(inputCls(Boolean(durationError)), 'w-20 h-8 px-2 text-center')}
          />
          phút
        </label>
      </div>
      {durationError && <p className="text-[11px] text-rose-500 text-right">{durationError}</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled && e.dataTransfer.files[0]) onChange({ file: e.dataTransfer.files[0] });
          }}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'rounded-xl border-2 border-dashed px-3 py-4 text-center cursor-pointer transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50',
          )}
        >
          <Upload className="w-5 h-5 mx-auto text-slate-400" />
          {row.file ? (
            <p className="mt-1 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 max-w-full">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{row.file.name}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs font-semibold text-slate-600">Kéo thả hoặc chọn file PDF, Word, .txt</p>
          )}
          {row.file && (
            <button
              type="button"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                onChange({ file: null });
              }}
              className="block mx-auto mt-1 text-[11px] text-rose-500 font-semibold hover:underline"
            >
              Bỏ file
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onChange({ file: e.target.files[0] });
              e.target.value = '';
            }}
          />
        </div>
        <textarea
          value={row.text}
          onChange={(e) => onChange({ text: e.target.value })}
          disabled={disabled || Boolean(row.file)}
          rows={4}
          placeholder={row.file ? 'Đang dùng file đề' : 'Hoặc dán nội dung đề vào đây…'}
          className={cn(inputCls(false), 'h-auto py-2 text-xs resize-y')}
        />
      </div>

      {row.skill === 'LISTENING' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              value={row.audioUrl}
              onChange={(e) => onAudioChange(e.target.value)}
              disabled={disabled || audioProgress !== null}
              placeholder="Link file nghe (https://…/audio.mp3) — dùng khi file đề không có"
              className={cn(inputCls(false), 'text-xs flex-1 min-w-0')}
            />
            <Button
              variant="outline"
              size="sm"
              leftIcon={Headphones}
              disabled={disabled}
              isLoading={audioProgress !== null}
              onClick={() => audioInputRef.current?.click()}
              className="h-10 shrink-0"
            >
              {audioProgress !== null ? `${audioProgress}%` : 'Tải mp3 lên'}
            </Button>
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,.aac,.ogg,audio/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) void uploadAudio(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </div>
          {row.audioUrl.trim() && <audio controls src={row.audioUrl.trim()} className="w-full h-9" />}
        </div>
      )}

      {row.error && <p className="text-xs text-status-danger font-semibold">{row.error}</p>}

      {result && result.questionCount > 0 && (
        <div className="space-y-2">
          {result.errors.length > 0 && (
            <ul className="rounded-xl border border-amber-200 bg-amber-50/60 p-2.5 space-y-1 text-[11px] text-amber-800">
              {result.errors.map((e, i) => (
                <li key={i}>
                  • {e.message}
                  {e.text && <span className="block ml-3 font-mono truncate">“{e.text}”</span>}
                </li>
              ))}
              <li className="font-semibold">Các mục lỗi sẽ bị bỏ qua khi tạo đề.</li>
            </ul>
          )}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {result.sections.map((s, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="ai" size="sm">
                    {s.request.sectionType}
                  </Badge>
                  <span className="font-bold text-xs text-slate-800 flex-1">{s.request.title}</span>
                  <span className="text-[11px] text-slate-500">
                    {showSplit && `${sectionMinutes[i]} phút · `}
                    {s.questions.length} câu
                  </span>
                </div>
                {s.request.audioUrl && <p className="text-[11px] text-slate-500 truncate">🎧 {s.request.audioUrl}</p>}
                {s.request.passageText && (
                  <p className="text-[11px] text-slate-600 bg-slate-50 rounded-lg p-2 whitespace-pre-line line-clamp-3">
                    {s.request.passageText}
                  </p>
                )}
                {s.questions.map((q, j) => (
                  <div key={j} className="text-[11px] border-t border-slate-100 pt-1">
                    <p className="text-slate-800">
                      <Badge size="sm" className="mr-1.5">
                        {QUESTION_TYPE_LABEL[q.request.questionType]}
                      </Badge>
                      {q.request.questionText}
                      <span className="text-slate-400"> · {q.request.points} điểm</span>
                    </p>
                    {answerText(q) && <p className="text-emerald-700 mt-0.5">✓ {answerText(q)}</p>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RowStatus: React.FC<{ row: SectionRow }> = ({ row }) => {
  if (row.status === 'reading') {
    return (
      <span className="text-[11px] font-semibold text-ai inline-flex items-center gap-1">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang đọc…
      </span>
    );
  }
  if (row.status === 'done' && row.result) {
    return (
      <span className="text-[11px] font-semibold text-status-success inline-flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" /> {row.result.questionCount} câu
      </span>
    );
  }
  if (row.status === 'error') {
    return (
      <span className="text-[11px] font-semibold text-status-danger inline-flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" /> Lỗi
      </span>
    );
  }
  return null;
};

export default CreatePracticeExamModal;
