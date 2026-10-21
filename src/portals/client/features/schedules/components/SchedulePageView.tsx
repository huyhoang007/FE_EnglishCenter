/**
 * SchedulePageView — Lịch học & Đặt hẹn Giảng viên 1-1
 * -----------------------------------------------------------
 * Phần 1: Buổi học sắp diễn ra (card nổi bật + nút tham gia phòng học)
 * Phần 2: Đặt lịch kèm riêng 1-1 (chọn ngày, chọn khung giờ,
 *          tóm tắt + mở hộp thoại VietQR thanh toán)
 */

import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  Video,
  Sparkles,
  Star,
  CheckCircle2,
  X,
  ShieldCheck,
  Copy,
  Check,
  Banknote,
  ArrowRight,
  User,
} from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils';
import { formatVND } from '@/shared/utils';
import { useQuery } from '@tanstack/react-query';
import { getMentors } from '@/shared/api/domainApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

/* ============================================================
 *  Dữ liệu mẫu
 * ============================================================ */
const UPCOMING_SESSION = {
  id: 'ses_001',
  dateLabel: 'Hôm nay',
  dateIso: '2026-10-11',
  startTime: '19:30',
  endTime: '20:30',
  topic: 'Luyện phản xạ Speaking Part 2 & 3',
  mentor: {
    fullName: 'David Smith',
    title: 'Chuyên gia IELTS · 8.5 Overall',
    avatarUrl:
      'https://api.dicebear.com/7.x/avataaars/svg?seed=david&backgroundColor=c0aede',
  },
  roomUrl: '#room-001',
};

const MENTOR_FOR_BOOKING = {
  id: 'mnt_david_smith',
  fullName: 'David Smith',
  title: 'Chuyên gia IELTS · 8.5 Overall',
  avatarUrl:
    'https://api.dicebear.com/7.x/avataaars/svg?seed=david&backgroundColor=c0aede',
  rating: 4.9,
  ratingCount: 1284,
  pricePerHour: 300000,
  bio: 'Hơn 10 năm đào tạo IELTS cho học viên Việt Nam, từng là cựu giám khảo IDP.',
};

type SlotStatus = 'BOOKED' | 'AVAILABLE';

interface Slot {
  start: string;
  end: string;
  status: SlotStatus;
}

const DAY_LABELS = [
  { short: 'T2', full: 'Thứ 2' },
  { short: 'T3', full: 'Thứ 3' },
  { short: 'T4', full: 'Thứ 4' },
  { short: 'T5', full: 'Thứ 5' },
  { short: 'T6', full: 'Thứ 6' },
  { short: 'T7', full: 'Thứ 7' },
  { short: 'CN', full: 'Chủ Nhật' },
];

