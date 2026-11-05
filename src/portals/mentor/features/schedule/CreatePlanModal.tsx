/**
 * CreatePlanModal — Mentor tạo gói kèm 1-1 cho 1 học viên (Dev 5, V21)
 * -----------------------------------------------------------
 * Dùng sau khi đã tư vấn chốt lộ trình: chọn học viên → chọn lộ trình (VD 12 buổi) → xếp N khung giờ.
 * - Lộ trình có "số buổi" thì danh sách buổi tự tạo đúng số đó (BE cũng bắt buộc khớp).
 * - "Lặp hàng tuần": lấy buổi đầu tiên, tự điền các buổi sau cách nhau 7 ngày.
 * - Mỗi buổi: chỉ trong 90 ngày tới, dài 30 – 180 phút (khớp BE app.schedule.*).
 * Học phí = hourly rate của mentor x số giờ, học viên thanh toán 1 lần cả gói.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Plus, Repeat, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { cn } from '@/shared/utils/cn';
import { useLearningPaths } from '@/portals/client/features/learning-path';
import {
  addDays,
  scheduleDateBounds,
  toDateInput,
  toUtcIso,
  useCreateMentoringPlan,
  useStudentSearch,
  validateSessionTime,
} from '@/shared/schedule';
import type { StudentOverview } from '@/shared/types';

const INPUT_CLASS =
  'w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#0052CC]';
const LABEL_CLASS = 'text-xs text-slate-500 font-semibold uppercase tracking-wider';
/** Số buổi mặc định khi lộ trình không quy định */
const DEFAULT_SESSIONS = 1;
const MAX_SESSIONS = 60;

interface SessionRow {
  date: string;
  startTime: string;
  endTime: string;
}

export interface PlanStudent {
  userId: string;
  fullName: string;
  email?: string;
  targetCertificateId?: string | null;
}

const tomorrowRow = (): SessionRow => ({
  date: toDateInput(addDays(new Date(), 1).toISOString()),
  startTime: '19:00',
  endTime: '20:30',
});

/** Dãy buổi lặp hàng tuần từ buổi đầu tiên */
const weeklyRows = (first: SessionRow, count: number): SessionRow[] =>
  Array.from({ length: count }, (_, i) => ({
    ...first,
    date: i === 0 ? first.date : toDateInput(addDays(new Date(`${first.date}T00:00`), i * 7).toISOString()),
  }));

