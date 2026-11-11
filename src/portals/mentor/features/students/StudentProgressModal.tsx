/**
 * StudentProgressModal — Mentor xem tiến độ học tập của học viên mình phụ trách (Dev 5)
 * -----------------------------------------------------------
 * Mở từ tab "Tôi phụ trách" (nút "Xem tiến độ học tập" dưới "Xem test level").
 * API: GET /api/v1/mentor/students/{id}/progress — chỉ mentor đã nhận tư vấn / tạo gói cho học viên (khác → 403).
 * - Khóa học: % bài học (có video) đã xem xong.
 * - Bài tập: điểm lần chấm gần nhất của từng bài (bài tập khóa học + bài tập mentor giao).
 * - Lộ trình: % chặng hoàn thành.
 * - Buổi kèm 1-1 với mentor đang xem: đã học / vắng / hủy / sắp tới.
 */

import React from 'react';
import { BookOpen, CalendarCheck, ClipboardCheck, Loader2, Route, X } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { cn } from '@/shared/utils/cn';
import { formatDate, useStudentProgress } from '@/shared/schedule';
import type { StudentHomeworkScore } from '@/shared/types';

/** Điểm: thang ≤ 10 hiện 1 chữ số thập phân, thang lớn hiện số nguyên */
const fmtNumber = (v: number) => (Number(v) <= 10 ? Number(v).toFixed(1) : String(Math.round(Number(v))));

const ProgressBar: React.FC<{ percent: number; className?: string }> = ({ percent, className }) => (
  <div className={cn('h-2 rounded-full bg-slate-100 overflow-hidden', className)}>
    <div
      className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] transition-all"
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  </div>
);

const SectionTitle: React.FC<{ icon: React.ElementType; title: string; hint?: string }> = ({ icon: Icon, title, hint }) => (
  <div className="flex items-end justify-between gap-2 mb-3">
    <h4 className="text-sm font-extrabold text-slate-900 inline-flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#0052CC]" />
      {title}
    </h4>
    {hint && <span className="text-xs text-slate-400">{hint}</span>}
  </div>
);

