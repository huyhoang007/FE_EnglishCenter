/**
 * MentorHomeworkLibrary — tab "Bài tập của tôi" trong trang Homework của mentor (Dev 5, V27)
 * -----------------------------------------------------------
 * - "Import PDF": chọn 1 file PDF đề → song song (1) upload làm file đề đính kèm cho học viên xem,
 *   (2) AI đọc ra tên / đề bài / hình thức nộp / điểm → mở form đã điền sẵn, mentor chỉ chỉnh hạn nộp rồi lưu.
 * - Gắn bài vào lộ trình: trang Learning Paths → sửa lộ trình của mình → loại chặng "Bài tập mentor".
 * - Chỉ học viên đã mua gói kèm 1-1 làm được bài; mentor 1-1 của học viên chấm tay (không AI chấm).
 * - Sửa / xóa: xóa chỉ khi chưa có bài nộp và không nằm trong lộ trình nào (BE cũng chặn).
 */

import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Pencil, Plus, Route, Trash2, Upload } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '@/shared/components/Feedback';
import { useToast } from '@/shared/components/Toast';
import { CLIENT_ROUTES } from '@/shared/constants/routes';
import { uploadToCloudinary } from '@/shared/hooks/useCloudinaryUpload';
import { fileToBase64, MAX_PDF_BYTES } from '@/portals/admin/features/exam/utils/examImport';
import type { HomeworkAiDraft, MentorHomework } from '@/shared/types/homework.types';
import { useDeleteMentorHomework, useImportHomeworkPdf, useMentorHomeworks } from './hooks/useMentorHomework';
import {
  HomeworkFormModal,
  SUBMISSION_TYPE_LABEL,
  withPdfExtension,
  type HomeworkAttachment,
} from './HomeworkFormModal';

type FormTarget =
  | { mode: 'edit'; homework: MentorHomework }
  | { mode: 'create'; draft: HomeworkAiDraft | null; attachment: HomeworkAttachment | null };

