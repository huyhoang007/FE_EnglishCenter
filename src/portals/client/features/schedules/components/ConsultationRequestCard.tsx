/**
 * ConsultationRequestCard — Học viên để lại SĐT + lịch rảnh nhờ mentor tư vấn lộ trình (Dev 5, V21 + V26)
 * -----------------------------------------------------------
 * Đăng ký tài khoản không còn ô SĐT, nên chỉ hỏi SĐT ở đây khi người học thật sự cần tư vấn.
 * - Chưa gửi / yêu cầu cũ đã kết thúc: form SĐT + lịch rảnh hằng tuần + ghi chú → mọi mentor nhận được thông báo.
 * - Đang chờ / mentor đang liên hệ: hiện trạng thái + lịch rảnh đã gửi, cho sửa.
 * - Đã chốt: mentor tạo gói kèm 1-1 (xếp buổi theo lịch rảnh, ghi nội dung từng buổi)
 *   → nút sang trang Mentor 1-1 để xem từng buổi học gì và thanh toán.
 * Học viên quyết định THỜI GIAN (lịch rảnh), mentor quyết định NỘI DUNG (lộ trình, từng buổi).
 * Chỉ hiện cho Learner (USER) / Student đã đăng nhập.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Headset, Phone, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import {
  AvailableSlotChips,
  CONSULTATION_STATUS_LABEL,
  CONSULTATION_STATUS_VARIANT,
  DAY_OF_WEEK_ORDER,
  DAY_OF_WEEK_SHORT,
  sortSlots,
  useMyConsultation,
  useMyPlans,
  useRequestConsultation,
  validateSlot,
} from '@/shared/schedule';
import type { AvailableSlot, DayOfWeek } from '@/shared/types';

/** Khớp BE: 0xxxxxxxxx hoặc +84xxxxxxxxx (9 – 10 số sau đầu số) */
const PHONE_PATTERN = /^(\+84|0)[0-9]{9,10}$/;
/** Khớp BE: tối đa 21 khung giờ rảnh */
const MAX_SLOTS = 21;
const DEFAULT_SLOT: AvailableSlot = { day: 'MONDAY', from: '19:00', to: '21:00' };

const INPUT_CLASS =
  'h-10 px-3 rounded-lg border border-slate-200 text-sm font-semibold bg-white focus:outline-none focus:border-[#0052CC]';

