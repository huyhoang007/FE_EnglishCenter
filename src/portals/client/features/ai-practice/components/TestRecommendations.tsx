/**
 * TestRecommendations — Gợi ý khóa học phù hợp sau test (TASK-DEV1 T8)
 * -----------------------------------------------------------------------------------
 * Hiển thị:
 *   - "Khóa học phù hợp với trình độ của bạn"
 *   - Không gợi ý lộ trình: lộ trình do mentor tư vấn riêng (khóa học / gói kèm 1-1).
 *   - Dev 5: chỉ gợi ý khóa vừa sức (điểm đầu vào ≤ trình độ hiện tại). Không có khóa nào vừa sức
 *     (VD band 1.0 mà khóa thấp nhất đầu vào 4.0) thì báo rõ và mời để lại SĐT cho mentor tư vấn.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, ArrowRight, Target, Info } from 'lucide-react';
import { useRecommendations } from '../hooks/usePractice';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { ConsultationRequestCard } from '@/portals/client/features/schedules/components/ConsultationRequestCard';

interface TestRecommendationsProps {
  className?: string;
}

/** Thang ≤ 10 (IELTS, VSTEP…) hiện 1 chữ số thập phân, thang lớn (TOEIC) hiện số nguyên */
const formatScore = (value: number) => (Number(value) <= 10 ? Number(value).toFixed(1) : String(Math.round(Number(value))));

export const TestRecommendations: React.FC<TestRecommendationsProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useRecommendations();

  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl bg-white border border-slate-200 animate-pulse ${className}`}>
        <div className="h-6 w-60 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-slate-100 rounded-xl" />
          <div className="h-40 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return <ConsultationRequestCard className={className} />;
  }

  const { courses, summary, targetCertificateName, targetScore, currentLevel, currentScore } = recommendations;

  const hasCourses = courses && courses.length > 0;
  const needConsultation = Boolean(recommendations.needConsultation);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header tóm tắt */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 border border-blue-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h3 className="text-lg font-bold text-slate-900">Gợi ý dành riêng cho bạn</h3>
              {targetCertificateName && (
                <Badge variant="primary" size="sm">
                  {targetCertificateName} {targetScore ? `· Mục tiêu ${formatScore(targetScore)}` : ''}
                </Badge>
              )}
              {currentLevel && (
                <Badge variant="ai" size="sm">
                  Trình độ: {currentLevel} {currentScore ? `(${formatScore(currentScore)})` : ''}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>

      {/* Chưa có khóa nào vừa sức (VD band 0 mà khóa thấp nhất đầu vào 4.0): báo rõ, không gợi ý khóa cao hơn */}
      {!hasCourses && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-base font-bold text-slate-900">Chưa có khóa học phù hợp với trình độ của bạn</p>
            <p className="text-sm text-slate-600 mt-1">
              Trung tâm đang bổ sung thêm khóa học theo từng trình độ. Bạn có thể để lại thông tin liên hệ bên dưới để
              mentor tư vấn.
            </p>
          </div>
        </div>
      )}

      {/* 1. Khóa học phù hợp với trình độ của bạn */}
      {hasCourses && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <h4 className="text-base font-bold text-slate-900">
                Khóa học phù hợp với trình độ của bạn
              </h4>
            </div>
            <button
              onClick={() => navigate('/courses')}
              className="text-xs font-semibold text-primary hover:text-primary-focus inline-flex items-center gap-1 transition-colors"
            >
              Xem tất cả khóa học <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Số cột theo chiều rộng khung chứa (không theo màn hình) để thẻ không bị bóp khi đặt trong cột hẹp */}
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
            {courses.slice(0, 3).map((course) => (
              <div
                key={course.courseId}
                className="group flex flex-col justify-between rounded-xl bg-white border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/5 border border-primary/10">
                      {course.certificateName || 'Khóa học'}
                    </span>
                    {course.targetScore && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap">
                        <Target className="w-3 h-3" />
                        {course.entryScore != null
                          ? `${formatScore(course.entryScore)} → ${formatScore(course.targetScore)}`
                          : `Mục tiêu ${formatScore(course.targetScore)}`}
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1.5">
                    {course.title}
                  </h5>
                  {course.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                      {course.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-auto">
                  <div className="text-sm font-bold text-slate-900 whitespace-nowrap">
                    {course.price && Number(course.price) > 0
                      ? `${Number(course.price).toLocaleString('vi-VN')} đ`
                      : 'Miễn phí'}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(CLIENT_ROUTES.course(course.courseId))}
                    className="text-xs h-8"
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dev 5: tư vấn lộ trình 1-1 — nổi bật khi chưa có khóa vừa sức */}
      <ConsultationRequestCard highlight={needConsultation} />
    </div>
  );
};
