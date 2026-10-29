/**
 * LearningPathManagementView — Admin quản lý lộ trình học (route `/admin/learning-paths`)
 * -----------------------------------------------------------
 * Dev 5 — TASK-D5-03. Admin dựng lộ trình theo chứng chỉ (VD: IELTS 0 - 6.5:
 * Nền tảng → Bứt phá → Luyện đề), mỗi chặng gắn với 1 khóa học / đề thi / đề luyện tập AI.
 * Tiến độ học viên do BE tự tính: COURSE = đã ghi danh khóa, EXAM = thi đậu,
 * PRACTICE_EXAM = AI chấm đạt band mục tiêu.
 *
 * Layout giữ nguyên AdminLayout: StatCard → title bar → filter bar → bảng → modal,
 * bo góc 16-24px, viền slate-200/80, màu nhấn #0052CC (giống Certificates / Courses).
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  ClipboardList,
  Eye,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Route,
  Search,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { EmptyState, ErrorState, Pagination, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { cn } from '@/shared/utils';
import { formatDate } from '@/shared/utils/format';
import type {
  LearningPath,
  LearningPathItem,
  LearningPathItemType,
  LearningPathPayload,
} from '@/shared/types';
import {
  useAdminLearningPaths,
  useDeleteLearningPath,
  useLearningPathItemOptions,
  useSaveLearningPath,
} from './hooks/useAdminLearningPaths';

const PAGE_SIZE = 10;

const TYPE_META: Record<
  LearningPathItemType,
  { label: string; icon: React.ElementType; variant: 'primary' | 'warning' | 'ai' }
> = {
  COURSE: { label: 'Khóa học', icon: BookOpen, variant: 'primary' },
  EXAM: { label: 'Đề thi', icon: ClipboardList, variant: 'warning' },
  PRACTICE_EXAM: { label: 'Luyện đề AI', icon: Sparkles, variant: 'ai' },
};
const ITEM_TYPES = Object.keys(TYPE_META) as LearningPathItemType[];
const STAGE_SUGGESTIONS = ['Nền tảng', 'Bứt phá', 'Luyện đề', 'Tăng tốc', 'Về đích'];

/** Giá trị đặc biệt của dropdown giai đoạn: chuyển sang ô tự nhập */
const CUSTOM_STAGE = '__custom__';

/* =========================================================
 * Types nội bộ
 * ========================================================= */

/** 1 chặng trong form tạo/sửa */
interface ItemForm {
  key: string;
  stage: string;
  type: LearningPathItemType;
  refId: string;
  /** Chuỗi để người dùng gõ tự do, parse khi submit */
  targetBand: string;
}

const newKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyItem = (stage = ''): ItemForm => ({
  key: newKey(),
  stage,
  type: 'COURSE',
  refId: '',
  targetBand: '',
});

const toItemForm = (item: LearningPathItem): ItemForm => ({
  key: item.itemId || newKey(),
  stage: item.stage,
  type: item.type,
  refId: item.refId,
  targetBand: item.targetBand != null ? String(item.targetBand) : '',
});

/* =========================================================
 * View
 * ========================================================= */
