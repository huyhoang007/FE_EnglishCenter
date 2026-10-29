/**
 * ImportExamModal — nhập section + câu hỏi từ file PDF / Word (.docx) / .txt (Dev 3)
 * -----------------------------------------------------------
 * 1. Kéo thả / chọn file:
 *    - Word / .txt viết theo mẫu ([SECTION], *đáp án…) → đọc thẳng trên trình duyệt
 *    - PDF, hoặc Word / .txt viết tự do → AI (Gemini) đọc và chuyển sang mẫu (POST /admin/ai-import)
 * 2. Xem trước bộ đề (lỗi hiện kèm nội dung dòng) → bấm Tạo: tạo lần lượt section rồi câu hỏi qua API sẵn có
 * Kéo thả file thẳng vào trang soạn đề (initialFile): file theo mẫu không lỗi thì tạo luôn;
 * bản AI đọc luôn dừng ở bước xem trước để admin kiểm tra đáp án.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, FileText, Sparkles, Upload } from 'lucide-react';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { QUESTION_TYPE_LABEL } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { addQuestionApi, aiImportApi, createSectionApi } from '../services/adminExamService';
import type { ScaleInfo } from '@/shared/constants/examScales';
import {
  MAX_PDF_BYTES,
  fileToBase64,
  isPdfFile,
  isTemplateText,
  parseExamText,
  readExamFile,
  sectionTokens,
  type ImportQuestion,
  type ImportResult,
} from '../utils/examImport';
import { ExamModal } from './ExamFormParts';

interface ImportExamModalProps {
  examId: string;
  /** Thang của chứng chỉ của đề — các phần thi được dùng sau [SECTION] */
  scale: ScaleInfo;
  /** File kéo thả ở trang soạn đề: đọc ngay và tạo luôn nếu không có lỗi */
  initialFile?: File;
  onClose: () => void;
}

const answerText = (q: ImportQuestion) =>
  (q.request.options ?? [])
    .filter((o) => o.isCorrect)
    .map((o) => o.optionText.replace('::', ' → '))
    .join(' · ');

