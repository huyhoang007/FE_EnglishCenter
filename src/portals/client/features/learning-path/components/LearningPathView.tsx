/**
 * LearningPathView — Lộ trình học theo chứng chỉ (Dev 5 — TASK-D5-03)
 * -----------------------------------------------------------
 * Phần 1 "Lộ trình của tôi" (chỉ STUDENT): % tiến độ và trạng thái từng chặng.
 *   - Chặng PRACTICE_EXAM → nút "Luyện đề" mở /practice?examId=...
 *   - Chặng COURSE → mở trang khóa học /courses/{id}
 *   Tiến độ do BE tự cập nhật khi học viên hoàn thành khóa học / đạt band đề luyện tập.
 * Phần 2 "Khám phá lộ trình": danh sách lộ trình (lọc theo chứng chỉ) + nút Ghi danh.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  ClipboardList,
  Loader2,
  Map as MapIcon,
  PenLine,
  Route,
  Users,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils';
import { useRole } from '@/portals/client/features/auth';
import { getErrorMessage } from '@/shared/api/axiosClient';
import type {
  LearningPath,
  LearningPathItem,
  LearningPathProgress,
  LearningPathStatus,
} from '@/shared/types';
import {
  useCertificateOptions,
  useEnrollLearningPath,
  useLearningPaths,
  useMyLearningPathProgress,
} from '../hooks/useLearningPaths';

/** Gom các chặng theo tên giai đoạn, giữ đúng thứ tự học */
const groupByStage = (items: LearningPathItem[]) => {
  const groups: { stage: string; items: LearningPathItem[] }[] = [];
  [...items]
    .sort((a, b) => a.order - b.order)
    .forEach((item) => {
      const last = groups[groups.length - 1];
      if (last && last.stage === item.stage) last.items.push(item);
      else groups.push({ stage: item.stage, items: [item] });
    });
  return groups;
};

const TYPE_LABEL: Record<LearningPathItem['type'], string> = {
  COURSE: 'Khóa học',
  EXAM: 'Đề thi',
  PRACTICE_EXAM: 'Luyện đề AI',
};