export const MentorHomeworkLibrary: React.FC = () => {
  const toast = useToast();
  const homeworksQuery = useMentorHomeworks();
  const importMutation = useImportHomeworkPdf();
  const deleteMutation = useDeleteMentorHomework();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleting, setDeleting] = useState<MentorHomework | null>(null);
  const homeworks = homeworksQuery.data ?? [];

  /** Upload PDF làm file đề + AI đọc đề, chạy song song; lỗi phần nào thì vẫn mở form với phần còn lại */
  const handleImport = async (file: File | undefined) => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) || file.size > MAX_PDF_BYTES) {
      toast.error('Chỉ nhận file PDF, tối đa 15MB');
      return;
    }
    setImporting(true);
    let attachment: HomeworkAttachment | null = null;
    const uploadTask = uploadToCloudinary({
      file,
      purpose: 'attachment',
      notifyError: (message) => toast.error(message),
      onUploaded: (result) => {
        if (result.secure_url && result.public_id) {
          attachment = { url: result.secure_url, publicId: result.public_id, name: withPdfExtension(file.name) };
        }
      },
    });
    const aiTask = fileToBase64(file).then((fileBase64) =>
      importMutation.mutateAsync({ fileBase64, fileName: file.name }),
    );
    const [, aiResult] = await Promise.allSettled([uploadTask, aiTask]);
    setImporting(false);
    const draft = aiResult.status === 'fulfilled' ? aiResult.value : null;
    if (!draft) {
      toast.error('AI chưa đọc được file, bạn nhập đề bài thủ công nhé');
    }
    setFormTarget({ mode: 'create', draft, attachment });
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteMutation.mutate(deleting.contentId, {
      onSuccess: () => {
        toast.success('Đã xóa bài tập');
        setDeleting(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900">Bài tập của tôi</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Import file PDF đề, AI điền sẵn nội dung — bạn chỉ chỉnh hạn nộp. Sau đó vào{' '}
            <Link to={CLIENT_ROUTES.learningPath} className="font-bold text-[#0052CC] hover:underline">
              Learning Paths
            </Link>{' '}
            gắn bài vào lộ trình của bạn (loại chặng "Bài tập mentor"). Chỉ học viên đã mua gói kèm 1-1 mới làm bài,
            bài nộp vào tab Chấm bài để bạn chấm tay.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => void handleImport(e.target.files?.[0])}
          />
          <Button
            variant="primary"
            size="md"
            leftIcon={Upload}
            isLoading={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? 'AI đang đọc PDF…' : 'Import PDF'}
          </Button>
          <Button
            variant="outline"
            size="md"
            leftIcon={Plus}
            disabled={importing}
            onClick={() => setFormTarget({ mode: 'create', draft: null, attachment: null })}
          >
            Tạo thủ công
          </Button>
        </div>
      </Card>

      {homeworksQuery.isLoading ? (
        <Skeleton className="h-40" />
      ) : homeworksQuery.isError ? (
        <ErrorState message={homeworksQuery.error.message} onRetry={() => void homeworksQuery.refetch()} />
      ) : homeworks.length === 0 ? (
        <EmptyState
          title="Chưa có bài tập nào"
          description="Bấm Import PDF để tạo bài tập đầu tiên từ file đề có sẵn."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {homeworks.map((hw) => {
            const canDelete = hw.submissionCount === 0 && hw.learningPaths.length === 0;
            return (
              <Card key={hw.contentId} className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate" title={hw.title}>
                      {hw.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Badge variant="neutral" size="sm">
                        {SUBMISSION_TYPE_LABEL[hw.submissionType] ?? hw.submissionType}
                      </Badge>
                      <Badge variant="primary" size="sm">
                        {Number(hw.maxScore)} điểm
                      </Badge>
                      <Badge variant={hw.dueDays ? 'warning' : 'neutral'} size="sm">
                        {hw.dueDays ? `Hạn ${hw.dueDays} ngày sau ghi danh` : 'Không hạn'}
                      </Badge>
                      <Badge variant={hw.submissionCount > 0 ? 'success' : 'neutral'} size="sm">
                        {hw.submissionCount} bài nộp
                      </Badge>
                    </div>
                  </div>
                </div>

                {hw.instructions && <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-line">{hw.instructions}</p>}

                <div className="text-xs text-slate-600 flex items-start gap-1.5">
                  <Route className="w-4 h-4 text-slate-400 shrink-0" />
                  {hw.learningPaths.length > 0 ? (
                    <span>Trong lộ trình: {hw.learningPaths.map((p) => p.name).join(', ')}</span>
                  ) : (
                    <span className="text-amber-700 font-semibold">Chưa gắn vào lộ trình nào — học viên chưa thấy bài này</span>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {hw.attachmentUrl && (
                    <a
                      href={hw.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#0052CC] hover:underline truncate"
                    >
                      {hw.attachmentName ?? 'File đề'}
                    </a>
                  )}
                  <div className="ml-auto flex gap-1.5">
                    <Button variant="ghost" size="sm" leftIcon={Pencil} onClick={() => setFormTarget({ mode: 'edit', homework: hw })}>
                      Sửa
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={Trash2}
                      disabled={!canDelete}
                      title={canDelete ? 'Xóa bài tập' : 'Đã có bài nộp hoặc đang nằm trong lộ trình'}
                      onClick={() => setDeleting(hw)}
                    >
                      Xóa
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <HomeworkFormModal
        open={formTarget != null}
        editing={formTarget?.mode === 'edit' ? formTarget.homework : null}
        draft={formTarget?.mode === 'create' ? formTarget.draft : null}
        attachment={formTarget?.mode === 'create' ? formTarget.attachment : null}
        onClose={() => setFormTarget(null)}
      />
      <ConfirmDialog
        open={deleting != null}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Xóa bài tập?"
        description={deleting ? `Xóa "${deleting.title}"? Thao tác không hoàn tác được.` : undefined}
        confirmLabel="Xóa"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default MentorHomeworkLibrary;