export const ConsultationRequestCard: React.FC<{ className?: string; highlight?: boolean }> = ({
  className,
  highlight,
}) => {
  const toast = useToast();
  const role = useAuthStore((s) => s.role);
  const profilePhone = useAuthStore((s) => s.user?.phone ?? '');
  const isLearner = role === 'USER' || role === 'STUDENT';
  const consultationQuery = useMyConsultation(isLearner);
  const plansQuery = useMyPlans(isLearner);
  const requestMutation = useRequestConsultation();

  const consultation = consultationQuery.data ?? null;
  const isOpen = consultation?.status === 'pending' || consultation?.status === 'contacted';
  const pendingPlan = (plansQuery.data ?? []).find((p) => p.status === 'pending_payment');

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([DEFAULT_SLOT]);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setPhone(consultation?.phone ?? profilePhone ?? '');
    setNote(consultation && isOpen ? consultation.note ?? '' : '');
    // Gửi lại / sửa thì điền sẵn lịch rảnh lần trước
    setSlots(consultation?.availableSlots?.length ? sortSlots(consultation.availableSlots) : [DEFAULT_SLOT]);
  }, [consultation, isOpen, profilePhone]);

  if (!isLearner) return null;

  const phoneError = !PHONE_PATTERN.test(phone.trim()) ? 'Số điện thoại không hợp lệ (VD 0912345678)' : '';
  const slotErrors = slots.map(validateSlot);
  const slotsError = slots.length === 0 ? 'Chọn ít nhất 1 khung giờ rảnh' : '';
  const hasError = Boolean(phoneError || slotsError) || slotErrors.some(Boolean);
  const showForm = !consultation || !isOpen || editing;

  const updateSlot = (index: number, patch: Partial<AvailableSlot>) =>
    setSlots((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;
    requestMutation.mutate(
      { phone: phone.trim(), availableSlots: sortSlots(slots), note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Đã gửi yêu cầu, mentor sẽ liên hệ bạn sớm');
          setEditing(false);
          setTouched(false);
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );
  };

  return (
    <div
      className={cn(
        'rounded-2xl border p-5 space-y-3',
        highlight ? 'border-amber-200 bg-amber-50/60' : 'border-slate-200 bg-white',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Headset className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900">Để lại thông tin liên hệ để được tư vấn</h3>
            {consultation && (
              <Badge variant={CONSULTATION_STATUS_VARIANT[consultation.status]} size="sm">
                {CONSULTATION_STATUS_LABEL[consultation.status]}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600 mt-0.5">
            Mentor sẽ gọi tư vấn lộ trình, rồi xếp các buổi học vào khung giờ rảnh bạn chọn. Bạn xem trước từng buổi
            (ngày giờ, nội dung) rồi mới thanh toán.
          </p>
        </div>
      </div>

      {pendingPlan && (
        <div className="rounded-xl bg-white border border-amber-200 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <p className="text-sm text-slate-700 flex-1">
            Mentor <b>{pendingPlan.mentorName}</b> đã tạo gói <b>{pendingPlan.title}</b> ({pendingPlan.totalSessions} buổi)
            cho bạn.
          </p>
          <Link to={CLIENT_ROUTES.schedule}>
            <Button variant="primary" size="sm" rightIcon={ArrowRight}>
              Xem lịch & thanh toán
            </Button>
          </Link>
        </div>
      )}

      {consultation && isOpen && !editing && (
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base text-slate-700">
            <p className="flex-1 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-400" /> <b>{consultation.phone}</b>
              {consultation.mentorName ? ` · Mentor ${consultation.mentorName} đang liên hệ bạn` : ' · Đang chờ mentor nhận'}
            </p>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Sửa SĐT / lịch rảnh
            </Button>
          </div>
          <AvailableSlotChips slots={consultation.availableSlots} label="Lịch rảnh đã gửi" />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-2 items-start">
            <div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Số điện thoại"
                className={cn(
                  'w-full h-11 px-3 rounded-lg border text-base font-semibold bg-white focus:outline-none focus:border-[#0052CC]',
                  touched && phoneError ? 'border-rose-400' : 'border-slate-200',
                )}
              />
              {touched && phoneError && <p className="text-[11px] text-rose-600 font-semibold mt-1">{phoneError}</p>}
            </div>
            <input
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú (không bắt buộc), VD: muốn học 2 buổi/tuần"
              className="w-full h-11 px-3 rounded-lg border border-slate-200 text-base bg-white focus:outline-none focus:border-[#0052CC]"
            />
          </div>

          {/* ---------- Lịch rảnh hằng tuần ---------- */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-sm font-bold text-slate-800">Lịch rảnh hằng tuần *</p>
                <p className="text-[11px] text-slate-500">Giờ Việt Nam. Mentor sẽ ưu tiên xếp buổi học trong các khung này.</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={Plus}
                disabled={slots.length >= MAX_SLOTS}
                onClick={() => setSlots((prev) => [...prev, { ...(prev[prev.length - 1] ?? DEFAULT_SLOT) }])}
              >
                Thêm khung giờ
              </Button>
            </div>
            <ul className="space-y-2">
              {slots.map((slot, i) => (
                <li key={i} className="grid grid-cols-[90px_1fr_1fr_36px] sm:grid-cols-[110px_130px_130px_36px] gap-2 items-start">
                  <select
                    value={slot.day}
                    onChange={(e) => updateSlot(i, { day: e.target.value as DayOfWeek })}
                    className={INPUT_CLASS}
                    aria-label="Thứ"
                  >
                    {DAY_OF_WEEK_ORDER.map((d) => (
                      <option key={d} value={d}>
                        {DAY_OF_WEEK_SHORT[d]}
                      </option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={slot.from}
                    onChange={(e) => updateSlot(i, { from: e.target.value })}
                    className={cn(INPUT_CLASS, touched && slotErrors[i] && 'border-rose-400')}
                    aria-label="Từ"
                  />
                  <input
                    type="time"
                    value={slot.to}
                    onChange={(e) => updateSlot(i, { to: e.target.value })}
                    className={cn(INPUT_CLASS, touched && slotErrors[i] && 'border-rose-400')}
                    aria-label="Đến"
                  />
                  <button
                    type="button"
                    disabled={slots.length <= 1}
                    onClick={() => setSlots((prev) => prev.filter((_, k) => k !== i))}
                    className="h-10 flex items-center justify-center text-rose-500 hover:bg-rose-50 rounded-lg disabled:opacity-30"
                    aria-label="Xóa khung giờ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {touched && slotErrors[i] && (
                    <p className="col-span-4 text-[11px] text-rose-600 font-semibold -mt-1">{slotErrors[i]}</p>
                  )}
                </li>
              ))}
            </ul>
            {touched && slotsError && <p className="text-[11px] text-rose-600 font-semibold">{slotsError}</p>}
          </div>

          <div className="flex justify-end gap-2">
            {editing && (
              <Button variant="ghost" size="md" onClick={() => setEditing(false)}>
                Hủy
              </Button>
            )}
            <Button type="submit" variant="primary" size="md" isLoading={requestMutation.isPending}>
              {consultation && isOpen ? 'Cập nhật' : 'Gửi thông tin'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ConsultationRequestCard;