const STATUS_BADGE: Record<LearningPathStatus, { label: string; variant: 'primary' | 'success' | 'neutral' }> = {
  active: { label: 'Đang học', variant: 'primary' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  abandoned: { label: 'Tạm dừng', variant: 'neutral' },
};

export const LearningPathView: React.FC = () => {
  const role = useRole();
  const isStudent = role === 'STUDENT';
  const [certificateId, setCertificateId] = useState('');

  const progressQuery = useMyLearningPathProgress(isStudent);
  const pathsQuery = useLearningPaths(certificateId);
  // Danh sách chứng chỉ để lọc (API của Dev 2). Lỗi thì ẩn bộ lọc, không ảnh hưởng trang.
  const certificatesQuery = useCertificateOptions();
  const enrollMutation = useEnrollLearningPath();

  const myProgress = progressQuery.data ?? [];
  const enrolledIds = new Set(myProgress.map((p) => p.learningPathId));
  const paths = pathsQuery.data ?? [];
  const certificates = certificatesQuery.data ?? [];

  return (
    <div className="space-y-8">
      {/* ============== HEADER ============== */}
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <Route className="w-3.5 h-3.5" />
          Lộ trình học
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lộ trình chinh phục chứng chỉ
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Học theo từng chặng từ nền tảng đến luyện đề. Tiến độ tự cập nhật khi bạn hoàn thành khóa học hoặc đạt
          band mục tiêu ở đề luyện tập.
        </p>
      </header>

      {/* ============== LỘ TRÌNH CỦA TÔI ============== */}
      {isStudent && (
        <section aria-label="Lộ trình của tôi" className="space-y-3">
          <SectionHeader
            title="Lộ trình của tôi"
            subtitle="Tiến độ cập nhật tự động khi bạn hoàn thành từng chặng"
          />
          {progressQuery.isLoading && <LoadingCard />}
          {progressQuery.isError && (
            <Card className="text-sm text-red-600">{getErrorMessage(progressQuery.error)}</Card>
          )}
          {progressQuery.isSuccess && myProgress.length === 0 && (
            <Card className="text-sm text-slate-500 text-center py-6">
              Bạn chưa ghi danh lộ trình nào. Chọn một lộ trình bên dưới để bắt đầu.
            </Card>
          )}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {myProgress.map((p) => (
              <ProgressCard key={p.learningPathId} progress={p} />
            ))}
          </div>
        </section>
      )}

      {/* ============== KHÁM PHÁ LỘ TRÌNH ============== */}
      <section aria-label="Khám phá lộ trình" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <SectionHeader
            title="Khám phá lộ trình"
            subtitle="Chọn lộ trình phù hợp với chứng chỉ bạn muốn chinh phục"
          />
          {certificates.length > 0 && (
            <select
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              className="h-10 px-3 rounded-input border border-slate-200 bg-white text-sm text-slate-700 focus:border-primary focus:outline-none"
            >
              <option value="">Tất cả chứng chỉ</option>
              {certificates.map((c) => (
                <option key={c.certificateId} value={c.certificateId}>
                  {c.certificateName}
                </option>
              ))}
            </select>
          )}
        </div>

        {enrollMutation.isError && (
          <Card className="bg-red-50 border-red-200 text-sm text-red-700">
            {getErrorMessage(enrollMutation.error)}
          </Card>
        )}
        {pathsQuery.isLoading && <LoadingCard />}
        {pathsQuery.isError && <Card className="text-sm text-red-600">{getErrorMessage(pathsQuery.error)}</Card>}
        {pathsQuery.isSuccess && paths.length === 0 && (
          <Card className="text-sm text-slate-500 text-center py-6">
            Chưa có lộ trình nào. Admin cần tạo lộ trình trước.
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {paths.map((path) => (
            <PathCard
              key={path.learningPathId}
              path={path}
              isStudent={isStudent}
              enrolled={enrolledIds.has(path.learningPathId)}
              enrolling={enrollMutation.isPending && enrollMutation.variables === path.learningPathId}
              onEnroll={() => enrollMutation.mutate(path.learningPathId)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

/* ============================================================
 *  Sub components
 * ============================================================ */

const SectionHeader: React.FC<{ title: string; subtitle: string }> = ({
  title,
  subtitle,
}) => (
  <div className="mb-3">
    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
      {title}
    </h2>
    <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
  </div>
);

const LoadingCard: React.FC = () => (
  <Card className="flex justify-center py-8 text-slate-400">
    <Loader2 className="w-6 h-6 animate-spin" />
  </Card>
);

const ItemIcon: React.FC<{ type: LearningPathItem['type'] }> = ({ type }) => {
  const Icon = type === 'COURSE' ? BookOpen : type === 'PRACTICE_EXAM' ? PenLine : ClipboardList;
  return <Icon className="w-4 h-4 text-slate-400 shrink-0" />;
};

/** Thẻ tiến độ của học viên */
const ProgressCard: React.FC<{ progress: LearningPathProgress }> = ({ progress }) => {
  const status = STATUS_BADGE[progress.status] ?? STATUS_BADGE.active;
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-extrabold text-slate-900">{progress.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Hoàn thành {progress.completedItems}/{progress.totalItems} chặng
          </p>
        </div>
        <Badge variant={status.variant} size="sm">
          {status.label}
        </Badge>
      </div>

      <div>
        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
          <span>Tiến độ</span>
          <span className="tabular-nums">{progress.progressPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] transition-all"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {groupByStage(progress.items).map((group) => (
          <div key={group.stage}>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{group.stage}</p>
            <ul className="mt-1.5 space-y-1.5">
              {group.items.map((item) => (
                <li key={item.itemId} className="flex items-center gap-2 text-sm">
                  {item.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                  )}
                  <span className={cn('flex-1 min-w-0 truncate', item.completed ? 'text-slate-400 line-through' : 'text-slate-800')}>
                    {item.title}
                    {item.targetBand != null && (
                      <span className="ml-1 text-xs text-violet-600 font-bold">
                        (đạt {Number(item.targetBand).toFixed(1)})
                      </span>
                    )}
                  </span>
                  {!item.completed && <ItemAction item={item} />}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
};

/** Nút đi tới nơi học của 1 chặng */
const ItemAction: React.FC<{ item: LearningPathItem }> = ({ item }) => {
  if (item.type === 'PRACTICE_EXAM') {
    return (
      <Link to={`/practice?examId=${item.refId}`} className="text-xs font-bold text-violet-600 hover:underline shrink-0">
        Luyện đề →
      </Link>
    );
  }
  if (item.type === 'COURSE') {
    return (
      <Link to={`/courses/${item.refId}`} className="text-xs font-bold text-[#0052CC] hover:underline shrink-0">
        Vào học →
      </Link>
    );
  }
  // EXAM: module thi của Dev 3 chưa bàn giao
  return <span className="text-xs text-slate-400 shrink-0">{TYPE_LABEL.EXAM}</span>;
};

/** Thẻ 1 lộ trình trong danh sách khám phá */
const PathCard: React.FC<{
  path: LearningPath;
  isStudent: boolean;
  enrolled: boolean;
  enrolling: boolean;
  onEnroll: () => void;
}> = ({ path, isStudent, enrolled, enrolling, onEnroll }) => (
  <Card hoverable className="flex flex-col gap-4">
    <div className="flex items-start gap-3">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0052CC] to-[#7C3AED] flex items-center justify-center text-white shrink-0">
        <MapIcon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="font-extrabold text-slate-900">{path.name}</p>
        {path.description && <p className="text-sm text-slate-600 mt-0.5">{path.description}</p>}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Route className="w-3.5 h-3.5" />
            {path.totalItems} chặng
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {path.enrolledCount} học viên
          </span>
        </div>
      </div>
    </div>

    <ol className="space-y-2">
      {groupByStage(path.items).map((group, i) => (
        <li key={group.stage} className="flex gap-3">
          <span className="w-6 h-6 rounded-md bg-blue-50 text-[#0052CC] text-xs font-extrabold flex items-center justify-center shrink-0">
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">{group.stage}</p>
            <ul className="mt-0.5 space-y-0.5">
              {group.items.map((item) => (
                <li key={item.itemId} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ItemIcon type={item.type} />
                  <span className="truncate">
                    {TYPE_LABEL[item.type]}: {item.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </li>
      ))}
    </ol>

    {isStudent && (
      <div className="mt-auto">
        {enrolled ? (
          <Badge variant="success" size="md" icon={CheckCircle2}>
            Đã ghi danh
          </Badge>
        ) : (
          <Button variant="primary" size="md" isLoading={enrolling} disabled={enrolling} onClick={onEnroll}>
            Ghi danh lộ trình
          </Button>
        )}
      </div>
    )}
  </Card>
);

export default LearningPathView;
