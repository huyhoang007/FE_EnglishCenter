/**
 * LearningPathView — Lộ trình học theo chứng chỉ (Dev 5 — TASK-D5-03)
 * -----------------------------------------------------------
 * Phần 1 "Lộ trình của tôi" (chỉ STUDENT): % tiến độ và trạng thái từng chặng.
 *   - Chặng PRACTICE_EXAM → nút "Luyện đề" mở /practice?examId=...
 *   - Chặng COURSE → mở trang khóa học /courses/{id}
 *   - Chặng HOMEWORK (V27, bài tập mentor) → nút "Làm bài" mở modal nộp bài của Dev 2.5 ngay tại đây;
 *     chỉ học viên đã mua gói kèm 1-1 mới làm được (chưa mua → nhắc sang trang Mentor 1-1); mentor 1-1 chấm,
 *     hoàn thành khi bài được chấm đạt.
 *   Tiến độ do BE tự cập nhật khi học viên hoàn thành khóa học / đạt band đề luyện tập.
 * Phần 2 "Khám phá lộ trình": danh sách lộ trình (lọc theo chứng chỉ) + nút Ghi danh.
 *   Học viên: ẩn lộ trình đã ghi danh (đã nằm ở phần 1); ghi danh hết thì ẩn cả phần này.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  Loader2,
  Map as MapIcon,
  PenLine,
  Route,
  Trophy,
  Users,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { cn } from '@/shared/utils';
import { useRole } from '@/portals/client/features/auth';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { useToast } from '@/shared/components/Toast';
import { HomeworkSubmitModal } from '@/portals/client/features/homework';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { useMyPlans } from '@/shared/schedule';
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
  usePathHomework,
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
  HOMEWORK: 'Bài tập mentor',
};

const STATUS_BADGE: Record<LearningPathStatus, { label: string; variant: 'primary' | 'success' | 'neutral' }> = {
  active: { label: 'Đang học', variant: 'primary' },
  completed: { label: 'Hoàn thành', variant: 'success' },
  abandoned: { label: 'Tạm dừng', variant: 'neutral' },
};

export const LearningPathView: React.FC = () => {
  const role = useRole();
  const isStudent = role === 'STUDENT';
  // Learner / Student chỉ xem lộ trình của chứng chỉ mục tiêu (BE lọc theo hồ sơ) → ẩn bộ lọc chứng chỉ
  const isGoalFiltered = role === 'STUDENT' || role === 'USER';
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

  // Học viên: lộ trình đã ghi danh đã hiện ở "Lộ trình của tôi" → không lặp lại ở phần khám phá
  const waitingProgress = isStudent && progressQuery.isLoading;
  const explorePaths = isStudent ? paths.filter((p) => !enrolledIds.has(p.learningPathId)) : paths;
  // Đã ghi danh hết các lộ trình phù hợp → ẩn hẳn phần khám phá
  const showExplore = !(
    isStudent &&
    pathsQuery.isSuccess &&
    progressQuery.isSuccess &&
    paths.length > 0 &&
    explorePaths.length === 0
  );

  return (
    <div className="space-y-10">
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
        <section aria-label="Lộ trình của tôi">
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
          {/* Mỗi lộ trình 1 thẻ ngang, chiếm hết chiều rộng */}
          <div className="space-y-5">
            {myProgress.map((p) => (
              <ProgressCard key={p.learningPathId} progress={p} />
            ))}
          </div>
        </section>
      )}

      {/* ============== KHÁM PHÁ LỘ TRÌNH ============== */}
      {showExplore && (
        <section aria-label="Khám phá lộ trình">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <SectionHeader
              title={isStudent && myProgress.length > 0 ? 'Khám phá thêm lộ trình' : 'Khám phá lộ trình'}
              subtitle={
                isGoalFiltered
                  ? 'Các lộ trình theo chứng chỉ mục tiêu trong hồ sơ của bạn'
                  : 'Chọn lộ trình phù hợp với chứng chỉ bạn muốn chinh phục'
              }
            />
            {!isGoalFiltered && certificates.length > 0 && (
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
            <Card className="mb-4 bg-red-50 border-red-200 text-sm text-red-700">
              {getErrorMessage(enrollMutation.error)}
            </Card>
          )}
          {(pathsQuery.isLoading || waitingProgress) && <LoadingCard />}
          {pathsQuery.isError && <Card className="text-sm text-red-600">{getErrorMessage(pathsQuery.error)}</Card>}
          {pathsQuery.isSuccess && !waitingProgress && explorePaths.length === 0 && (
            <Card className="text-sm text-slate-500 text-center py-6">
              {isGoalFiltered
                ? 'Chưa có lộ trình cho chứng chỉ mục tiêu của bạn. Hãy cập nhật nguyện vọng trong hồ sơ hoặc nhờ mentor tư vấn.'
                : 'Chưa có lộ trình nào.'}
            </Card>
          )}

          {!waitingProgress && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {explorePaths.map((path) => (
                <PathCard
                  key={path.learningPathId}
                  path={path}
                  isStudent={isStudent}
                  enrolling={enrollMutation.isPending && enrollMutation.variables === path.learningPathId}
                  onEnroll={() => enrollMutation.mutate(path.learningPathId)}
                />
              ))}
            </div>
          )}
        </section>
      )}
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
  <div className="mb-4">
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

