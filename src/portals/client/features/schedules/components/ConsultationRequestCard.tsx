/**
 * ConsultationRequestCard — Học viên để lại SĐT nhờ mentor tư vấn lộ trình (Dev 5, V21)
 * -----------------------------------------------------------
 * Đăng ký tài khoản không còn ô SĐT, nên chỉ hỏi SĐT ở đây khi người học thật sự cần tư vấn.
 * - Chưa gửi / yêu cầu cũ đã kết thúc: form SĐT + ghi chú → mọi mentor nhận được thông báo.
 * - Đang chờ / mentor đang liên hệ: hiện trạng thái, cho sửa SĐT.
 * - Đã chốt: mentor tạo gói kèm 1-1 → nút sang trang Mentor 1-1 để xem lịch và thanh toán.
 * Chỉ hiện cho Learner (USER) / Student đã đăng nhập.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Headset, Phone } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { cn } from '@/shared/utils/cn';
import {
  CONSULTATION_STATUS_LABEL,
  CONSULTATION_STATUS_VARIANT,
  useMyConsultation,
  useMyPlans,
  useRequestConsultation,
} from '@/shared/schedule';

/** Khớp BE: 0xxxxxxxxx hoặc +84xxxxxxxxx (9 – 10 số sau đầu số) */
const PHONE_PATTERN = /^(\+84|0)[0-9]{9,10}$/;

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
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setPhone(consultation?.phone ?? profilePhone ?? '');
    setNote(consultation && isOpen ? consultation.note ?? '' : '');
  }, [consultation, isOpen, profilePhone]);

  if (!isLearner) return null;

  const phoneError = !PHONE_PATTERN.test(phone.trim()) ? 'Số điện thoại không hợp lệ (VD 0912345678)' : '';
  const showForm = !consultation || !isOpen || editing;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (phoneError) return;
    requestMutation.mutate(
      { phone: phone.trim(), note: note.trim() || undefined },
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
          <p className="text-sm text-slate-600 mt-0.5">Mentor sẽ liên hệ với bạn qua số điện thoại này.</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-base text-slate-700">
          <p className="flex-1 flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-slate-400" /> <b>{consultation.phone}</b>
            {consultation.mentorName ? ` · Mentor ${consultation.mentorName} đang liên hệ bạn` : ' · Đang chờ mentor nhận'}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Sửa SĐT / ghi chú
          </Button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-[220px_1fr_auto] gap-2 items-start">
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
            placeholder="Ghi chú (không bắt buộc)"
            className="w-full h-11 px-3 rounded-lg border border-slate-200 text-base bg-white focus:outline-none focus:border-[#0052CC]"
          />
          <Button type="submit" variant="primary" size="md" isLoading={requestMutation.isPending}>
            {consultation && isOpen ? 'Cập nhật' : 'Gửi thông tin'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ConsultationRequestCard;
