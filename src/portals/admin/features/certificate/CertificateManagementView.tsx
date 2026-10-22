/**
 * CertificateManagementView — Quản trị chứng chỉ (route `/admin/certificates`)
 * -----------------------------------------------------------
 * API thật của Dev 2:
 *   GET  /api/v1/certificates                → danh sách chứng chỉ (summary)
 *   GET  /api/v1/certificates/{id}           → chi tiết + các kỹ năng (parts)
 *   POST /api/v1/admin/certificates          → tạo chứng chỉ (kèm parts)
 *   PUT  /api/v1/admin/certificates/{id}     → sửa tên / mô tả
 *
 * Lưu ý:
 *   - `properties` của mỗi part gửi lên là JSON **string** (backend normalize
 *     vào cột JSONB), khi đọc về backend đã parse sẵn thành object.
 *   - Endpoint list KHÔNG trả `parts`, chỉ trả `partCount` — nên màn chi tiết
 *     phải gọi thêm `fetchCertificateById`.
 *   - Backend chưa có API xoá chứng chỉ → không render nút xoá.
 *
 * Layout giữ nguyên AdminLayout: bo góc 16-24px, viền slate-200/80,
 * font Be Vietnam Pro, màu nhấn #0052CC.
 */

import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import {
  Award,
  BookMarked,
  CalendarClock,
  Eye,
  Layers3,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { formatDate } from '@/shared/utils/format';
import {
  createCertificate,
  fetchCertificateById,
  fetchCertificates,
  updateCertificate,
} from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import type {
  CertificateDto,
  CreateCertificatePayload,
  UpdateCertificatePayload,
} from '@/shared/types/catalog.types';

/* =========================================================
 * Types nội bộ
 * ========================================================= */

/** Một dòng "kỹ năng" (certificate part) trong form tạo/sửa. */
interface PartForm {
  key: string;
  partName: string;
  partDescription: string;
  properties: string;
}

const emptyPart = (): PartForm => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  partName: '',
  partDescription: '',
  properties: '',
});

/* =========================================================
 * View
 * ========================================================= */
export const CertificateManagementView: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [keyword, setKeyword] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<CertificateDto | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  /* ---------- Query ---------- */
  const {
    data: certificates = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 60_000,
  });

  /* ---------- Filter client-side ---------- */
  const normalizedKeyword = keyword.trim().toLowerCase();
  const visible = normalizedKeyword
    ? certificates.filter(
        (c) =>
          c.certificateName.toLowerCase().includes(normalizedKeyword) ||
          (c.description ?? '').toLowerCase().includes(normalizedKeyword),
      )
    : certificates;

  const totalParts = certificates.reduce(
    (sum, c) => sum + (c.partCount ?? 0),
    0,
  );
  const updatedRecently = certificates.filter((c) => {
    if (!c.lastUpdated) return false;
    const diff = Date.now() - new Date(c.lastUpdated).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const hasFilter = Boolean(normalizedKeyword);

  const resetFilters = () => setKeyword('');

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.certificates });

  return (
    <div className="space-y-6">
      {/* ============ 1. STATS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
        <StatCard
          title="Tổng chứng chỉ"
          value={certificates.length.toLocaleString('vi-VN')}
          subtext="Toàn hệ thống"
          icon={Award}
          colorScheme="blue"
          trendPoints={[3, 4, 4, 5, 6, 6, 7, certificates.length || 7]}
        />
        <StatCard
          title="Tổng kỹ năng"
          value={totalParts.toLocaleString('vi-VN')}
          subtext="Tổng các phần"
          icon={Layers3}
          colorScheme="emerald"
          trendPoints={[8, 10, 12, 14, 16, 18, 20, totalParts || 20]}
        />
        <StatCard
          title="Cập nhật 7 ngày"
          value={updatedRecently.toLocaleString('vi-VN')}
          subtext="Chứng chỉ"
          icon={CalendarClock}
          colorScheme="amber"
          trendPoints={[1, 2, 1, 3, 2, 3, 4, updatedRecently || 4]}
        />
        <StatCard
          title="Đang hiển thị"
          value={visible.length.toLocaleString('vi-VN')}
          subtext={hasFilter ? 'Sau khi lọc' : 'Tất cả'}
          icon={BookMarked}
          colorScheme="purple"
          trendPoints={[6, 6, 7, 7, 7, 8, 8, visible.length || 8]}
        />
      </div>

      {/* ============ 2. TITLE BAR ============ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quản lý chứng chỉ
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Danh mục chứng chỉ và các kỹ năng (IELTS, TOEIC, VSTEP…).
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center border border-slate-200 rounded-xl p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-white shadow-2xs text-[#0052CC]'
                  : 'text-slate-400 hover:text-slate-600',
              )}
              title="Dạng lưới"
              aria-label="Dạng lưới"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                viewMode === 'table'
                  ? 'bg-white shadow-2xs text-[#0052CC]'
                  : 'text-slate-400 hover:text-slate-600',
              )}
              title="Dạng bảng"
              aria-label="Dạng bảng"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <Button
            variant="primary"
            size="md"
            leftIcon={Plus}
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            Tạo chứng chỉ
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
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên hoặc mô tả chứng chỉ…"
              className="bg-transparent outline-none w-full text-slate-700 text-sm placeholder:text-slate-400"
              aria-label="Tìm chứng chỉ"
            />
          </div>

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
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      ) : certificates.length === 0 ? (
        <EmptyState
          title="Chưa có chứng chỉ nào"
          description="Tạo chứng chỉ đầu tiên (IELTS, TOEIC, VSTEP…) để gắn vào khóa học."
          actionLabel="Tạo chứng chỉ"
          onAction={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Không tìm thấy chứng chỉ phù hợp"
          description="Thử xoá bớt từ khoá tìm kiếm."
          actionLabel="Đặt lại bộ lọc"
          onAction={resetFilters}
        />
      ) : viewMode === 'table' ? (
        <CertificateTable
          certificates={visible}
          onView={(c) => setDetailId(c.certificateId)}
          onEdit={(c) => {
            setEditing(c);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visible.map((c) => (
            <CertificateCard
              key={c.certificateId}
              certificate={c}
              onView={(x) => setDetailId(x.certificateId)}
              onEdit={(x) => {
                setEditing(x);
                setIsFormOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* ============ MODALS ============ */}
      <CertificateFormModal
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        editing={editing}
        onSaved={() => {
          invalidate();
          toast.success(
            editing ? 'Đã cập nhật chứng chỉ' : 'Đã tạo chứng chỉ mới',
          );
        }}
      />

      <CertificateDetailModal
        certificateId={detailId}
        onClose={() => setDetailId(null)}
      />
    </div>
  );
};