/** Khung giờ mở theo từng ngày (key: index 0..6 — T2..CN) */
const SLOTS_BY_DAY: Record<number, Slot[]> = {
  0: [
    { start: '09:00', end: '10:00', status: 'BOOKED' },
    { start: '14:00', end: '15:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'AVAILABLE' },
  ],
  1: [
    { start: '09:00', end: '10:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'BOOKED' },
  ],
  2: [
    { start: '14:00', end: '15:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'AVAILABLE' },
  ],
  3: [
    { start: '09:00', end: '10:00', status: 'AVAILABLE' },
    { start: '14:00', end: '15:00', status: 'BOOKED' },
  ],
  4: [
    { start: '14:00', end: '15:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'AVAILABLE' },
  ],
  5: [
    { start: '09:00', end: '10:00', status: 'AVAILABLE' },
  ],
  6: [
    { start: '14:00', end: '15:00', status: 'AVAILABLE' },
    { start: '19:30', end: '20:30', status: 'AVAILABLE' },
  ],
};

/* ============================================================
 *  Component chính
 * ============================================================ */
export const SchedulePageView: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Query real mentor from backend
  const { data: mentorsData } = useQuery({
    queryKey: QUERY_KEYS.mentor.directory({ page: 0 }),
    queryFn: () => getMentors({ page: 0, size: 5 }),
  });

  const realMentor = mentorsData?.data?.[0];

  const mentorForBooking = useMemo(() => {
    if (realMentor) {
      return {
        id: realMentor.userId,
        fullName: realMentor.fullName,
        title: realMentor.specialization || realMentor.department || 'Chuyên gia IELTS',
        avatarUrl:
          realMentor.avatarUrl ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(realMentor.email)}`,
        rating: realMentor.ratingAverage || 5.0,
        ratingCount: 120,
        pricePerHour: realMentor.hourlyRate || 300000,
        bio:
          realMentor.biography ||
          'Giảng viên giàu kinh nghiệm luyện thi chứng chỉ quốc tế IELTS/TOEIC/VSTEP tại PrepMaster.',
      };
    }
    return MENTOR_FOR_BOOKING;
  }, [realMentor]);

  const slots = useMemo(() => SLOTS_BY_DAY[selectedDay] ?? [], [selectedDay]);

  const handleSelectSlot = (slot: Slot) => {
    if (slot.status === 'BOOKED') return;
    setSelectedSlot(slot);
  };

  return (
    <div className="space-y-6">
      {/* ============== HEADER ============== */}
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <Calendar className="w-3.5 h-3.5" />
          Lịch học & Đặt hẹn
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Lịch học và đặt hẹn Giảng viên 1-1
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Theo dõi buổi học sắp tới và đặt lịch kèm riêng với giảng viên
          chuyên môn cao theo khung giờ phù hợp với bạn.
        </p>
      </header>

      {/* ============== SECTION 1: BUỔI HỌC SẮP DIỄN RA ============== */}
      <section aria-label="Buổi học sắp diễn ra">
        <SectionHeader
          title="Buổi học sắp diễn ra"
          subtitle="Buổi hẹn gần nhất với giảng viên của bạn"
        />
        <Card hoverable className="relative overflow-hidden p-0">
          <div className="absolute -top-20 -right-16 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-ai/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center gap-5">
            {/* Time block */}
            <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-1 md:w-48 shrink-0">
              <Badge variant="primary" size="md" icon={Clock}>
                {UPCOMING_SESSION.dateLabel}
              </Badge>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
                {UPCOMING_SESSION.startTime}
                <span className="text-slate-400 font-bold text-base mx-1">
                  –
                </span>
                {UPCOMING_SESSION.endTime}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                60 phút · Phòng học trực tuyến
              </p>
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px self-stretch bg-slate-200" />

            {/* Mentor + topic */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={UPCOMING_SESSION.mentor.avatarUrl}
                  alt={UPCOMING_SESSION.mentor.fullName}
                  className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-md"
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Giảng viên hướng dẫn
                  </p>
                  <p className="font-extrabold text-slate-900 truncate">
                    Thầy {UPCOMING_SESSION.mentor.fullName}
                  </p>
                  <p className="text-xs text-ai font-semibold truncate">
                    {UPCOMING_SESSION.mentor.title}
                  </p>
                </div>
              </div>

              <div className="rounded-input bg-slate-50 border border-slate-200/70 p-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-0.5">
                  Nội dung buổi kèm
                </p>
                <p className="text-sm font-bold text-slate-800">
                  {UPCOMING_SESSION.topic}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 flex flex-col items-stretch md:items-end gap-2">
              <Button
                variant="success"
                size="lg"
                leftIcon={Video}
                rightIcon={ArrowRight}
                onClick={() => window.open(UPCOMING_SESSION.roomUrl, '_self')}
                className="relative"
              >
                <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-200" />
                </span>
                Tham gia phòng học trực tuyến
              </Button>
              <p className="text-[11px] text-slate-500 text-center md:text-right">
                Vui lòng vào phòng trước giờ hẹn 5 phút
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* ============== SECTION 2: ĐẶT LỊCH KÈM RIÊNG 1-1 ============== */}
      <section aria-label="Đặt lịch kèm riêng 1-1">
        <SectionHeader
          title="Đặt lịch kèm riêng 1-1"
          subtitle="Chọn ngày trong tuần và khung giờ phù hợp để đặt buổi kèm riêng"
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
          {/* ==== LEFT: Mentor card + Date strip + Slot grid ==== */}
          <div className="space-y-5 min-w-0">
            <Card>
              <div className="flex items-start gap-4">
                <img
                  src={mentorForBooking.avatarUrl}
                  alt={mentorForBooking.fullName}
                  className="w-16 h-16 rounded-full bg-slate-100 border-2 border-white shadow-md shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-slate-900">
                      Thầy {mentorForBooking.fullName}
                    </h3>
                    <Badge variant="ai" size="sm" icon={Sparkles}>
                      Top Mentor
                    </Badge>
                  </div>
                  <p className="text-xs text-ai font-semibold mt-0.5">
                    {mentorForBooking.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {mentorForBooking.bio}
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                      <Star
                        className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                      />
                      {mentorForBooking.rating.toFixed(1)}
                      <span className="text-slate-500 font-medium">
                        ({mentorForBooking.ratingCount.toLocaleString('vi-VN')} đánh giá)
                      </span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-extrabold text-primary">
                      {formatVND(mentorForBooking.pricePerHour)}/giờ
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Date strip */}
            <Card>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3">
                Chọn ngày học trong tuần
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {DAY_LABELS.map((d, idx) => {
                  const active = idx === selectedDay;
                  return (
                    <button
                      key={d.full}
                      type="button"
                      onClick={() => {
                        setSelectedDay(idx);
                        setSelectedSlot(null);
                      }}
                      className={cn(
                        'shrink-0 w-16 h-20 rounded-input border flex flex-col items-center justify-center transition-all',
                        active
                          ? 'border-primary bg-primary-tint ring-2 ring-primary/20'
                          : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-extrabold uppercase tracking-wider',
                          active ? 'text-primary' : 'text-slate-400',
                        )}
                      >
                        {d.short}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-extrabold mt-1',
                          active ? 'text-primary' : 'text-slate-800',
                        )}
                      >
                        Ngày {idx + 1 < 8 ? String(idx + 2) : idx === 6 ? '1' : '8'}
                      </span>
                      <span
                        className={cn(
                          'text-[9px] mt-0.5',
                          active ? 'text-primary font-bold' : 'text-slate-400',
                        )}
                      >
                        {SLOTS_BY_DAY[idx]?.filter((s) => s.status === 'AVAILABLE').length ?? 0}{' '}
                        khung giờ
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Slot grid */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                  Khung giờ mở · {DAY_LABELS[selectedDay].full}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-slate-200" />
                    Đã có người đặt
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-status-success" />
                    Còn trống
                  </span>
                </div>
              </div>

              {slots.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  Giảng viên chưa mở khung giờ cho ngày này.
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {slots.map((slot) => {
                    const active =
                      selectedSlot?.start === slot.start &&
                      selectedSlot?.end === slot.end;
                    const booked = slot.status === 'BOOKED';
                    return (
                      <button
                        key={`${slot.start}-${slot.end}`}
                        type="button"
                        disabled={booked}
                        onClick={() => handleSelectSlot(slot)}
                        className={cn(
                          'h-14 rounded-input border flex items-center justify-center gap-1.5 font-bold text-sm transition-all',
                          booked
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : active
                              ? 'border-status-success bg-status-success-bg text-status-success ring-2 ring-status-success/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-status-success/40 hover:bg-status-success-bg/40',
                        )}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span className="tabular-nums">
                          {slot.start} – {slot.end}
                        </span>
                        {booked && (
                          <span className="ml-1 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
                            Đã đặt
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* ==== RIGHT: Tóm tắt đặt lịch ==== */}
          <aside className="lg:sticky lg:top-[112px] rounded-card border border-slate-200/80 bg-white shadow-elevation h-fit">
            <div className="p-5 border-b border-slate-100">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                Tóm tắt đặt lịch
              </p>
              <h3 className="mt-1 text-base font-extrabold text-slate-900">
                Phiên kèm riêng 1-1
              </h3>
            </div>

            <div className="p-5 space-y-4">
              <SummaryRow
                label="Giảng viên"
                value={`Thầy ${mentorForBooking.fullName}`}
                icon={User}
              />
              <SummaryRow
                label="Ngày học"
                value={
                  selectedSlot
                    ? `${DAY_LABELS[selectedDay].full} tuần này`
                    : 'Chưa chọn ngày'
                }
                icon={Calendar}
              />
              <SummaryRow
                label="Khung giờ"
                value={
                  selectedSlot
                    ? `${selectedSlot.start} – ${selectedSlot.end}`
                    : 'Chưa chọn giờ'
                }
                icon={Clock}
              />
              <SummaryRow
                label="Hình thức"
                value="Trực tuyến (Video call)"
                icon={Video}
              />

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Học phí</span>
                <span className="text-lg font-extrabold text-primary">
                  {formatVND(mentorForBooking.pricePerHour)}
                </span>
              </div>

              <Button
                variant="ai"
                size="lg"
                fullWidth
                rightIcon={ArrowRight}
                disabled={!selectedSlot}
                onClick={() => setShowCheckout(true)}
              >
                Xác nhận & Thanh toán học phí
              </Button>
              <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                Hệ thống sẽ gửi xác nhận qua email & thông báo sau khi thanh
                toán thành công.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* ============== CHECKOUT MODAL (VietQR) ============== */}
      {showCheckout && selectedSlot && (
        <VietQRModal
          dayLabel={DAY_LABELS[selectedDay].full}
          slot={selectedSlot}
          amount={mentorForBooking.pricePerHour}
          onClose={() => setShowCheckout(false)}
        />
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
  <div className="mb-3">
    <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
      {title}
    </h2>
    <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
  </div>
);

const SummaryRow: React.FC<{
  label: string;
  value: string;
  icon: React.ElementType;
}> = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-2.5">
    <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
      <Icon className="w-3.5 h-3.5" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
        {value}
      </p>
    </div>
  </div>
);

/* ============================================================
 *  VietQRModal — hộp thoại thanh toán học phí 1-1
 * ============================================================ */
const VietQRModal: React.FC<{
  dayLabel: string;
  slot: Slot;
  amount: number;
  onClose: () => void;
}> = ({ dayLabel, slot, amount, onClose }) => {
  const orderCode = useMemo(
    () =>
      `1ON1-${Date.now().toString().slice(-8)}`,
    [],
  );
  const description = `PREP 1ON1 ${orderCode}`;
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);

  const qrSvg = useMemo(() => {
    const size = 21;
    let cells = '';
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const v = (x * 31 + y * 17 + orderCode.charCodeAt((x + y) % orderCode.length)) % 5;
        const corner =
          (x < 7 && y < 7) ||
          (x >= size - 7 && y < 7) ||
          (x < 7 && y >= size - 7);
        const border =
          corner &&
          ((x === 0 || x === 6 || x === size - 1 || x === size - 7) ||
            (y === 0 || y === 6 || y === size - 1 || y === size - 7));
        const center = corner && x >= 2 && x <= 4 && y >= 2 && y <= 4;
        const data = v < 2 && !corner;
        if (data || border || center) {
          cells += `<rect x="${x * 8}" y="${y * 8}" width="8" height="8" fill="#0F172A"/>`;
        }
      }
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 ${size * 8} ${size * 8}">${cells}</svg>`,
    )}`;
  }, [orderCode]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white rounded-card shadow-elevation border border-slate-200 overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-status-success-bg flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-status-success" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Đặt lịch thành công!
            </h3>
            <p className="text-sm text-slate-600 mt-2 max-w-sm mx-auto">
              Buổi kèm 1-1 của bạn đã được ghi nhận. Chúng tôi sẽ gửi lời nhắc
              trước buổi học 30 phút.
            </p>
            <Button
              variant="primary"
              size="md"
              className="mt-6"
              onClick={onClose}
            >
              Đóng
            </Button>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-primary-tint/50 to-ai/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-ai-gradient flex items-center justify-center shadow-ai-glow">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-slate-900">
                    Thanh toán học phí 1-1
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Cổng VietQR · Tự động xác nhận
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Left — info */}
              <div className="space-y-3">
                <div className="rounded-input bg-slate-50 border border-slate-200/70 p-3 space-y-1.5">
                  <Row label="Buổi học" value={`${dayLabel} · ${slot.start} – ${slot.end}`} />
                  <Row label="Mã đơn" value={orderCode} mono />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    Số tiền
                  </p>
                  <p className="text-2xl font-extrabold text-primary tabular-nums">
                    {formatVND(amount)}
                  </p>
                </div>
                <CopyLine
                  label="Số tài khoản"
                  value="0000123456789"
                  copied={copied}
                  onCopy={() => handleCopy('0000123456789')}
                />
                <CopyLine
                  label="Nội dung (bắt buộc)"
                  value={description}
                  copied={copied}
                  onCopy={() => handleCopy(description)}
                  highlight
                />
              </div>

              {/* Right — QR */}
              <div className="rounded-input border-2 border-primary/30 bg-white p-3 text-center">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider mb-2">
                  <span className="text-primary inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary rounded-sm" />
                    VietQR
                  </span>
                  <span className="text-status-danger inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-status-danger rounded-sm" />
                    Napas247
                  </span>
                </div>
                <img src={qrSvg} alt="VietQR" className="w-full aspect-square" />
                <p className="text-[10px] text-slate-500 mt-2 leading-snug">
                  Mở ứng dụng ngân hàng để quét mã thanh toán
                </p>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-status-success" />
              <span className="text-xs text-slate-600 flex-1">
                Hệ thống sẽ tự động xác nhận trong vòng 3 giây sau khi nhận
                được chuyển khoản.
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={() => setSuccess(true)}
              >
                Tôi đã thanh toán
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <div>
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
      {label}
    </p>
    <p
      className={cn(
        'text-sm font-bold text-slate-800 truncate',
        mono && 'font-mono',
      )}
    >
      {value}
    </p>
  </div>
);

const CopyLine: React.FC<{
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  highlight?: boolean;
}> = ({ label, value, copied, onCopy, highlight }) => (
  <div
    className={cn(
      'rounded-md p-2.5 flex items-center justify-between gap-2',
      highlight
        ? 'bg-status-danger-bg border border-red-200'
        : 'bg-slate-50 border border-slate-200/70',
    )}
  >
    <div className="min-w-0 flex-1">
      <p
        className={cn(
          'text-[10px] font-extrabold uppercase tracking-widest',
          highlight ? 'text-status-danger' : 'text-slate-500',
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          'font-mono font-bold text-sm truncate',
          highlight ? 'text-status-danger' : 'text-slate-800',
        )}
      >
        {value}
      </p>
    </div>
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold shrink-0',
        copied
          ? 'bg-status-success text-white'
          : highlight
            ? 'bg-white text-status-danger border border-red-200 hover:bg-red-50'
            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary',
      )}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Đã sao chép
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          Sao chép
        </>
      )}
    </button>
  </div>
);

export default SchedulePageView;
