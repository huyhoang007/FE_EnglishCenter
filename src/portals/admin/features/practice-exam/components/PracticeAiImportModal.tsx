/**
 * PracticeAiImportModal — tạo đề luyện Writing / Speaking từ file PDF / Word / text bằng AI (Dev 3)
 * -----------------------------------------------------------
 * 1. Kéo thả / chọn file → AI (Gemini) đọc và tách từng đề Writing / Speaking (POST /admin/ai-import, target PRACTICE)
 * 2. Xem trước, bỏ chọn đề không muốn tạo → bấm Tạo: gọi lần lượt API tạo đề luyện tập sẵn có
 */

import React, { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Sparkles, Upload } from 'lucide-react';
import { unwrapOrThrow } from '@/shared/api/axiosClient';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { cn } from '@/shared/utils/cn';
import { ExamModal } from '@/portals/admin/features/exam/components/ExamFormParts';
import { aiImportApi, type AiPracticeDraft } from '@/portals/admin/features/exam/services/adminExamService';
import { MAX_PDF_BYTES, fileToBase64, isPdfFile, readExamFile } from '@/portals/admin/features/exam/utils/examImport';
import { createPracticeExamApi } from '../services/adminPracticeExamService';

interface PracticeAiImportModalProps {
  onClose: () => void;
}

export const PracticeAiImportModal: React.FC<PracticeAiImportModalProps> = ({ onClose }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isReading, setReading] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<AiPracticeDraft[] | null>(null);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const isCreating = progress !== null && createError === null;
  const chosen = (drafts ?? []).filter((_, i) => selected[i]);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setDrafts(null);
    setReadError(null);
    setCreateError(null);
    setReading(true);
    try {
      const pdf = isPdfFile(file);
      if (pdf && file.size > MAX_PDF_BYTES) throw new Error('File PDF tối đa 15MB');
      const res = unwrapOrThrow(
        await aiImportApi({
          target: 'PRACTICE',
          fileName: file.name,
          fileBase64: pdf ? await fileToBase64(file) : undefined,
          text: pdf ? undefined : await readExamFile(file),
        }),
      );
      const list = res.prompts ?? [];
      setDrafts(list);
      setSelected(list.map(() => true));
      if (list.length === 0) setReadError('AI không tìm thấy đề Writing / Speaking nào trong file.');
    } catch (err) {
      setReadError(err instanceof Error ? err.message : 'Không đọc được file');
    } finally {
      setReading(false);
    }
  };

  /** Tạo lần lượt các đề đã chọn; dừng ở lỗi đầu tiên */
  const handleCreate = async () => {
    const total = chosen.length;
    let done = 0;
    setCreateError(null);
    setProgress({ done, total });
    try {
      for (const d of chosen) {
        unwrapOrThrow(
          await createPracticeExamApi({
            title: d.title,
            description: d.description,
            examType: d.examType,
            bankName: d.bankName || undefined,
          }),
        );
        setProgress({ done: ++done, total });
      }
      toast.success(`Đã tạo ${total} đề luyện tập`);
      onClose();
    } catch (err) {
      setCreateError(`${err instanceof Error ? err.message : 'Tạo thất bại'} — đã tạo được ${done}/${total} đề.`);
    } finally {
      queryClient.invalidateQueries({ queryKey: ['admin', 'practice-exams'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.admin.practiceOptions });
      queryClient.invalidateQueries({ queryKey: ['practice'] });
    }
  };

  return (
    <ExamModal title="Tạo đề luyện tập từ file" onClose={onClose} isDismissDisabled={isCreating || isReading}>
      <div className="p-6 pt-2 space-y-4">
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
          onClick={() => !isReading && inputRef.current?.click()}
          className={cn(
            'rounded-2xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors',
            isDragging ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50',
          )}
        >
          <Upload className="w-7 h-7 mx-auto text-slate-400" />
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {isReading
              ? 'AI đang đọc file… (có thể mất vài phút)'
              : 'Kéo thả file PDF, Word (.docx) hoặc .txt vào đây, hoặc bấm để chọn'}
          </p>
          <p className="mt-1 text-xs text-slate-500">AI tách từng đề Writing / Speaking trong file.</p>
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

        {drafts && drafts.length > 0 && (
          <div className="space-y-3">
            <p className="rounded-xl border border-ai/30 bg-ai/5 p-3 text-sm text-slate-700 flex gap-2">
              <Sparkles className="w-4 h-4 text-ai shrink-0 mt-0.5" />
              <span>
                AI đọc được {drafts.length} đề. Bỏ chọn đề không muốn tạo; sau khi tạo vẫn sửa được từng đề.
              </span>
            </p>
            <ul className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {drafts.map((d, i) => (
                <li key={i}>
                  <label className="flex gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selected[i] ?? false}
                      onChange={(e) => setSelected((s) => s.map((v, j) => (j === i ? e.target.checked : v)))}
                      className="mt-1"
                    />
                    <span className="flex-1 min-w-0 space-y-1">
                      <span className="flex items-center gap-2">
                        <Badge variant={d.examType === 'WRITING' ? 'primary' : 'ai'} size="sm">
                          {d.examType === 'WRITING' ? 'Writing' : 'Speaking'}
                        </Badge>
                        <span className="font-bold text-sm text-slate-800 truncate">{d.title}</span>
                      </span>
                      <span className="block text-xs text-slate-600 whitespace-pre-line line-clamp-3">{d.description}</span>
                      {d.bankName && <span className="block text-[11px] text-slate-400">Bộ đề: {d.bankName}</span>}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {createError && <p className="text-sm text-status-danger font-semibold">{createError}</p>}
        <div className="flex items-center justify-end gap-2">
          {progress && !createError && (
            <span className="text-xs text-slate-500 mr-auto">
              Đang tạo {progress.done}/{progress.total}…
            </span>
          )}
          <Button variant="outline" onClick={onClose} disabled={isCreating || isReading}>
            Hủy
          </Button>
          <Button onClick={handleCreate} isLoading={isCreating} disabled={isReading || chosen.length === 0}>
            Tạo {chosen.length} đề
          </Button>
        </div>
      </div>
    </ExamModal>
  );
};

export default PracticeAiImportModal;
