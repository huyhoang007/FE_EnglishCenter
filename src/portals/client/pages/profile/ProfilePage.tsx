"use client";

/**
 * ProfilePage — Hồ sơ cá nhân (/profile, /settings)
 * -----------------------------------------------------------
 * 1. Thông tin cá nhân
 * 2. Trình độ & mục tiêu (chỉ USER / STUDENT): band / điểm hiện tại theo bài test gần nhất + mục tiêu,
 *    sửa được mục tiêu (dùng chung TargetGoalFields với Onboarding / Luyện tập AI)
 * 3. Đổi mật khẩu (mọi vai trò)
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Award, BookOpen, KeyRound, Pencil, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { ChangePasswordForm } from '@/shared/components/ChangePasswordForm';
import { TargetGoalFields, type TargetGoal } from '@/shared/components/TargetGoalFields';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { getProfile, updateProfile } from '@/shared/api/domainApi';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { scaleFromCertificate } from '@/shared/constants/examScales';
import { CEFR_LABEL } from '@/portals/client/features/exams/components/PracticeLevelCard';

const ROLE_LABEL: Record<string, string> = {
  USER: 'Học viên tự do',
  STUDENT: 'Học viên',
  MENTOR: 'Mentor',
  ADMIN: 'Quản trị viên',
};

export const ProfilePage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  const isLearner = role === 'USER' || role === 'STUDENT';

  // Trình độ đổi sau mỗi lần làm test → luôn đọc hồ sơ mới nhất từ BE (GET /api/v1/account/me)
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.account.profile,
    queryFn: getProfile,
    enabled: Boolean(authUser),
    initialData: authUser || undefined,
    // User lúc đăng nhập có thể thiếu mục tiêu → luôn tải lại GET /account/me
    initialDataUpdatedAt: 0,
  });
  const { data: certificates = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 5 * 60_000,
  });

  const user = profileQuery.data ?? authUser;
  const currentLevel = user?.currentLevel;
  const currentScore = user?.currentScore ?? null;
  const targetScore = user?.targetScore ?? null;
  const targetCertificate = certificates.find((c) => c.certificateId === user?.targetCertificateId) ?? null;
  // Thang của chứng chỉ mục tiêu (IELTS: Band 0 – 9, TOEIC: Điểm 10 – 990…) — điểm hiện tại BE tính theo thang này
  const scale = useMemo(() => (targetCertificate ? scaleFromCertificate(targetCertificate) : null), [targetCertificate]);
  const unit = scale?.unit && scale.unit !== '%' ? scale.unit : '';
  const formatScore = (n: number) => (n <= 10 ? Number(n).toFixed(1) : String(Math.round(n)));
  const gap =
    currentScore !== null && targetScore !== null
      ? Math.round((Number(targetScore) - Number(currentScore)) * 100) / 100
      : null;

  /* ---------- Sửa mục tiêu ---------- */
  const [isEditingGoal, setEditingGoal] = useState(false);
  const [goal, setGoal] = useState<TargetGoal>({ certificateId: '', score: '' });
  const [goalError, setGoalError] = useState<string | null>(null);

  const openEditGoal = () => {
    setGoal({ certificateId: user?.targetCertificateId ?? '', score: targetScore ?? '' });
    setGoalError(null);
    setEditingGoal(true);
  };

  const saveGoalMutation = useMutation({
    mutationFn: () => {
      if (!goal.certificateId || goal.score === '') {
        throw new Error('Vui lòng chọn chứng chỉ và điểm mục tiêu');
      }
      return updateProfile({ targetCertificateId: goal.certificateId, targetScore: Number(goal.score) });
    },
    onSuccess: (updated) => {
      toast.success('Đã lưu mục tiêu học tập!');
      queryClient.setQueryData(QUERY_KEYS.account.profile, updated);
      useAuthStore.setState((prev) => ({ ...prev, user: prev.user ? { ...prev.user, ...updated } : null }));
      // Gợi ý khóa học / lộ trình đổi theo mục tiêu mới
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.practice.recommendations });
      setEditingGoal(false);
    },
    onError: (err: Error) => setGoalError(err.message || 'Lưu mục tiêu thất bại'),
  });

  const isChangingCertificate =
    isEditingGoal && Boolean(goal.certificateId) && goal.certificateId !== user?.targetCertificateId && Boolean(currentLevel);

  /* ---------- Sửa thông tin cá nhân (Họ tên, SĐT) ---------- */
  const [isEditingInfo, setEditingInfo] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [infoError, setInfoError] = useState<string | null>(null);

  const openEditInfo = () => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setInfoError(null);
    setEditingInfo(true);
  };

  const saveInfoMutation = useMutation({
    mutationFn: () => {
      if (!fullName.trim()) {
        throw new Error('Họ tên không được để trống');
      }
      return updateProfile({ fullName: fullName.trim(), phone: phone.trim() });
    },
    onSuccess: (updated) => {
      toast.success('Đã cập nhật thông tin cá nhân!');
      queryClient.setQueryData(QUERY_KEYS.account.profile, updated);
      useAuthStore.setState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updated } : null,
      }));
      setEditingInfo(false);
    },
    onError: (err: Error) => setInfoError(err.message || 'Cập nhật thông tin thất bại'),
  });

  return (
    <div className="space-y-6">
      {/* ---------- 1. Thông tin cá nhân ---------- */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-slate-900">Thông tin cá nhân</h2>
          {!isEditingInfo && (
            <Button variant="outline" size="sm" leftIcon={Pencil} onClick={openEditInfo}>
              Chỉnh sửa thông tin
            </Button>
          )}
        </div>

        {isEditingInfo ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveInfoMutation.mutate();
            }}
            className="space-y-4"
          >
            {infoError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {infoError}
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  disabled={saveInfoMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nhập số điện thoại (vd: 0912345678)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC]"
                  disabled={saveInfoMutation.isPending}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Vai trò
                </label>
                <input
                  type="text"
                  value={ROLE_LABEL[role] ?? role}
                  disabled
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-100 bg-slate-50 text-slate-400 text-sm cursor-not-allowed font-semibold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setEditingInfo(false)}
                disabled={saveInfoMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={saveInfoMutation.isPending}
                disabled={!fullName.trim()}
              >
                Lưu thay đổi
              </Button>
            </div>
          </form>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <InfoItem label="Họ tên" value={user?.fullName} />
            <InfoItem label="Email" value={user?.email} />
            <InfoItem label="Số điện thoại" value={user?.phone || '—'} />
            <InfoItem label="Vai trò" value={ROLE_LABEL[role] ?? role} />
          </div>
        )}
      </Card>

      {/* ---------- 2. Trình độ & mục tiêu (học viên) ---------- */}
      {isLearner && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Trình độ &amp; mục tiêu
            </h2>
            {!isEditingGoal && (
              <Button variant="outline" size="sm" leftIcon={Pencil} onClick={openEditGoal}>
                {targetCertificate ? 'Sửa mục tiêu' : 'Đặt mục tiêu'}
              </Button>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Hiện tại */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" /> Hiện tại
              </div>
              {currentLevel ? (
                <>
                  <div className="mt-2 flex items-baseline gap-2">
                    {currentScore !== null && (
                      <span className="text-3xl font-extrabold text-slate-900">{formatScore(Number(currentScore))}</span>
                    )}
                    {currentScore !== null && unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
                    <Badge variant="success" size="sm">
                      {currentLevel}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {CEFR_LABEL[currentLevel] ? `${CEFR_LABEL[currentLevel]} · ` : ''}theo bài test gần nhất
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(CLIENT_ROUTES.practice)}
                  >
                    Làm test lại
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-2 font-bold text-slate-900">Chưa xác định trình độ</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Làm bài kiểm tra trình độ miễn phí để biết band / điểm hiện tại và nhận lộ trình phù hợp.
                  </p>
                  <Button variant="primary" size="sm" className="mt-3" onClick={() => navigate(CLIENT_ROUTES.practice)}>
                    Làm test miễn phí →
                  </Button>
                </>
              )}
            </div>

            {/* Mục tiêu */}
            <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Mục tiêu
              </div>
              {targetCertificate ? (
                <>
                  <div className="mt-2 flex items-baseline gap-2">
                    {targetScore !== null && (
                      <span className="text-3xl font-extrabold text-slate-900">{formatScore(Number(targetScore))}</span>
                    )}
                    {targetScore !== null && unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 font-semibold">{targetCertificate.certificateName}</p>
                  {gap !== null && currentLevel && (
                    <p className="text-sm mt-2 flex items-center gap-1.5 text-slate-600">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      {gap > 0 ? `Cần thêm ${formatScore(gap)}${unit ? ` ${unit}` : ''}` : 'Đã đạt mục tiêu'}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="mt-2 font-bold text-slate-900">Chưa đặt mục tiêu</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Chọn chứng chỉ và điểm mục tiêu để cá nhân hóa bài test và gợi ý khóa học.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Form sửa mục tiêu */}
          {isEditingGoal && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 space-y-3">
              {goalError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {goalError}
                </div>
              )}
              <TargetGoalFields
                value={goal}
                onChange={(val) => {
                  setGoal(val);
                  setGoalError(null);
                }}
                disabled={saveGoalMutation.isPending}
              />
              {isChangingCertificate && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                  Trình độ hiện tại đang tính theo chứng chỉ cũ. Sau khi đổi, hãy làm test lại để cập nhật theo thang mới.
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingGoal(false)}
                  disabled={saveGoalMutation.isPending}
                >
                  Huỷ
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={saveGoalMutation.isPending}
                  disabled={!goal.certificateId || goal.score === ''}
                  onClick={() => saveGoalMutation.mutate()}
                >
                  Lưu mục tiêu
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ---------- 3. Đổi mật khẩu ---------- */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5" />
          Đổi mật khẩu
        </h2>
        <div className="max-w-md">
          <ChangePasswordForm />
        </div>
      </Card>
    </div>
  );
};

const InfoItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
  <div className="space-y-2">
    <div className="text-sm text-slate-500">{label}</div>
    <div className="font-medium text-slate-900">{value || '—'}</div>
  </div>
);

export default ProfilePage;
