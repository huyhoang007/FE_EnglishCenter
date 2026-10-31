"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Target, Award } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { getProfile } from '@/shared/api/domainApi';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { CEFR_LABEL } from '@/portals/client/features/exams/components/PracticeLevelCard';

export const ProfilePage = () => {
  const authUser = useAuthStore((s) => s.user);
  // Trình độ đổi sau mỗi lần làm test → luôn đọc hồ sơ mới nhất từ BE (GET /api/v1/account/me)
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.account.profile,
    queryFn: getProfile,
    enabled: Boolean(authUser),
    initialData: authUser || undefined,
  });
  const { data: certificates = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 5 * 60_000,
  });

  const user = profileQuery.data ?? authUser;
  const currentLevel = user?.currentLevel;
  const currentScore = user?.currentScore;
  const targetCertificate = certificates.find((c) => c.certificateId === user?.targetCertificateId);
  const formatScore = (n: number) => (n <= 10 ? Number(n).toFixed(1) : String(Math.round(n)));

  return (
    <div className="space-y-6">
      {/* Card thông tin cá nhân */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin cá nhân</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Họ tên</div>
            <div className="font-medium text-slate-900">{user?.fullName}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-500">Email</div>
            <div className="font-medium text-slate-900">{user?.email}</div>
          </div>
          {targetCertificate && (
            <div className="space-y-2">
              <div className="text-sm text-slate-500">Mục tiêu</div>
              <div className="font-medium text-slate-900">
                {targetCertificate.certificateName}
                {user?.targetScore !== null && user?.targetScore !== undefined ? ` · ${user.targetScore}` : ''}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Card trình độ hiện tại */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Trình độ hiện tại
        </h2>

        {currentLevel ? (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-lg">
                  Trình độ {currentLevel}
                  {CEFR_LABEL[currentLevel] ? ` · ${CEFR_LABEL[currentLevel]}` : ''}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  {currentScore !== null && currentScore !== undefined
                    ? `${targetCertificate?.certificateName ?? 'Điểm'} ${formatScore(Number(currentScore))} · `
                    : ''}
                  theo bài test gần nhất
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" size="sm">
                Đã đánh giá
              </Badge>
              <Button variant="outline" size="sm" onClick={() => (window.location.href = CLIENT_ROUTES.practice)}>
                Làm test lại
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 rounded-xl bg-slate-50 border border-slate-200 border-dashed">
            <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Target className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Chưa xác định trình độ</h3>
            <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
              Hãy tham gia bài kiểm tra trình độ miễn phí để xác định trình độ CEFR của bạn và nhận lộ trình học phù hợp.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={() => window.location.href = CLIENT_ROUTES.practice}
            >
              Làm test miễn phí →
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
