/**
 * MentorStudentsView — Học viên & tư vấn lộ trình (Mentor, Dev 5)
 * -----------------------------------------------------------
 * - Yêu cầu tư vấn mới: học viên làm test level xong để lại SĐT; mentor nào cũng thấy, mentor nhận trước phụ trách.
 * - Tôi phụ trách: yêu cầu mình đã nhận → gọi / email tư vấn → chốt thì "Tạo gói kèm 1-1", không chốt thì "Kết thúc".
 * - Tìm học viên: mentor nào cũng tìm được học viên để xem điểm test level (từng kỹ năng, nhận xét AI).
 *   Chấm bài Exam cho học viên thì chỉ khi học viên đã thuê mentor đó (luồng chấm bài riêng).
 */

import React, { useState } from 'react';
import { CalendarPlus, Eye, Mail, Phone, Search, UserCheck, X, XCircle } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Pagination } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { getErrorMessage } from '@/shared/api/axiosClient';
import { cn } from '@/shared/utils/cn';
import {
  CONSULTATION_STATUS_LABEL,
  CONSULTATION_STATUS_VARIANT,
  formatDate,
  formatDayLabel,
  formatTime,
  useClaimConsultation,
  useMentorConsultations,
  useStudentLevelTestResult,
  useStudentLevelTests,
  useStudentOverview,
  useStudentSearch,
  useUpdateConsultationStatus,
} from '@/shared/schedule';
import type { Consultation, StudentOverview } from '@/shared/types';
import { PracticeLevelCard } from '@/portals/client/features/exams/components/PracticeLevelCard';
import { AnswerReviewItem } from '@/portals/client/features/exams/components/AnswerReviewItem';
import { CreatePlanModal, type PlanStudent } from '../schedule/CreatePlanModal';

type Tab = 'open' | 'mine' | 'search';

const TABS: { id: Tab; label: string }[] = [
  { id: 'open', label: 'Yêu cầu tư vấn mới' },
  { id: 'mine', label: 'Tôi phụ trách' },
  { id: 'search', label: 'Tìm học viên' },
];

/** Thang ≤ 10 hiện 1 chữ số thập phân, thang lớn (TOEIC) hiện số nguyên */
const fmtScore = (v: number | null | undefined) =>
  v == null ? '—' : Number(v) <= 10 ? Number(v).toFixed(1) : String(Math.round(Number(v)));

const MentorStudentsView: React.FC = () => {
  const [tab, setTab] = useState<Tab>('open');
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);
  const [planFor, setPlanFor] = useState<{ student: PlanStudent; consultationId?: string } | null>(null);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Mentor workspace</p>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">Học viên & tư vấn lộ trình</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl">
          Xem điểm test level của học viên, gọi điện / email tư vấn lộ trình, chốt xong thì tạo gói kèm 1-1 gồm các buổi đã
          thống nhất.
        </p>
      </header>

      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'h-9 px-4 rounded-lg text-xs font-bold transition-colors',
              tab === t.id ? 'bg-[#0052CC] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'search' ? (
        <StudentSearchCard onView={setViewingStudentId} />
      ) : (
        <ConsultationListCard
          mine={tab === 'mine'}
          onView={setViewingStudentId}
          onCreatePlan={(c) =>
            setPlanFor({
              student: {
                userId: c.studentId,
                fullName: c.studentName,
                email: c.studentEmail,
                targetCertificateId: c.targetCertificateId,
              },
              consultationId: c.requestId,
            })
          }
        />
      )}

      {viewingStudentId && (
        <StudentDetailModal
          studentId={viewingStudentId}
          onClose={() => setViewingStudentId(null)}
          onCreatePlan={(student) => {
            setViewingStudentId(null);
            setPlanFor({ student });
          }}
        />
      )}
      {planFor && (
        <CreatePlanModal student={planFor.student} consultationId={planFor.consultationId} onClose={() => setPlanFor(null)} />
      )}
    </div>
  );
};

/* ============================================================
 *  Danh sách yêu cầu tư vấn
 * ============================================================ */
