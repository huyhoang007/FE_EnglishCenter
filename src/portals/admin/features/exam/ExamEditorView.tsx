/**
 * ExamEditorView — Soạn đề (Dev 3)
 * -----------------------------------------------------------
 * Section, câu hỏi (kèm đáp án đúng), publish / unpublish / xóa.
 * Chỉ sửa được cấu trúc khi đề là nháp và chưa có lượt thi (backend chặn với mã 5005 / 5006).
 * URL: /admin/exams/:examId
 */

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, EyeOff, FileUp, Plus, Rocket, Trash2 } from 'lucide-react';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import { SECTION_TYPES_BY_SCALE, detectScale } from '@/shared/constants/examScales';
import { EXAM_STATUS_LABEL, EXAM_TYPE_LABEL } from '@/shared/types';
import { useAdminExam, useExamActions } from './hooks/useAdminExams';
import { AddQuestionModal } from './components/AddQuestionModal';
import { AddSectionForm } from './components/AddSectionForm';
import { QuestionRow } from './components/QuestionRow';
import { ImportExamModal } from './components/ImportExamModal';

export const ExamEditorView: React.FC = () => {
  const { examId = '' } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading, isError, error, refetch } = useAdminExam(examId);
  const actions = useExamActions(examId);
  /** null = đóng modal; '' = câu không thuộc section; còn lại = sectionId */
  const [questionTarget, setQuestionTarget] = useState<string | null>(null);
  const [isImportOpen, setImportOpen] = useState(false);

  const backButton = (
    <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onClick={() => navigate(ADMIN_ROUTES.exams)}>
      Danh sách đề
    </Button>
  );

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="space-y-5">
        {backButton}
        <ErrorState message={error?.message} onRetry={() => refetch()} />
      </div>
    );
  }

  const { exam } = data;
  const isDraft = exam.status === 'draft';
  const onError = (err: Error) => toast.error(err.message);

  const handleDelete = () => {
    if (!window.confirm(`Xóa đề "${exam.examTitle}"?`)) return;
    actions.remove.mutate(undefined, {
      onSuccess: () => {
        toast.success('Đã xóa đề');
        navigate(ADMIN_ROUTES.exams);
      },
      onError,
    });
  };

  return (
    <div className="space-y-5">
      {backButton}

      <Card className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900">{exam.examTitle}</h1>
            <Badge variant={isDraft ? 'neutral' : 'success'}>{EXAM_STATUS_LABEL[exam.status]}</Badge>
          </div>
          <p className="text-sm text-slate-500">
            {exam.examCode ?? 'Không mã'} · {exam.examType ? EXAM_TYPE_LABEL[exam.examType] : '—'} ·{' '}
            {exam.durationMinutes} phút · {exam.totalQuestions} câu · {data.maxScore} điểm · {exam.totalAttempts ?? 0}{' '}
            lượt thi
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft ? (
            <Button
              leftIcon={Rocket}
              variant="success"
              isLoading={actions.publish.isPending}
              onClick={() =>
                actions.publish.mutate(undefined, { onSuccess: () => toast.success('Đã công khai đề'), onError })
              }
            >
              Publish
            </Button>
          ) : (
            <Button
              leftIcon={EyeOff}
              variant="outline"
              isLoading={actions.unpublish.isPending}
              onClick={() =>
                actions.unpublish.mutate(undefined, { onSuccess: () => toast.success('Đã chuyển về nháp'), onError })
              }
            >
              Unpublish
            </Button>
          )}
          <Button leftIcon={Trash2} variant="danger" isLoading={actions.remove.isPending} onClick={handleDelete}>
            Xóa đề
          </Button>
        </div>
      </Card>

      {!isDraft && (
        <p className="text-sm text-status-warning font-semibold">
          Đề đang công khai: hãy Unpublish để sửa section / câu hỏi (đề đã có lượt thi thì không sửa cấu trúc được).
        </p>
      )}

      {data.sections.map((section) => (
        <Card key={section.sectionId} className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="ai" size="sm">{section.sectionType}</Badge>
            <h2 className="font-extrabold text-slate-900 flex-1">{section.title}</h2>
            <span className="text-xs text-slate-500">
              {section.questionCount} câu · {section.maxScore ?? 0} điểm
            </span>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={Plus}
              disabled={!isDraft}
              onClick={() => setQuestionTarget(section.sectionId)}
            >
              Câu hỏi
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={!isDraft}
              aria-label="Xóa section"
              onClick={() =>
                window.confirm(`Xóa section "${section.title}" và các câu của nó?`) &&
                actions.removeSection.mutate(section.sectionId, { onError })
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {section.passageText && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 whitespace-pre-line line-clamp-4">
              {section.passageText}
            </p>
          )}
          {(section.questions ?? []).map((q) => (
            <QuestionRow
              key={q.questionId}
              question={q}
              isEditable={isDraft}
              onRemove={() => actions.removeQuestion.mutate(q.questionId, { onError })}
            />
          ))}
        </Card>
      ))}

      {(data.unsectionedQuestions ?? []).length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-extrabold text-slate-900">Câu hỏi không thuộc section</h2>
          {(data.unsectionedQuestions ?? []).map((q) => (
            <QuestionRow
              key={q.questionId}
              question={q}
              isEditable={isDraft}
              onRemove={() => actions.removeQuestion.mutate(q.questionId, { onError })}
            />
          ))}
        </Card>
      )}

      {isDraft && (
        <div className="grid lg:grid-cols-2 gap-4">
          <AddSectionForm
            key={exam.examId}
            scaleKind={detectScale(exam.certificateName).kind}
            isSubmitting={actions.addSection.isPending}
            serverError={actions.addSection.error?.message}
            onSubmit={(payload, reset) => actions.addSection.mutate(payload, { onSuccess: reset })}
          />
          <Card className="flex flex-col items-center justify-center text-center gap-3">
            <p className="text-sm text-slate-500">
              Thêm câu hỏi bằng nút “Câu hỏi” ở từng section, hoặc nhập cả bộ đề từ file Word theo mẫu.
            </p>
            <Button variant="secondary" leftIcon={FileUp} onClick={() => setImportOpen(true)}>
              Nhập từ Word
            </Button>
          </Card>
        </div>
      )}

      {isImportOpen && (
        <ImportExamModal
          examId={examId}
          certificateLabel={exam.certificateName ?? 'đề không thuộc chứng chỉ'}
          allowedSectionTypes={SECTION_TYPES_BY_SCALE[detectScale(exam.certificateName).kind]}
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

export default ExamEditorView;
