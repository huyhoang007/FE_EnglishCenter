/**
 * StudyScheduleView — Lịch học cá nhân của người học (Dev 5 — TASK-D5-01)
 * -----------------------------------------------------------
 * Chỉ USER / STUDENT (BE chặn role khác). Vào từ dropdown avatar → "Study Schedule".
 * - Tạo lịch: tiêu đề, ngày giờ (phải ở tương lai), lặp lại none/daily/weekly, nhắc trước 0-1440 phút.
 * - Danh sách 30 ngày tới (mặc định của BE), lọc theo trạng thái, phân trang.
 * - Đánh dấu Đã học / Bỏ qua / Mở lại, sửa, xóa.
 * BE tự gửi thông báo nhắc học (StudyReminderJob); lịch lặp đã qua giờ tự dời sang kỳ sau.
 * Thời gian nhập theo giờ máy, gửi BE dạng UTC.
 */

import React, { useState } from 'react';
import { BellRing, CalendarClock, CalendarPlus, Check, Edit2, Repeat, RotateCcw, SkipForward, Trash2 } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { Pagination } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { cn } from '@/shared/utils/cn';
import {
  REPEAT_RULE_LABEL,
  STUDY_STATUS_LABEL,
  STUDY_STATUS_VARIANT,
  formatDayLabel,
  formatTime,
  toDateInput,
  toTimeInput,
  toUtcIso,
  weekdayFull,
  useCreateStudySchedule,
  useDeleteStudySchedule,
  useMyStudySchedules,
  useUpdateStudySchedule,
  useUpdateStudyStatus,
} from '@/shared/schedule';
import type { StudyRepeatRule, StudySchedule, StudySchedulePayload, StudyStatus } from '@/shared/types';

const INPUT_CLASS =
  'w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#0052CC]';
const LABEL_CLASS = 'text-xs text-slate-500 font-semibold uppercase tracking-wider';

/** Tab lọc trạng thái ('' = tất cả) */
const STATUS_TABS: [StudyStatus | '', string][] = [
  ['', 'Tất cả'],
  ['pending', STUDY_STATUS_LABEL.pending],
  ['done', STUDY_STATUS_LABEL.done],
  ['skipped', STUDY_STATUS_LABEL.skipped],
  ['cancelled', STUDY_STATUS_LABEL.cancelled],
];

const REPEAT_OPTIONS: StudyRepeatRule[] = ['none', 'daily', 'weekly'];

/** Mặc định của BE khi không gửi số phút nhắc */
const DEFAULT_REMINDER_MINUTES = 15;

interface FormState {
  title: string;
  date: string;
  time: string;
  repeatRule: StudyRepeatRule;
  reminderMinutesBefore: number;
}

const toPayload = (form: FormState): StudySchedulePayload => ({
  title: form.title.trim(),
  scheduledTime: toUtcIso(form.date, form.time),
  repeatRule: form.repeatRule,
  reminderMinutesBefore: form.reminderMinutesBefore,
});

const StudyScheduleView: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <CalendarClock className="w-3.5 h-3.5" />
          Study Schedule
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lịch học của tôi
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Tự đặt giờ học cho bản thân, hệ thống sẽ gửi thông báo nhắc trước giờ học.
        </p>
      </header>

      <CreateScheduleCard />
      <ScheduleListCard />
    </div>
  );
};

/* ============================================================
 *  Tạo lịch học mới
 * ============================================================ */