const ItemIcon: React.FC<{ type: LearningPathItem['type']; className?: string }> = ({ type, className }) => {
  const Icon =
    type === 'COURSE' ? BookOpen : type === 'PRACTICE_EXAM' ? PenLine : type === 'HOMEWORK' ? FileText : ClipboardList;
  return <Icon className={cn('w-4 h-4 text-slate-400 shrink-0', className)} />;
};

/** Vòng tròn % tiến độ */
const ProgressRing: React.FC<{ percent: number }> = ({ percent }) => {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const value = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="lp-progress" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="url(#lp-progress)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="transition-all duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-slate-900 tabular-nums">
        {value}%
      </span>
    </div>
  );
};

/**
 * Thẻ tiến độ của học viên — bố cục ngang:
 * trái = tổng quan (% tiến độ, bước tiếp theo), phải = các giai đoạn xếp thành cột.
 */
const ProgressCard: React.FC<{ progress: LearningPathProgress }> = ({ progress }) => {
  const status = STATUS_BADGE[progress.status] ?? STATUS_BADGE.active;
  const groups = groupByStage(progress.items);
  const nextItem = [...progress.items].sort((a, b) => a.order - b.order).find((item) => !item.completed);
  const remaining = progress.totalItems - progress.completedItems;

  return (
    <Card noPadding className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr]">
        {/* ---------- Tổng quan ---------- */}
        <div className="p-6 flex flex-col gap-5 bg-gradient-to-br from-blue-50 via-white to-violet-50 border-b lg:border-b-0 lg:border-r border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xl font-extrabold text-slate-900 tracking-tight min-w-0 break-words">{progress.name}</p>
            <Badge variant={status.variant} size="sm">
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <ProgressRing percent={progress.progressPercent} />
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-extrabold text-emerald-600 tabular-nums">{progress.completedItems}</span> chặng đã xong
              </p>
              <p>
                <span className="font-extrabold text-slate-900 tabular-nums">{remaining}</span> chặng còn lại
              </p>
            </div>
          </div>

          {nextItem ? (
            <div className="mt-auto rounded-xl bg-white border border-slate-200 p-4 shadow-sm">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#0052CC]">Bước tiếp theo</p>
              <p className="mt-1 text-sm font-bold text-slate-900 leading-snug">{nextItem.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">
                {nextItem.stage} · {TYPE_LABEL[nextItem.type]}
              </p>
              <div className="mt-3 flex">
                <ItemAction item={nextItem} />
              </div>
            </div>
          ) : (
            <div className="mt-auto rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-bold text-emerald-700">Bạn đã hoàn thành lộ trình này!</p>
            </div>
          )}
        </div>

        {/* ---------- Các giai đoạn ---------- */}
        <div className="p-6">
          <ol className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
            {groups.map((group, index) => {
              const done = group.items.every((item) => item.completed);
              const current = !done && group.items.some((item) => item.itemId === nextItem?.itemId);
              return (
                <li
                  key={group.stage}
                  className={cn(
                    'rounded-xl border p-4 flex flex-col gap-3',
                    done
                      ? 'border-emerald-200 bg-emerald-50/40'
                      : current
                        ? 'border-blue-300 bg-blue-50/40 ring-1 ring-blue-200'
                        : 'border-slate-200',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-7 h-7 rounded-lg text-xs font-extrabold flex items-center justify-center shrink-0',
                        done ? 'bg-emerald-500 text-white' : current ? 'bg-[#0052CC] text-white' : 'bg-slate-100 text-slate-500',
                      )}
                    >
                      {done ? <Check className="w-4 h-4" /> : index + 1}
                    </span>
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600">{group.stage}</p>
                  </div>

                  <ul className="space-y-3">
                    {group.items.map((item) => (
                      <li key={item.itemId} className="flex items-start gap-2">
                        {item.completed ? (
                          <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 mt-0.5 text-slate-300 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-sm font-semibold leading-snug break-words',
                              item.completed ? 'text-slate-400 line-through' : 'text-slate-800',
                            )}
                          >
                            {item.title}
                            {item.targetBand != null && (
                              <span className="ml-1 text-xs text-violet-600 font-bold no-underline">
                                (đạt {Number(item.targetBand).toFixed(1)})
                              </span>
                            )}
                          </p>
                          <div className="mt-1 flex items-center justify-between gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <ItemIcon type={item.type} className="w-3.5 h-3.5" />
                              {TYPE_LABEL[item.type]}
                            </span>
                            {!item.completed && <ItemAction item={item} />}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ol>
        </div>
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
  if (item.type === 'HOMEWORK') {
    return <PathHomeworkAction contentId={item.refId} />;
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

/**
 * Chặng bài tập của mentor: bấm "Làm bài" mới tải bài (kèm hạn nộp riêng của học viên),
 * mở modal nộp bài dùng chung với bài tập khóa học. Đóng modal thì tải lại tiến độ lộ trình.
 */
const PathHomeworkAction: React.FC<{ contentId: string }> = ({ contentId }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const homeworkQuery = usePathHomework(contentId, open);
  // Bài tập mentor chỉ dành cho học viên đã thanh toán gói kèm 1-1 (BE cũng chặn)
  const plansQuery = useMyPlans(true);
  const hasPaidPlan = (plansQuery.data ?? []).some((p) => p.status === 'active' || p.status === 'completed');

  React.useEffect(() => {
    if (open && homeworkQuery.isError) {
      toast.error(getErrorMessage(homeworkQuery.error));
      setOpen(false);
    }
  }, [open, homeworkQuery.isError, homeworkQuery.error, toast]);

  const handleClose = () => {
    setOpen(false);
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.learningPath.myProgress });
  };

  if (plansQuery.isSuccess && !hasPaidPlan) {
    return (
      <Link
        to={CLIENT_ROUTES.schedule}
        title="Bài tập do mentor giao và chấm, chỉ dành cho học viên đã mua gói kèm 1-1"
        className="text-xs font-bold text-slate-400 hover:text-[#0052CC] hover:underline shrink-0"
      >
        Cần gói kèm 1-1 →
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-amber-700 hover:underline shrink-0 inline-flex items-center gap-1"
      >
        {open && homeworkQuery.isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
        Làm bài →
      </button>
      {open && homeworkQuery.data && (
        <HomeworkSubmitModal open onClose={handleClose} homework={homeworkQuery.data} />
      )}
    </>
  );
};

/** Thẻ 1 lộ trình trong danh sách khám phá */
const PathCard: React.FC<{
  path: LearningPath;
  isStudent: boolean;
  enrolling: boolean;
  onEnroll: () => void;
}> = ({ path, isStudent, enrolling, onEnroll }) => (
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
          <div className="min-w-0 flex-1">
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
      <div className="mt-auto pt-2">
        <Button
          variant="primary"
          size="md"
          rightIcon={ArrowRight}
          isLoading={enrolling}
          disabled={enrolling}
          onClick={onEnroll}
          className="w-full"
        >
          Ghi danh lộ trình
        </Button>
      </div>
    )}
  </Card>
);

export default LearningPathView;