const StatTile: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 text-2xl font-extrabold text-slate-900 tabular-nums">{value}</p>
    {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

const homeworkStatus = (h: StudentHomeworkScore): { label: string; variant: 'warning' | 'success' | 'danger' | 'neutral' } => {
  if (h.pendingGrading) return { label: 'Chờ chấm', variant: 'warning' };
  if (h.passed === true) return { label: 'Đạt', variant: 'success' };
  if (h.passed === false) return { label: 'Chưa đạt', variant: 'danger' };
  return { label: 'Đã chấm', variant: 'neutral' };
};

export const StudentProgressModal: React.FC<{
  studentId: string;
  studentName: string;
  onClose: () => void;
}> = ({ studentId, studentName, onClose }) => {
  const query = useStudentProgress(studentId);
  const data = query.data;

  const courses = data?.courses ?? [];
  const homeworks = data?.homeworks ?? [];
  const paths = data?.learningPaths ?? [];
  const sessions = data?.sessions;

  const avgCourse = courses.length
    ? Math.round(courses.reduce((sum, c) => sum + c.progressPercent, 0) / courses.length)
    : 0;
  const graded = homeworks.filter((h) => h.score != null);
  const passedCount = homeworks.filter((h) => h.passed === true).length;
  const avgPath = paths.length ? Math.round(paths.reduce((sum, p) => sum + p.progressPercent, 0) / paths.length) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Header ---------- */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Tiến độ học tập</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{studentName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {query.isLoading ? (
          <div className="py-16 flex justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : query.isError ? (
          <p className="py-16 text-center text-rose-600 text-sm">{getErrorMessage(query.error)}</p>
        ) : (
          <>
            {/* ---------- Tổng quan ---------- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatTile
                label="Khóa học"
                value={courses.length ? `${avgCourse}%` : '—'}
                sub={courses.length ? `Trung bình ${courses.length} khóa đang học` : 'Chưa ghi danh khóa nào'}
              />
              <StatTile
                label="Bài tập"
                value={`${graded.length}/${homeworks.length}`}
                sub={homeworks.length ? `Đã chấm · ${passedCount} bài đạt` : 'Chưa nộp bài nào'}
              />
              <StatTile
                label="Lộ trình"
                value={paths.length ? `${avgPath}%` : '—'}
                sub={paths.length ? `${paths.length} lộ trình đã ghi danh` : 'Chưa ghi danh lộ trình'}
              />
              <StatTile
                label="Buổi kèm 1-1"
                value={sessions ? `${sessions.completed}/${sessions.total}` : '—'}
                sub={sessions ? `Đã học · ${sessions.upcoming} buổi sắp tới` : undefined}
              />
            </div>

            {/* ---------- Khóa học ---------- */}
            <section>
              <SectionTitle icon={BookOpen} title="Tiến độ khóa học" hint="Tính theo bài học video đã xem xong" />
              {courses.length === 0 ? (
                <p className="text-sm text-slate-400">Học viên chưa ghi danh khóa học nào.</p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {courses.map((c) => (
                    <li key={c.courseId} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900 min-w-0 break-words">{c.courseTitle}</p>
                        <span className="text-sm font-extrabold text-[#0052CC] tabular-nums shrink-0">
                          {c.progressPercent}%
                        </span>
                      </div>
                      <ProgressBar percent={c.progressPercent} className="mt-2" />
                      <p className="text-xs text-slate-500 mt-1.5">
                        {c.totalLessons
                          ? `Đã học ${c.completedLessons}/${c.totalLessons} bài`
                          : 'Khóa chưa có bài học video'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ---------- Bài tập ---------- */}
            <section>
              <SectionTitle icon={ClipboardCheck} title="Điểm bài tập" hint="Điểm của lần chấm gần nhất" />
              {homeworks.length === 0 ? (
                <p className="text-sm text-slate-400">Học viên chưa nộp bài tập nào.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="text-left font-bold px-4 py-2.5">Bài tập</th>
                        <th className="text-left font-bold px-4 py-2.5">Thuộc</th>
                        <th className="text-center font-bold px-4 py-2.5">Lần nộp</th>
                        <th className="text-right font-bold px-4 py-2.5">Điểm</th>
                        <th className="text-left font-bold px-4 py-2.5">Kết quả</th>
                        <th className="text-left font-bold px-4 py-2.5">Nộp gần nhất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {homeworks.map((h) => {
                        const status = homeworkStatus(h);
                        return (
                          <tr key={h.homeworkId}>
                            <td className="px-4 py-2.5 font-semibold text-slate-800">{h.title}</td>
                            <td className="px-4 py-2.5 text-slate-500">{h.courseTitle ?? 'Bài tập mentor'}</td>
                            <td className="px-4 py-2.5 text-center tabular-nums text-slate-600">{h.attemptCount}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">
                              {h.score == null ? '—' : fmtNumber(h.score)}
                              {h.score != null && h.maxScore != null && (
                                <span className="text-slate-400 font-medium"> / {fmtNumber(h.maxScore)}</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5">
                              <Badge variant={status.variant} size="sm">
                                {status.label}
                              </Badge>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                              {h.lastSubmittedDate ? formatDate(h.lastSubmittedDate) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* ---------- Lộ trình ---------- */}
            <section>
              <SectionTitle icon={Route} title="Lộ trình học" />
              {paths.length === 0 ? (
                <p className="text-sm text-slate-400">Học viên chưa ghi danh lộ trình nào.</p>
              ) : (
                <ul className="space-y-3">
                  {paths.map((p) => (
                    <li key={p.learningPathId} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900">{p.name}</p>
                        <span className="text-sm font-extrabold text-[#0052CC] tabular-nums shrink-0">
                          {p.progressPercent}%
                        </span>
                      </div>
                      <ProgressBar percent={p.progressPercent} className="mt-2" />
                      <p className="text-xs text-slate-500 mt-1.5">
                        Hoàn thành {p.completedItems}/{p.totalItems} chặng
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[...p.items]
                          .sort((a, b) => a.order - b.order)
                          .map((item) => (
                            <span
                              key={item.itemId}
                              className={cn(
                                'text-[11px] font-semibold px-2 py-0.5 rounded-md border',
                                item.completed
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                  : 'bg-white border-slate-200 text-slate-500',
                              )}
                            >
                              {item.completed ? '✓ ' : ''}
                              {item.title}
                            </span>
                          ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* ---------- Buổi kèm 1-1 ---------- */}
            {sessions && (
              <section>
                <SectionTitle icon={CalendarCheck} title="Buổi kèm 1-1 với bạn" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  {[
                    { label: 'Đã học', value: sessions.completed, cls: 'text-emerald-600' },
                    { label: 'Sắp tới', value: sessions.upcoming, cls: 'text-[#0052CC]' },
                    { label: 'Vắng mặt', value: sessions.noShow, cls: 'text-rose-600' },
                    { label: 'Đã hủy', value: sessions.cancelled, cls: 'text-slate-500' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-slate-200 py-3">
                      <p className={cn('text-xl font-extrabold tabular-nums', s.cls)}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StudentProgressModal;
