/**
 * ImportExamModal — nhập section + câu hỏi từ file Word (.docx) / .txt viết theo mẫu (Dev 3)
 * -----------------------------------------------------------
 * 1. Hướng dẫn + tải file mẫu + ví dụ có nút sao chép
 * 2. Kéo thả / chọn file → đọc và kiểm tra ngay trên trình duyệt
 * 3. Xem trước bộ đề (lỗi hiện kèm nội dung dòng) → bấm Tạo: tạo lần lượt section rồi câu hỏi qua API sẵn có
 */

import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, ChevronDown, Copy, Download, FileText, Upload } from 'lucide-react';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { QUESTION_TYPE_LABEL } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { addQuestionApi, createSectionApi } from '../services/adminExamService';
import type { ScaleInfo } from '@/shared/constants/examScales';
import {
  IMPORT_TEMPLATE,
  parseExamText,
  readExamFile,
  sectionTokens,
  type ImportQuestion,
  type ImportResult,
} from '../utils/examImport';
import { ExamModal } from './ExamFormParts';

interface ImportExamModalProps {
  examId: string;
  /** Tên chứng chỉ để hiện trong hướng dẫn */
  certificateLabel: string;
  /** Thang của chứng chỉ của đề — các phần thi được dùng sau [SECTION] */
  scale: ScaleInfo;
  onClose: () => void;
}

const TEMPLATE_URL = '/templates/mau-de-thi.docx';

const GUIDE: { syntax: string; meaning: string }[] = [
  { syntax: '[SECTION] READING | Part 2 - Reading', meaning: 'Mở một phần thi mới: LOẠI | Tiêu đề' },
  { syntax: '[INSTRUCTIONS] Đọc và trả lời…', meaning: 'Hướng dẫn của phần thi' },
  { syntax: '[PASSAGE] Tom moved to…', meaning: 'Đoạn đọc, viết được nhiều dòng liền sau' },
  { syntax: '[AUDIO] https://…/audio.mp3', meaning: 'Link file nghe (chỉ phần LISTENING)' },
  { syntax: '1. Câu hỏi…', meaning: 'Câu trắc nghiệm; A. B. C. … là lựa chọn' },
  { syntax: '*B. In a bakery', meaning: 'Dấu * trước chữ cái = đáp án đúng (đúng 1 đáp án)' },
  { syntax: '2. [TF] …  rồi  = False', meaning: 'Câu đúng / sai' },
  { syntax: '3. [FILL] …  rồi  = moved | move', meaning: 'Điền từ, nhiều đáp án ngăn bằng |' },
  { syntax: '4. [MATCH] …  rồi  - bakery = tiệm bánh', meaning: 'Nối cặp, mỗi cặp một dòng, ít nhất 2 cặp' },
  { syntax: '5. [ESSAY] Describe your hometown.', meaning: 'Tự luận Writing / Speaking, mentor chấm' },
  { syntax: '… {2}', meaning: 'Cuối câu hỏi: số điểm của câu (mặc định 1)' },
  { syntax: '[EXPLAIN] Giải thích…', meaning: 'Giải thích đáp án cho câu ngay trên' },
  { syntax: '# ghi chú', meaning: 'Dòng ghi chú, bị bỏ qua' },
];

const answerText = (q: ImportQuestion) =>
  (q.request.options ?? [])
    .filter((o) => o.isCorrect)
    .map((o) => o.optionText.replace('::', ' → '))
    .join(' · ');

export const ImportExamModal: React.FC<ImportExamModalProps> = ({
  examId,
  certificateLabel,
  scale,
  onClose,
}) => {
  const allowedSections = sectionTokens(scale.parts);
  const queryClient = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isGuideOpen, setGuideOpen] = useState(true);
  const [isDragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [isReading, setReading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const isCreating = progress !== null && createError === null;

  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setReadError(null);
    setCreateError(null);
    setReading(true);
    try {
      const text = await readExamFile(file);
      setResult(parseExamText(text, scale.parts));
      setGuideOpen(false);
    } catch (err) {
      setReadError(err instanceof Error ? err.message : 'Không đọc được file');
    } finally {
      setReading(false);
    }
  };

  const copyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(IMPORT_TEMPLATE);
      toast.success('Đã sao chép ví dụ, dán vào Word để sửa');
    } catch {
      toast.error('Trình duyệt không cho sao chép, hãy tải file mẫu');
    }
  };

  /** Tạo lần lượt từng section rồi các câu của section đó; dừng ở lỗi đầu tiên. */
  const handleCreate = async () => {
    if (!result) return;
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
    <ExamModal title="Nhập đề từ file Word" onClose={onClose} isDismissDisabled={isCreating}>
      <div className="p-6 pt-2 space-y-4">
        {/* ---------- Hướng dẫn ---------- */}
        <div className="rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-800"
          >
            <span>Hướng dẫn viết file đề ({certificateLabel})</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', isGuideOpen && 'rotate-180')} />
          </button>
          {isGuideOpen && (
            <div className="px-4 pb-4 space-y-3 text-sm text-slate-600">
              <ol className="list-decimal pl-5 space-y-1">
                <li>Tải file mẫu Word bên dưới (hoặc sao chép ví dụ rồi dán vào Word).</li>
                <li>Sửa nội dung, giữ nguyên các thẻ trong ngoặc vuông như [SECTION], [TF]…</li>
                <li>Lưu thành .docx (file .doc đời cũ phải "Lưu thành" .docx), rồi kéo thả vào ô bên dưới.</li>
                <li>Xem trước bộ đề, sửa lỗi nếu có, rồi bấm "Tạo".</li>
              </ol>
              <p>
                Ghi sau [SECTION] một trong các phần thi của chứng chỉ này:{' '}
                {allowedSections.map((t) => (
                  <Badge key={t} variant="neutral" size="sm" className="mr-1">
                    {t}
                  </Badge>
                ))}
              </p>
              <div className="rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-xs">
                  <tbody>
                    {GUIDE.map((g) => (
                      <tr key={g.syntax} className="border-t border-slate-100 first:border-t-0">
                        <td className="px-3 py-1.5 font-mono text-slate-800 bg-slate-50 whitespace-nowrap">{g.syntax}</td>
                        <td className="px-3 py-1.5">{g.meaning}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={TEMPLATE_URL} download="mau-de-thi.docx">
                  <Button variant="secondary" size="sm" leftIcon={Download}>
                    Tải file mẫu Word
                  </Button>
                </a>
                <Button variant="outline" size="sm" leftIcon={Copy} onClick={copyTemplate}>
                  Sao chép ví dụ
                </Button>
              </div>
              <pre className="max-h-48 overflow-auto rounded-xl bg-slate-900 text-slate-100 text-[11px] leading-relaxed p-3 whitespace-pre-wrap">
                {IMPORT_TEMPLATE}
              </pre>
            </div>
          )}
        </div>

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
            {isReading ? 'Đang đọc file…' : 'Kéo thả file .docx vào đây hoặc bấm để chọn'}
          </p>
          {fileName && (
            <p className="mt-1 text-xs text-slate-500 inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {fileName}
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".docx,.txt"
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
              {hasErrors && ` — ${result.errors.length} lỗi cần sửa trong file`}
            </p>

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
            onClick={handleCreate}
            isLoading={isCreating}
            disabled={!result || hasErrors || result.questionCount + result.sections.length === 0}
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