export const CreatePlanModal: React.FC<{
  /** Học viên đã chọn sẵn (mở từ trang Học viên & tư vấn); không có thì mentor tự tìm */
  student?: PlanStudent | null;
  consultationId?: string | null;
  onClose: () => void;
}> = ({ student: initialStudent, consultationId, onClose }) => {
  const toast = useToast();
  const createMutation = useCreateMentoringPlan();
  const bounds = useMemo(() => scheduleDateBounds(), []);

  const [student, setStudent] = useState<PlanStudent | null>(initialStudent ?? null);
  const [keyword, setKeyword] = useState('');
  const [learningPathId, setLearningPathId] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [rows, setRows] = useState<SessionRow[]>([tomorrowRow()]);
  const [touched, setTouched] = useState(false);

  // Lộ trình đúng chứng chỉ mục tiêu của học viên (chưa có mục tiêu thì xem tất cả)
  const pathsQuery = useLearningPaths(student?.targetCertificateId ?? '');
  const paths = pathsQuery.data ?? [];
  const selectedPath = paths.find((p) => p.learningPathId === learningPathId) ?? null;
  const requiredSessions = selectedPath?.totalSessions ?? null;

  const searchQuery = useStudentSearch(keyword.trim(), 0);

  // Chọn lộ trình có số buổi → tạo đúng số buổi đó, lặp hàng tuần từ buổi đầu
  useEffect(() => {
    if (!selectedPath) return;
    if (!title.trim()) setTitle(selectedPath.name);
    if (requiredSessions) setRows((prev) => weeklyRows(prev[0] ?? tomorrowRow(), requiredSessions));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningPathId]);

  const rowErrors = rows.map((r) => validateSessionTime(r.date, r.startTime, r.endTime));
  // 2 buổi trùng giờ nhau
  const sorted = rows
    .map((r, i) => ({ i, start: new Date(`${r.date}T${r.startTime}`).getTime(), end: new Date(`${r.date}T${r.endTime}`).getTime() }))
    .sort((a, b) => a.start - b.start);
  for (let k = 1; k < sorted.length; k++) {
    if (sorted[k].start < sorted[k - 1].end && !rowErrors[sorted[k].i]) rowErrors[sorted[k].i] = 'Trùng giờ với buổi khác trong gói';
  }
  const countError =
    requiredSessions && rows.length !== requiredSessions
      ? `Lộ trình "${selectedPath?.name}" gồm ${requiredSessions} buổi, hiện có ${rows.length} buổi`
      : '';
  const studentError = !student ? 'Chọn học viên' : '';
  const titleError = !title.trim() ? 'Nhập tên gói' : '';
  const hasError = Boolean(studentError || titleError || countError) || rowErrors.some(Boolean);

  const updateRow = (index: number, patch: Partial<SessionRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError || !student) return;
    createMutation.mutate(
      {
        studentId: student.userId,
        learningPathId: learningPathId || undefined,
        consultationId: consultationId || undefined,
        title: title.trim(),
        note: note.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        sessions: rows.map((r) => ({ startTime: toUtcIso(r.date, r.startTime), endTime: toUtcIso(r.date, r.endTime) })),
      },
      {
        onSuccess: () => {
          toast.success('Đã tạo gói kèm 1-1, học viên sẽ nhận thông báo để thanh toán');
          onClose();
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Tạo gói kèm 1-1</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Xếp lịch sau khi đã tư vấn chốt lộ trình. Học viên thanh toán 1 lần cả gói thì lịch mới được xác nhận.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* ---------- Học viên ---------- */}
          <div className="space-y-1">
            <span className={LABEL_CLASS}>Học viên *</span>
            {student ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{student.fullName}</p>
                  {student.email && <p className="text-xs text-slate-500 truncate">{student.email}</p>}
                </div>
                {!initialStudent && (
                  <Button variant="ghost" size="sm" onClick={() => setStudent(null)}>
                    Đổi
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 h-10 rounded-lg border border-slate-200 focus-within:border-[#0052CC]">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Tìm theo tên, email hoặc SĐT…"
                    className="flex-1 bg-transparent outline-none text-sm"
                  />
                </div>
                <ul className="max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-lg border border-slate-100">
                  {(searchQuery.data?.data ?? []).map((s: StudentOverview) => (
                    <li key={s.userId}>
                      <button
                        type="button"
                        onClick={() =>
                          setStudent({ userId: s.userId, fullName: s.fullName, email: s.email, targetCertificateId: s.targetCertificateId })
                        }
                        className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      >
                        <span className="text-sm font-semibold text-slate-800">{s.fullName}</span>
                        <span className="text-xs text-slate-500">
                          {' '}· {s.email}
                          {s.targetCertificateName ? ` · ${s.targetCertificateName} ${s.targetScore ?? ''}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {touched && studentError && <p className="text-xs text-rose-600 font-semibold">{studentError}</p>}
              </div>
            )}
          </div>

          {/* ---------- Lộ trình + tên gói ---------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className={LABEL_CLASS}>Lộ trình</span>
              <select value={learningPathId} onChange={(e) => setLearningPathId(e.target.value)} className={INPUT_CLASS}>
                <option value="">— Tư vấn riêng, không theo lộ trình —</option>
                {paths.map((p) => (
                  <option key={p.learningPathId} value={p.learningPathId}>
                    {p.name}
                    {p.totalSessions ? ` · ${p.totalSessions} buổi` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={LABEL_CLASS}>Tên gói *</span>
              <input
                value={title}
                maxLength={255}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: IELTS 4.0 → 5.5 cấp tốc"
                className={cn(INPUT_CLASS, touched && titleError && 'border-rose-400')}
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className={LABEL_CLASS}>Link phòng học</span>
              <input
                type="url"
                maxLength={500}
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className={INPUT_CLASS}
              />
            </label>
            <label className="space-y-1">
              <span className={LABEL_CLASS}>Ghi chú cho học viên</span>
              <input
                value={note}
                maxLength={2000}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: tập trung Writing Task 2 + phát âm"
                className={INPUT_CLASS}
              />
            </label>
          </div>

          {/* ---------- Các buổi ---------- */}
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className={LABEL_CLASS}>
                Các buổi ({rows.length}
                {requiredSessions ? `/${requiredSessions}` : ''})
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={Repeat}
                  onClick={() => setRows((prev) => weeklyRows(prev[0], requiredSessions ?? Math.max(prev.length, DEFAULT_SESSIONS)))}
                >
                  Lặp hàng tuần từ buổi 1
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={Plus}
                  disabled={rows.length >= MAX_SESSIONS || (requiredSessions != null && rows.length >= requiredSessions)}
                  onClick={() => setRows((prev) => [...prev, { ...prev[prev.length - 1] }])}
                >
                  Thêm buổi
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Chỉ xếp trong 90 ngày tới (đến {new Date(`${bounds.max}T00:00`).toLocaleDateString('vi-VN')}), mỗi buổi 30 – 180 phút.
            </p>
            <ul className="space-y-2">
              {rows.map((r, i) => (
                <li key={i} className="grid grid-cols-[32px_1fr_110px_110px_32px] gap-2 items-start">
                  <span className="h-10 flex items-center justify-center text-xs font-bold text-slate-500">#{i + 1}</span>
                  <input
                    type="date"
                    required
                    min={bounds.min}
                    max={bounds.max}
                    value={r.date}
                    onChange={(e) => updateRow(i, { date: e.target.value })}
                    className={cn(INPUT_CLASS, touched && rowErrors[i] && 'border-rose-400')}
                  />
                  <input type="time" required value={r.startTime} onChange={(e) => updateRow(i, { startTime: e.target.value })} className={INPUT_CLASS} />
                  <input type="time" required value={r.endTime} onChange={(e) => updateRow(i, { endTime: e.target.value })} className={INPUT_CLASS} />
                  <button
                    type="button"
                    disabled={rows.length <= 1}
                    onClick={() => setRows((prev) => prev.filter((_, k) => k !== i))}
                    className="h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30"
                    aria-label="Xóa buổi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {touched && rowErrors[i] && (
                    <p className="col-start-2 col-span-3 text-[11px] text-rose-600 font-semibold -mt-1">{rowErrors[i]}</p>
                  )}
                </li>
              ))}
            </ul>
            {touched && countError && <p className="text-xs text-rose-600 font-semibold">{countError}</p>}
          </div>

          {createMutation.isError && (
            <p className="text-xs text-rose-600 font-semibold">{getErrorMessage(createMutation.error)}</p>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="md" onClick={onClose}>
              Đóng
            </Button>
            <Button type="submit" variant="primary" size="md" leftIcon={CalendarPlus} isLoading={createMutation.isPending}>
              Tạo gói & gửi học viên
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlanModal;
