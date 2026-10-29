/**
 * CertificateManagementView — Quản trị chứng chỉ (route `/admin/certificates`)
 * -----------------------------------------------------------
 * Hỗ trợ nhiều loại chứng chỉ: VSTEP.3–5, IELTS, TOEIC L&R, TOEIC S&W,
 * TOEFL iBT (cũ/mới), APTIS, CEFR, Thang 100, Tuỳ chỉnh.
 *
 * Preset chỉ là MẪU THAM KHẢO — admin tự quyết định toàn bộ giá trị.
 * Không hard-code tỷ lệ khi chọn thang điểm.
 *
 * CRUD đầy đủ:
 *   - Create (Tạo chứng chỉ + cấu hình kỹ năng)
 *   - Read (Danh sách dạng bảng/lưới + Modal xem chi tiết)
 *   - Update (Chỉnh sửa thông tin + cập nhật thang điểm & kỹ năng)
 *   - Delete (Xoá chứng chỉ có hộp thoại xác nhận)
 *
 * Layout giữ nguyên AdminLayout: bo góc 16-24px, viền slate-200/80, font Be Vietnam Pro, màu nhấn #0052CC.
 */

import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StatCard } from '@/portals/admin/components/StatCard';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import {
  AlertCircle,
  Award,
  BookMarked,
  Calculator,
  CalendarClock,
  CheckCircle2,
  Eye,
  Gauge,
  Info,
  Layers3,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { cn } from '@/shared/utils';
import { formatDate } from '@/shared/utils/format';
import {
  createCertificate,
  deleteCertificate,
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
import {
  CERTIFICATE_PRESETS,
  DEFAULT_CERTIFICATE_SCORING,
  type CertificatePreset,
  type CertificateScoringSystem,
  formatScoringSummary,
  getCertificateScoring,
  getDisplayDescription,
  getPartScoreInfo,
  parseCertificateMeta,
  serializeCertificateDescription,
  TOEFL_NEW_TO_OLD_120_SCALE,
  validateSkillScores,
} from './certificateScoring';

/* =========================================================
 * Types nội bộ cho Form
 * ========================================================= */

interface PartForm {
  key: string;
  partName: string;
  partDescription: string;
  minScore: string;
  maxScore: string;
  step: string;
  weight: string;
  /** Kỹ năng không tính vào điểm tổng (VD: Aptis Grammar & Vocabulary). */
  excludeFromTotal: boolean;
}

const createEmptyPart = (defaultMin = '0', defaultMax = '10', defaultStep = '0.5'): PartForm => ({
  key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  partName: '',
  partDescription: '',
  minScore: defaultMin,
  maxScore: defaultMax,
  step: defaultStep,
  weight: '',
  excludeFromTotal: false,
});

/* =========================================================
 * View chính
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
  const [deleteTarget, setDeleteTarget] = useState<CertificateDto | null>(null);

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
    ? certificates.filter((c) => {
        const desc = getDisplayDescription(c).toLowerCase();
        return (
          c.certificateName.toLowerCase().includes(normalizedKeyword) ||
          desc.includes(normalizedKeyword)
        );
      })
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

  /* ---------- Delete Mutation ---------- */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCertificate(id),
    onSuccess: () => {
      toast.success('Đã xoá chứng chỉ thành công');
      setDeleteTarget(null);
      invalidate();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Xoá chứng chỉ thất bại');
    },
  });

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
          subtext="Tổng các phần thi"
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Award className="w-7 h-7 text-[#0052CC]" />
            Quản lý chứng chỉ
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Danh mục chứng chỉ tiếng Anh — chọn thang điểm tham khảo và tự cấu hình theo nhu cầu.
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
              placeholder="Tìm theo tên hoặc mô tả chứng chỉ (IELTS, VSTEP, TOEIC…)…"
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
          description="Tạo chứng chỉ đầu tiên (VSTEP, IELTS, TOEIC…) với thang điểm tham khảo để gắn vào khóa học."
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
          onDelete={(c) => setDeleteTarget(c)}
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
              onDelete={(x) => setDeleteTarget(x)}
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
            editing ? 'Đã cập nhật chứng chỉ' : 'Đã tạo chứng chỉ mới thành công',
          );
        }}
      />

      <CertificateDetailModal
        certificateId={detailId}
        onClose={() => setDetailId(null)}
        onSaved={() => invalidate()}
      />

      {/* ============ CONFIRM DELETE DIALOG ============ */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoá chứng chỉ"
        description={`Bạn có chắc chắn muốn xoá chứng chỉ "${deleteTarget?.certificateName}"? Hành động này sẽ xoá toàn bộ kỹ năng thành phần liên kết.`}
        confirmLabel="Xác nhận xoá"
        cancelLabel="Huỷ"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.certificateId);
          }
        }}
        onClose={() => setDeleteTarget(null)}
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
  onDelete: (c: CertificateDto) => void;
}> = ({ certificates, onView, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider text-left">
            <th className="py-3.5 px-4 font-bold">Chứng chỉ</th>
            <th className="py-3.5 px-3 font-bold">Thang điểm Core</th>
            <th className="py-3.5 px-3 font-bold">Hình thức tính</th>
            <th className="py-3.5 px-3 font-bold">Kỹ năng</th>
            <th className="py-3.5 px-3 font-bold">Ngày tạo</th>
            <th className="py-3.5 px-4 font-bold text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {certificates.map((c) => {
            const scoring = getCertificateScoring(c);
            const displayDesc = getDisplayDescription(c);
            const isAverage = scoring.scaleType === 'AVERAGE';
            const isIndependent = scoring.scaleType === 'INDEPENDENT';
            const hasParts = (c.partCount ?? 0) > 0;

            return (
              <tr
                key={c.certificateId}
                className="hover:bg-slate-50/60 transition-colors"
              >
                <td className="py-3 px-4 max-w-[280px]">
                  <span className="font-bold text-slate-900 block truncate">
                    {c.certificateName}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {displayDesc || 'Chưa có mô tả'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border',
                      isAverage
                        ? 'bg-blue-50/80 text-blue-700 border-blue-200/80'
                        : isIndependent
                          ? 'bg-purple-50/80 text-purple-700 border-purple-200/80'
                          : 'bg-emerald-50/80 text-emerald-700 border-emerald-200/80',
                    )}
                  >
                    <Gauge className="w-3.5 h-3.5 shrink-0" />
                    {scoring.minScore} - {scoring.maxScore} {scoring.unit}
                  </span>
                </td>
                <td className="py-3 px-3">
                  <span className="text-[11px] font-semibold text-slate-600">
                    {isAverage
                      ? scoring.roundingRule === 'IELTS'
                        ? 'TB cộng (Làm tròn IELTS)'
                        : 'TB cộng (Làm tròn 0.5)'
                      : isIndependent
                        ? 'Từng phần độc lập (Không cộng)'
                        : 'Tổng điểm các phần'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {hasParts ? (
                    <Badge variant="primary" size="sm" icon={Layers3}>
                      {c.partCount} phần
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" icon={Layers3}>
                      0 phần (Bấm xem để nạp)
                    </Badge>
                  )}
                </td>
                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                  {c.createdAt ? formatDate(c.createdAt) : '—'}
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
                    <button
                      type="button"
                      onClick={() => onDelete(c)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Xoá chứng chỉ"
                      aria-label="Xoá chứng chỉ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
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
  onDelete: (c: CertificateDto) => void;
}> = ({ certificate, onView, onEdit, onDelete }) => {
  const scoring = getCertificateScoring(certificate);
  const displayDesc = getDisplayDescription(certificate);
  const hasParts = (certificate.partCount ?? 0) > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group">
      <div className="relative h-24 bg-gradient-to-r from-[#0052CC] via-indigo-600 to-indigo-700 p-4 flex items-start justify-between text-white">
        <div className="min-w-0">
          <span className="inline-block px-2.5 py-0.5 rounded-md bg-white/20 backdrop-blur-md font-extrabold text-[10px] uppercase tracking-wider">
            Certificate
          </span>
          <p className="text-[11px] opacity-80 mt-1 font-mono truncate">
            {certificate.certificateId.slice(0, 8)}
          </p>
        </div>
        <Badge variant={hasParts ? 'success' : 'warning'} size="sm">
          {hasParts ? `${certificate.partCount} phần` : '0 phần (Cần nạp)'}
        </Badge>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-base text-slate-900 group-hover:text-[#0052CC] transition-colors leading-snug line-clamp-2">
            {certificate.certificateName}
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
            {displayDesc || 'Chưa có mô tả'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
          <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg bg-blue-50 text-[#0052CC] border border-blue-200/70">
            <Gauge className="w-3.5 h-3.5" />
            {formatScoringSummary(scoring)}
          </span>
          <span className="inline-flex items-center gap-1 h-6 px-2.5 rounded-lg bg-slate-100 text-slate-600">
            <CalendarClock className="w-3.5 h-3.5" />
            {certificate.createdAt
              ? formatDate(certificate.createdAt)
              : 'Chưa có ngày tạo'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Thao tác
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
            <button
              type="button"
              onClick={() => onDelete(certificate)}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
              title="Xoá chứng chỉ"
              aria-label="Xoá chứng chỉ"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
 * Modal: Create / Edit certificate with Core Scoring & Skills
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
  const [scoring, setScoring] = useState<CertificateScoringSystem>({
    ...DEFAULT_CERTIFICATE_SCORING,
  });
  const [parts, setParts] = useState<PartForm[]>([]);
  const [touched, setTouched] = useState(false);

  // Nạp dữ liệu khi mở modal
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

    if (editing) {
      setName(editing.certificateName ?? '');
      const meta = parseCertificateMeta(editing.description);
      setDescription(meta.description);
      const certScoring = getCertificateScoring(editing);
      setScoring(certScoring);

      // Nếu chứng chỉ đang sửa đã có parts thì nạp parts
      if (editing.parts && editing.parts.length > 0) {
        setParts(
          editing.parts.map((p) => {
            const info = getPartScoreInfo(p.properties);
            return {
              key: p.partId || `${Date.now()}-${Math.random()}`,
              partName: p.partName,
              partDescription: p.partDescription ?? '',
              minScore: String(info.minScore ?? certScoring.minScore),
              maxScore: String(info.maxScore ?? certScoring.maxScore),
              step: String(info.step ?? certScoring.step),
              weight: info.weight ? String(info.weight) : '',
              excludeFromTotal: info.excludeFromTotal,
            };
          }),
        );
      } else {
        // Chứng chỉ chưa có parts trong DB -> tạo một dòng trống để admin tự nhập
        setParts([
          createEmptyPart(
            String(certScoring.minScore),
            String(certScoring.maxScore),
            String(certScoring.step),
          ),
        ]);
      }
    } else {
      // Tạo mới: khởi tạo form trống với thang điểm mặc định
      setName('');
      setDescription('');
      setScoring({ ...DEFAULT_CERTIFICATE_SCORING });
      setParts([
        createEmptyPart(
          String(DEFAULT_CERTIFICATE_SCORING.minScore),
          String(DEFAULT_CERTIFICATE_SCORING.maxScore),
          String(DEFAULT_CERTIFICATE_SCORING.step),
        ),
      ]);
    }
  }, [open, editing]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateCertificatePayload) => createCertificate(payload),
    onSuccess: () => {
      onSaved();
      onClose();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : 'Tạo chứng chỉ thất bại'),
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

  /* ---------- Validation ---------- */
  const nameError = !name.trim()
    ? 'Tên chứng chỉ là bắt buộc'
    : name.trim().length > 255
      ? 'Tối đa 255 ký tự'
      : '';

  const scoringScaleError =
    scoring.maxScore <= scoring.minScore
      ? 'Điểm tối đa phải lớn hơn điểm tối thiểu'
      : scoring.maxScore <= 0
        ? 'Điểm tối đa phải là số dương'
        : '';

  // Validate toàn bộ kỹ năng so với thang điểm core của chứng chỉ
  const skillValidation = validateSkillScores(scoring, parts);

  const partNameErrors = parts.map((p) => {
    if (!p.partName.trim()) return 'Tên kỹ năng là bắt buộc';
    if (p.partName.trim().length > 255) return 'Tối đa 255 ký tự';
    return '';
  });

  const partsEmptyError =
    parts.length === 0 ? 'Cần thêm ít nhất một kỹ năng cho chứng chỉ' : '';

  const hasFormError =
    Boolean(nameError) ||
    Boolean(scoringScaleError) ||
    Boolean(partsEmptyError) ||
    Boolean(skillValidation.globalError) ||
    partNameErrors.some(Boolean) ||
    !skillValidation.isValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasFormError) {
      toast.error('Vui lòng kiểm tra lại thông tin thang điểm và kỹ năng');
      return;
    }

    const serializedDesc = serializeCertificateDescription(description, {
      ...scoring,
      preset: scoring.preset ?? 'CUSTOM',
    });

    const mappedParts = parts.map((p) => {
      const minVal = parseFloat(p.minScore) || scoring.minScore;
      const maxVal = parseFloat(p.maxScore) || scoring.maxScore;
      const stepVal = parseFloat(p.step) || scoring.step;
      const weightVal = p.weight ? parseFloat(p.weight) : undefined;

      const propertiesObj = {
        minScore: minVal,
        maxScore: maxVal,
        step: stepVal,
        weight: weightVal,
        scaleType: scoring.scaleType,
        unit: scoring.unit,
        excludeFromTotal: p.excludeFromTotal || undefined,
      };

      return {
        partName: p.partName.trim(),
        partDescription: p.partDescription.trim() || undefined,
        properties: JSON.stringify(propertiesObj),
      };
    });

    if (editing) {
      updateMutation.mutate({
        id: editing.certificateId,
        payload: {
          certificateName: name.trim(),
          description: serializedDesc,
          parts: mappedParts,
        },
      });
      return;
    }

    const payload: CreateCertificatePayload = {
      certificateName: name.trim(),
      description: serializedDesc,
      parts: mappedParts,
    };

    createMutation.mutate(payload);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isSumMode = scoring.scaleType === 'SUM';
  const isAverageMode = scoring.scaleType === 'AVERAGE';
  const isIndependentMode = scoring.scaleType === 'INDEPENDENT';

  if (!open) return null;

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editing ? 'Cập nhật chứng chỉ & Kỹ năng' : 'Tạo chứng chỉ mới'}
            </h3>
            <p className="text-xs text-slate-500">
              {editing
                ? editing.certificateName
                : 'Thiết lập thang điểm và cấu hình các kỹ năng thành phần'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 pt-3">
        {/* ============ THÔNG TIN CHỨNG CHỈ ============ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              placeholder="VD: VSTEP.3–5, IELTS Academic, TOEIC Listening & Reading"
              className={inputCls(Boolean(touched && nameError))}
            />
          </Field>

          <Field label="Mô tả chứng chỉ">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả tóm tắt về chứng chỉ…"
              className={inputCls(false)}
            />
          </Field>
        </div>

        {/* ============ CORE ĐIỂM CHỨNG CHỈ (SCORING SCALE) ============ */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 border border-blue-100/80 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100/80 text-[#0052CC]">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Thang điểm chứng chỉ
                </h4>
                <p className="text-[11px] text-slate-500">
                  Thiết lập khung điểm và phương thức tính toán. Bạn tự quyết định các giá trị này.
                </p>
              </div>
            </div>

            <Badge
              variant={isAverageMode ? 'primary' : isIndependentMode ? 'warning' : 'success'}
              size="sm"
              icon={Calculator}
            >
              {isAverageMode
                ? scoring.roundingRule === 'IELTS'
                  ? 'TB (Làm tròn IELTS)'
                  : 'TB (Làm tròn 0.5)'
                : isIndependentMode
                  ? 'Độc lập (Không cộng)'
                  : 'Tổng điểm các phần'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Hình thức tính điểm */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Phương thức tính điểm <span className="text-rose-500">*</span>
              </label>
              <select
                value={scoring.scaleType}
                onChange={(e) => {
                  const newType = e.target.value as 'AVERAGE' | 'SUM' | 'INDEPENDENT';
                  setScoring((prev) => ({
                    ...prev,
                    scaleType: newType,
                    preset: 'CUSTOM',
                  }));
                }}
                className={cn(inputCls(false), 'bg-white cursor-pointer')}
              >
                <option value="AVERAGE">
                  Trung bình cộng các kỹ năng (Ví dụ: VSTEP.3–5, IELTS)
                </option>
                <option value="SUM">
                  Tổng điểm các kỹ năng (Ví dụ: TOEIC L&amp;R, TOEFL iBT)
                </option>
                <option value="INDEPENDENT">
                  Từng kỹ năng độc lập, không cộng tổng (Ví dụ: TOEIC S&amp;W)
                </option>
              </select>
            </div>

            {/* Đơn vị tính */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Đơn vị điểm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={scoring.unit}
                onChange={(e) => {
                  setScoring((prev) => ({
                    ...prev,
                    unit: e.target.value,
                    preset: 'CUSTOM',
                  }));
                }}
                placeholder="VD: Band, Điểm, %"
                className={inputCls(false)}
              />
            </div>

            {/* Bước nhảy */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Bước nhảy (Step)
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={scoring.step}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0.5;
                  setScoring((prev) => ({
                    ...prev,
                    step: val,
                    preset: 'CUSTOM',
                  }));
                }}
                className={inputCls(false)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Điểm tối thiểu */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Điểm tối thiểu chứng chỉ
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={scoring.minScore}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setScoring((prev) => ({
                    ...prev,
                    minScore: val,
                    preset: 'CUSTOM',
                  }));
                }}
                className={inputCls(false)}
              />
            </div>

            {/* Điểm tối đa (Thang điểm) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Điểm tối đa chứng chỉ (Thang điểm) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="1"
                value={scoring.maxScore}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 10;
                  setScoring((prev) => ({
                    ...prev,
                    maxScore: val,
                    preset: 'CUSTOM',
                  }));
                }}
                className={inputCls(Boolean(touched && scoringScaleError))}
              />
              {touched && scoringScaleError && (
                <p className="text-[11px] text-rose-500 mt-1">{scoringScaleError}</p>
              )}
            </div>
          </div>

          {/* Giải thích quy tắc tính điểm chuẩn */}
          <div className="p-3 rounded-xl bg-white/90 border border-blue-200/70 text-slate-600 text-[11px] space-y-1.5">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0052CC] shrink-0 mt-0.5" />
              <div>
                {isAverageMode ? (
                  <span>
                    <strong>Quy tắc Trung bình cộng:</strong> Thang điểm từ{' '}
                    <span className="font-bold text-[#0052CC]">{scoring.minScore}</span> đến{' '}
                    <span className="font-bold text-[#0052CC]">
                      {scoring.maxScore} {scoring.unit}
                    </span>
                    .{' '}
                    {scoring.roundingRule === 'VSTEP'
                      ? 'Làm tròn theo quy định Bộ GD&ĐT (đến 0.5 điểm gần nhất: <.25 về .0, [.25, .75) thành .5, >=.75 lên 1.0). Xác định bậc dựa trên điểm TB 4 kỹ năng.'
                      : scoring.roundingRule === 'IELTS'
                        ? 'Làm tròn theo quy định chính thức IELTS (<.25 xuống số nguyên, [.25, .75) thành .5, >=.75 lên số nguyên tiếp theo).'
                        : 'Mỗi kỹ năng thành phần bắt buộc phải có thang điểm tối đa bằng thang điểm chứng chỉ.'}
                  </span>
                ) : isSumMode ? (
                  <span>
                    <strong>Quy tắc Tổng điểm:</strong> Thang điểm từ{' '}
                    <span className="font-bold text-emerald-700">{scoring.minScore}</span> đến{' '}
                    <span className="font-bold text-emerald-700">
                      {scoring.maxScore} {scoring.unit}
                    </span>
                    . <strong>Tổng điểm tối đa của tất cả các kỹ năng</strong> phải bằng đúng{' '}
                    <span className="font-bold text-emerald-700">
                      {scoring.maxScore} {scoring.unit}
                    </span>
                    .
                  </span>
                ) : (
                  <span>
                    <strong>Quy tắc Độc lập (Không cộng tổng):</strong> Mỗi kỹ năng được đánh giá
                    độc lập từ{' '}
                    <span className="font-bold text-purple-700">{scoring.minScore}</span> đến{' '}
                    <span className="font-bold text-purple-700">
                      {scoring.maxScore} {scoring.unit}
                    </span>
                    . <strong>Không cộng điểm các kỹ năng để tạo thành điểm tổng</strong>.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============ CẤU HÌNH KỸ NĂNG (PARTS) ============ */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers3 className="w-4 h-4 text-[#0052CC]" />
                Kỹ năng thành phần ({parts.length})
              </p>
              <p className="text-[11px] text-slate-400">
                Thiết lập từng kỹ năng và điểm số tương ứng với core điểm chứng chỉ.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setParts((prev) => [
                  ...prev,
                  createEmptyPart(
                    String(scoring.minScore),
                    isAverageMode || isIndependentMode
                      ? String(scoring.maxScore)
                      : parts.length > 0
                        ? String(Math.max(0, scoring.maxScore - skillValidation.currentTotal))
                        : String(scoring.maxScore),
                    String(scoring.step),
                  ),
                ])
              }
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 text-xs font-bold text-[#0052CC] bg-blue-50/50 hover:bg-blue-100/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm kỹ năng
            </button>
          </div>

          {/* Thanh đối soát tổng điểm (Nếu là SUM mode) */}
          {isSumMode && parts.length > 0 && (
            <div
              className={cn(
                'p-3 rounded-xl border transition-colors flex flex-col gap-1.5',
                skillValidation.globalError
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : !skillValidation.globalWarning
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/70 border-amber-200 text-amber-900',
              )}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  {skillValidation.globalError ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : !skillValidation.globalWarning ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  Tổng điểm kỹ năng hiện tại:
                </span>
                <span className="font-mono text-sm">
                  {skillValidation.currentTotal} / {scoring.maxScore} {scoring.unit}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-300',
                    skillValidation.globalError
                      ? 'bg-rose-500'
                      : !skillValidation.globalWarning
                        ? 'bg-emerald-500'
                        : skillValidation.currentTotal > scoring.maxScore
                          ? 'bg-rose-500'
                          : 'bg-amber-500',
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      (skillValidation.currentTotal / (scoring.maxScore || 1)) * 100,
                    )}%`,
                  }}
                />
              </div>

              {/* Ghi chú tình trạng */}
              <div className="flex items-center justify-between text-[11px]">
                <span>
                  {skillValidation.globalError ? (
                    <span className="text-rose-700 font-semibold">
                      ✕ {skillValidation.globalError}
                    </span>
                  ) : !skillValidation.globalWarning ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Tổng điểm các kỹ năng khớp với thang điểm chứng chỉ ({scoring.maxScore} {scoring.unit}).
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">
                      {skillValidation.globalWarning}
                    </span>
                  )}
                </span>
                <span className="font-bold shrink-0 ml-2">
                  {((skillValidation.currentTotal / (scoring.maxScore || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Thông báo độc lập cho TOEIC S&W */}
          {isIndependentMode && (
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Điểm của Speaking và Writing hoàn toàn độc lập, thang 0–200 điểm/kỹ năng.
                Hệ thống <strong>không cộng tổng điểm 2 kỹ năng này</strong> theo đúng quy định khảo thí của ETS.
              </span>
            </div>
          )}

          {/* Lỗi cấu hình thang điểm — chặn lưu */}
          {touched && skillValidation.globalError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{skillValidation.globalError}</span>
            </div>
          )}

          {/* Cảnh báo nếu có */}
          {touched && skillValidation.globalWarning && !isSumMode && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{skillValidation.globalWarning}</span>
            </div>
          )}

          {parts.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center space-y-2">
              <Layers3 className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Chưa có kỹ năng nào cho chứng chỉ.
              </p>
              <p className="text-[11px] text-slate-400">
                Bấm &ldquo;Thêm kỹ năng&rdquo; hoặc chọn mẫu ở trên để nạp danh sách kỹ năng chuẩn.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {parts.map((part, idx) => {
                const partError = skillValidation.partErrors[idx];
                const nameErr = partNameErrors[idx];
                const maxVal = parseFloat(part.maxScore) || 0;
                const ratio =
                  isSumMode && scoring.maxScore > 0
                    ? ((maxVal / scoring.maxScore) * 100).toFixed(0)
                    : null;

                return (
                  <li
                    key={part.key}
                    className={cn(
                      'p-4 rounded-2xl border transition-all space-y-3',
                      touched && (partError || nameErr)
                        ? 'border-rose-300 bg-rose-50/30'
                        : 'border-slate-200/90 bg-white shadow-2xs hover:border-slate-300',
                    )}
                  >
                    {/* Dòng 1: STT, Tên kỹ năng, Nút xoá */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#0052CC] text-white text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>

                      <div className="flex-1">
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
                          placeholder="Tên kỹ năng (VD: Listening, Reading, Writing, Speaking...)"
                          className={cn(
                            inputCls(Boolean(touched && nameErr)),
                            'font-bold text-slate-900',
                          )}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setParts((prev) =>
                            prev.filter((p) => p.key !== part.key),
                          )
                        }
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Xoá kỹ năng"
                        aria-label="Xoá kỹ năng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Dòng 2: Mô tả kỹ năng */}
                    <div>
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
                        placeholder="Mô tả kỹ năng (VD: 40 câu trắc nghiệm nghe hiểu, thời gian 45 phút...)"
                        className={cn(inputCls(false), 'text-xs text-slate-600')}
                      />
                    </div>

                    {/* Dòng 3: Điểm Min, Điểm Max, Bước nhảy, Trọng số/Tỷ lệ (Admin tự quyết định) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Điểm tối thiểu
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={part.minScore}
                          onChange={(e) =>
                            setParts((prev) =>
                              prev.map((p) =>
                                p.key === part.key
                                  ? { ...p, minScore: e.target.value }
                                  : p,
                              ),
                            )
                          }
                          className={inputCls(false)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Điểm tối đa <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={part.maxScore}
                          onChange={(e) =>
                            setParts((prev) =>
                              prev.map((p) =>
                                p.key === part.key
                                  ? { ...p, maxScore: e.target.value }
                                  : p,
                              ),
                            )
                          }
                          className={inputCls(Boolean(touched && partError))}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Bước điểm (Step)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.01"
                          value={part.step}
                          onChange={(e) =>
                            setParts((prev) =>
                              prev.map((p) =>
                                p.key === part.key
                                  ? { ...p, step: e.target.value }
                                  : p,
                              ),
                            )
                          }
                          placeholder={String(scoring.step)}
                          className={inputCls(false)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Trọng số / Tỷ lệ (%)
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={part.weight}
                          onChange={(e) =>
                            setParts((prev) =>
                              prev.map((p) =>
                                p.key === part.key
                                  ? { ...p, weight: e.target.value }
                                  : p,
                              ),
                            )
                          }
                          placeholder={ratio ? `${ratio}%` : 'Tự đặt'}
                          className={inputCls(false)}
                        />
                      </div>
                    </div>

                    {/* Tùy chọn: kỹ năng không tính vào điểm tổng (VD: Aptis Grammar & Vocabulary) */}
                    {isSumMode && (
                      <label className="flex items-center gap-2 pt-0.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={part.excludeFromTotal}
                          onChange={(e) =>
                            setParts((prev) =>
                              prev.map((p) =>
                                p.key === part.key
                                  ? { ...p, excludeFromTotal: e.target.checked }
                                  : p,
                              ),
                            )
                          }
                          className="w-4 h-4 rounded border-slate-300 text-[#0052CC] focus:ring-[#0052CC]/30"
                        />
                        <span className="text-[11px] text-slate-600">
                          Không tính vào điểm tổng (kỹ năng có điểm riêng)
                        </span>
                      </label>
                    )}

                    {/* Thông báo lỗi nếu có */}
                    {touched && (nameErr || partError) && (
                      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1.5 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {nameErr || partError}
                      </p>
                    )}

                    {/* Cảnh báo gợi ý (không chặn lưu) */}
                    {skillValidation.partWarnings?.[idx] && !partError && (
                      <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1.5 pt-0.5">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        {skillValidation.partWarnings[idx]}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isPending}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold shadow-xs"
          >
            {editing ? 'Lưu thay đổi' : 'Tạo chứng chỉ'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

/* =========================================================
 * Modal: Certificate detail (chi tiết Core điểm & kỹ năng chuẩn)
 * KHÔNG CÒN PHẦN MÔ PHỎNG ĐIỂM
 * ========================================================= */
interface EffectivePart {
  id: string;
  name: string;
  description: string;
  order: number;
  minScore: number;
  maxScore: number;
  step: number;
  weight?: number | null;
  unit: string;
  isDefaultFallback: boolean;
  /** Kỹ năng có điểm riêng, KHÔNG tính vào điểm tổng (VD: Aptis G&V). */
  excludeFromTotal: boolean;
}

const CertificateDetailModal: React.FC<{
  certificateId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}> = ({ certificateId, onClose, onSaved }) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificate(certificateId ?? ''),
    queryFn: () => fetchCertificateById(certificateId!),
    enabled: Boolean(certificateId),
  });

  const parts = data?.parts ?? [];
  const scoring = data ? getCertificateScoring(data) : null;
  const displayDesc = data ? getDisplayDescription(data) : '';
  const isAverage = scoring?.scaleType === 'AVERAGE';
  const isIndependent = scoring?.scaleType === 'INDEPENDENT';
  const certNameUpper = (data?.certificateName || '').toUpperCase();
  const isIelts = scoring?.preset === 'IELTS' || certNameUpper.includes('IELTS');
  const isVstep = scoring?.preset === 'VSTEP' || certNameUpper.includes('VSTEP');
  const isToeicLr = scoring?.preset === 'TOEIC_LR' || (certNameUpper.includes('TOEIC') && !isIndependent);
  const isToeicSw = scoring?.preset === 'TOEIC_SW' || isIndependent;
  const isToeflNew = scoring?.preset === 'TOEFL_NEW' || (certNameUpper.includes('TOEFL') && (certNameUpper.includes('2023') || certNameUpper.includes('NEW')));
  const isToeflOld = scoring?.preset === 'TOEFL_OLD' || certNameUpper.includes('TOEFL');
  const isAptis = scoring?.preset === 'APTIS' || certNameUpper.includes('APTIS');
  const isCefr = scoring?.preset === 'CEFR' || certNameUpper.includes('CEFR');

  // Tìm preset tương ứng
  const matchedPreset: CertificatePreset | undefined = useMemo(() => {
    if (!scoring) return undefined;
    if (isVstep) return CERTIFICATE_PRESETS.find((p) => p.id === 'VSTEP');
    if (isIelts) return CERTIFICATE_PRESETS.find((p) => p.id === 'IELTS');
    if (isToeicSw) return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEIC_SW');
    if (isToeicLr) return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEIC_LR');
    if (isToeflNew) return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEFL_NEW');
    if (isToeflOld) return CERTIFICATE_PRESETS.find((p) => p.id === 'TOEFL_OLD');
    if (isAptis) return CERTIFICATE_PRESETS.find((p) => p.id === 'APTIS');
    if (isCefr) return CERTIFICATE_PRESETS.find((p) => p.id === 'CEFR');
    return CERTIFICATE_PRESETS.find((p) => p.id === scoring.preset);
  }, [scoring, isVstep, isIelts, isToeicSw, isToeicLr, isToeflNew, isToeflOld, isAptis, isCefr]);

  // Tính danh sách kỹ năng hiệu dụng (nếu DB chưa có thì lấy từ Preset chuẩn)
  const effectiveParts = useMemo<EffectivePart[]>(() => {
    if (parts.length > 0) {
      return parts.map((p) => {
        const info = getPartScoreInfo(p.properties);
        return {
          id: p.partId,
          name: p.partName,
          description: p.partDescription ?? '',
          order: p.partOrder,
          minScore: info.minScore ?? scoring?.minScore ?? 0,
          maxScore: info.maxScore ?? scoring?.maxScore ?? 10,
          step: info.step ?? scoring?.step ?? 0.5,
          unit: info.unit ?? scoring?.unit ?? 'Điểm',
          isDefaultFallback: false,
          excludeFromTotal: info.excludeFromTotal,
        };
      });
    }

    if (matchedPreset && matchedPreset.defaultParts.length > 0) {
      return matchedPreset.defaultParts.map((dp, idx) => ({
        id: `default-${idx}`,
        name: dp.partName,
        description: dp.partDescription,
        order: idx + 1,
        minScore: dp.minScore,
        maxScore: dp.maxScore,
        step: dp.step ?? matchedPreset.scoringSystem.step,
        unit: matchedPreset.scoringSystem.unit,
        isDefaultFallback: true,
        excludeFromTotal: dp.excludeFromTotal === true,
      }));
    }

    return [];
  }, [parts, matchedPreset, scoring]);

  // Mutation nạp nhanh kỹ năng chuẩn vào CSDL khi chứng chỉ chưa có kỹ năng
  const initPartsMutation = useMutation({
    mutationFn: async () => {
      if (!data || !matchedPreset || matchedPreset.defaultParts.length === 0) return;
      const payload: UpdateCertificatePayload = {
        certificateName: data.certificateName,
        description: data.description ?? undefined,
        parts: matchedPreset.defaultParts.map((p) => ({
          partName: p.partName,
          partDescription: p.partDescription,
          properties: JSON.stringify({
            minScore: p.minScore,
            maxScore: p.maxScore,
            step: p.step ?? matchedPreset.scoringSystem.step,
            weight: p.weight,
            scaleType: matchedPreset.scoringSystem.scaleType,
            unit: matchedPreset.scoringSystem.unit,
            // APTIS: G&V (Core) có điểm riêng, KHÔNG cộng vào Final Scale Score.
            ...(p.excludeFromTotal ? { excludeFromTotal: true } : {}),
          }),
        })),
      };
      return updateCertificate(data.certificateId, payload);
    },
    onSuccess: () => {
      toast.success('Đã nạp và lưu thành công các kỹ năng chuẩn vào CSDL');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.certificates });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.catalog.certificate(certificateId ?? '') });
      onSaved?.();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Nạp kỹ năng thất bại');
    },
  });

  if (!certificateId) return null;

  return (
    <ModalShell onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-blue-50 text-[#0052CC] rounded-xl shadow-2xs">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Chi tiết chứng chỉ &amp; Thang điểm
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {data?.certificateName ?? 'Đang tải…'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2 pt-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          className="mt-3"
        />
      ) : (
        <div className="space-y-4 pt-3">
          {/* Card thông tin chứng chỉ */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0052CC]">
                Certificate
              </span>
              {scoring && (
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border',
                    isAverage
                      ? 'bg-blue-100/70 text-blue-800 border-blue-200'
                      : isIndependent
                        ? 'bg-purple-100/70 text-purple-800 border-purple-200'
                        : 'bg-emerald-100/70 text-emerald-800 border-emerald-200',
                  )}
                >
                  {isAverage
                    ? scoring.roundingRule === 'IELTS'
                      ? 'TB (Quy tắc IELTS)'
                      : 'TB (Làm tròn 0.5 VSTEP)'
                    : isIndependent
                      ? 'Từng phần độc lập (Không cộng)'
                      : 'Tổng điểm các phần'}
                </span>
              )}
            </div>

            <h4 className="font-extrabold text-slate-900 text-lg">
              {data?.certificateName}
            </h4>
            {displayDesc && (
              <p className="text-xs text-slate-600 leading-relaxed">
                {displayDesc}
              </p>
            )}
          </div>

          {/* Khung thang điểm chứng chỉ */}
          {scoring && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#0052CC]" />
                Thang điểm của chứng chỉ
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Thang điểm
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    {scoring.minScore} - {scoring.maxScore} {scoring.unit}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Hình thức tính
                  </span>
                  <span className="font-bold text-slate-800">
                    {isAverage ? 'Trung bình cộng' : isIndependent ? 'Độc lập từng phần' : 'Tổng điểm'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Bước nhảy
                  </span>
                  <span className="font-bold text-slate-800">
                    {scoring.step} {scoring.unit}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    Kỹ năng áp dụng
                  </span>
                  <span className="font-bold text-[#0052CC]">
                    {effectiveParts.length} kỹ năng
                  </span>
                </div>
              </div>

              {/* Bảng mốc CEFR / Bậc quy chiếu chính thức */}
              {matchedPreset && matchedPreset.benchmarks.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <BookMarked className="w-3.5 h-3.5 text-[#0052CC]" />
                    Mốc điểm quy chiếu năng lực chính thức:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    {matchedPreset.benchmarks.map((bm, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-bold text-slate-800">{bm.label}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Thang: {bm.scoreRange}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-[#0052CC] font-bold text-[10px] border border-blue-200/60">
                          {bm.cefr}
                        </span>
                      </div>
                    ))}
                  </div>

                  {matchedPreset.referenceNotes && matchedPreset.referenceNotes.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 text-[11px] text-slate-600 space-y-1">
                      <p className="font-bold text-[#0052CC]">Ghi chú tham khảo:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                        {matchedPreset.referenceNotes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bảng quy đổi TOEFL 1–6 → 0–120 (chỉ trong 2 năm chuyển tiếp) */}
                  {isToeflNew && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] space-y-1.5">
                      <p className="font-bold text-amber-800">
                        Quy đổi thang 1–6 → 0–120 (ETS, thời gian chuyển tiếp đến ~01/2028)
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {TOEFL_NEW_TO_OLD_120_SCALE.map((row) => (
                          <div
                            key={row.band}
                            className="px-2 py-1 rounded-lg bg-white border border-amber-200/70 flex items-center justify-between"
                          >
                            <span className="font-mono font-bold text-slate-800">
                              {row.band.toFixed(1)}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {row.oldRange}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-amber-700">
                        Điểm 0–120 là giá trị TƯƠNG ĐƯƠNG (trung vị khoảng), KHÔNG phải tổng 4 kỹ
                        năng.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Banner khi chứng chỉ chưa lưu kỹ năng trong CSDL */}
          {parts.length === 0 && matchedPreset && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800">
                    Chứng chỉ chưa lưu danh sách kỹ năng vào CSDL
                  </p>
                  <p className="text-[11px] text-amber-700">
                    Hệ thống đang hiển thị {effectiveParts.length} kỹ năng chuẩn theo bài thi {matchedPreset.label}. Bấm nút bên cạnh để lưu trực tiếp vào CSDL.
                  </p>
                </div>
              </div>

              <Button
                size="sm"
                variant="primary"
                leftIcon={Upload}
                onClick={() => initPartsMutation.mutate()}
                isLoading={initPartsMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-2xs"
              >
                Lưu {effectiveParts.length} kỹ năng vào CSDL
              </Button>
            </div>
          )}

          {/* Danh sách kỹ năng */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers3 className="w-4 h-4 text-[#0052CC]" />
                Kỹ năng thành phần ({effectiveParts.length})
              </p>
              {parts.length === 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-[#0052CC] font-bold border border-blue-200">
                  Mẫu chuẩn Preset
                </span>
              )}
            </div>

            <ul className="space-y-2.5">
              {effectiveParts.map((part) => {
                const certMax = scoring?.maxScore || 1;
                const contribution =
                  !isAverage && !isIndependent && certMax > 0
                    ? ((part.maxScore / certMax) * 100).toFixed(0)
                    : null;

                return (
                  <li
                    key={part.id}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-md bg-[#0052CC] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                          {part.order ?? '·'}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {part.name}
                        </span>
                      </div>

                      {/* Điểm của kỹ năng */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0052CC] font-bold text-xs border border-blue-200/70">
                          Thang điểm: {part.minScore} - {part.maxScore} {part.unit}
                        </span>
                        {contribution && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                            {contribution}% tổng điểm
                          </span>
                        )}
                        {isIndependent && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[10px] border border-purple-200">
                            Độc lập
                          </span>
                        )}
                        {part.excludeFromTotal && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                            Không tính vào tổng
                          </span>
                        )}
                      </div>
                    </div>

                    {part.description && (
                      <p className="text-[11px] text-slate-500 mt-2 pl-8">
                        {part.description}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={onClose}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold mt-4"
          >
            Đóng
          </Button>
        </div>
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