/* =========================================================
 * Table view
 * ========================================================= */
const CertificateTable: React.FC<{
  certificates: CertificateDto[];
  onView: (c: CertificateDto) => void;
  onEdit: (c: CertificateDto) => void;
}> = ({ certificates, onView, onEdit }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
            <th className="py-3.5 px-4 font-bold">Chứng chỉ</th>
            <th className="py-3.5 px-3 font-bold">Kỹ năng</th>
            <th className="py-3.5 px-3 font-bold">Ngày tạo</th>
            <th className="py-3.5 px-3 font-bold">Cập nhật</th>
            <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {certificates.map((c) => (
            <tr
              key={c.certificateId}
              className="hover:bg-slate-50/60 transition-colors"
            >
              <td className="py-3 px-4 max-w-[320px]">
                <span className="font-bold text-slate-900 block truncate">
                  {c.certificateName}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {c.description ?? 'Chưa có mô tả'}
                </span>
              </td>
              <td className="py-3 px-3">
                <Badge variant="primary" size="sm" icon={Layers3}>
                  {c.partCount ?? 0} phần
                </Badge>
              </td>
              <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                {c.createdAt ? formatDate(c.createdAt) : '—'}
              </td>
              <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                {c.lastUpdated ? formatDate(c.lastUpdated) : '—'}
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onView(c)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
                    title="Xem chi tiết"
                    aria-label="Xem chi tiết"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Sửa chứng chỉ"
                    aria-label="Sửa chứng chỉ"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* =========================================================
 * Grid view
 * ========================================================= */
const CertificateCard: React.FC<{
  certificate: CertificateDto;
  onView: (c: CertificateDto) => void;
  onEdit: (c: CertificateDto) => void;
}> = ({ certificate, onView, onEdit }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
    <div className="relative h-24 bg-gradient-to-r from-[#0052CC] to-indigo-700 p-4 flex items-start justify-between text-white">
      <div className="min-w-0">
        <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md font-extrabold text-[10px] uppercase tracking-wider">
          Certificate
        </span>
        <p className="text-[11px] opacity-80 mt-1 font-mono truncate">
          {certificate.certificateId.slice(0, 8)}
        </p>
      </div>
      <Badge variant="success" size="sm">
        {certificate.partCount ?? 0} phần
      </Badge>
    </div>

    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
      <div>
        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0052CC] transition-colors leading-snug line-clamp-2">
          {certificate.certificateName}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
          {certificate.description ?? 'Chưa có mô tả'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-[10px] font-bold">
        <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-slate-100 text-slate-600">
          <CalendarClock className="w-3 h-3" />
          {certificate.createdAt
            ? formatDate(certificate.createdAt)
            : 'Chưa có ngày tạo'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="text-[10px] uppercase font-bold text-slate-400">
          Cập nhật
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onView(certificate)}
            className="p-2 rounded-xl text-slate-500 hover:text-[#0052CC] hover:bg-slate-100 transition-colors"
            title="Xem chi tiết"
            aria-label="Xem chi tiết"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onEdit(certificate)}
            className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
            title="Sửa chứng chỉ"
            aria-label="Sửa chứng chỉ"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* =========================================================
 * Modal: Create / Edit certificate
 * ========================================================= */
const CertificateFormModal: React.FC<{
  open: boolean;
  onClose: () => void;
  editing: CertificateDto | null;
  onSaved: () => void;
}> = ({ open, onClose, editing, onSaved }) => {
  const toast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parts, setParts] = useState<PartForm[]>([]);
  const [touched, setTouched] = useState(false);

  // Nạp dữ liệu chứng chỉ đang sửa (1 lần cho mỗi lần mở)
  const loadedFor = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!open) {
      loadedFor.current = null;
      return;
    }
    const id = editing?.certificateId ?? 'new';
    if (loadedFor.current === id) return;
    loadedFor.current = id;
    setTouched(false);
    setName(editing?.certificateName ?? '');
    setDescription(editing?.description ?? '');
    setParts([]);
  }, [open, editing]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateCertificatePayload) => createCertificate(payload),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Tạo thất bại'),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCertificatePayload;
    }) => updateCertificate(id, payload),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Cập nhật thất bại'),
  });

  /* ---------- Validate ---------- */
  const nameError = !name.trim()
    ? 'Tên chứng chỉ là bắt buộc'
    : name.trim().length > 255
      ? 'Tối đa 255 ký tự'
      : '';

  const partErrors = parts.map((p) => {
    if (!p.partName.trim()) return 'Tên phần là bắt buộc';
    if (p.partName.trim().length > 255) return 'Tối đa 255 ký tự';
    if (p.properties.trim()) {
      try {
        JSON.parse(p.properties);
      } catch {
        return 'Properties phải là JSON hợp lệ';
      }
    }
    return '';
  });

  const hasError = Boolean(nameError) || partErrors.some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;

    if (editing) {
      // UpdateCertificateRequest chỉ có certificateName + description
      updateMutation.mutate({
        id: editing.certificateId,
        payload: {
          certificateName: name.trim(),
          description: description.trim() || undefined,
        },
      });
      return;
    }

    const payload: CreateCertificatePayload = {
      certificateName: name.trim(),
      description: description.trim() || undefined,
      parts: parts
        .filter((p) => p.partName.trim())
        .map((p) => ({
          partName: p.partName.trim(),
          partDescription: p.partDescription.trim() || undefined,
          properties: p.properties.trim() || undefined,
        })),
    };
    createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (!open) return null;

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editing ? 'Cập nhật chứng chỉ' : 'Tạo chứng chỉ mới'}
            </h3>
            <p className="text-xs text-slate-500">
              {editing
                ? editing.certificateName
                : 'Thiết lập thông tin chứng chỉ và các kỹ năng'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <Field
          label="Tên chứng chỉ"
          required
          error={touched ? nameError : ''}
        >
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: IELTS, TOEIC, VSTEP"
            className={inputCls(Boolean(touched && nameError))}
          />
        </Field>

        <Field label="Mô tả">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả ngắn về chứng chỉ…"
            className={cn(inputCls(false), 'h-auto py-2 resize-none')}
          />
        </Field>

        {/* ---------- Kỹ năng (chỉ khi tạo mới) ---------- */}
        {!editing && (
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Kỹ năng / phần của chứng chỉ
              </p>
              <button
                type="button"
                onClick={() => setParts((p) => [...p, emptyPart()])}
                className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 text-[11px] font-bold text-[#0052CC] hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm kỹ năng
              </button>
            </div>

            {parts.length === 0 ? (
              <p className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl py-4 text-center">
                Chưa có kỹ năng nào. Bấm “Thêm kỹ năng” để tạo (VD: Listening,
                Reading, Writing, Speaking).
              </p>
            ) : (
              <ul className="space-y-2.5">
                {parts.map((part, idx) => (
                  <li
                    key={part.key}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-[#0052CC] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={part.partName}
                        onChange={(e) =>
                          setParts((prev) =>
                            prev.map((p) =>
                              p.key === part.key
                                ? { ...p, partName: e.target.value }
                                : p,
                            ),
                          )
                        }
                        placeholder="Tên kỹ năng (VD: Listening)"
                        className={inputCls(Boolean(touched && partErrors[idx]))}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setParts((prev) =>
                            prev.filter((p) => p.key !== part.key),
                          )
                        }
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                        title="Xoá kỹ năng"
                        aria-label="Xoá kỹ năng"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={part.partDescription}
                      onChange={(e) =>
                        setParts((prev) =>
                          prev.map((p) =>
                            p.key === part.key
                              ? { ...p, partDescription: e.target.value }
                              : p,
                          ),
                        )
                      }
                      placeholder="Mô tả ngắn (không bắt buộc)"
                      className={inputCls(false)}
                    />

                    <textarea
                      rows={2}
                      value={part.properties}
                      onChange={(e) =>
                        setParts((prev) =>
                          prev.map((p) =>
                            p.key === part.key
                              ? { ...p, properties: e.target.value }
                              : p,
                          ),
                        )
                      }
                      placeholder='{"band": "7.0"} — JSON tuỳ chọn'
                      className={cn(
                        inputCls(Boolean(touched && partErrors[idx])),
                        'h-auto py-2 resize-none font-mono text-[11px]',
                      )}
                    />

                    {touched && partErrors[idx] && (
                      <p className="text-[11px] text-rose-500">
                        {partErrors[idx]}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {editing && (
          <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            Backend hiện chỉ hỗ trợ cập nhật <strong>tên</strong> và{' '}
            <strong>mô tả</strong> của chứng chỉ. Muốn đổi danh sách kỹ năng,
            hãy tạo chứng chỉ mới.
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
            isLoading={isPending}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
          >
            {editing ? 'Lưu thay đổi' : 'Tạo chứng chỉ'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

/* =========================================================
 * Modal: Certificate detail (danh sách kỹ năng)
 * ========================================================= */
const CertificateDetailModal: React.FC<{
  certificateId: string | null;
  onClose: () => void;
}> = ({ certificateId, onClose }) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificate(certificateId ?? ''),
    queryFn: () => fetchCertificateById(certificateId!),
    enabled: Boolean(certificateId),
  });

  if (!certificateId) return null;

  const parts = data?.parts ?? [];

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Chi tiết chứng chỉ
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {data?.certificateName ?? 'Đang tải…'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 pt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          className="mt-2"
        />
      ) : (
        <>
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1 mt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC]">
              Certificate
            </span>
            <h4 className="font-extrabold text-slate-900 text-base">
              {data?.certificateName}
            </h4>
            {data?.description && (
              <p className="text-xs text-slate-600">{data.description}</p>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-3 text-xs mt-2">
            <DetailCell
              label="Mã chứng chỉ"
              value={data?.certificateId ?? '—'}
              mono
            />
            <DetailCell
              label="Số kỹ năng"
              value={`${data?.partCount ?? parts.length}`}
              accent
            />
            <DetailCell
              label="Ngày tạo"
              value={data?.createdAt ? formatDate(data.createdAt) : '—'}
            />
            <DetailCell
              label="Cập nhật"
              value={data?.lastUpdated ? formatDate(data.lastUpdated) : '—'}
            />
          </dl>

          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Kỹ năng ({parts.length})
            </p>
            {parts.length === 0 ? (
              <p className="text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl py-6 text-center">
                Chứng chỉ này chưa có kỹ năng nào.
              </p>
            ) : (
              <ul className="space-y-2">
                {parts.map((part) => (
                  <li
                    key={part.partId}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-[#0052CC] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {part.partOrder ?? '·'}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {part.partName}
                      </span>
                    </div>
                    {part.partDescription && (
                      <p className="text-[11px] text-slate-500 mt-1.5 pl-8">
                        {part.partDescription}
                      </p>
                    )}
                    {part.properties && (
                      <pre className="mt-2 ml-8 p-2 rounded-lg bg-slate-900 text-emerald-300 text-[10px] overflow-x-auto">
                        {JSON.stringify(part.properties, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={onClose}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold mt-5"
          >
            Đóng
          </Button>
        </>
      )}
    </ModalShell>
  );
};

/* =========================================================
 * Shared form atoms
 * ========================================================= */
const inputCls = (invalid: boolean) =>
  cn(
    'w-full h-10 px-3 rounded-xl border text-sm outline-none transition-colors',
    'placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400',
    invalid
      ? 'border-rose-300 focus:border-rose-400'
      : 'border-slate-200 focus:border-[#0052CC]',
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

const DetailCell: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}> = ({ label, value, mono, accent }) => (
  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
    <dt className="text-slate-400 font-semibold uppercase text-[10px]">{label}</dt>
    <dd
      className={cn(
        'font-bold mt-1 truncate',
        mono && 'font-mono',
        accent ? 'text-[#0052CC]' : 'text-slate-800',
      )}
    >
      {value}
    </dd>
  </div>
);

const ModalShell: React.FC<{
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}> = ({ children, onClose, maxWidth = 'max-w-lg' }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    onClick={onClose}
    role="presentation"
  >
    <div
      className={cn(
        'bg-white rounded-3xl w-full p-6 shadow-2xl border border-slate-100',
        'max-h-[90vh] overflow-y-auto',
        maxWidth,
      )}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  </div>
);

export default CertificateManagementView;
