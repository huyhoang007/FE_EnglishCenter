/**
 * ExamEditorView — Soạn đề (Dev 3)
 * -----------------------------------------------------------
 * Header: quay lại, tên đề, trạng thái, thông tin tổng quan; hành động chính theo trạng thái
 * (Công khai đề / Chuyển về nháp / Khôi phục về nháp), Lưu trữ + Xóa đề nằm trong menu phụ.
 * Vùng làm việc: danh sách phần thi theo chiều dọc; "Thêm phần thi" mở form tại chỗ; "Nhập từ Word".
 * Chỉ sửa cấu trúc khi đề là nháp và chưa có lượt thi (backend chặn với mã 5005 / 5006).
 * URL: /admin/exams/:examId
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  EyeOff,
  FileUp,
  Info,
  MoreHorizontal,
  Plus,
  Rocket,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import {
  SECTION_TYPES_BY_SCALE,
  detectScale,
  formatScaleScore,
  percentToPass,
} from '@/shared/constants/examScales';
import { EXAM_TYPE_LABEL } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { useAdminExam, useExamActions } from './hooks/useAdminExams';
import { AddQuestionModal } from './components/AddQuestionModal';
import { AddSectionForm } from './components/AddSectionForm';
import { ExamStatusPill } from './components/ExamStatusPill';
import { ImportExamModal } from './components/ImportExamModal';
import { QuestionRow } from './components/QuestionRow';
import { SectionCard } from './components/SectionCard';

const FOCUS_RING = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0052CC]/40';

export const ExamEditorView: React.FC = () => {
  const { examId = '' } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useAdminExam(examId);
  const actions = useExamActions(examId);
  /** null = đóng modal; '' = câu không thuộc phần thi; còn lại = sectionId */
  const [questionTarget, setQuestionTarget] = useState<string | null>(null);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isAddSectionOpen, setAddSectionOpen] = useState(false);

  const backLink = (
    <Link
      to={ADMIN_ROUTES.exams}
      className={cn('inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded', FOCUS_RING)}
    >
      <ArrowLeft className="w-4 h-4" /> Danh sách đề thi
    </Link>
  );

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {backLink}
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const { exam } = data;
  const isDraft = exam.status === 'draft';
  const isArchived = exam.status === 'archived';
  const scale = detectScale(exam.certificateName);
  const onError = (err: Error) => toast.error(err.message);
  const looseQuestions = data.unsectionedQuestions ?? [];
  const hasContent = data.sections.length > 0 || looseQuestions.length > 0;

  const handleDelete = () => {
    if (!window.confirm(`Xóa đề "${exam.examTitle}"? Thao tác này không hoàn tác được.`)) return;
    actions.remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã xóa đề');
        navigate(ADMIN_ROUTES.exams);
      },
      onError,
    });
  };
  const handleArchive = () => {
    if (!window.confirm(`Lưu trữ đề "${exam.examTitle}"? Học viên sẽ không thấy đề này nữa, lịch sử thi vẫn được giữ.`)) return;
    actions.archive.mutate(undefined, { onSuccess: () => toast.success('Đã lưu trữ đề'), onError });
  };

  const primaryAction = isDraft ? (
    <Button
      leftIcon={Rocket}
      className="h-10"
      isLoading={actions.publish.isPending}
      onClick={() => actions.publish.mutate(undefined, { onSuccess: () => toast.success('Đã công khai đề'), onError })}
    >
      Công khai đề
    </Button>
  ) : isArchived ? (
    <Button
      leftIcon={ArchiveRestore}
      className="h-10"
      isLoading={actions.restore.isPending}
      onClick={() => actions.restore.mutate(undefined, { onSuccess: () => toast.success('Đã khôi phục đề về nháp'), onError })}
    >
      Khôi phục về nháp
    </Button>
  ) : (
    <Button
      leftIcon={EyeOff}
      variant="outline"
      className="h-10"
      isLoading={actions.unpublish.isPending}
      onClick={() => actions.unpublish.mutate(undefined, { onSuccess: () => toast.success('Đã chuyển đề về nháp'), onError })}
    >
      Chuyển về nháp
    </Button>
  );

  const meta: string[] = [
    exam.examCode ?? 'Chưa có mã đề',
    exam.examType ? EXAM_TYPE_LABEL[exam.examType] : '',
    `${exam.durationMinutes} phút`,
    `${exam.totalQuestions} câu hỏi`,
    `${data.sections.length} phần thi`,
    `${data.maxScore} điểm`,
    `${exam.totalAttempts ?? 0} lượt thi`,
    scale.kind !== 'raw'
      ? `Điểm đạt ${scale.label} ${formatScaleScore(scale, percentToPass(scale, exam.passingScore ?? 0))}`
      : `Điểm đạt ${exam.passingScore ?? 0}%`,
  ].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {backLink}

      {/* ---------- Header đề ---------- */}
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight break-words min-w-0">{exam.examTitle}</h1>
            <ExamStatusPill status={exam.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
            {exam.certificateName && <Badge variant={scale.badge} size="sm">{exam.certificateName}</Badge>}
            {exam.courseTitle && <span className="font-medium text-slate-700">{exam.courseTitle}</span>}
            {meta.map((m, i) => (
              <span key={m} className="inline-flex items-center gap-2">
                {(i > 0 || exam.certificateName || exam.courseTitle) && <span className="text-slate-300" aria-hidden="true">•</span>}
                {m}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {primaryAction}
          <MoreActions
            items={[
              ...(!isArchived
                ? [{ label: 'Lưu trữ', icon: Archive, onSelect: handleArchive }]
                : []),
              { label: 'Xóa', icon: Trash2, onSelect: handleDelete, danger: true },
            ]}
          />
        </div>
      </div>

      {/* ---------- Thông báo trạng thái ---------- */}
      {!isDraft && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
            isArchived ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-900',
          )}
          role="status"
        >
          <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <p>
            {isArchived
              ? 'Đề đã lưu trữ: học viên không thấy đề này, lịch sử và kết quả các lượt thi vẫn được giữ. Khôi phục về nháp để chỉnh sửa và dùng lại.'
              : 'Đề đang công khai: chuyển về nháp để sửa phần thi và câu hỏi. Đề đã có lượt thi thì không sửa được cấu trúc.'}
          </p>
        </div>
      )}

      {/* ---------- Thanh công cụ phần thi ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900">Phần thi ({data.sections.length})</h2>
          {isDraft && (
            <p className="text-xs text-slate-600 mt-0.5">
              Có sẵn đề trong Word? Dùng “Nhập từ Word” để tạo cả bộ đề từ file .docx viết theo mẫu.
            </p>
          )}
        </div>
        {isDraft && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" leftIcon={FileUp} className="h-10" onClick={() => setImportOpen(true)}>
              Nhập từ Word
            </Button>
            <Button
              variant="secondary"
              leftIcon={Plus}
              className="h-10"
              onClick={() => setAddSectionOpen(true)}
              disabled={isAddSectionOpen}
            >
              Thêm phần thi
            </Button>
          </div>
        )}
      </div>

      {/* ---------- Form thêm phần thi (mở khi bấm) ---------- */}
      {isDraft && isAddSectionOpen && (
        <div className="rounded-2xl border border-[#0052CC]/30 bg-white p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Thêm phần thi</h3>
          <AddSectionForm
            key={exam.examId}
            scaleKind={scale.kind}
            isSubmitting={actions.addSection.isPending}
            serverError={actions.addSection.error?.message}
            onCancel={() => {
              actions.addSection.reset();
              setAddSectionOpen(false);
            }}
            onSubmit={(payload, reset) =>
              actions.addSection.mutate(payload, {
                onSuccess: () => {
                  reset();
                  setAddSectionOpen(false);
                  toast.success('Đã thêm phần thi');
                },
              })
            }
          />
        </div>
      )}

      {/* ---------- Danh sách phần thi ---------- */}
      {hasContent ? (
        <div className="space-y-4">
          {data.sections.map((section, index) => (
            <SectionCard
              key={section.sectionId}
              section={section}
              index={index}
              isEditable={isDraft}
              onAddQuestion={() => setQuestionTarget(section.sectionId)}
              onRemove={() =>
                window.confirm(`Xóa phần thi "${section.title}" và các câu hỏi của nó?`) &&
                actions.removeSection.mutate(section.sectionId, { onError })
              }
              onRemoveQuestion={(questionId) => actions.removeQuestion.mutate(questionId, { onError })}
            />
          ))}

          {looseQuestions.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 space-y-3">
              <h3 className="text-base font-bold text-slate-900">Câu hỏi không thuộc phần thi</h3>
              {looseQuestions.map((q) => (
                <QuestionRow
                  key={q.questionId}
                  question={q}
                  isEditable={isDraft}
                  onRemove={() => actions.removeQuestion.mutate(q.questionId, { onError })}
                />
              ))}
            </section>
          )}
        </div>
      ) : (
        !isAddSectionOpen && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
            <p className="text-base font-bold text-slate-900">Đề chưa có phần thi nào</p>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              {isDraft
                ? 'Thêm phần thi (Listening, Reading…) rồi thêm câu hỏi vào từng phần, hoặc nhập cả bộ đề từ file Word.'
                : 'Chuyển đề về nháp để thêm phần thi và câu hỏi.'}
            </p>
            {isDraft && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button leftIcon={Plus} className="h-10" onClick={() => setAddSectionOpen(true)}>
                  Thêm phần thi
                </Button>
                <Button variant="outline" leftIcon={FileUp} className="h-10" onClick={() => setImportOpen(true)}>
                  Nhập từ Word
                </Button>
              </div>
            )}
          </div>
        )
      )}

      {isImportOpen && (
        <ImportExamModal
          examId={examId}
          certificateLabel={exam.certificateName ?? 'đề không thuộc chứng chỉ'}
          allowedSectionTypes={SECTION_TYPES_BY_SCALE[scale.kind]}
          onClose={() => setImportOpen(false)}
        />
      )}

      {questionTarget !== null && (
        <AddQuestionModal
          sections={data.sections}
          defaultSectionId={questionTarget || undefined}
          isSubmitting={actions.addQuestion.isPending}
          serverError={actions.addQuestion.error?.message}
          onClose={() => {
            actions.addQuestion.reset();
            setQuestionTarget(null);
          }}
          onSubmit={(payload) =>
            actions.addQuestion.mutate(payload, {
              onSuccess: () => {
                toast.success('Đã thêm câu hỏi');
                setQuestionTarget(null);
              },
            })
          }
        />
      )}
    </div>
  );
};

/* ---------- Menu phụ (⋯): thao tác ít dùng / nguy hiểm ---------- */

interface MenuItem {
  label: string;
  icon: React.ElementType;
  onSelect: () => void;
  danger?: boolean;
}

const MoreActions: React.FC<{ items: MenuItem[] }> = ({ items }) => {
  const [isOpen, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Thao tác khác"
        title="Thao tác khác"
        className={cn(
          'h-10 w-10 rounded-xl border border-slate-300 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50',
          FOCUS_RING,
        )}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg z-20"
        >
          {items.map(({ label, icon: Icon, onSelect, danger }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSelect();
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left focus:outline-none focus-visible:bg-slate-100',
                danger ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamEditorView;
