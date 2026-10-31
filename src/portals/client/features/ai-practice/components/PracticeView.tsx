/**
 * PracticeView — Luyện tập AI / Test trình độ (Dev 5)
 * -----------------------------------------------------------
 * Đề luyện tập dùng chung module Exam (examScope = practice): mỗi đề gồm nhiều phần thi
 * Listening / Reading (tự chấm theo đáp án) và Writing / Speaking (AI - Claude chấm theo thang chứng chỉ mục tiêu).
 *
 * Tab "Kho đề": vào trang là hiện ngay các đề theo mục tiêu của học viên (đề của chứng chỉ mục tiêu
 *   + đề không gắn chứng chỉ). Chip "Mục tiêu" có nút Sửa để đổi chứng chỉ / điểm mục tiêu.
 *   Bấm đề → xác nhận → vào phòng làm bài (ExamRoomView, có đồng hồ, tự lưu, Speaking ghi âm → phiên âm).
 *   Nộp bài → trang kết quả: điểm từng phần + AI tự chấm Writing / Speaking kèm nhận xét.
 * Tab "Lịch sử làm bài": các lượt đã làm, bấm để xem lại kết quả (hoặc làm tiếp lượt đang dở).
 *
 * Learner (USER) dùng trang này làm Test trình độ miễn phí: tối đa 3 lượt (BE chặn mã 6029).
 */

import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Clock, FileQuestion, History, Layers, Pencil, Search, Sparkles, Target, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/components/Toast';
import { getProfile, updateProfile } from '@/shared/api/domainApi';
import { fetchCertificates } from '@/shared/api/certificateService';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { TargetGoalFields, type TargetGoal } from '@/shared/components/TargetGoalFields';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { cn } from '@/shared/utils';
import { useRole } from '@/portals/client/features/auth';
import { useAuthStore } from '@/shared/auth/useAuthStore';
import { ATTEMPT_STATUS_LABEL, type AttemptSummary, type ExamSummary } from '@/shared/types';
import { useExamList, useMyAttempts, useStartAttempt } from '@/portals/client/features/exams/hooks/useExams';
import { TestRecommendations } from './TestRecommendations';

type Tab = 'bank' | 'history';

/** Learner (USER) được 3 lượt test miễn phí (tính cả đề thi) */
const LEARNER_FREE_ATTEMPTS = 3;

