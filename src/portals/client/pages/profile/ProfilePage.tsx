"use client";

import React from 'react';
import { BookOpen, Target, Award } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { CLIENT_ROUTES } from '@/shared/constants/routes';

export const ProfilePage = () => {
  const { user, profile } = useAuthStore();

  const isUser = user?.role === 'USER';
  const currentLevel = profile?.currentLevel;
  const currentScore = profile?.currentScore;

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
        </div>
      </Card>

      {/* Card trình độ hiện tại */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Trình độ hiện tại
        </h2>

        {currentLevel ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-lg">
                  {currentLevel} {currentScore ? `· ${currentScore}` : ''}
                </div>
                <div className="text-sm text-slate-500 mt-0.5">
                  Trình độ CEFR được đánh giá từ bài kiểm tra miễn phí hoặc bài thi khách quan
                </div>
              </div>
            </div>
            <Badge variant="success" size="sm">
              Đã đánh giá
            </Badge>
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