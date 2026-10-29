/**
 * PracticeExamManagementView — Admin quản lý kho đề luyện tập AI (route `/admin/practice-exams`)
 * -----------------------------------------------------------
 * Dev 5 — TASK-D5-04. Đề Writing / Speaking để học viên tự luyện và được AI (Gemini) chấm
 * theo 4 tiêu chí IELTS. API: xem services/adminPracticeExamService.ts
 *
 * Layout giữ nguyên AdminLayout: StatCard → title bar → filter bar → bảng → modal,
 * bo góc 16-24px, viền slate-200/80, màu nhấn #0052CC (giống Certificates / Courses).
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import {
  FileText,
  Mic,
  PenLine,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { cn } from '@/shared/utils';
import { formatDate } from '@/shared/utils/format';
import type { PracticeExam, PracticeExamPayload, PracticeExamType } from '@/shared/types';
import {
  useAdminPracticeExams,
  useDeletePracticeExam,
  useSavePracticeExam,
} from './hooks/useAdminPracticeExams';
import { PracticeAiImportModal } from './components/PracticeAiImportModal';

const PAGE_SIZE = 10;
/** Chiều cao tối thiểu ô "Đề bài" (px) — đề Writing/Speaking thường dài */
const DESCRIPTION_MIN_HEIGHT = 320;

const TYPE_LABEL: Record<PracticeExamType, string> = {
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
};

/* =========================================================
 * View
 * ========================================================= */
