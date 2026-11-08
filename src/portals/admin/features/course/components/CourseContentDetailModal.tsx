/**
 * CourseContentDetailModal — XEM CHI TIẾT một nội dung khóa học
 * ---------------------------------------------------------------------------
 * Admin bấm "Chi tiết" ở bảng nội dung → modal này hiện TOÀN BỘ cấu hình
 * đã lưu, theo đúng loại nội dung:
 *
 *   - Bài học    : video đã upload, bài xem trước, tên file video.
 *   - Từ vựng  : các bộ từ vựng đã gắn.
 *   - Bài tập   : hình thức nộp, đề bài (instructions), hạn nộp, điểm,
 *                 điểm đạt, số lượt, tài liệu đính kèm, rubric chấm điểm,
 *                 đề thi đã liên kết (nếu trắc nghiệm).
 *
 * Modal CHỈ ĐỌC — mọi thay đổi vẫn qua nút "Sửa" (mở `CourseContentModal`).
 */

import React from 'react';
import {
  Award,
  CalendarClock,
  FileText,
  ListChecks,
  Paperclip,
  PlayCircle,
  Sparkles,
  Target,
} from 'lucide-react';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { cn } from '@/shared/utils/cn';
import type { CourseContentDto } from '@/shared/types/catalog.types';
import {
  CONTENT_TYPE_META,
  SUBMISSION_TYPE_LABEL,
  chipClass,
  readHomeworkData,
  readRubric,
  type SummaryChip,
} from '../contentSummary';
import { VocabularySetWordsPreview } from './VocabularySetWordsPreview';

export interface CourseContentDetailModalProps {
  open: boolean;
  onClose: () => void;
  /** Nội dung cần xem. */
  content: CourseContentDto | null;
  /** Sửa nội dung này (mở form edit). */
  onEdit?: (content: CourseContentDto) => void;
}

export const CourseContentDetailModal: React.FC<
  CourseContentDetailModalProps
> = ({ open, onClose, content, onEdit }) => {
  if (!content) return null;

  const meta = CONTENT_TYPE_META[content.contentType];
  const data = readHomeworkData(content);
  const rubric = readRubric(content);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={content.title || meta.label}
      subtitle={`${meta.label} · Thứ tự ${content.contentOrder ?? 0}`}
      icon={meta.icon}
      iconClassName={meta.iconClass}
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* ---- Mô tả ---- */}
        {content.description && (
          <Section title="Mô tả" icon={FileText}>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {content.description}
            </p>
          </Section>
        )}

        {/* ================= BÀI HỌC ================= */}
        {content.contentType === 'lesson' && (
          <Section title="Cấu hình bài học" icon={PlayCircle}>
            <div className="flex flex-wrap gap-2">
              {content.videoUrl ? (
                <Chip
                  label="Đã upload video"
                  tone="emerald"
                  icon={PlayCircle}
                />
              ) : (
                <Chip label="Chưa có video" tone="rose" />
              )}
              <Chip
                label={content.isPreview ? 'Bài xem trước (ai cũng xem được)' : 'Bài học chính'}
                tone={content.isPreview ? 'blue' : 'slate'}
              />
              <Chip
                label={content.isLocked ? 'Đang khoá' : 'Không khoá'}
                tone={content.isLocked ? 'amber' : 'slate'}
              />
            </div>

            {content.videoUrl && (
              <a
                href={content.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Mở video
              </a>
            )}
          </Section>
        )}

        {/* ================= TỪ VỰNG ================= */}
        {content.contentType === 'vocabulary' && (
          <Section title="Bộ từ vựng đã gắn" icon={Sparkles}>
            <VocabularySetWordsPreview content={content} />
          </Section>
        )}

        {/* ================= BÀI TẬP ================= */}
        {content.contentType === 'homework' && (
          <>
            <Section title="Hình thức nộp bài" icon={Target}>
              <div className="flex flex-wrap gap-2">
                {data?.submissionType && (
                  <Chip
                    label={SUBMISSION_TYPE_LABEL[data.submissionType]}
                    tone={
                      data.submissionType === 'multiple_choice' ? 'blue' : 'emerald'
                    }
                    icon={Target}
                  />
                )}
                {data?.passingScore != null && (
                  <Chip label={`Đạt từ ${data.passingScore}%`} tone="slate" />
                )}
                {data?.maxScore != null && (
                  <Chip label={`${data.maxScore} điểm`} tone="slate" />
                )}
                {data?.maxAttempts != null ? (
                  <Chip label={`Tối đa ${data.maxAttempts} lượt`} tone="slate" />
                ) : (
                  <Chip label="Không giới hạn lượt" tone="slate" />
                )}
              </div>
            </Section>

            {content.examTitle && (
              <Section title="Đề thi đã liên kết" icon={FileText}>
                <p className="text-sm font-bold text-slate-900">
                  {content.examTitle}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Học viên làm bài trong phòng thi của bài tập — điểm chấm tự động.
                </p>
              </Section>
            )}

            {(data?.instructions || content.description) && (
              <Section title="Đề bài" icon={FileText}>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {data?.instructions || content.description}
                </p>
              </Section>
            )}

            {data?.dueDate && (
              <Section title="Hạn nộp" icon={CalendarClock}>
                <p className="text-sm font-bold text-slate-900">
                  {data.dueDate}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Hết hạn cuối ngày này — vẫn nộp được trong cả ngày đến hạn.
                </p>
              </Section>
            )}

            {data?.attachmentUrl && (
              <Section title="Tài liệu đính kèm" icon={Paperclip}>
                <a
                  href={data.attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0052CC] hover:underline"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  {data.attachmentName || 'Tải tài liệu'}
                </a>
              </Section>
            )}

            {rubric.length > 0 && (
              <Section title={`Rubric chấm điểm (${rubric.length})`} icon={ListChecks}>
                <ul className="space-y-2">
                  {rubric.map((r, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70"
                    >
                      <span className="w-5 h-5 rounded-md bg-white border border-slate-200 text-[10px] font-extrabold text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800">
                          {r.criterion}
                        </p>
                        {r.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {r.description}
                          </p>
                        )}
                      </div>
                      {r.maxScore != null && (
                        <span className="text-[10px] font-bold text-[#0052CC] bg-blue-50 rounded px-1.5 py-0.5 shrink-0">
                          {r.maxScore}đ
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {content.certificatePartId && (
              <Section title="Kỹ năng chứng chỉ đo lường" icon={Award}>
                <p className="text-[11px] text-slate-500">
                  Đã gắn kỹ năng (certificate part) — bài nộp được tính vào kỹ
                  năng này của chứng chỉ.
                </p>
              </Section>
            )}
          </>
        )}

        {/* ---- Actions ---- */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
          {onEdit && (
            <Button variant="primary" size="sm" onClick={() => onEdit(content)}>
              Sửa nội dung
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

/* =========================================================
 * Helpers
 * ========================================================= */

/** Một khối thông tin có tiêu đề + icon. */
const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="space-y-2">
    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {title}
    </p>
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-3.5 space-y-2">
      {children}
    </div>
  </div>
);

/** Một chip metadata nhỏ. */
const Chip: React.FC<{
  label: string;
  tone?: SummaryChip['tone'];
  icon?: React.ElementType;
}> = ({ label, tone = 'slate', icon: Icon }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold',
      chipClass(tone),
    )}
  >
    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
    {label}
  </span>
);

export default CourseContentDetailModal;