export const LearningPathManagementView: React.FC = () => {
  const toast = useToast();

  const [certificateId, setCertificateId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<LearningPath | null>(null);
  const [viewing, setViewing] = useState<LearningPath | null>(null);
  const [deleting, setDeleting] = useState<LearningPath | null>(null);

  const listQuery = useAdminLearningPaths({ certificateId, page, size: PAGE_SIZE });
  // Thống kê toàn hệ thống (1 trung tâm có ít lộ trình nên lấy 1 trang lớn)
  const statsQuery = useAdminLearningPaths({ page: 0, size: 200 });
  const deleteMutation = useDeleteLearningPath();

  const { data: certificates = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 5 * 60_000,
  });
  const certificateName = (id: string) =>
    certificates.find((c) => c.certificateId === id)?.certificateName ?? '—';

  const allPaths = statsQuery.data?.data ?? [];
  const totalEnrolled = allPaths.reduce((sum, p) => sum + (p.enrolledCount ?? 0), 0);
  const totalItems = allPaths.reduce((sum, p) => sum + (p.totalItems ?? 0), 0);

  // Tìm theo tên/mô tả trên trang hiện tại (BE chỉ lọc theo chứng chỉ)
  const normalizedKeyword = keyword.trim().toLowerCase();
  const pagePaths = listQuery.data?.data ?? [];
  const visible = normalizedKeyword
    ? pagePaths.filter(
        (p) =>
          p.name.toLowerCase().includes(normalizedKeyword) ||
          (p.description ?? '').toLowerCase().includes(normalizedKeyword),
      )
    : pagePaths;
  const hasFilter = Boolean(certificateId || normalizedKeyword);

  const resetFilters = () => {
    setCertificateId('');
    setKeyword('');
    setPage(0);
  };

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.learningPathId, {
      onSuccess: () => {
        toast.success('Đã xóa lộ trình');
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
          title="Tổng lộ trình"
          value={(statsQuery.data?.totalElements ?? 0).toLocaleString('vi-VN')}
          subtext="Toàn hệ thống"
          icon={Route}
          colorScheme="blue"
          trendPoints={[1, 2, 2, 3, 3, 4, 4, statsQuery.data?.totalElements || 4]}
        />
        <StatCard
          title="Học viên ghi danh"
          value={totalEnrolled.toLocaleString('vi-VN')}
          subtext="Tổng lượt ghi danh"
          icon={Users}
          colorScheme="emerald"
          trendPoints={[2, 4, 5, 7, 8, 10, 12, totalEnrolled || 12]}
        />
        <StatCard
          title="Tổng chặng"
          value={totalItems.toLocaleString('vi-VN')}
          subtext="Khóa học, đề thi, luyện đề"
          icon={Layers3}
          colorScheme="purple"
          trendPoints={[3, 5, 6, 8, 9, 10, 12, totalItems || 12]}
        />
        <StatCard
          title="Đang hiển thị"
          value={visible.length.toLocaleString('vi-VN')}
          subtext={hasFilter ? 'Sau khi lọc' : 'Trang hiện tại'}
          icon={Target}
          colorScheme="amber"
          trendPoints={[2, 3, 3, 4, 4, 5, 5, visible.length || 5]}
        />
      </div>

      {/* ============ 2. TITLE BAR ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản lý lộ trình học</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Lộ trình theo chứng chỉ, mỗi chặng gắn khóa học / đề thi / đề luyện tập AI. Tiến độ học viên được tính tự động.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={Plus}
          onClick={openCreate}
          className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
        >
          Tạo lộ trình
        </Button>
      </div>

      {/* ============ 3. FILTER BAR ============ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 h-10 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-500 flex-1 min-w-[240px] focus-within:bg-white focus-within:border-[#0052CC] transition-colors">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên hoặc mô tả lộ trình…"
              className="bg-transparent outline-none w-full text-slate-700 text-sm placeholder:text-slate-400"
              aria-label="Tìm lộ trình"
            />
          </div>

          <select
            value={certificateId}
            onChange={(e) => {
              setCertificateId(e.target.value);
              setPage(0);
            }}
            className="h-10 px-3 rounded-xl border border-slate-200/80 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:border-[#0052CC]"
            aria-label="Lọc theo chứng chỉ"
          >
            <option value="">Tất cả chứng chỉ</option>
            {certificates.map((c) => (
              <option key={c.certificateId} value={c.certificateId}>
                {c.certificateName}
              </option>
            ))}
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
      ) : visible.length === 0 ? (
        hasFilter ? (
          <EmptyState
            title="Không tìm thấy lộ trình phù hợp"
            description="Thử đổi chứng chỉ hoặc xoá bớt từ khoá."
            actionLabel="Đặt lại bộ lọc"
            onAction={resetFilters}
          />
        ) : (
          <EmptyState
            title="Chưa có lộ trình nào"
            description="Tạo lộ trình đầu tiên (VD: IELTS 0 - 6.5) để học viên ghi danh và theo dõi tiến độ."
            actionLabel="Tạo lộ trình"
            onAction={openCreate}
          />
        )
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
                  <th className="py-3.5 px-4 font-bold">Lộ trình</th>
                  <th className="py-3.5 px-3 font-bold">Chứng chỉ</th>
                  <th className="py-3.5 px-3 font-bold">Chặng</th>
                  <th className="py-3.5 px-3 font-bold">Học viên</th>
                  <th className="py-3.5 px-3 font-bold">Cập nhật</th>
                  <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((path) => (
                  <tr key={path.learningPathId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 max-w-[340px]">
                      <span className="font-bold text-slate-900 block truncate">{path.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {path.description ?? 'Chưa có mô tả'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-semibold">{certificateName(path.certificateId)}</td>
                    <td className="py-3 px-3">
                      <Badge variant="primary" size="sm" icon={Layers3}>
                        {path.totalItems} chặng
                      </Badge>
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={path.enrolledCount > 0 ? 'success' : 'neutral'} size="sm" icon={Users}>
                        {path.enrolledCount}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {path.lastUpdated ? formatDate(path.lastUpdated) : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setViewing(path)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                          title="Xem chi tiết"
                          aria-label="Xem chi tiết"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(path);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Sửa lộ trình"
                          aria-label="Sửa lộ trình"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(path)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Xóa lộ trình"
                          aria-label="Xóa lộ trình"
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
      <LearningPathFormModal
        open={isFormOpen}
        editing={editing}
        certificates={certificates}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => toast.success(editing ? 'Đã cập nhật lộ trình' : 'Đã tạo lộ trình mới')}
      />

      {viewing && (
        <LearningPathDetailModal
          path={viewing}
          certificateName={certificateName(viewing.certificateId)}
          onClose={() => setViewing(null)}
        />
      )}

      {deleting && (
        <ModalShell onClose={() => setDeleting(null)}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Xóa lộ trình</h3>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {deleting.enrolledCount > 0 ? (
            <p className="text-sm text-slate-700 pt-4">
              Lộ trình <span className="font-bold">{deleting.name}</span> đã có{' '}
              <span className="font-bold">{deleting.enrolledCount}</span> học viên ghi danh nên không thể xóa (để giữ
              tiến độ của học viên). Bạn vẫn có thể sửa nội dung lộ trình.
            </p>
          ) : (
            <p className="text-sm text-slate-700 pt-4">
              Xóa lộ trình <span className="font-bold">{deleting.name}</span>? Thao tác này không thể hoàn tác.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-5">
            <Button variant="ghost" size="md" onClick={() => setDeleting(null)}>
              Đóng
            </Button>
            {deleting.enrolledCount === 0 && (
              <Button variant="danger" size="md" isLoading={deleteMutation.isPending} onClick={handleConfirmDelete}>
                Xác nhận xóa
              </Button>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
};

/* =========================================================
 * Modal: Create / Edit learning path
 * ========================================================= */
const LearningPathFormModal: React.FC<{
  open: boolean;
  editing: LearningPath | null;
  certificates: { certificateId: string; certificateName: string }[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ open, editing, certificates, onClose, onSaved }) => {
  const toast = useToast();
  const saveMutation = useSaveLearningPath();
  const options = useLearningPathItemOptions(open);

  const [certificateId, setCertificateId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<ItemForm[]>([]);
  const [touched, setTouched] = useState(false);

  // Nạp dữ liệu lộ trình đang sửa (1 lần cho mỗi lần mở)
  const loadedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!open) {
      loadedFor.current = null;
      return;
    }
    const id = editing?.learningPathId ?? 'new';
    if (loadedFor.current === id) return;
    loadedFor.current = id;
    setTouched(false);
    setCertificateId(editing?.certificateId ?? '');
    setName(editing?.name ?? '');
    setDescription(editing?.description ?? '');
    setItems(
      editing
        ? [...editing.items].sort((a, b) => a.order - b.order).map(toItemForm)
        : [emptyItem(STAGE_SUGGESTIONS[0])],
    );
  }, [open, editing]);

  const updateItem = (key: string, patch: Partial<ItemForm>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));

  const moveItem = (index: number, delta: number) =>
    setItems((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  /** Lựa chọn của dropdown theo loại chặng */
  const refOptions = (type: LearningPathItemType): { id: string; label: string }[] => {
    if (type === 'COURSE') {
      return options.courses.map((c) => ({
        id: c.courseId,
        label: `${c.title}${c.certificateName ? ` · ${c.certificateName}` : ''}${c.status !== 'active' ? ` (${c.status})` : ''}`,
      }));
    }
    if (type === 'EXAM') {
      return options.exams.map((e) => ({
        id: e.examId,
        label: `${e.examTitle}${e.examCode ? ` · ${e.examCode}` : ''}${e.status !== 'published' ? ` (${e.status})` : ''}`,
      }));
    }
    return options.practices.map((p) => ({ id: p.practiceExamId, label: `${p.title} · ${p.examType}` }));
  };

  /* ---------- Validate (khớp BE LearningPathRequest) ---------- */
  const certificateError = !certificateId ? 'Chọn chứng chỉ' : '';
  const nameError = !name.trim() ? 'Tên lộ trình là bắt buộc' : name.trim().length > 255 ? 'Tối đa 255 ký tự' : '';
  const descriptionError = description.trim().length > 5000 ? 'Tối đa 5000 ký tự' : '';
  const itemsError = items.length === 0 ? 'Lộ trình phải có ít nhất 1 chặng' : '';
  const seen = new Set<string>();
  const itemErrors = items.map((it) => {
    if (!it.stage.trim()) return 'Nhập tên giai đoạn';
    if (it.stage.trim().length > 100) return 'Tên giai đoạn tối đa 100 ký tự';
    if (!it.refId) return `Chọn ${TYPE_META[it.type].label.toLowerCase()}`;
    const dupKey = `${it.type}:${it.refId}`;
    if (seen.has(dupKey)) return 'Chặng này bị trùng với chặng phía trên';
    seen.add(dupKey);
    if (it.type === 'PRACTICE_EXAM' && it.targetBand.trim()) {
      const band = Number(it.targetBand);
      if (Number.isNaN(band) || band < 0 || band > 9 || (band * 2) % 1 !== 0) {
        return 'Band mục tiêu từ 0 đến 9, bước 0.5 (VD: 6.5)';
      }
    }
    return '';
  });
  const hasError =
    Boolean(certificateError || nameError || descriptionError || itemsError) || itemErrors.some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;
    const payload: LearningPathPayload = {
      certificateId,
      name: name.trim(),
      description: description.trim() || undefined,
      items: items.map((it, index) => ({
        stage: it.stage.trim(),
        order: index + 1,
        type: it.type,
        refId: it.refId,
        // targetBand chỉ dùng cho PRACTICE_EXAM (BE trả 6021 nếu gửi cho loại khác)
        targetBand: it.type === 'PRACTICE_EXAM' && it.targetBand.trim() ? Number(it.targetBand) : null,
      })),
    };
    saveMutation.mutate(
      { learningPathId: editing?.learningPathId, payload },
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
    <ModalShell onClose={onClose} maxWidth="max-w-3xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{editing ? 'Cập nhật lộ trình' : 'Tạo lộ trình mới'}</h3>
            <p className="text-xs text-slate-500">
              {editing ? editing.name : 'Sắp xếp các chặng theo thứ tự học viên sẽ đi qua'}
            </p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg" aria-label="Đóng">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Chứng chỉ" required error={touched ? certificateError : ''}>
            <select
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className={inputCls(Boolean(touched && certificateError))}
            >
              <option value="">— Chọn chứng chỉ —</option>
              {certificates.map((c) => (
                <option key={c.certificateId} value={c.certificateId}>
                  {c.certificateName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tên lộ trình" required error={touched ? nameError : ''}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: IELTS 0 - 6.5"
              className={inputCls(Boolean(touched && nameError))}
            />
          </Field>
        </div>

        <Field label="Mô tả" error={touched ? descriptionError : ''}>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="VD: Nền tảng → Bứt phá → Luyện đề, phù hợp người mất gốc"
            className={cn(inputCls(Boolean(touched && descriptionError)), 'h-auto py-2 resize-none')}
          />
        </Field>

        {/* ---------- Các chặng ---------- */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Các chặng ({items.length}) <span className="text-rose-500">*</span>
            </p>
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, emptyItem(prev[prev.length - 1]?.stage ?? '')])}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 text-[11px] font-bold text-[#0052CC] hover:bg-blue-50 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm chặng
            </button>
          </div>

          {options.isLoading && (
            <p className="text-[11px] text-slate-400 mb-2">Đang tải danh sách khóa học, đề thi, đề luyện tập…</p>
          )}
          {touched && itemsError && <p className="text-[11px] text-rose-500 mb-2">{itemsError}</p>}

          {items.length === 0 ? (
            <p className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl py-4 text-center">
              Chưa có chặng nào. Bấm “Thêm chặng” để gắn khóa học, đề thi hoặc đề luyện tập AI.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {items.map((item, idx) => {
                const meta = TYPE_META[item.type];
                const opts = refOptions(item.type);
                const error = touched ? itemErrors[idx] : '';
                return (
                  <li key={item.key} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#0052CC] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <StageSelect
                        value={item.stage}
                        invalid={Boolean(error && !item.stage.trim())}
                        onChange={(stage) => updateItem(item.key, { stage })}
                      />
                      <select
                        value={item.type}
                        onChange={(e) =>
                          updateItem(item.key, {
                            type: e.target.value as LearningPathItemType,
                            refId: '',
                            targetBand: '',
                          })
                        }
                        className={cn(inputCls(false), 'max-w-[160px]')}
                        aria-label="Loại chặng"
                      >
                        {ITEM_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {TYPE_META[t].label}
                          </option>
                        ))}
                      </select>
                      <div className="ml-auto flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveItem(idx, -1)}
                          disabled={idx === 0}
                          className="p-2 rounded-lg text-slate-400 hover:text-[#0052CC] hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="Lên trên"
                          aria-label="Lên trên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 1)}
                          disabled={idx === items.length - 1}
                          className="p-2 rounded-lg text-slate-400 hover:text-[#0052CC] hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                          title="Xuống dưới"
                          aria-label="Xuống dưới"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItems((prev) => prev.filter((it) => it.key !== item.key))}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Xoá chặng"
                          aria-label="Xoá chặng"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-8">
                      <select
                        value={item.refId}
                        onChange={(e) => updateItem(item.key, { refId: e.target.value })}
                        className={inputCls(Boolean(error && !item.refId))}
                        aria-label={meta.label}
                      >
                        <option value="">— Chọn {meta.label.toLowerCase()} —</option>
                        {opts.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                        {/* Mục cũ không còn trong danh sách (VD: khóa đã ẩn) vẫn giữ để không mất dữ liệu */}
                        {item.refId && !opts.some((o) => o.id === item.refId) && (
                          <option value={item.refId}>
                            {editing?.items.find((i) => i.refId === item.refId)?.title ?? item.refId}
                          </option>
                        )}
                      </select>
                      {item.type === 'PRACTICE_EXAM' && (
                        <input
                          type="number"
                          min={0}
                          max={9}
                          step={0.5}
                          value={item.targetBand}
                          onChange={(e) => updateItem(item.key, { targetBand: e.target.value })}
                          placeholder="Band"
                          title="Band AI chấm cần đạt (bỏ trống = chỉ cần có bài đã chấm)"
                          className={cn(inputCls(false), 'max-w-[96px]')}
                        />
                      )}
                    </div>

                    {item.type === 'PRACTICE_EXAM' && !error && (
                      <p className="text-[10px] text-slate-400 pl-8">
                        Hoàn thành khi AI chấm đạt band mục tiêu; bỏ trống band = chỉ cần có 1 bài đã chấm.
                      </p>
                    )}
                    {error && <p className="text-[11px] text-rose-500 pl-8">{error}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {editing && editing.enrolledCount > 0 && (
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            Lộ trình đã có {editing.enrolledCount} học viên ghi danh. Thay đổi chặng sẽ được áp dụng và tiến độ của học
            viên được tính lại ở lần xem tiếp theo.
          </p>
        )}

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
            {editing ? 'Lưu thay đổi' : 'Tạo lộ trình'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

/* =========================================================
 * Modal: Learning path detail (các chặng theo giai đoạn)
 * ========================================================= */
const LearningPathDetailModal: React.FC<{
  path: LearningPath;
  certificateName: string;
  onClose: () => void;
}> = ({ path, certificateName, onClose }) => {
  const items = [...path.items].sort((a, b) => a.order - b.order);

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Chi tiết lộ trình</h3>
            <p className="text-xs text-slate-500 truncate">{path.name}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg" aria-label="Đóng">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1 mt-4">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC]">{certificateName}</span>
        <h4 className="font-extrabold text-slate-900 text-base">{path.name}</h4>
        {path.description && <p className="text-xs text-slate-600">{path.description}</p>}
      </div>

      <dl className="grid grid-cols-3 gap-3 text-xs mt-3">
        <DetailCell label="Số chặng" value={`${path.totalItems}`} accent />
        <DetailCell label="Học viên" value={`${path.enrolledCount}`} />
        <DetailCell label="Cập nhật" value={path.lastUpdated ? formatDate(path.lastUpdated) : '—'} />
      </dl>

      <ol className="mt-4 space-y-2">
        {items.map((item, idx) => {
          const meta = TYPE_META[item.type];
          const newStage = idx === 0 || items[idx - 1].stage !== item.stage;
          return (
            <li key={item.itemId}>
              {newStage && (
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 mt-3 first:mt-0">
                  {item.stage}
                </p>
              )}
              <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="w-6 h-6 rounded-md bg-[#0052CC] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {item.order}
                </span>
                <span className="text-xs font-bold text-slate-800 truncate flex-1">{item.title}</span>
                {item.targetBand != null && (
                  <span className="text-[10px] font-bold text-purple-600 shrink-0">Band ≥ {Number(item.targetBand).toFixed(1)}</span>
                )}
                <Badge variant={meta.variant} size="sm" icon={meta.icon}>
                  {meta.label}
                </Badge>
              </div>
            </li>
          );
        })}
      </ol>

      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={onClose}
        className="bg-[#0052CC] hover:bg-[#0040A8] font-bold mt-5"
      >
        Đóng
      </Button>
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

const DetailCell: React.FC<{ label: string; value: string; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
    <dt className="text-slate-400 font-semibold uppercase text-[10px]">{label}</dt>
    <dd className={cn('font-bold mt-1 truncate', accent ? 'text-[#0052CC]' : 'text-slate-800')}>{value}</dd>
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

export default LearningPathManagementView;

/* =========================================================
 * Chọn giai đoạn của chặng
 * ---------------------------------------------------------
 * Dropdown luôn hiện đủ các giai đoạn gợi ý (datalist cũ lọc theo chữ đang gõ
 * nên chỉ hiện "Nền tảng"). Chọn "Khác…" để tự đặt tên; tên lạ từ dữ liệu cũ
 * cũng mở thẳng ô tự nhập.
 * ========================================================= */
const StageSelect: React.FC<{
  value: string;
  invalid: boolean;
  onChange: (stage: string) => void;
}> = ({ value, invalid, onChange }) => {
  const [custom, setCustom] = useState(() => value.trim() !== '' && !STAGE_SUGGESTIONS.includes(value));

  if (custom) {
    return (
      <div className="flex items-center gap-1 max-w-[220px] w-full">
        <input
          type="text"
          autoFocus
          value={value}
          maxLength={100}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Tên giai đoạn"
          className={inputCls(invalid)}
        />
        <button
          type="button"
          title="Chọn giai đoạn có sẵn"
          onClick={() => {
            setCustom(false);
            onChange(STAGE_SUGGESTIONS[0]);
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        if (e.target.value === CUSTOM_STAGE) {
          setCustom(true);
          onChange('');
          return;
        }
        onChange(e.target.value);
      }}
      className={cn(inputCls(invalid), 'max-w-[200px]')}
      aria-label="Giai đoạn"
    >
      <option value="" disabled>
        Chọn giai đoạn
      </option>
      {STAGE_SUGGESTIONS.map((stage) => (
        <option key={stage} value={stage}>
          {stage}
        </option>
      ))}
      <option value={CUSTOM_STAGE}>Khác (tự nhập)…</option>
    </select>
  );
};