export const PracticeExamManagementView: React.FC = () => {
  const toast = useToast();

  const [type, setType] = useState<PracticeExamType | ''>('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<PracticeExam | null>(null);
  const [deleting, setDeleting] = useState<PracticeExam | null>(null);
  // Dev 3: tạo đề từ file PDF / Word bằng AI
  const [isAiImportOpen, setAiImportOpen] = useState(false);

  const listQuery = useAdminPracticeExams({ type, keyword, page, size: PAGE_SIZE });
  // Thống kê theo kỹ năng: chỉ cần totalElements
  const writingQuery = useAdminPracticeExams({ type: 'WRITING', page: 0, size: 1 });
  const speakingQuery = useAdminPracticeExams({ type: 'SPEAKING', page: 0, size: 1 });
  const deleteMutation = useDeletePracticeExam();

  const exams = listQuery.data?.data ?? [];
  const writingTotal = writingQuery.data?.totalElements ?? 0;
  const speakingTotal = speakingQuery.data?.totalElements ?? 0;
  const hasFilter = Boolean(type || keyword);

  /* ---------- Debounce keyword (giống Courses) ---------- */
  const timerRef = React.useRef<number | undefined>(undefined);
  const applyKeyword = (value: string) => {
    setKeywordInput(value);
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setKeyword(value.trim());
      setPage(0);
    }, 400);
  };

  const resetFilters = () => {
    setType('');
    setKeywordInput('');
    setKeyword('');
    setPage(0);
  };

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.practiceExamId, {
      onSuccess: () => {
        toast.success('Đã xóa đề luyện tập');
        setDeleting(null);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <div className="space-y-6">
      {/* ============ 1. STATS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        <StatCard
          title="Tổng đề luyện tập"
          value={(writingTotal + speakingTotal).toLocaleString('vi-VN')}
          subtext="AI chấm tự động"
          icon={Sparkles}
          colorScheme="purple"
          trendPoints={[2, 3, 3, 4, 5, 5, 6, writingTotal + speakingTotal || 6]}
        />
        <StatCard
          title="Writing"
          value={writingTotal.toLocaleString('vi-VN')}
          subtext="Đề viết"
          icon={PenLine}
          colorScheme="blue"
          trendPoints={[1, 2, 2, 3, 3, 4, 4, writingTotal || 4]}
        />
        <StatCard
          title="Speaking"
          value={speakingTotal.toLocaleString('vi-VN')}
          subtext="Đề nói (nộp bản phiên âm)"
          icon={Mic}
          colorScheme="emerald"
          trendPoints={[1, 1, 2, 2, 3, 3, 4, speakingTotal || 4]}
        />
        <StatCard
          title="Đang hiển thị"
          value={(listQuery.data?.totalElements ?? 0).toLocaleString('vi-VN')}
          subtext={hasFilter ? 'Sau khi lọc' : 'Tất cả'}
          icon={FileText}
          colorScheme="amber"
          trendPoints={[3, 4, 4, 5, 5, 6, 6, listQuery.data?.totalElements || 6]}
        />
      </div>

      {/* ============ 2. TITLE BAR ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đề luyện tập AI</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Kho đề Writing / Speaking để học viên tự luyện, AI chấm theo 4 tiêu chí IELTS.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="md" leftIcon={Sparkles} onClick={() => setAiImportOpen(true)} className="font-bold">
            Tạo từ file
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={openCreate}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            Tạo đề luyện tập
          </Button>
        </div>
      </div>

      {/* ============ 3. FILTER BAR ============ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 flex-1 min-w-[240px] focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => applyKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề hoặc đề bài…"
              className="bg-transparent outline-none w-full text-slate-700 text-sm placeholder:text-slate-400"
              aria-label="Tìm đề luyện tập"
            />
          </div>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as PracticeExamType | '');
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc theo kỹ năng"
          >
            <option value="">Tất cả kỹ năng</option>
            <option value="WRITING">Writing</option>
            <option value="SPEAKING">Speaking</option>
          </select>

          {hasFilter && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* ============ 4. CONTENT ============ */}
      {listQuery.isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : listQuery.isError ? (
        <ErrorState message={getErrorMessage(listQuery.error)} onRetry={() => listQuery.refetch()} />
      ) : exams.length === 0 ? (
        hasFilter ? (
          <EmptyState
            title="Không tìm thấy đề phù hợp"
            description="Thử đổi kỹ năng hoặc xoá bớt từ khoá."
            actionLabel="Đặt lại bộ lọc"
            onAction={resetFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có đề luyện tập nào"
            description="Tạo đề Writing / Speaking đầu tiên để học viên luyện và được AI chấm."
            actionLabel="Tạo đề luyện tập"
            onAction={openCreate}
          />
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3.5 px-4 font-bold">Đề luyện tập</th>
                  <th className="py-3.5 px-3 font-bold">Kỹ năng</th>
                  <th className="py-3.5 px-3 font-bold">Ngày tạo</th>
                  <th className="py-3.5 px-3 font-bold">Cập nhật</th>
                  <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.practiceExamId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 max-w-[380px]">
                      <span className="font-bold text-slate-900 block truncate">{exam.title}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{exam.description}</span>
                    </td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={exam.examType === 'WRITING' ? 'primary' : 'success'}
                        size="sm"
                        icon={exam.examType === 'WRITING' ? PenLine : Mic}
                      >
                        {TYPE_LABEL[exam.examType]}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {exam.createdAt ? formatDate(exam.createdAt) : '—'}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {exam.lastUpdated ? formatDate(exam.lastUpdated) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(exam);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Sửa đề"
                          aria-label="Sửa đề"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(exam)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Xóa đề"
                          aria-label="Xóa đề"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-slate-100">
            <Pagination currentPage={page} totalPages={listQuery.data?.totalPages ?? 0} onChange={setPage} />
          </div>
        </div>
      )}

      {/* ============ MODALS ============ */}
      <PracticeExamFormModal
        open={isFormOpen}
        editing={editing}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => toast.success(editing ? 'Đã cập nhật đề luyện tập' : 'Đã tạo đề luyện tập mới')}
      />

      {deleting && (
        <ModalShell onClose={() => setDeleting(null)}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Xóa đề luyện tập</h3>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-slate-700 pt-4">
            Xóa đề <span className="font-bold">{deleting.title}</span>? Đề đã có học viên nộp bài thì không xóa được
            (để giữ lịch sử chấm của học viên).
          </p>
          <div className="flex justify-end gap-2 pt-5">
            <Button variant="ghost" size="md" onClick={() => setDeleting(null)}>
              Đóng
            </Button>
            <Button variant="danger" size="md" isLoading={deleteMutation.isPending} onClick={handleConfirmDelete}>
              Xác nhận xóa
            </Button>
          </div>
        </ModalShell>
      )}

      {isAiImportOpen && <PracticeAiImportModal onClose={() => setAiImportOpen(false)} />}
    </div>
  );
};

/* =========================================================
 * Modal: Create / Edit practice exam
 * ========================================================= */
const PracticeExamFormModal: React.FC<{
  open: boolean;
  editing: PracticeExam | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, editing, onClose, onSaved }) => {
  const toast = useToast();
  const saveMutation = useSavePracticeExam();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState<PracticeExamType>('WRITING');
  const [touched, setTouched] = useState(false);
  // Ô đề bài cao sẵn và tự giãn theo nội dung (đề thường dài, không bắt admin tự kéo)
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, DESCRIPTION_MIN_HEIGHT)}px`;
  }, [description, open]);

  // Nạp dữ liệu đề đang sửa (1 lần cho mỗi lần mở)
  const loadedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!open) {
      loadedFor.current = null;
      return;
    }
    const id = editing?.practiceExamId ?? 'new';
    if (loadedFor.current === id) return;
    loadedFor.current = id;
    setTouched(false);
    setTitle(editing?.title ?? '');
    setDescription(editing?.description ?? '');
    setExamType(editing?.examType ?? 'WRITING');
  }, [open, editing]);

  const titleError = !title.trim() ? 'Tiêu đề là bắt buộc' : title.trim().length > 255 ? 'Tối đa 255 ký tự' : '';
  const descriptionError = !description.trim()
    ? 'Đề bài là bắt buộc'
    : description.trim().length > 5000
      ? 'Tối đa 5000 ký tự'
      : '';
  const hasError = Boolean(titleError || descriptionError);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;
    const payload: PracticeExamPayload = {
      title: title.trim(),
      description: description.trim(),
      examType,
      // Form không còn ô "Bộ đề" / "Khóa học liên quan": giữ nguyên giá trị cũ khi sửa để không bị xóa mất
      bankName: editing?.bankName ?? undefined,
      courseId: editing?.courseId ?? undefined,
    };
    saveMutation.mutate(
      { practiceExamId: editing?.practiceExamId, payload },
      {
        onSuccess: () => {
          onSaved();
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  if (!open) return null;

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editing ? 'Cập nhật đề luyện tập' : 'Tạo đề luyện tập mới'}
            </h3>
            <p className="text-xs text-slate-500">
              {editing ? editing.title : 'Đề bài sẽ được gửi kèm bài làm cho AI chấm'}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg" aria-label="Đóng">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <Field label="Tiêu đề" required error={touched ? titleError : ''}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Writing Task 2 - Technology"
            className={inputCls(Boolean(touched && titleError))}
          />
        </Field>

        <div className="max-w-sm">
          <Field label="Kỹ năng" required>
            <div className="grid grid-cols-2 gap-2">
              {(['WRITING', 'SPEAKING'] as PracticeExamType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setExamType(t)}
                  className={cn(
                    'h-10 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors',
                    examType === t
                      ? 'border-[#0052CC] bg-blue-50 text-[#0052CC]'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                  )}
                >
                  {t === 'WRITING' ? <PenLine className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  {TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <Field label="Đề bài" required error={touched ? descriptionError : ''}>
          <textarea
            ref={descriptionRef}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              examType === 'WRITING'
                ? 'VD: Some people think technology makes life easier. Others disagree. Discuss both views and give your opinion.'
                : 'VD: Describe a place you like to visit. You should say: where it is, how often you go there… (học viên nộp bản phiên âm câu trả lời)'
            }
            style={{ minHeight: DESCRIPTION_MIN_HEIGHT }}
            className={cn(inputCls(Boolean(touched && descriptionError)), 'h-auto py-2 leading-relaxed resize-none overflow-hidden')}
          />
          <p className="text-[10px] text-slate-400 text-right mt-1">{description.trim().length}/5000</p>
        </Field>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={saveMutation.isPending}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
          >
            {editing ? 'Lưu thay đổi' : 'Tạo đề'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

/* =========================================================
 * Shared form atoms (giống CertificateManagementView)
 * ========================================================= */
const inputCls = (invalid: boolean) =>
  cn(
    'w-full h-10 px-3 rounded-xl border text-sm outline-none transition-colors bg-white',
    'placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400',
    invalid ? 'border-rose-300 focus:border-rose-400' : 'border-slate-200 focus:border-[#0052CC]',
  );

const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, error, children }) => (
  <div>
    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-rose-500 mt-1">{error}</p>}
  </div>
);

const ModalShell: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}> = ({ children, onClose, maxWidth = 'max-w-lg' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose} role="presentation">
    <div
      className={cn('bg-white rounded-3xl w-full p-6 shadow-2xl border border-slate-100', 'max-h-[90vh] overflow-y-auto', maxWidth)}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  </div>
);

export default PracticeExamManagementView;