const CreateScheduleCard: React.FC = () => {
  const toast = useToast();
  const createMutation = useCreateStudySchedule();
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (form: FormState) => {
    createMutation.mutate(toPayload(form), {
      onSuccess: () => {
        toast.success('Đã tạo lịch học');
        // Reset form sau khi tạo
        setFormKey((k) => k + 1);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold text-slate-900">Thêm lịch học</h2>
        <span className="text-xs text-slate-400 font-medium">Giờ học phải ở tương lai</span>
      </div>
      <ScheduleForm
        key={formKey}
        layout="inline"
        submitLabel="Thêm lịch"
        isLoading={createMutation.isPending}
        onSubmit={handleSubmit}
      />
    </Card>
  );
};

/* ============================================================
 *  Danh sách lịch học (30 ngày tới)
 * ============================================================ */
const ScheduleListCard: React.FC = () => {
  const toast = useToast();
  const [status, setStatus] = useState<StudyStatus | ''>('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<StudySchedule | null>(null);
  const [deleting, setDeleting] = useState<StudySchedule | null>(null);

  const listQuery = useMyStudySchedules(status || undefined, page);
  const statusMutation = useUpdateStudyStatus();
  const deleteMutation = useDeleteStudySchedule();
  const schedules = listQuery.data?.data ?? [];

  const handleStatus = (schedule: StudySchedule, next: StudyStatus) => {
    statusMutation.mutate(
      { scheduleId: schedule.scheduleId, status: next },
      {
        onSuccess: () => toast.success(`Đã chuyển sang "${STUDY_STATUS_LABEL[next]}"`),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.scheduleId, {
      onSuccess: () => {
        toast.success('Đã xóa lịch học');
        setDeleting(null);
      },
      onError: (err) => toast.error(getErrorMessage(err)),
    });
  };

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Lịch sắp tới</h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Từ hôm nay đến 30 ngày tới</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(([value, label]) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(0);
              }}
              className={cn(
                'h-8 px-3 rounded-lg text-xs font-semibold transition-colors',
                status === value ? 'bg-[#0052CC] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {listQuery.isLoading ? (
        <p className="py-10 text-center text-slate-400 text-xs">Đang tải lịch học…</p>
      ) : listQuery.isError ? (
        <p className="py-10 text-center text-rose-600 text-xs">{getErrorMessage(listQuery.error)}</p>
      ) : schedules.length === 0 ? (
        <p className="py-10 text-center text-slate-400 text-xs">Chưa có lịch học nào.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {schedules.map((item) => (
            <li key={item.scheduleId} className="py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                  <Badge variant={STUDY_STATUS_VARIANT[item.status]} size="sm">
                    {STUDY_STATUS_LABEL[item.status]}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="tabular-nums font-semibold text-slate-700">
                    {formatDayLabel(item.scheduledTime)} · {formatTime(item.scheduledTime)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    {REPEAT_RULE_LABEL[item.repeatRule]}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BellRing className="w-3 h-3" />
                    Nhắc trước {item.reminderMinutesBefore} phút
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.status === 'pending' ? (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      leftIcon={Check}
                      disabled={statusMutation.isPending}
                      onClick={() => handleStatus(item, 'done')}
                    >
                      Đã học
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={SkipForward}
                      disabled={statusMutation.isPending}
                      onClick={() => handleStatus(item, 'skipped')}
                    >
                      Bỏ qua
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={RotateCcw}
                    disabled={statusMutation.isPending}
                    onClick={() => handleStatus(item, 'pending')}
                  >
                    Mở lại
                  </Button>
                )}
                <IconButton title="Sửa" onClick={() => setEditing(item)} className="text-blue-600 hover:bg-blue-50">
                  <Edit2 className="w-3.5 h-3.5" />
                </IconButton>
                <IconButton title="Xóa" onClick={() => setDeleting(item)} className="text-rose-500 hover:bg-rose-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination className="mt-4" currentPage={page} totalPages={listQuery.data?.totalPages ?? 0} onChange={setPage} />

      {editing && <EditScheduleModal schedule={editing} onClose={() => setEditing(null)} />}

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Xóa lịch học"
        description={
          deleting
            ? `Xóa lịch "${deleting.title}" lúc ${formatDayLabel(deleting.scheduledTime)} · ${formatTime(deleting.scheduledTime)}?`
            : undefined
        }
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
      />
    </Card>
  );
};

/* ============================================================
 *  Sửa lịch học
 * ============================================================ */
const EditScheduleModal: React.FC<{ schedule: StudySchedule; onClose: () => void }> = ({ schedule, onClose }) => {
  const toast = useToast();
  const updateMutation = useUpdateStudySchedule();

  const handleSubmit = (form: FormState) => {
    updateMutation.mutate(
      {
        scheduleId: schedule.scheduleId,
        // Giữ bài học đã gắn (nếu có), form không sửa trường này
        payload: { ...toPayload(form), lessonContentId: schedule.lessonContentId ?? undefined },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật lịch học');
          onClose();
        },
      },
    );
  };

  return (
    <Modal open onClose={onClose} title="Sửa lịch học" icon={CalendarClock} maxWidth="sm">
      <ScheduleForm
        layout="stacked"
        initial={{
          title: schedule.title,
          date: toDateInput(schedule.scheduledTime),
          time: toTimeInput(schedule.scheduledTime),
          repeatRule: schedule.repeatRule,
          reminderMinutesBefore: schedule.reminderMinutesBefore,
        }}
        submitLabel="Lưu thay đổi"
        isLoading={updateMutation.isPending}
        errorMessage={updateMutation.isError ? getErrorMessage(updateMutation.error) : null}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
};

/* ============================================================
 *  Sub components
 * ============================================================ */

/** Form dùng chung cho tạo (inline) và sửa (trong modal) */
const ScheduleForm: React.FC<{
  layout: 'inline' | 'stacked';
  initial?: FormState;
  submitLabel: string;
  isLoading: boolean;
  errorMessage?: string | null;
  onSubmit: (form: FormState) => void;
  onCancel?: () => void;
}> = ({ layout, initial, submitLabel, isLoading, errorMessage, onSubmit, onCancel }) => {
  const [form, setForm] = useState<FormState>(
    initial ?? {
      title: '',
      date: toDateInput(new Date().toISOString()),
      time: '20:00',
      repeatRule: 'none',
      reminderMinutesBefore: DEFAULT_REMINDER_MINUTES,
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inline = layout === 'inline';
  // Lịch lặp: BE lưu 1 mốc = buổi đầu tiên, qua giờ thì tự dời sang ngày / tuần kế tiếp
  const repeating = form.repeatRule !== 'none';
  const repeatHint =
    form.repeatRule === 'daily'
      ? `Học lúc ${form.time} mỗi ngày, bắt đầu từ ${formatDateInput(form.date)}.`
      : form.repeatRule === 'weekly'
        ? `Học lúc ${form.time} mỗi ${weekdayFull(new Date(`${form.date}T00:00`))}, bắt đầu từ ${formatDateInput(form.date)}.`
        : null;

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3">
      <div
        className={cn(
          'gap-3',
          inline ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_140px_150px_140px_130px_auto] items-end' : 'space-y-3',
        )}
      >
        <label className="block space-y-1">
          <span className={LABEL_CLASS}>Nội dung</span>
          <input
            type="text"
            required
            maxLength={255}
            placeholder="Vd: Ôn 20 từ vựng IELTS"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={INPUT_CLASS}
          />
        </label>
        {/* Chọn kiểu lặp trước, nhãn ô ngày đổi theo */}
        <label className="block space-y-1">
          <span className={LABEL_CLASS}>Lặp lại</span>
          <select
            value={form.repeatRule}
            onChange={(e) => setForm({ ...form, repeatRule: e.target.value as StudyRepeatRule })}
            className={INPUT_CLASS}
          >
            {REPEAT_OPTIONS.map((rule) => (
              <option key={rule} value={rule}>
                {REPEAT_RULE_LABEL[rule]}
              </option>
            ))}
          </select>
        </label>
        <div className={cn(inline ? 'contents' : 'grid grid-cols-2 gap-3')}>
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>{repeating ? 'Bắt đầu từ' : 'Ngày'}</span>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className={INPUT_CLASS}
            />
          </label>
          <label className="block space-y-1">
            <span className={LABEL_CLASS}>Giờ</span>
            <input
              type="time"
              required
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className={INPUT_CLASS}
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className={LABEL_CLASS}>Nhắc trước</span>
          <div className="relative">
            <input
              type="number"
              required
              min={0}
              max={1440}
              value={form.reminderMinutesBefore}
              onChange={(e) => setForm({ ...form, reminderMinutesBefore: Number(e.target.value) })}
              className={cn(INPUT_CLASS, 'pr-12')}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
              phút
            </span>
          </div>
        </label>

        {inline && (
          <Button type="submit" variant="primary" size="md" leftIcon={CalendarPlus} isLoading={isLoading}>
            {submitLabel}
          </Button>
        )}
      </div>

      {repeatHint && (
        <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
          <Repeat className="w-3.5 h-3.5 text-[#0052CC]" />
          {repeatHint}
        </p>
      )}

      {errorMessage && <p className="text-xs text-rose-600 font-semibold">{errorMessage}</p>}

      {!inline && (
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="md" onClick={onCancel}>
            Đóng
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
};

/** "2026-10-29" (giá trị input date) → "29/10/2026" */
const formatDateInput = (date: string): string => {
  const [y, m, d] = date.split('-');
  return y && m && d ? `${d}/${m}/${y}` : date;
};

const IconButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => (
  <button
    type="button"
    className={cn('p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:pointer-events-none', className)}
    {...props}
  >
    {children}
  </button>
);

export default StudyScheduleView;
