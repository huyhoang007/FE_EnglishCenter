import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import {
  Award,
  Building,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Info,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { getMentor } from '@/shared/api/domainApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';

export const MentorDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();

  const query = useQuery({
    queryKey: QUERY_KEYS.mentor.detail(id),
    queryFn: () => getMentor(id),
    enabled: Boolean(id),
  });

  if (query.isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        <div className="w-8 h-8 mx-auto border-3 border-[#0052CC] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold">Đang tải hồ sơ giảng viên…</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <Card className="text-center py-12">
          <GraduationCap className="w-12 h-12 mx-auto text-rose-300 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Không tìm thấy thông tin giảng viên</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Hồ sơ mentor không tồn tại hoặc đã bị thu hồi.
          </p>
          <Link to="/mentors">
            <Button variant="secondary" size="sm" leftIcon={ArrowLeft}>
              Quay lại danh sách Mentor
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const mentor = query.data;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link
        to="/mentors"
        className="inline-flex items-center gap-2 text-xs font-bold text-[#0052CC] hover:text-[#0040A8] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách Giảng viên
      </Link>

      <Card className="!p-8 overflow-hidden relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-6 border-b border-slate-100">
          <img
            src={
              mentor.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(mentor.email)}`
            }
            alt={mentor.fullName}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-blue-50 object-cover shadow-md shrink-0"
          />

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {mentor.fullName}
              </h1>
              <Badge variant="success" size="sm" icon={CheckCircle2}>
                Verified Mentor
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-[#0052CC] text-xs font-bold">
                <Award className="w-3.5 h-3.5" />
                {mentor.specialization}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {mentor.department}
              </span>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {mentor.email}
            </p>
          </div>
        </div>

        {/* Pricing & Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-6 border-b border-slate-100">
          <div className="p-4 rounded-2xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Học phí giảng dạy
            </span>
            <p className="text-lg font-black text-slate-900 mt-1">
              {mentor.hourlyRate?.toLocaleString('vi-VN')} ₫
              <span className="text-xs font-normal text-slate-500"> / giờ</span>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Hình thức học
            </span>
            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              1-kèm-1 Trực tuyến
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Khoa trực thuộc
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">
              {mentor.department}
            </p>
          </div>
        </div>

        {/* Biography */}
        <div className="py-6 space-y-3">
          <h2 className="text-base font-bold text-slate-900">Giới thiệu & Triết lý giảng dạy</h2>
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            {mentor.biography ||
              'Giảng viên chưa cập nhật phần giới thiệu chi tiết. Vui lòng liên hệ trung tâm để nhận lộ trình học tập cá nhân hóa cùng giảng viên này.'}
          </div>
        </div>

        {/* Đặt lịch 1-1 với giảng viên này (Dev 5) */}
        <div className="mt-2 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="font-bold">Chức năng đặt lịch học 1-kèm-1:</p>
            <p className="text-amber-800 leading-normal">
              Xem các khung giờ trống của giảng viên và đặt buổi kèm riêng phù hợp với bạn.
            </p>
          </div>
          <Link to={`/schedule?mentorId=${mentor.userId}`} className="shrink-0">
            <Button variant="primary" size="sm">
              Đặt lịch 1-1
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default MentorDetailPage;
