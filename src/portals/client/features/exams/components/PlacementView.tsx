/**
 * PlacementView — Kiểm tra năng lực đầu vào theo chứng chỉ mục tiêu (Dev 3)
 * -----------------------------------------------------------
 * 1. Học viên chọn chứng chỉ mục tiêu (IELTS / TOEIC / VSTEP…)
 * 2. Xem năng lực hiện tại (nếu đã làm bài kiểm tra) — GET /api/v1/me/proficiency
 * 3. Chọn một bài kiểm tra năng lực (đề thi thử loại placement_test của chứng chỉ đó) để làm
 * Nộp xong: trắc nghiệm chấm ngay, Writing / Speaking chờ mentor chấm, rồi năng lực tự cập nhật.
 * URL: /exams/placement
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Gauge, Hourglass, LogIn } from 'lucide-react';
import { fetchCertificates } from '@/shared/api/certificateService';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { detectScale, formatScaleScore } from '@/shared/constants/examScales';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import type { Proficiency } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { useExamList, useMyProficiency } from '../hooks/useExams';
import { ExamCard } from './ExamCard';
import { formatDateTime } from '../utils/examRoom';

const SKILL_LABEL: Record<string, string> = {
  LISTENING: 'Listening',
  READING: 'Reading',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
  OTHER: 'Toàn bài',
};

export const PlacementView: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const certificates = useQuery({ queryKey: QUERY_KEYS.catalog.certificates, queryFn: fetchCertificates });
  const proficiency = useMyProficiency(isAuthenticated);
  const [certificateId, setCertificateId] = useState('');

  // Mặc định chọn chứng chỉ đầu tiên
  useEffect(() => {
    if (!certificateId && certificates.data?.length) setCertificateId(certificates.data[0].certificateId);
  }, [certificateId, certificates.data]);

  const selected = certificates.data?.find((c) => c.certificateId === certificateId);
  const current = proficiency.data?.find((p) => p.certificateId === certificateId);
  const exams = useExamList({ examType: 'placement_test', examScope: 'trial', certificateId, size: 12 });

  return (
    <div className="space-y-6">
      <Link
        to={CLIENT_ROUTES.exams}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" /> Ngân hàng đề
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Kiểm tra năng lực</h1>
        <p className="text-sm text-slate-600 mt-1">
          Chọn chứng chỉ bạn muốn đạt, làm một bài kiểm tra đầu vào. Hệ thống chấm ngay phần trắc nghiệm, mentor chấm
          phần Writing / Speaking, sau đó xác định năng lực hiện tại của bạn theo thang của chứng chỉ.
        </p>
      </div>

      {/* ---------- 1. Chọn chứng chỉ mục tiêu ---------- */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">1. Chọn chứng chỉ mục tiêu</h2>
        {certificates.isLoading ? (
          <div className="grid sm:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
        ) : certificates.isError ? (
          <ErrorState message={certificates.error.message} onRetry={() => certificates.refetch()} />
        ) : (
          <div className="grid sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Chứng chỉ mục tiêu">
            {(certificates.data ?? []).map((c) => {
              const scale = detectScale(c.certificateName);
              const done = proficiency.data?.find((p) => p.certificateId === c.certificateId);
              const isActive = c.certificateId === certificateId;
              return (
                <button
                  key={c.certificateId}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setCertificateId(c.certificateId)}
                  className={cn(
                    'text-left rounded-2xl border p-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    isActive ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={scale.badge}>{c.certificateName}</Badge>
                    {done?.status === 'assessed' && done.overall !== undefined && (
                      <span className="text-xs font-bold text-slate-700">
                        Hiện tại: {formatScaleScore(scale, done.overall)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{scale.range}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------- 2. Năng lực hiện tại ---------- */}
      {selected && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">2. Năng lực hiện tại ({selected.certificateName})</h2>
          {!isAuthenticated ? (
            <Card className="flex flex-col sm:flex-row sm:items-center gap-3">
              <p className="text-sm text-slate-600 flex-1">Đăng nhập để làm bài kiểm tra và lưu kết quả năng lực.</p>
              <Button leftIcon={LogIn} onClick={() => navigate('/login')}>
                Đăng nhập
              </Button>
            </Card>
          ) : proficiency.isLoading ? (
            <Skeleton className="h-32 rounded-2xl" />
          ) : current ? (
            <ProficiencyCard proficiency={current} />
          ) : (
            <Card className="text-sm text-slate-600">
              Bạn chưa làm bài kiểm tra năng lực {selected.certificateName}.
            </Card>
          )}
        </section>
      )}

      {/* ---------- 3. Bài kiểm tra năng lực ---------- */}
      {selected && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">
            3. {current ? 'Làm lại để cập nhật năng lực' : 'Chọn bài kiểm tra năng lực'}
          </h2>
          {exams.isLoading ? (
            <Skeleton className="h-48 rounded-2xl" />
          ) : exams.isError ? (
            <ErrorState message={exams.error.message} onRetry={() => exams.refetch()} />
          ) : !exams.data || exams.data.data.length === 0 ? (
            <EmptyState
              title={`Chưa có bài kiểm tra năng lực ${selected.certificateName}`}
              description="Trung tâm đang soạn đề. Bạn có thể luyện các đề khác trong ngân hàng đề."
            />
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {exams.data.data.map((exam) => (
                <ExamCard key={exam.examId} exam={exam} onSelect={(id) => navigate(CLIENT_ROUTES.exam(id))} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

/** Thẻ năng lực: điểm tổng theo thang, mô tả trình độ, CEFR, điểm từng kỹ năng. */
const ProficiencyCard: React.FC<{ proficiency: Proficiency }> = ({ proficiency: p }) => {
  const scale = detectScale(p.certificateName);
  const isPending = p.status === 'pending_grading';
  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className={cn('rounded-2xl border-2 px-6 py-4 text-center sm:min-w-[180px]', scale.accent)}>
          <p className="text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1">
            <Gauge className="w-3.5 h-3.5" /> Năng lực {p.certificateName}
          </p>
          {isPending ? (
            <p className="text-sm font-semibold mt-3 flex items-center justify-center gap-1.5">
              <Hourglass className="w-4 h-4" /> Chờ mentor chấm
            </p>
          ) : (
            <>
              <p className="text-4xl font-extrabold tabular-nums mt-1">{formatScaleScore(scale, p.overall)}</p>
              <p className="text-xs font-bold opacity-70">/ {formatScaleScore(scale, p.overallMax)}</p>
            </>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {!isPending && (
            <div className="flex flex-wrap items-center gap-2">
              {p.level && <span className="text-base font-bold text-slate-900">{p.level}</span>}
              {p.cefr && <Badge variant="primary">CEFR {p.cefr}</Badge>}
            </div>
          )}
          <p className="text-xs text-slate-600">
            Theo bài “{p.examTitle}”{p.takenAt ? ` · nộp lúc ${formatDateTime(p.takenAt)}` : ''}
          </p>
          {isPending && (
            <p className="text-sm text-ai font-semibold">
              Phần trắc nghiệm đã chấm xong. Năng lực sẽ được xác định khi mentor chấm xong phần Writing / Speaking.
            </p>
          )}
          <Link
            to={CLIENT_ROUTES.examResult(p.attemptId)}
            className="inline-block text-sm font-semibold text-primary hover:underline"
          >
            Xem chi tiết bài làm
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {p.skills.map((s, i) => (
          <div key={`${s.skill}-${i}`} className="rounded-xl border border-slate-200 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{SKILL_LABEL[s.skill] ?? s.skill}</p>
            <p className="text-lg font-extrabold text-slate-900 tabular-nums">
              {s.pendingManualGrading ? '—' : formatScaleScore(scale, s.score)}
              <span className="text-xs text-slate-400 font-bold"> / {formatScaleScore(scale, s.maxScore)}</span>
            </p>
            {s.pendingManualGrading ? (
              <p className="text-[11px] text-ai font-semibold">Chờ chấm</p>
            ) : (
              s.cefr && <p className="text-[11px] text-slate-600">CEFR {s.cefr}</p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PlacementView;
