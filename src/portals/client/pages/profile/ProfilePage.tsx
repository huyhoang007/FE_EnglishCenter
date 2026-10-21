import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { getProfile, updateProfile, changePasswordRequest } from '@/shared/api/domainApi';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import {
  User,
  Lock,
  Mail,
  Phone,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: authUser, role } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Query
  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
  } = useQuery({
    queryKey: QUERY_KEYS.account.profile,
    queryFn: getProfile,
    initialData: authUser || undefined,
  });

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [targetScore, setTargetScore] = useState<number | ''>('');
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        targetScore: targetScore !== '' ? Number(targetScore) : undefined,
      }),
    onSuccess: (updated) => {
      setProfileMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      queryClient.setQueryData(QUERY_KEYS.account.profile, updated);
      // Cập nhật auth store để Header hiển thị tên mới
      useAuthStore.setState((prev) => ({
        ...prev,
        user: { ...prev.user, ...updated },
        userName: updated.fullName,
      }));
      setTimeout(() => setProfileMessage(null), 4000);
    },
    onError: (err: Error) => {
      setProfileMessage({ type: 'error', text: err.message || 'Cập nhật thất bại. Vui lòng thử lại.' });
    },
  });

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const changePasswordMutation = useMutation({
    mutationFn: () => changePasswordRequest({ currentPassword, newPassword }),
    onSuccess: () => {
      setPasswordMessage({
        type: 'success',
        text: 'Đổi mật khẩu thành công! Các phiên đăng nhập khác đã được thu hồi an toàn.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 5000);
    },
    onError: (err: Error) => {
      setPasswordMessage({
        type: 'error',
        text: err.message || 'Đổi mật khẩu không thành công. Kiểm tra lại mật khẩu hiện tại.',
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileMessage({ type: 'error', text: 'Họ tên không được để trống' });
      return;
    }
    setProfileMessage(null);
    updateProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại' });
      return;
    }
    if (newPassword.length < 8 || newPassword.length > 100) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải từ 8 đến 100 ký tự' });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }
    setPasswordMessage(null);
    changePasswordMutation.mutate();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-8 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
          <img
            src={
              profile?.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.email || 'user')}`
            }
            alt="Avatar"
            className="h-24 w-24 rounded-full border-4 border-white/20 bg-white/10 shadow-lg object-cover"
          />
          <div className="text-center sm:text-left space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {profile?.fullName || 'Hồ sơ người dùng'}
              </h1>
              <Badge variant="primary" size="sm">
                {role}
              </Badge>
              {profile?.isActive && (
                <Badge variant="success" size="sm">
                  Active
                </Badge>
              )}
            </div>
            <p className="text-slate-300 text-sm flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              {profile?.email}
            </p>
            {profile?.phone && (
              <p className="text-slate-400 text-xs flex items-center justify-center sm:justify-start gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                {profile.phone}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'profile'
              ? 'bg-[#0052CC] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          Thông tin cá nhân
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-colors ${
            activeTab === 'security'
              ? 'bg-[#0052CC] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Shield className="w-4 h-4" />
          Bảo mật & Mật khẩu
        </button>
      </div>

      {/* Content */}
      {activeTab === 'profile' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-xl bg-blue-50 text-[#0052CC]">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Chi tiết tài khoản</h2>
                  <p className="text-xs text-slate-500">Cập nhật thông tin cá nhân của bạn trên hệ thống</p>
                </div>
              </div>

              {profileMessage && (
                <div
                  className={`p-3.5 mb-5 rounded-xl text-sm flex items-center gap-2.5 ${
                    profileMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {profileMessage.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  {profileMessage.text}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email đăng nhập (Cố định)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                    />
                  </div>
                </div>

                {role === 'STUDENT' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      Mục tiêu điểm số (Target Score)
                    </label>
                    <div className="relative">
                      <Sparkles className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="number"
                        step="0.5"
                        value={targetScore}
                        onChange={(e) => setTargetScore(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="7.5"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updateProfileMutation.isPending || isLoadingProfile}
                  >
                    {updateProfileMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div>
            <Card>
              <h3 className="font-bold text-slate-900 text-sm mb-3">Thông tin hệ thống</h3>
              <dl className="space-y-3 text-xs">
                <div>
                  <dt className="text-slate-400 uppercase tracking-wider">Mã người dùng (User ID)</dt>
                  <dd className="font-mono text-slate-700 font-semibold break-all mt-0.5">
                    {profile?.id || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 uppercase tracking-wider">Vai trò</dt>
                  <dd className="mt-1">
                    <Badge variant="primary" size="sm">
                      {role}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400 uppercase tracking-wider">Trạng thái tài khoản</dt>
                  <dd className="mt-1">
                    <Badge variant={profile?.isActive !== false ? 'success' : 'warning'} size="sm">
                      {profile?.isActive !== false ? 'Hoạt động (Active)' : 'Tạm khóa (Inactive)'}
                    </Badge>
                  </dd>
                </div>
                {profile?.createdAt && (
                  <div>
                    <dt className="text-slate-400 uppercase tracking-wider">Ngày tham gia</dt>
                    <dd className="text-slate-700 font-semibold mt-0.5">
                      {new Date(profile.createdAt).toLocaleDateString('vi-VN')}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="max-w-2xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thay đổi mật khẩu</h2>
              <p className="text-xs text-slate-500">
                Sau khi đổi mật khẩu thành công, toàn bộ refresh token hiện có sẽ bị hủy để bảo đảm an toàn.
              </p>
            </div>
          </div>

          {passwordMessage && (
            <div
              className={`p-3.5 mb-5 rounded-xl text-sm flex items-center gap-2.5 ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {passwordMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              {passwordMessage.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Mật khẩu hiện tại *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Mật khẩu mới * (tối thiểu 8 ký tự)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Xác nhận mật khẩu mới *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0052CC] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
