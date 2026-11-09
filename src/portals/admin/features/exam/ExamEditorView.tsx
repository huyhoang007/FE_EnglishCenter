/**
 * ExamEditorView — Soạn đề (Dev 3)
 * -----------------------------------------------------------
 * Header: quay lại, tên đề, trạng thái, thông tin tổng quan; hành động chính theo trạng thái
 * (Công khai đề / Chuyển về nháp / Khôi phục về nháp), Lưu trữ + Xóa đề nằm trong menu phụ.
 * Vùng làm việc: danh sách phần thi theo chiều dọc; "Thêm phần thi" mở form tại chỗ; "Nhập từ Word".
 * Đề của khóa: hiện cảnh báo khi bộ đề của khóa chưa đủ (BE trả `warnings`), luật thi nối tiếp bị bỏ qua.
 * Chỉ sửa cấu trúc khi đề là nháp và chưa có lượt thi (backend chặn với mã 5005 / 5006): đề đã có lượt thi thì
 * ẩn mọi nút thêm / xóa phần thi, câu hỏi, ẩn mục Xóa đề và hướng dẫn dùng Nhân bản trong menu ⋯.
 * URL: /admin/exams/:examId
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Archive,
  ArchiveRestore,
  AlertTriangle,
  ArrowLeft,
  Copy,
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
import { formatPass, formatScore } from '@/shared/constants/examScales';
import { useCertificateScale } from '@/portals/client/features/exams/hooks/useCertificateScale';
import { EXAM_TYPE_LABEL, type ExamQuestion, type ExamSection } from '@/shared/types';
import { cn } from '@/shared/utils/cn';
import { useAdminExam, useExamActions } from './hooks/useAdminExams';
import { AddQuestionModal } from './components/AddQuestionModal';
import { AddSectionForm } from './components/AddSectionForm';
import { EditContentModal } from './components/EditContentModal';
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
  const scale = useCertificateScale(data?.exam.certificateId, data?.exam.certificateName);
  const actions = useExamActions(examId);
  /** null = đóng modal; '' = câu không thuộc phần thi; còn lại = sectionId */
  const [questionTarget, setQuestionTarget] = useState<string | null>(null);
  const [isImportOpen, setImportOpen] = useState(false);
  const [isAddSectionOpen, setAddSectionOpen] = useState(false);
  /** File Word kéo thả vào ô "Đề chưa có phần thi nào" — nhập luôn, không cần mở "Nhập từ Word" trước */
  const [droppedFile, setDroppedFile] = useState<File | undefined>();
  const [isDropping, setDropping] = useState(false);
  /** Đang sửa nội dung hiển thị của một phần thi / câu hỏi */
  const [editing, setEditing] = useState<
    { kind: 'section'; section: ExamSection } | { kind: 'question'; question: ExamQuestion } | null
  >(null);

  // Đề luyện tập AI được quản lý ở trang AI Practice
  const isPractice = data?.exam.examScope === 'practice';
  const listRoute = isPractice ? ADMIN_ROUTES.practiceExams : ADMIN_ROUTES.exams;
  const backLink = (
    <Link
      to={listRoute}
      className={cn('inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded', FOCUS_RING)}
    >
      <ArrowLeft className="w-4 h-4" /> {isPractice ? 'Danh sách đề luyện tập' : 'Danh sách đề thi'}
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
  const onError = (err: Error) => toast.error(err.message);
  const looseQuestions = data.unsectionedQuestions ?? [];
  const hasContent = data.sections.length > 0 || looseQuestions.length > 0;
  const attemptCount = exam.totalAttempts ?? 0;
  /** Đề đã có lượt thi: cấu trúc khóa vĩnh viễn (kể cả khi về nháp) để giữ đúng kết quả đã chấm */
  const hasAttempts = attemptCount > 0;
  const canEditStructure = isDraft && !hasAttempts;

  const handleDelete = () => {
    if (!window.confirm(`Xóa đề "${exam.examTitle}"? Thao tác này không hoàn tác được.`)) return;
    actions.remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã xóa đề');
        navigate(listRoute);
      },
      onError,
    });
  };
  const handleArchive = () => {
    if (!window.confirm(`Lưu trữ đề "${exam.examTitle}"? Học viên sẽ không thấy đề này nữa, lịch sử thi vẫn được giữ.`)) return;
    actions.archive.mutate(undefined, { onSuccess: () => toast.success('Đã lưu trữ đề'), onError });
  };
  /** Nhân bản thành đề nháp mới — cách sửa đáp án / cấu trúc khi đề cũ đã có lượt thi */
  const handleClone = () => {
    if (!window.confirm(`Nhân bản đề "${exam.examTitle}" thành một đề nháp mới?`)) return;
    actions.clone.mutate(undefined, {
      onSuccess: (copy) => {
        toast.success('Đã nhân bản đề, bạn đang ở bản sao');
        navigate(`${ADMIN_ROUTES.exams}/${copy.exam.examId}`);
      },
      onError,
    });
  };
  // Đề lưu trữ thì chỉ xem; còn lại sửa được nội dung hiển thị kể cả khi đã có lượt thi
  const canEditContent = !isArchived;
  const saveEditing = async (values: Record<string, string>) => {
    if (!editing) return;
    const { points, pointsPerQuestion, ...content } = values;
    try {
      if (editing.kind === 'section') {
        if (Object.keys(content).length > 0) {
          await actions.updateSection.mutateAsync({ sectionId: editing.section.sectionId, payload: content });
        }
        // "Điểm mỗi câu": đặt một lần cho mọi câu của phần thi
        if (pointsPerQuestion) {
          await Promise.all(
            (editing.section.questions ?? []).map((q) =>
              actions.updateQuestion.mutateAsync({
                questionId: q.questionId,
                payload: { points: Number(pointsPerQuestion) },
              }),
            ),
          );
        }
      } else {
        await actions.updateQuestion.mutateAsync({
          questionId: editing.question.questionId,
          payload: { ...content, ...(points ? { points: Number(points) } : {}) },
        });
      }
      toast.success('Đã lưu');
      setEditing(null);
    } catch (err) {
      onError(err as Error);
    }
  };

  const primaryAction = isDraft ? (
    <Button
      leftIcon={Rocket}
      className="h-10"
      isLoading={actions.publish.isPending}
      onClick={() =>
        actions.publish.mutate(undefined, {
          onSuccess: (detail) => {
            toast.success('Đã công khai đề');
            detail.warnings?.forEach((w) => toast.warning(w));
          },
          onError,
        })
      }
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
    // Đề theo chứng chỉ: điểm của câu chỉ là trọng số trong kỹ năng, kết quả quy về thang chứng chỉ
    scale.kind === 'raw'
      ? `${data.maxScore} điểm`
      : `Thang ${scale.label} ${formatScore(scale.min, scale.step)} – ${formatScore(scale.max, scale.step)}`,
    `${exam.totalAttempts ?? 0} lượt thi`,
    `Điểm đạt ${formatPass(scale, exam.passingScore ?? 0)}`,
  ].filter(Boolean);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {backLink}

      {/* ---------- Header đề ---------- */}
      <div className="space-y-2">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight min-w-0 [overflow-wrap:anywhere]">{exam.examTitle}</h1>
            <ExamStatusPill status={exam.status} />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {primaryAction}
          <MoreActions
            items={[
              { label: 'Nhân bản', icon: Copy, onSelect: handleClone },
              ...(!isArchived
                ? [{ label: 'Lưu trữ', icon: Archive, onSelect: handleArchive }]
                : []),
              // Đề đã có lượt thi không xóa được (giữ lịch sử làm bài) -> không hiện mục Xóa
              ...(!hasAttempts ? [{ label: 'Xóa', icon: Trash2, onSelect: handleDelete, danger: true }] : []),
            ]}
          />
        </div>
      </div>
      {/* Thông tin tổng quan: một hàng chạy hết chiều rộng, màn hẹp thì kéo ngang */}
      <div className="flex items-center gap-x-1.5 text-[13px] text-slate-600 whitespace-nowrap overflow-x-auto pb-1">
        {exam.certificateName && <Badge variant={scale.badge} size="sm">{exam.certificateName}</Badge>}
        {exam.courseTitle && <span className="font-medium text-slate-700">{exam.courseTitle}</span>}
        {meta.map((m, i) => (
          <span key={m} className="inline-flex items-center gap-1.5">
            {(i > 0 || exam.certificateName || exam.courseTitle) && <span className="text-slate-300" aria-hidden="true">•</span>}
            {m}
          </span>
        ))}
      </div>
      </div>

      {/* ---------- Cảnh báo bộ đề của khóa chưa đủ (luật Quiz → Giữa kỳ → Cuối kỳ bị bỏ qua) ---------- */}
      {data.warnings && data.warnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <ul className="space-y-1">
            {data.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ---------- Thông báo trạng thái ---------- */}
      {(!isDraft || hasAttempts) && (
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3 text-sm',
            isArchived || hasAttempts ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-blue-200 bg-blue-50 text-blue-900',
          )}
          role="status"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              {isArchived && 'Đề đã lưu trữ: học viên không thấy đề này, lịch sử và kết quả các lượt thi vẫn được giữ. '}
              {hasAttempts
                ? `Đề đã có ${attemptCount} lượt thi nên không đổi được phần thi, câu hỏi, đáp án hay điểm (để giữ đúng kết quả đã chấm), kể cả khi về nháp. Vẫn sửa được chữ, giải thích và link audio. Muốn đổi cấu trúc, chọn Nhân bản trong menu ⋯ để tạo đề mới.`
                : isArchived
                  ? 'Khôi phục về nháp để chỉnh sửa và dùng lại.'
                  : 'Đề đang công khai: chuyển về nháp để sửa phần thi và câu hỏi.'}
            </p>
          </div>
        </div>
      )}

      {/* ---------- Thanh công cụ phần thi ---------- */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-200 pb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-900">Phần thi ({data.sections.length})</h2>
          {/* Đề trống: nút nằm ở khung trống bên dưới, không lặp lại trên thanh công cụ */}
          {canEditStructure && hasContent && (
            <p className="text-xs text-slate-600 mt-0.5">
              Có sẵn đề trong file? Dùng “Nhập từ file” để AI đọc PDF / Word và tạo cả bộ đề.
            </p>
          )}
        </div>
        {canEditStructure && hasContent && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" leftIcon={FileUp} className="h-10" onClick={() => setImportOpen(true)}>
              Nhập từ file
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
      {canEditStructure && isAddSectionOpen && (
        <div className="rounded-2xl border border-[#0052CC]/30 bg-white p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Thêm phần thi</h3>
          <AddSectionForm
            key={exam.examId}
            scale={scale}
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
              isEditable={canEditStructure}
              onAddQuestion={() => setQuestionTarget(section.sectionId)}
              onRemove={() =>
                window.confirm(`Xóa phần thi "${section.title}" và các câu hỏi của nó?`) &&
                actions.removeSection.mutate(section.sectionId, { onError })
              }
              onRemoveQuestion={(questionId) => actions.removeQuestion.mutate(questionId, { onError })}
              onEdit={canEditContent ? () => setEditing({ kind: 'section', section }) : undefined}
              onEditQuestion={canEditContent ? (question) => setEditing({ kind: 'question', question }) : undefined}
            />
          ))}

          {looseQuestions.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 space-y-3">
              <h3 className="text-base font-bold text-slate-900">Câu hỏi không thuộc phần thi</h3>
              {looseQuestions.map((q) => (
                <QuestionRow
                  key={q.questionId}
                  question={q}
                  isEditable={canEditStructure}
                  onRemove={() => actions.removeQuestion.mutate(q.questionId, { onError })}
                  onEdit={canEditContent ? () => setEditing({ kind: 'question', question: q }) : undefined}
                />
              ))}
            </section>
          )}
        </div>
      ) : (
        !isAddSectionOpen && (
          <div
            onDragOver={(e) => {
              if (!canEditStructure) return;
              e.preventDefault();
              setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={(e) => {
              if (!canEditStructure) return;
              e.preventDefault();
              setDropping(false);
              const file = e.dataTransfer.files[0];
              if (!file) return;
              setDroppedFile(file);
              setImportOpen(true);
            }}
            className={cn(
              'rounded-2xl border border-dashed bg-white px-6 py-10 text-center transition-colors',
              isDropping ? 'border-2 border-primary bg-primary/5' : 'border-slate-300',
            )}
          >
            <p className="text-base font-bold text-slate-900">
              {isDropping ? 'Thả file PDF / Word để tạo bộ đề' : 'Đề chưa có phần thi nào'}
            </p>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">
              {canEditStructure
                ? 'Thêm phần thi (Listening, Reading…) rồi thêm câu hỏi vào từng phần, hoặc kéo thả file PDF, Word (.docx) hoặc .txt vào đây để tạo cả bộ đề (AI đọc file tự do).'
                : hasAttempts
                  ? 'Đề đã có lượt thi nên không thêm được phần thi. Chọn Nhân bản trong menu ⋯ để tạo đề mới.'
                  : 'Chuyển đề về nháp để thêm phần thi và câu hỏi.'}
            </p>
            {canEditStructure && (
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button leftIcon={Plus} className="h-10" onClick={() => setAddSectionOpen(true)}>
                  Thêm phần thi
                </Button>
                <Button variant="outline" leftIcon={FileUp} className="h-10" onClick={() => setImportOpen(true)}>
                  Nhập từ file
                </Button>
              </div>
            )}
          </div>
        )
      )}

      {isImportOpen && (
        <ImportExamModal
          examId={examId}
          scale={scale}
          initialFile={droppedFile}
          onClose={() => {
            setImportOpen(false);
            setDroppedFile(undefined);
          }}
        />
      )}

      {editing && (
        <EditContentModal
          title={editing.kind === 'section' ? 'Sửa nội dung phần thi' : `Sửa nội dung câu ${editing.question.displayNumber}`}
          fields={
            editing.kind === 'section'
              ? [
                  { key: 'title', label: 'Tên phần thi', value: editing.section.title, required: true },
                  { key: 'instructions', label: 'Hướng dẫn', value: editing.section.instructions, multiline: true },
                  { key: 'passageText', label: 'Đoạn đọc', value: editing.section.passageText, multiline: true },
                  { key: 'audioUrl', label: 'Link file nghe', value: editing.section.audioUrl },
                  // Đề chưa có lượt thi: đặt điểm cho mọi câu của phần một lần
                  ...(canEditStructure && (editing.section.questions?.length ?? 0) > 0
                    ? [
                        {
                          key: 'pointsPerQuestion',
                          label: 'Điểm mỗi câu',
                          numeric: true,
                          placeholder: 'Để trống = giữ nguyên',
                          hint: `Áp dụng cho cả ${editing.section.questions?.length} câu của phần này.`,
                        },
                      ]
                    : []),
                ]
              : [
                  { key: 'questionText', label: 'Nội dung câu hỏi', value: editing.question.questionText, multiline: true, required: true },
                  { key: 'explanation', label: 'Giải thích đáp án', value: editing.question.explanation, multiline: true },
                  { key: 'audioUrl', label: 'Link audio', value: editing.question.audioUrl },
                  { key: 'imageUrl', label: 'Link ảnh', value: editing.question.imageUrl },
                  ...(canEditStructure
                    ? [{ key: 'points', label: 'Điểm', value: String(editing.question.points ?? 1), numeric: true }]
                    : []),
                ]
          }
          isSaving={actions.updateSection.isPending || actions.updateQuestion.isPending}
          note={
            canEditStructure
              ? 'Đề chưa có lượt thi nên sửa được cả điểm. Đáp án và dạng câu không đổi ở đây.'
              : undefined
          }
          onSave={saveEditing}
          onClose={() => setEditing(null)}
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