export const PracticeView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = useRole();
  // Learner (USER) dùng trang này làm Test trình độ (Free), Student dùng để Luyện tập AI
  const isStudent = role === 'STUDENT' || role === 'USER';
  const isLearner = role === 'USER';

  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'history' ? 'history' : 'bank');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  /** Đề đang chờ xác nhận bắt đầu làm */
  const [confirmExam, setConfirmExam] = useState<ExamSummary | null>(null);

  const queryClient = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const toast = useToast();

  /* ---------------- Mục tiêu học tập ---------------- */
  const profileQuery = useQuery({
    queryKey: QUERY_KEYS.account.profile,
    queryFn: getProfile,
    enabled: isStudent,
    initialData: authUser || undefined,
  });
  const { data: certificates = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.certificates,
    queryFn: fetchCertificates,
    staleTime: 5 * 60_000,
  });

  const targetCertificateId = profileQuery.data?.targetCertificateId ?? authUser?.targetCertificateId ?? null;
  const targetScore = profileQuery.data?.targetScore ?? authUser?.targetScore ?? null;
  const targetCertificate = certificates.find((c) => c.certificateId === targetCertificateId) ?? null;

  // Chưa có mục tiêu → bắt buộc chọn (TASK DEV1 - T2); có rồi thì mở lại được bằng nút "Sửa mục tiêu"
  const isGoalRequired = isStudent && !profileQuery.isLoading && !targetCertificateId;
  const [isEditingGoal, setEditingGoal] = useState(false);
  const isGoalModalOpen = isGoalRequired || isEditingGoal;

  const [modalGoal, setModalGoal] = useState<TargetGoal>({ certificateId: '', score: '' });
  const [goalModalError, setGoalModalError] = useState<string | null>(null);

  const openEditGoal = () => {
    setModalGoal({ certificateId: targetCertificateId ?? '', score: targetScore ?? '' });
    setGoalModalError(null);
    setEditingGoal(true);
  };

  const saveGoalMutation = useMutation({
    mutationFn: () => {
      if (!modalGoal.certificateId || modalGoal.score === '') {
        throw new Error('Vui lòng chọn chứng chỉ và điểm mục tiêu');
      }
      return updateProfile({
        targetCertificateId: modalGoal.certificateId,
        targetScore: Number(modalGoal.score),
      });
    },
    onSuccess: (updated) => {
      toast.success('Đã lưu mục tiêu học tập!');
      queryClient.setQueryData(QUERY_KEYS.account.profile, updated);
      useAuthStore.setState((prev) => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updated } : null,
      }));
      // Gợi ý khóa học / lộ trình đổi theo mục tiêu mới
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.practice.recommendations });
      setEditingGoal(false);
    },
    onError: (err: Error) => {
      setGoalModalError(err.message || 'Lưu mục tiêu thất bại');
    },
  });

  /* ---------------- Dữ liệu ---------------- */
  // Có mục tiêu: đề của chứng chỉ mục tiêu + đề dùng chung (BE gộp khi examScope = practice)
  const examsQuery = useExamList({
    examScope: 'practice',
    certificateId: targetCertificateId ?? undefined,
    keyword,
    size: 50,
  });
  const exams = examsQuery.data?.data ?? [];

  const historyQuery = useMyAttempts(0, 'practice', 50, isStudent);
  const attempts = historyQuery.data?.data ?? [];
  // Learner: BE đếm mọi lượt test (đề luyện tập + đề thi)
  const learnerAttemptsQuery = useMyAttempts(0, undefined, 1, isLearner);
  const usedAttempts = learnerAttemptsQuery.data?.totalElements ?? 0;
  const remainingAttempts = Math.max(0, LEARNER_FREE_ATTEMPTS - usedAttempts);
  const isLimitReached = isLearner && remainingAttempts <= 0;

  const startAttempt = useStartAttempt();

  /** Lượt đang làm dở của đề (bắt đầu lại sẽ vào tiếp lượt đó, không tốn thêm lượt) */
  const inProgressOf = (examId: string) =>
    attempts.find((a) => a.examId === examId && a.status === 'in_progress');

  return (
    <div className="space-y-6">
      {/* Modal chọn / sửa mục tiêu (TASK DEV1 - T2) */}
      {isGoalModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
                <Target className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {isGoalRequired ? 'Chọn mục tiêu học tập' : 'Sửa mục tiêu học tập'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isGoalRequired
                    ? 'Bước bắt buộc để cá nhân hóa bài kiểm tra và lộ trình học của bạn'
                    : 'Kho đề, thang điểm AI chấm và gợi ý khóa học sẽ đổi theo mục tiêu mới'}
                </p>
              </div>
              {!isGoalRequired && (
                <button
                  type="button"
                  onClick={() => setEditingGoal(false)}
                  disabled={saveGoalMutation.isPending}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg self-start"
                  aria-label="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {goalModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {goalModalError}
              </div>
            )}

            <div className="py-2">
              <TargetGoalFields
                value={modalGoal}
                onChange={(val) => {
                  setModalGoal(val);
                  setGoalModalError(null);
                }}
                disabled={saveGoalMutation.isPending}
              />
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Button
                variant="primary"
                size="lg"
                className="w-full justify-center"
                isLoading={saveGoalMutation.isPending}
                disabled={!modalGoal.certificateId || modalGoal.score === '' || saveGoalMutation.isPending}
                onClick={() => saveGoalMutation.mutate()}
              >
                {isGoalRequired ? 'Lưu mục tiêu & Bắt đầu' : 'Lưu mục tiêu'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============== HEADER ============== */}
      <header>
        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          <Sparkles className="w-3.5 h-3.5" />
          {isLearner ? 'Test trình độ miễn phí' : 'Luyện đề với AI'}
        </div>
        <h1 className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isLearner ? 'Kiểm tra trình độ 4 kỹ năng' : 'Phòng luyện đề 4 kỹ năng'}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">
          Làm đề Listening, Reading, Writing, Speaking. Reading / Listening chấm ngay theo đáp án; Writing / Speaking
          được AI chấm theo thang của chứng chỉ mục tiêu kèm level CEFR và nhận xét bằng tiếng Việt.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {isStudent && targetCertificateId && (
            <span className="inline-flex items-center gap-2 pl-3 pr-1 h-8 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-purple-700">
              <Target className="w-3.5 h-3.5" />
              Mục tiêu: {targetCertificate?.certificateName ?? 'Chứng chỉ'}
              {targetScore !== null && targetScore !== undefined ? ` · ${targetScore}` : ''}
              <button
                type="button"
                onClick={openEditGoal}
                className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-white text-purple-700 hover:bg-purple-100 transition-colors"
              >
                <Pencil className="w-3 h-3" /> Sửa
              </button>
            </span>
          )}
          {isLearner && (
            <Badge variant={isLimitReached ? 'danger' : 'primary'} size="sm">
              Còn {remainingAttempts}/{LEARNER_FREE_ATTEMPTS} lượt test miễn phí
            </Badge>
          )}
        </div>
      </header>

      {/* ============== TABS ============== */}
      <div className="inline-flex p-1 rounded-full bg-slate-100">
        <TabButton active={tab === 'bank'} onClick={() => setTab('bank')} icon={Layers}>
          Kho đề
        </TabButton>
        {isStudent && (
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={History}>
            Lịch sử làm bài
          </TabButton>
        )}
      </div>

      {!isStudent && (
        <Card className="bg-amber-50 border-amber-200 text-sm text-amber-800">
          Đăng nhập để làm bài và được AI chấm. Bạn vẫn xem được kho đề.
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-5 items-start">
        {/* ============== CỘT TRÁI ============== */}
        <div className="space-y-5 min-w-0">
          {tab === 'bank' ? (
            <>
              <Card>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setKeyword(keywordInput.trim());
                  }}
                >
                  <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-input border border-slate-200 focus-within:border-primary">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      placeholder="Tìm theo tên đề…"
                      className="flex-1 text-sm outline-none bg-transparent"
                    />
                  </div>
                  <Button type="submit" variant="outline">
                    Tìm
                  </Button>
                </form>
              </Card>

              {examsQuery.isLoading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-44 rounded-card" />
                  ))}
                </div>
              ) : examsQuery.isError ? (
                <ErrorState message={examsQuery.error?.message} onRetry={() => examsQuery.refetch()} />
              ) : exams.length === 0 ? (
                <EmptyState
                  title={keyword ? 'Không tìm thấy đề phù hợp' : 'Chưa có đề luyện tập nào'}
                  description={
                    keyword
                      ? 'Thử từ khóa khác.'
                      : targetCertificate
                        ? `Chưa có đề cho ${targetCertificate.certificateName}. Mentor hoặc Admin cần tạo đề trước.`
                        : 'Mentor hoặc Admin cần tạo đề trước.'
                  }
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {exams.map((exam) => (
                    <PracticeExamCard
                      key={exam.examId}
                      exam={exam}
                      isInProgress={Boolean(inProgressOf(exam.examId))}
                      onSelect={() => setConfirmExam(exam)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <HistoryList
              attempts={attempts}
              isLoading={historyQuery.isLoading}
              error={historyQuery.isError ? historyQuery.error : null}
              onRetry={() => historyQuery.refetch()}
              onOpen={(a) =>
                navigate(
                  a.status === 'in_progress' ? CLIENT_ROUTES.examAttempt(a.attemptId) : CLIENT_ROUTES.examResult(a.attemptId),
                )
              }
            />
          )}
        </div>

        {/* ============== CỘT PHẢI ============== */}
        <div className="space-y-5">
          <Card className="space-y-2.5">
            <h2 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ai" /> Cách chấm điểm
            </h2>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>• Listening / Reading: chấm ngay theo đáp án khi nộp bài.</li>
              <li>• Writing: AI chấm 4 tiêu chí theo thang chứng chỉ mục tiêu.</li>
              <li>• Speaking: bấm ghi âm và nói tiếng Anh, hệ thống chuyển thành chữ để AI chấm.</li>
              <li>• Bài làm tự lưu; hết giờ hệ thống tự nộp.</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Gợi ý khóa học / lộ trình theo mục tiêu + trình độ: để toàn chiều ngang cho thẻ không bị bóp */}
      {isStudent && <TestRecommendations />}

      {/* ============== XÁC NHẬN BẮT ĐẦU ============== */}
      {confirmExam && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !startAttempt.isPending && setConfirmExam(null)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
                {confirmExam.certificateName ?? 'Đề luyện tập'}
              </p>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1">{confirmExam.examTitle}</h3>
              {confirmExam.description && <p className="text-sm text-slate-500 mt-1">{confirmExam.description}</p>}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {confirmExam.durationMinutes} phút
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5 text-slate-400" /> {confirmExam.totalQuestions} câu
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> {confirmExam.totalParts} phần
              </span>
            </div>
            <p className="text-sm text-slate-600">
              {inProgressOf(confirmExam.examId)
                ? 'Bạn đang làm dở đề này — vào tiếp lượt cũ, đồng hồ vẫn chạy.'
                : 'Đồng hồ bắt đầu chạy khi vào phòng làm bài. Bài làm tự lưu, hết giờ hệ thống tự nộp.'}
              {isLearner && !inProgressOf(confirmExam.examId) && (
                <b> Lượt này dùng 1 trong {remainingAttempts} lượt test miễn phí còn lại.</b>
              )}
            </p>
            {!isStudent && <p className="text-sm text-amber-700 font-semibold">Đăng nhập để làm bài.</p>}
            {startAttempt.isError && (
              <p className="text-sm text-status-danger font-semibold">{startAttempt.error.message}</p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setConfirmExam(null)} disabled={startAttempt.isPending}>
                Để sau
              </Button>
              <Button
                leftIcon={Sparkles}
                isLoading={startAttempt.isPending}
                disabled={!isStudent || (isLimitReached && !inProgressOf(confirmExam.examId))}
                onClick={() => startAttempt.mutate(confirmExam.examId)}
              >
                {inProgressOf(confirmExam.examId) ? 'Làm tiếp' : 'Bắt đầu làm bài'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================================================
 * Thẻ đề luyện tập
 * ========================================================= */
const PracticeExamCard: React.FC<{ exam: ExamSummary; isInProgress: boolean; onSelect: () => void }> = ({
  exam,
  isInProgress,
  onSelect,
}) => (
  <Card
    hoverable
    className="cursor-pointer flex flex-col gap-3"
    onClick={onSelect}
    role="button"
    aria-label={`Làm đề ${exam.examTitle}`}
  >
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={exam.certificateName ? 'ai' : 'neutral'} size="sm">
        {exam.certificateName ?? 'Mọi mục tiêu'}
      </Badge>
      {isInProgress && (
        <Badge variant="warning" size="sm">
          Đang làm dở
        </Badge>
      )}
    </div>
    <div>
      <h3 className="font-extrabold text-slate-900 leading-snug">{exam.examTitle}</h3>
      {exam.description && <p className="text-sm text-slate-500 mt-1 line-clamp-2">{exam.description}</p>}
    </div>
    <div className="mt-auto grid grid-cols-3 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
      <span className="inline-flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        {exam.durationMinutes} phút
      </span>
      <span className="inline-flex items-center gap-1.5">
        <FileQuestion className="w-3.5 h-3.5 text-slate-400" />
        {exam.totalQuestions} câu
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Layers className="w-3.5 h-3.5 text-slate-400" />
        {exam.totalParts} phần
      </span>
    </div>
  </Card>
);

/* =========================================================
 * Lịch sử làm bài
 * ========================================================= */
const HistoryList: React.FC<{
  attempts: AttemptSummary[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  onOpen: (attempt: AttemptSummary) => void;
}> = ({ attempts, isLoading, error, onRetry, onOpen }) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-card" />
        ))}
      </div>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (attempts.length === 0) {
    return <EmptyState title="Chưa có bài làm nào" description="Chọn một đề trong Kho đề để bắt đầu luyện tập." />;
  }
  return (
    <div className="space-y-3">
      {attempts.map((a) => (
        <Card
          key={a.attemptId}
          hoverable
          className="cursor-pointer flex flex-wrap items-center gap-3"
          onClick={() => onOpen(a)}
          role="button"
        >
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 truncate">{a.examTitle}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Lượt #{a.attemptNumber} · {new Date(a.startTime).toLocaleString('vi-VN')}
            </p>
          </div>
          {a.status === 'in_progress' ? (
            <Badge variant="warning" size="sm">
              Đang làm dở
            </Badge>
          ) : a.pendingManualGrading ? (
            <Badge variant="ai" size="sm" icon={Sparkles}>
              Chờ AI chấm
            </Badge>
          ) : (
            <Badge variant={a.status === 'graded' ? 'success' : 'neutral'} size="sm">
              {ATTEMPT_STATUS_LABEL[a.status]}
            </Badge>
          )}
          {a.score !== undefined && a.score !== null && a.status !== 'in_progress' && (
            <span className="text-sm font-extrabold text-slate-900 tabular-nums">
              {a.score}/{a.maxScore}
              {a.percentage !== undefined && a.percentage !== null && (
                <span className="text-xs text-slate-400 font-bold"> · {a.percentage}%</span>
              )}
            </span>
          )}
        </Card>
      ))}
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ active, onClick, icon: Icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-colors',
      active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
    )}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

export default PracticeView;