export const ImportExamModal: React.FC<ImportExamModalProps> = ({
  examId,
  scale,
  initialFile,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [isReading, setReading] = useState(false);
  /** Bộ đề đang xem do AI đọc (nhắc admin kiểm tra đáp án) */
  const [isAiResult, setAiResult] = useState(false);
  const [isAiReading, setAiReading] = useState(false);

  /** Nhờ AI chuyển PDF / văn bản tự do sang mẫu nhập đề */
  const readWithAi = async (file: File, text?: string) => {
    setAiReading(true);
    try {
      const res = unwrapOrThrow(
        await aiImportApi({
          target: 'EXAM',
          certificateName: scale.kind === 'raw' ? undefined : scale.label,
          sections: sectionTokens(scale.parts),
          fileName: file.name,
          fileBase64: text === undefined ? await fileToBase64(file) : undefined,
          text,
        }),
      );
      return res.content ?? '';
    } finally {
      setAiReading(false);
    }
  };
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const isCreating = progress !== null && createError === null;

  /** Đọc file; autoCreate = tạo luôn khi file không có lỗi (kéo thả ở trang soạn đề) */
  const handleFile = async (file?: File, autoCreate = false) => {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setReadError(null);
    setCreateError(null);
    setAiResult(false);
    setReading(true);
    try {
      let text: string;
      let fromAi = false;
      if (isPdfFile(file)) {
        if (file.size > MAX_PDF_BYTES) throw new Error('File PDF tối đa 15MB');
        text = await readWithAi(file);
        fromAi = true;
      } else {
        text = await readExamFile(file);
        // Word / .txt viết tự do (không theo mẫu) → nhờ AI chuyển sang mẫu
        if (!isTemplateText(text)) {
          text = await readWithAi(file, text);
          fromAi = true;
        }
      }
      const parsed = parseExamText(text, scale.parts);
      setResult(parsed);
      setAiResult(fromAi);
      // Bản AI đọc luôn dừng ở xem trước để kiểm tra đáp án
      if (autoCreate && !fromAi && parsed.errors.length === 0 && parsed.sections.length + parsed.questionCount > 0) {
        await handleCreate(parsed);
      }
    } catch (err) {
      setReadError(err instanceof Error ? err.message : 'Không đọc được file');
    } finally {
      setReading(false);
    }
  };

  // File kéo thả từ trang soạn đề: xử lý một lần khi mở
  const startedRef = useRef(false);
  useEffect(() => {
    if (!initialFile || startedRef.current) return;
    startedRef.current = true;
    void handleFile(initialFile, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  /** Tạo lần lượt từng section rồi các câu của section đó; dừng ở lỗi đầu tiên. */
  const handleCreate = async (source: ImportResult | null = result) => {
    if (!source) return;
    const result = source;
    const total = result.sections.length + result.questionCount;
    let done = 0;
    setCreateError(null);
    setProgress({ done, total });
    try {
      for (const q of result.looseQuestions) {
        unwrapOrThrow(await addQuestionApi(examId, q.request));
        setProgress({ done: ++done, total });
      }
      for (const s of result.sections) {
        const section = unwrapOrThrow(await createSectionApi(examId, s.request));
        setProgress({ done: ++done, total });
        for (const q of s.questions) {
          unwrapOrThrow(await addQuestionApi(examId, { ...q.request, sectionId: section.sectionId }));
          setProgress({ done: ++done, total });
        }
      }
      toast.success(`Đã tạo ${result.sections.length} section, ${result.questionCount} câu hỏi`);
      onClose();
    } catch (err) {
      setCreateError(
        `${err instanceof Error ? err.message : 'Tạo thất bại'} — đã tạo được ${done}/${total} mục, kiểm tra đề rồi xóa phần thừa nếu cần.`,
      );
    } finally {
      queryClient.invalidateQueries({ queryKey: ['exam'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.examOptions });
    }
  };

  const hasErrors = (result?.errors.length ?? 0) > 0;

  return (
    <ExamModal title="Nhập đề từ file" onClose={onClose} isDismissDisabled={isCreating}>
      <div className="p-6 pt-2 space-y-4">
        {/* ---------- Chọn file ---------- */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50',
          )}
        >
          <Upload className="w-7 h-7 mx-auto text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {isAiReading
              ? 'AI đang đọc file và tạo đề… (có thể mất vài phút)'
              : isReading
                ? 'Đang đọc file…'
                : 'Kéo thả file PDF, Word (.docx) hoặc .txt vào đây, hoặc bấm để chọn'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            File viết tự do hoặc PDF sẽ được AI đọc và tạo đề, kèm đáp án trắc nghiệm để hệ thống tự chấm.
          </p>
          {fileName && (
            <p className="mt-1 text-xs text-slate-500 inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {fileName}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
        {readError && <p className="text-sm text-status-danger font-semibold">{readError}</p>}

        {/* ---------- Xem trước ---------- */}
        {result && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
              {hasErrors ? (
                <AlertTriangle className="w-4 h-4 text-status-danger" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-status-success" />
              )}
              Đọc được {result.sections.length} section, {result.questionCount} câu hỏi
              {hasErrors &&
                (isAiResult
                  ? ` — ${result.errors.length} mục AI đọc chưa chắc, sẽ bỏ qua khi tạo`
                  : ` — ${result.errors.length} lỗi cần sửa trong file`)}
            </p>
            {isAiResult && (
              <p className="rounded-xl border border-ai/30 bg-ai/5 p-3 text-sm text-slate-700 flex gap-2">
                <Sparkles className="w-4 h-4 text-ai shrink-0 mt-0.5" />
                <span>
                  Bộ đề do AI đọc từ file. Kiểm tra lại đáp án đúng (✓) trước khi tạo; sau khi tạo vẫn sửa được từng câu.
                  Phần Listening cần link file nghe nếu file gốc không có.
                </span>
              </p>
            )}

            {hasErrors && (
              <ul className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 space-y-1.5 text-sm">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-rose-700">
                    • {e.message}
                    {e.text && <span className="block ml-3 text-xs font-mono text-rose-500 truncate">“{e.text}”</span>}
                  </li>
                ))}
              </ul>
            )}

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {result.looseQuestions.length > 0 && (
                <PreviewGroup title="Câu hỏi không thuộc section" questions={result.looseQuestions} />
              )}
              {result.sections.map((s, i) => (
                <PreviewGroup
                  key={i}
                  title={s.request.title}
                  badge={s.request.sectionType}
                  passage={s.request.passageText}
                  audio={s.request.audioUrl}
                  questions={s.questions}
                />
              ))}
            </div>
          </div>
        )}

        {createError && <p className="text-sm text-status-danger font-semibold">{createError}</p>}
        <div className="flex items-center justify-end gap-2">
          {progress && !createError && (
            <span className="text-xs text-slate-500 mr-auto">
              Đang tạo {progress.done}/{progress.total}…
            </span>
          )}
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Hủy
          </Button>
          <Button
            onClick={() => handleCreate()}
            isLoading={isCreating}
            disabled={
              !result || isAiReading || (hasErrors && !isAiResult) || result.questionCount + result.sections.length === 0
            }
          >
            Tạo {result ? `${result.sections.length} section, ${result.questionCount} câu` : 'bộ đề'}
          </Button>
        </div>
      </div>
    </ExamModal>
  );
};

const PreviewGroup: React.FC<{
  title: string;
  badge?: string;
  passage?: string;
  audio?: string;
  questions: ImportQuestion[];
}> = ({ title, badge, passage, audio, questions }) => (
  <div className="rounded-xl border border-slate-200 p-3 space-y-2">
    <div className="flex items-center gap-2">
      {badge && <Badge variant="ai" size="sm">{badge}</Badge>}
      <span className="font-bold text-sm text-slate-800 flex-1">{title}</span>
      <span className="text-xs text-slate-500">{questions.length} câu</span>
    </div>
    {audio && <p className="text-xs text-slate-500 truncate">🎧 {audio}</p>}
    {passage && <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 whitespace-pre-line line-clamp-3">{passage}</p>}
    {questions.map((q, i) => (
      <div key={i} className="text-xs border-t border-slate-100 pt-1.5">
        <p className="text-slate-800">
          <Badge size="sm" className="mr-1.5">{QUESTION_TYPE_LABEL[q.request.questionType]}</Badge>
          {q.request.questionText}
          <span className="text-slate-400"> · {q.request.points} điểm</span>
        </p>
        {answerText(q) && <p className="text-emerald-700 mt-0.5">✓ {answerText(q)}</p>}
      </div>
    ))}
  </div>
);

export default ImportExamModal;