const ConsultationListCard: React.FC<{
  mine: boolean;
  onView: (studentId: string) => void;
  onCreatePlan: (c: Consultation) => void;
}> = ({ mine, onView, onCreatePlan }) => {
  const toast = useToast();
  const [page, setPage] = useState(0);
  const query = useMentorConsultations(mine, page);
  const claimMutation = useClaimConsultation();
  const statusMutation = useUpdateConsultationStatus();
  const items = query.data?.data ?? [];

  const claim = (c: Consultation) =>
    claimMutation.mutate(c.requestId, {
      onSuccess: () => toast.success(`Đã nhận tư vấn cho ${c.studentName}, chuyển sang tab "Tôi phụ trách"`),
      onError: (err) => toast.error(getErrorMessage(err)),
    });

  const close = (c: Consultation) =>
    statusMutation.mutate(
      { requestId: c.requestId, status: 'closed' },
      {
        onSuccess: () => toast.success('Đã kết thúc yêu cầu tư vấn'),
        onError: (err) => toast.error(getErrorMessage(err)),
      },
    );

  return (
    <Card>
      {query.isLoading ? (
        <p className="py-10 text-center text-slate-400 text-xs">Đang tải…</p>
      ) : query.isError ? (
        <p className="py-10 text-center text-rose-600 text-xs">{getErrorMessage(query.error)}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-slate-400 text-xs">
          {mine
            ? 'Bạn chưa nhận yêu cầu nào. Bấm "Nhận tư vấn" ở tab Yêu cầu tư vấn mới thì yêu cầu chuyển sang đây.'
            : 'Chưa có yêu cầu mới. Yêu cầu hiện ở đây khi học viên bấm "Gửi thông tin" ở trang kết quả test level / Mentor 1-1.'}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((c) => (
            <li key={c.requestId} className="py-3 flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-bold text-slate-900">{c.studentName}</p>
                  <Badge variant={CONSULTATION_STATUS_VARIANT[c.status]} size="sm">
                    {CONSULTATION_STATUS_LABEL[c.status]}
                  </Badge>
                  {c.createdAt && <span className="text-[11px] text-slate-400">{formatDate(c.createdAt)}</span>}
                </div>
                <p className="text-base text-slate-700 flex items-center gap-4 flex-wrap">
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline">
                    <Phone className="w-4 h-4" /> {c.phone}
                  </a>
                  <a href={`mailto:${c.studentEmail}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <Mail className="w-4 h-4" /> {c.studentEmail}
                  </a>
                </p>
                <p className="text-sm text-slate-500">
                  Mục tiêu: <b className="text-slate-700">{c.targetCertificateName ?? '—'} {fmtScore(c.targetScore)}</b> · Hiện tại:{' '}
                  <b className="text-slate-700">
                    {c.currentLevel ?? '—'} ({fmtScore(c.currentScore)})
                  </b>
                </p>
                {c.note && <p className="text-sm text-slate-600 italic">"{c.note}"</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button variant="outline" size="sm" leftIcon={Eye} onClick={() => onView(c.studentId)}>
                  Xem test level
                </Button>
                {c.status === 'pending' && (
                  <Button variant="primary" size="sm" leftIcon={UserCheck} isLoading={claimMutation.isPending} onClick={() => claim(c)}>
                    Nhận tư vấn
                  </Button>
                )}
                {mine && c.status === 'contacted' && (
                  <>
                    <Button variant="primary" size="sm" leftIcon={CalendarPlus} onClick={() => onCreatePlan(c)}>
                      Chốt & tạo gói
                    </Button>
                    <Button variant="ghost" size="sm" leftIcon={XCircle} onClick={() => close(c)}>
                      Kết thúc
                    </Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination className="mt-4" currentPage={page} totalPages={query.data?.totalPages ?? 0} onChange={setPage} />
    </Card>
  );
};

/* ============================================================
 *  Tìm học viên
 * ============================================================ */
const StudentSearchCard: React.FC<{ onView: (studentId: string) => void }> = ({ onView }) => {
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const query = useStudentSearch(keyword, page);
  const students = query.data?.data ?? [];

  return (
    <Card className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setKeyword(input.trim());
          setPage(0);
        }}
        className="flex gap-2"
      >
        <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-lg border border-slate-200 focus-within:border-[#0052CC]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tên, email hoặc số điện thoại của học viên…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <Button type="submit" variant="primary" size="md">
          Tìm
        </Button>
      </form>

      {query.isLoading ? (
        <p className="py-8 text-center text-slate-400 text-xs">Đang tìm…</p>
      ) : query.isError ? (
        <p className="py-8 text-center text-rose-600 text-xs">{getErrorMessage(query.error)}</p>
      ) : students.length === 0 ? (
        <p className="py-8 text-center text-slate-400 text-xs">Không tìm thấy học viên nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100 uppercase tracking-wider text-[11px]">
                <th className="py-2 pr-3 font-bold">Học viên</th>
                <th className="py-2 pr-3 font-bold">Mục tiêu</th>
                <th className="py-2 pr-3 font-bold">Trình độ test level</th>
                <th className="py-2 pr-3 font-bold">Tư vấn</th>
                <th className="py-2 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((s: StudentOverview) => (
                <tr key={s.userId}>
                  <td className="py-2.5 pr-3">
                    <p className="text-base font-bold text-slate-900">{s.fullName}</p>
                    <p className="text-slate-600">{s.email}</p>
                    {s.phone && <p className="font-bold text-[#0052CC]">{s.phone}</p>}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-700">
                    {s.targetCertificateName ? `${s.targetCertificateName} ${fmtScore(s.targetScore)}` : '—'}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-700">
                    {s.currentLevel ? `${s.currentLevel} (${fmtScore(s.currentScore)})` : 'Chưa test'}
                    <span className="text-slate-400"> · {s.levelTestCount} lượt</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    {s.consultationStatus ? (
                      <Badge variant={CONSULTATION_STATUS_VARIANT[s.consultationStatus]} size="sm">
                        {CONSULTATION_STATUS_LABEL[s.consultationStatus]}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">Chưa gửi</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <Button variant="outline" size="sm" leftIcon={Eye} onClick={() => onView(s.userId)}>
                      Xem
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination currentPage={page} totalPages={query.data?.totalPages ?? 0} onChange={setPage} />
    </Card>
  );
};

/* ============================================================
 *  Hồ sơ học viên + kết quả test level
 * ============================================================ */
const StudentDetailModal: React.FC<{
  studentId: string;
  onClose: () => void;
  onCreatePlan: (student: PlanStudent) => void;
}> = ({ studentId, onClose, onCreatePlan }) => {
  const [page, setPage] = useState(0);
  const [pickedAttemptId, setAttemptId] = useState<string | null>(null);
  const overviewQuery = useStudentOverview(studentId);
  const testsQuery = useStudentLevelTests(studentId, page);
  const student = overviewQuery.data;
  const tests = testsQuery.data?.data ?? [];
  // Chưa chọn thì mở lượt test gần nhất đã nộp
  const attemptId = pickedAttemptId ?? tests.find((t) => t.status !== 'in_progress')?.attemptId ?? null;
  const resultQuery = useStudentLevelTestResult(studentId, attemptId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl border border-slate-100 space-y-5">
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          {student ? (
            <div className="min-w-0">
              <h3 className="text-xl font-extrabold text-slate-900">{student.fullName}</h3>
              <p className="text-base text-slate-700 flex items-center gap-4 flex-wrap mt-1">
                <a href={`mailto:${student.email}`} className="inline-flex items-center gap-1.5 hover:underline">
                  <Mail className="w-4 h-4" /> {student.email}
                </a>
                {student.phone ? (
                  <a href={`tel:${student.phone}`} className="inline-flex items-center gap-1.5 font-bold text-[#0052CC] hover:underline">
                    <Phone className="w-4 h-4" /> {student.phone}
                  </a>
                ) : (
                  <span className="text-slate-400">Chưa để lại SĐT</span>
                )}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Mục tiêu{' '}
                <b className="text-slate-700">
                  {student.targetCertificateName ?? '—'} {fmtScore(student.targetScore)}
                </b>{' '}
                · Trình độ hiện tại{' '}
                <b className="text-slate-700">
                  {student.currentLevel ?? '—'} ({fmtScore(student.currentScore)})
                </b>
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">{overviewQuery.isError ? getErrorMessage(overviewQuery.error) : 'Đang tải…'}</p>
          )}
          <div className="flex items-center gap-2 shrink-0">
            {student && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={CalendarPlus}
                onClick={() =>
                  onCreatePlan({
                    userId: student.userId,
                    fullName: student.fullName,
                    email: student.email,
                    targetCertificateId: student.targetCertificateId,
                  })
                }
              >
                Tạo gói kèm 1-1
              </Button>
            )}
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg" aria-label="Đóng">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Các lượt test level */}
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Các lượt test level</p>
          {testsQuery.isLoading ? (
            <p className="text-xs text-slate-400">Đang tải…</p>
          ) : tests.length === 0 ? (
            <p className="text-xs text-slate-400">Học viên chưa làm test level nào.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {tests.map((t) => (
                <button
                  key={t.attemptId}
                  type="button"
                  disabled={t.status === 'in_progress'}
                  onClick={() => setAttemptId(t.attemptId)}
                  className={cn(
                    'text-left px-3 py-2 rounded-lg border text-xs transition-colors disabled:opacity-40',
                    attemptId === t.attemptId ? 'border-[#0052CC] bg-blue-50' : 'border-slate-200 hover:bg-slate-50',
                  )}
                >
                  <p className="font-bold text-slate-800">{t.examTitle}</p>
                  <p className="text-slate-500">
                    {formatDayLabel(t.startTime)} · {formatTime(t.startTime)}
                    {t.status === 'in_progress' ? ' · đang làm' : ''}
                  </p>
                </button>
              ))}
            </div>
          )}
          <Pagination className="mt-2" currentPage={page} totalPages={testsQuery.data?.totalPages ?? 0} onChange={setPage} />
        </div>

        {/* Kết quả chi tiết */}
        {attemptId && (
          resultQuery.isLoading ? (
            <p className="text-sm text-slate-400">Đang tải kết quả…</p>
          ) : resultQuery.isError ? (
            <p className="text-sm text-rose-600">{getErrorMessage(resultQuery.error)}</p>
          ) : resultQuery.data ? (
            <div className="space-y-4">
              {resultQuery.data.practiceLevel ? (
                <PracticeLevelCard level={resultQuery.data.practiceLevel} forMentor />
              ) : (
                <p className="text-sm text-slate-500">Lượt test này chưa chấm xong (còn câu Writing / Speaking chờ AI chấm).</p>
              )}
              <Card className="space-y-3">
                <h4 className="font-extrabold text-slate-900">Chi tiết bài làm</h4>
                {resultQuery.data.answers.map((a) => (
                  <AnswerReviewItem key={a.questionId} answer={a} isScoreVisible />
                ))}
              </Card>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
};

export default MentorStudentsView;
