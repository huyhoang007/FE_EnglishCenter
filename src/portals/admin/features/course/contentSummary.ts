/**
 * contentSummary — Tóm tắt nội dung khóa học cho bảng + modal chi tiết
 * ---------------------------------------------------------------------------
 * Bảng "Nội dung khóa học" ở trang admin hiển thị nhiều loại nội dung
 * (bài học / bộ từ vựng / bài tập) — mỗi loại có metadata riêng.
 *
 * File này gom logic đọc `content_data` (JSONB) về 1 chỗ để:
 *   - cột "Loại" hiển thị đẹp (icon + màu theo loại);
 *   - cột "Chi tiết" hiển thị các chip metadata đúng ngữ nghĩa;
 *   - modal xem chi tiết hiển thị đầy đủ.
 */

import {
  BookOpen,
  ClipboardList,
  FileText,
  GraduationCap,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';
import type {
  CourseContentDto,
  HomeworkContentData,
  HomeworkSubmissionType,
  RubricCriterion,
} from '@/shared/types/catalog.types';

/* =========================================================
 * Meta theo loại nội dung
 * ========================================================= */

export interface ContentTypeMeta {
  /** Nhãn hiển thị (tiếng Việt). */
  label: string;
  /** Icon đại diện. */
  icon: LucideIcon;
  /** Class cho badge nền + chữ. */
  badgeClass: string;
  /** Class cho ô icon bo tròn. */
  iconClass: string;
}

/** Meta cố định cho 3 loại nội dung của khóa học. */
export const CONTENT_TYPE_META: Record<
  CourseContentDto['contentType'],
  ContentTypeMeta
> = {
  lesson: {
    label: 'Bài học',
    icon: BookOpen,
    badgeClass: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    iconClass: 'bg-emerald-50 text-emerald-600',
  },
  vocabulary: {
    label: 'Bộ từ vựng',
    icon: Sparkles,
    badgeClass: 'bg-blue-50 text-[#0052CC] ring-1 ring-inset ring-blue-200',
    iconClass: 'bg-blue-50 text-[#0052CC]',
  },
  homework: {
    label: 'Bài tập',
    icon: ClipboardList,
    badgeClass: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    iconClass: 'bg-amber-50 text-amber-600',
  },
  /** Bài thi cuối kỳ (V29) — trỏ tới một đề `final` trong kho đề thi. */
  exam: {
    label: 'Bài thi cuối kỳ',
    icon: GraduationCap,
    badgeClass: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200',
    iconClass: 'bg-violet-50 text-violet-600',
  },
};

/* =========================================================
 * Đọc content_data
 * ========================================================= */

/** Đọc `content_data` của bài tập ( ép kiểu an toàn — JSONB là object tự do). */
export function readHomeworkData(
  item: CourseContentDto,
): HomeworkContentData | null {
  const data = item.contentData as HomeworkContentData | null;
  return data && typeof data === 'object' ? data : null;
}

/** Danh sách rubric của bài tập. */
export function readRubric(item: CourseContentDto): RubricCriterion[] {
  const data = readHomeworkData(item);
  return Array.isArray(data?.rubric) ? (data?.rubric as RubricCriterion[]) : [];
}

/**
 * Nhãn hình thức nộp bài.
 *
 * `text` là dữ liệu cũ (bài tập tự luận gõ chữ) — vẫn hiện để không mất
 * thông tin bài đã tạo trước đây.
 */
export const SUBMISSION_TYPE_LABEL: Record<HomeworkSubmissionType, string> = {
  text: 'Nhập văn bản trực tiếp',
  file: 'Nộp file PDF',
  audio: 'Ghi âm / File âm thanh',
  multiple_choice: 'Trắc nghiệm',
};

/* =========================================================
 * Chip tóm tắt (dùng ở cột "Chi tiết")
 * ========================================================= */

export interface SummaryChip {
  /** Nội dung chip. */
  label: string;
  /** Icon nhỏ bên trái (tuỳ chọn). */
  icon?: LucideIcon;
  /** Class màu — mặc định slate trung tính. */
  tone?: 'slate' | 'blue' | 'emerald' | 'amber' | 'rose';
}

const CHIP_TONE: Record<NonNullable<SummaryChip['tone']>, string> = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-50 text-[#0052CC]',
  emerald: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-600',
};

/** Class cho một chip. */
export function chipClass(tone: SummaryChip['tone'] = 'slate'): string {
  return CHIP_TONE[tone ?? 'slate'];
}

/**
 * Tóm tắt metadata theo từng loại nội dung — dùng cho cột "Chi tiết".
 */
export function buildSummaryChips(item: CourseContentDto): SummaryChip[] {
  if (item.contentType === 'lesson') {
    const data = item.contentData as Record<string, unknown> | null;
    const chips: SummaryChip[] = [];
    if (item.videoUrl) {
      chips.push({ label: 'Đã có video', icon: FileText, tone: 'emerald' });
    }
    if (item.isPreview) {
      chips.push({ label: 'Bài xem trước', tone: 'blue' });
    }
    if (item.isLocked) {
      chips.push({ label: 'Đang khoá', tone: 'amber' });
    }
    const name = typeof data?.videoName === 'string' ? data.videoName : '';
    if (name) chips.push({ label: name, icon: FileText });
    return chips;
  }

  if (item.contentType === 'vocabulary') {
    const data = item.contentData as Record<string, unknown> | null;
    const setIds = Array.isArray(data?.setIds)
      ? (data?.setIds as string[])
      : Array.isArray(item.vocabularySetIds)
        ? item.vocabularySetIds
        : [];
    const chips: SummaryChip[] = [];
    chips.push({
      label: `${setIds.length} bộ từ vựng`,
      icon: Sparkles,
      tone: 'blue',
    });
    return chips;
  }
  if (item.contentType === 'exam') {
    // Bài thi cuối kỳ (V29) — chip: đề liên kết + trạng thái mở khoá.
    const chips: SummaryChip[] = [];
    if (item.examTitle) {
      chips.push({ label: item.examTitle, icon: FileText, tone: 'blue' });
    }
    chips.push({ label: 'Đề cuối kỳ', icon: Target, tone: 'blue' });
    if (item.requiresMentor) {
      chips.push({ label: 'Cần mentor chấm tay', icon: Target, tone: 'amber' });
    }
    if (item.examLockReason === 'lessons') {
      chips.push({ label: 'Chờ xem xong video', tone: 'amber' });
    }
    if (item.examLockReason === 'mentor') {
      chips.push({ label: 'Chờ mở khoá mentor', tone: 'rose' });
    }
    return chips;
  }

  // ---- Homework ----
  const data = readHomeworkData(item);
  const chips: SummaryChip[] = [];
  const type = data?.submissionType;
  if (type) {
    chips.push({
      label: SUBMISSION_TYPE_LABEL[type] ?? type,
      icon: Target,
      tone: type === 'multiple_choice' ? 'blue' : 'emerald',
    });
  }
  if (data?.dueDate) {
    chips.push({ label: `Hạn ${data.dueDate}`, tone: 'amber' });
  }
  if (data?.maxScore != null) {
    chips.push({ label: `${data.maxScore} điểm`, tone: 'slate' });
  }
  if (data?.maxAttempts != null) {
    chips.push({ label: `${data.maxAttempts} lượt`, tone: 'slate' });
  }
  const rubric = readRubric(item);
  if (rubric.length > 0) {
    chips.push({ label: `${rubric.length} tiêu chí`, tone: 'slate' });
  }
  if (item.examTitle) {
    chips.push({ label: item.examTitle, icon: FileText, tone: 'blue' });
  }
  if (data?.attachmentUrl) {
    chips.push({ label: data.attachmentName || 'Tài liệu đính kèm', icon: FileText });
  }
  return chips;
}
