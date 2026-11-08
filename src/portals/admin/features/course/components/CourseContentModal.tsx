/**
 * CourseContentModal — Modal Quản lý Nội dung khóa học (Admin)
 * -----------------------------------------------------------
 * API thật (Backend) — KHÔNG dùng mock data:
 *   GET    /api/v1/admin/exams                     (đề thi trắc nghiệm)
 *   POST   /api/v1/admin/courses/{courseId}/contents
 *   PUT    /api/v1/admin/course-contents/{contentId}
 *   DELETE /api/v1/admin/course-contents/{contentId}
 *
 * ⚡ FORM ĐỘNG THEO `contentType` — bám sát Entity/DTO của Backend:
 *
 *   LESSON → `CourseContent` + `content_data`:
 *            { isPreview, videoUrl?, videoPublicId?, videoFormat? }
 *            Giữ nguyên: title, description, contentOrder, videoUrl,
 *            checkbox "Bài học thử".
 *
 *   VOCABULARY → KHÔNG nhập tay, CHỌN bộ trong KHO TỪ VỮNG CHUNG:
 *            { setIds: string[] }
 *            Các bộ được tham chiếu bằng `setId` và được gán vào khóa học
 *            qua bảng `course_vocabulary_sets` (backend tự lo).
 *            UI: `VocabularyBankPicker` (search + tick trong kho chung).
 *
 *   HOMEWORK → khớp `CourseContent` (homework) + `HomeworkSubmission`:
 *            { submissionType, instructions?, dueDate?, maxScore?,
 *              passingScore?, attachmentUrl?,
 *              maxAttempts?, examId?, rubric: [...] }
 *            `submissionType` bám sát 2 cột nội dung của `homework_submissions`:
 *              - `text`            → học viên gõ vào `answer_content`
 *              - `file`            → học viên upload vào `file_url`
 *              - `multiple_choice` → làm đề trắc nghiệm (Exam) chấm tự động
 *            UI: `ExamPicker` (danh sách đề thi định nghĩa sẵn + search).
 *
 * PAYLOAD (đúng shape backend đọc — `content_data` là JSONB tự do):
 *   lesson      → { isPreview, videoUrl?, videoPublicId?, videoFormat? }
 *   vocabulary  → { setIds: string[] }
 *   homework    → { submissionType, instructions?, dueDate?, maxScore?,
 *                  passingScore?, attachmentUrl?,
 *                  maxAttempts?, examId?, rubric: [{ criterion, … }] }
 *
 * `contentData` gửi lên là JSON **string** (backend `JsonUtil.normalize()`
 * parse vào cột JSONB); khi đọc về backend đã parse sẵn thành object.
 *
 * UI bám sát Admin Layout: bo góc rounded-2xl/3xl, màu nhấn #0052CC,
 * viền slate-200/80, bảng phẳng divide-y slate-100.
 *
 * Toàn bộ nhãn UI đi qua i18n key → hỗ trợ nút gạt Anh/Việt.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Layers3, Plus, Save, Trash2 } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Modal } from '@/shared/components/Modal';
import { useToast } from '@/shared/components/Toast';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from '@/shared/i18n/I18nProvider';
import {
  createCourseContent,
  updateCourseContent,
} from '@/shared/api/courseService';
import {
  buildHomeworkContentData,
  buildLessonContentData,
  buildVocabularyContentData,
  buildVocabularyTitle,
  type RubricInput,
} from '@/shared/api/courseContentBuilder';
import { QUERY_KEYS } from '@/shared/constants/queryKeys';
import { fetchVocabularyBank } from '@/shared/api/vocabularyService';
import type {
  ContentType,
  CourseContentDto,
  HomeworkSubmissionType,
  RubricCriterion,
} from '@/shared/types/catalog.types';
import {
  Checkbox,
  Field,
  Select,
  TextArea,
  TextInput,
} from './form/formControls';
import { ExamPicker } from './ExamPicker';
import { VocabularyBankPicker } from './VocabularyBankPicker';
import { CertificateSkillPicker } from './CertificateSkillPicker';
import { AttachmentUpload } from './AttachmentUpload';

/* =========================================================
 * Types
 * ========================================================= */

/** Form chung — các field dùng cho mọi contentType. */
interface CommonForm {
  title: string;
  description: string;
  contentOrder: number;
}

/** Form bài học. */
interface LessonForm extends CommonForm {
  videoUrl: string;
  isPreview: boolean;
  /** Public ID của video trên Cloudinary (dùng để xoá/thay video). */
  videoPublicId: string;
  /** Đuôi file video (mp4, mov, webm...). */
  videoFormat: string;
  /** Tên file video gốc — chỉ để hiển thị. */
  videoName: string;
}

/**
 * Form từ vựng — KHÔNG nhập tay, chỉ chọn bộ trong KHO TỪ VỰNG CHUNG.
 *
 * `setIds` là danh sách id bộ từ vựng đã setup sẵn; backend gán chúng vào
 * khóa học qua bảng `course_vocabulary_sets`.
 */
interface VocabularyForm extends CommonForm {
  setIds: string[];
  /** Tên bộ từ vựng (setId → title) — chỉ để hiển thị preview. */
  setTitles: Record<string, string>;
  /** Nội dung "xem thử" — học viên chưa ghi danh vẫn xem được các bộ từ đã tick. */
  isPreview: boolean;
}

/** Form bài tập — khớp `HomeworkSubmission` + `CourseContent` (homework). */
interface HomeworkForm extends CommonForm {
  /** Hình thức nộp — quyết định form nộp bài phía học viên. */
  submissionType: HomeworkSubmissionType;
  instructions: string;
  dueDate: string;
  maxScore: string;
  /** Điểm đạt (%) — tương đương `Exam.passingScore`. */
  passingScore: string;
  maxAttempts: string;
  /** Định dạng file được phép nộp (CSV, ví dụ "pdf,docx"). Rỗng = chỉ PDF. */
  allowedFileTypes: string;
  /** URL công khai của tài liệu đính kèm (file `upload` trên Cloudinary). */
  attachmentUrl: string;
  /** Tên file tài liệu đính kèm (để hiển thị). */
  attachmentName: string;
  /** Public ID trên Cloudinary (dùng để xoá file khi gỡ tài liệu). */
  attachmentPublicId: string;
  /** `examId` của đề trắc nghiệm liên kết. */
  examId: string;
  /**
   * `certificatePartId` — kỹ năng (chứng chỉ) mà bài tập này đo lường.
   * <p>
   * Rỗng = chưa gắn kỹ năng. Backend lưu ở `course_content.certificate_part_id`.
   */
  certificatePartId: string;
  rubric: RubricInput[];
}

type AnyForm = LessonForm | VocabularyForm | HomeworkForm;

const EMPTY_COMMON: CommonForm = { title: '', description: '', contentOrder: 1 };

const EMPTY_LESSON: LessonForm = {
  ...EMPTY_COMMON,
  videoUrl: '',
  isPreview: false,
  videoPublicId: '',
  videoFormat: '',
  videoName: '',
};

const EMPTY_VOCABULARY: VocabularyForm = {
  ...EMPTY_COMMON,
  setIds: [],
  setTitles: {},
  isPreview: false,
};

const EMPTY_HOMEWORK: HomeworkForm = {
  ...EMPTY_COMMON,
  // Mặc định nộp file PDF; `text` chỉ còn cho bài tập cũ.
  submissionType: 'file',
  instructions: '',
  dueDate: '',
  maxScore: '',
  passingScore: '',
  maxAttempts: '',
  allowedFileTypes: '',
  attachmentUrl: '',
  attachmentName: '',
  attachmentPublicId: '',
  examId: '',
  certificatePartId: '',
  rubric: [],
};

/** Tách chuỗi "pdf, docx" → ['pdf', 'docx'] (bỏ dấu chấm đầu, hạ chữ thường). */
function parseAllowedFileTypes(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/^\./, ''))
    .filter(Boolean);
}

/**
 * Tạo form rỗng MỚI theo `contentType` (factory thay vì dùng chung hằng số).
 *
 * Bắt buộc dùng factory vì `useState` khởi tạo PHẢI đúng shape theo
 * `contentType` hiện tại — nếu khởi tạo bằng `EMPTY_LESSON` (không có key
 * `rubric`) thì ở render đầu tiên `homework.rubric` là `undefined` và
 * `homework.rubric.length` ném `TypeError`.
 */
const createEmptyFormForType = (contentType: ContentType): AnyForm => {
  switch (contentType) {
    case 'homework':
      return { ...EMPTY_HOMEWORK, rubric: [] };
    case 'vocabulary':
      return { ...EMPTY_VOCABULARY, setIds: [], setTitles: {}, isPreview: false };
    case 'lesson':
    default:
      return { ...EMPTY_LESSON };
  }
};

/**
 * Chuẩn hoá `submissionType` đọc từ `content_data`.
 *
 * Backend lưu JSONB tự do nên dữ liệu cũ có thể thiếu / sai kiểu — luôn
 * fallback về `'text'` (gõ trả lời) cho an toàn.
 */
const normalizeSubmissionType = (raw: unknown): HomeworkSubmissionType => {
  if (
    raw === 'file' ||
    raw === 'multiple_choice' ||
    raw === 'text' ||
    raw === 'audio'
  ) {
    return raw;
  }
  return 'file';
};

/* =========================================================
 * Component
 * ========================================================= */
export interface CourseContentModalProps {
  open: boolean;
  onClose: () => void;
  /** UUID của khóa học. */
  courseId: string;
  /** Tên khóa học — hiển thị ở phụ đề modal. */
  courseTitle?: string;
  /** Loại nội dung mặc định khi thêm mới. */
  defaultContentType?: ContentType;
  /** Nội dung đang sửa — `null` nghĩa là thêm mới. */
  editing?: CourseContentDto | null;
  /** `contentOrder` gợi ý cho bản ghi mới. */
  nextContentOrder?: number;
  /** Chứng chỉ của khóa học — lọc kỹ năng bài tập đo lường. */
  certificateId?: string | null;
}

export const CourseContentModal: React.FC<CourseContentModalProps> = ({
  open,
  onClose,
  courseId,
  courseTitle,
  defaultContentType = 'lesson',
  editing = null,
  nextContentOrder = 1,
  certificateId = null,
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();

  const isEditing = Boolean(editing);

  /* ---------- State ---------- */
  const [contentType, setContentType] = useState<ContentType>(defaultContentType);
  /**
   * Khởi tạo form theo ĐÚNG `contentType` hiện tại (luôn có `rubric: []`)
   * để render đầu tiên không bao giờ đụng mảng `undefined`.
   */
  const [form, setForm] = useState<AnyForm>(() =>
    createEmptyFormForType(defaultContentType),
  );
  const [touched, setTouched] = useState(false);

  /* ---------- Nạp dữ liệu khi mở modal ---------- */
  useEffect(() => {
    if (!open) return;

    setTouched(false);

    if (editing) {
      const type = editing.contentType;
      setContentType(type);
      const data = (editing.contentData ?? {}) as Record<string, unknown>;

      if (type === 'lesson') {
        setForm({
          title: editing.title ?? '',
          description: editing.description ?? '',
          contentOrder: editing.contentOrder ?? 1,
          videoUrl: (data.videoUrl as string) ?? '',
          isPreview: Boolean(data.isPreview),
          videoPublicId: (data.videoPublicId as string) ?? '',
          videoFormat: (data.videoFormat as string) ?? '',
          videoName: (data.videoName as string) ?? '',
        } satisfies LessonForm);
      } else if (type === 'vocabulary') {
        // Nội dung 'vocabulary' chỉ là CON TRỎ tới các bộ trong kho chung.
        const setIds = Array.isArray(data.setIds)
          ? (data.setIds as string[]).filter(Boolean)
          : [];
        setForm({
          title: editing.title ?? '',
          description: editing.description ?? '',
          contentOrder: editing.contentOrder ?? 1,
          setIds,
          setTitles: {},
          isPreview: Boolean(data.isPreview),
        } satisfies VocabularyForm);
      } else {
        const rubric = Array.isArray(data.rubric)
          ? (data.rubric as RubricCriterion[])
          : [];
        setForm({
          title: editing.title ?? '',
          description: editing.description ?? '',
          contentOrder: editing.contentOrder ?? 1,
          submissionType: normalizeSubmissionType(data.submissionType),
          instructions: (data.instructions as string) ?? '',
          dueDate: (data.dueDate as string) ?? '',
          maxScore: data.maxScore != null ? String(data.maxScore) : '',
          passingScore:
            data.passingScore != null ? String(data.passingScore) : '',
          maxAttempts:
            data.maxAttempts != null ? String(data.maxAttempts) : '',
          allowedFileTypes: Array.isArray(data.allowedFileTypes)
            ? (data.allowedFileTypes as string[]).join(', ')
            : '',
          attachmentUrl: (data.attachmentUrl as string) ?? '',
          attachmentName: (data.attachmentName as string) ?? '',
          attachmentPublicId: (data.attachmentPublicId as string) ?? '',
          examId: (data.examId as string) ?? '',
          certificatePartId: editing.certificatePartId ?? '',
          rubric: rubric.map((r) => ({
            criterion: r.criterion ?? '',
            description: r.description ?? '',
            maxScore: r.maxScore != null ? String(r.maxScore) : '',
          })),
        } satisfies HomeworkForm);
      }
      return;
    }

    // Thêm mới.
    setContentType(defaultContentType);
    setForm({
      ...createEmptyFormForType(defaultContentType),
      contentOrder: nextContentOrder,
    } as AnyForm);
  }, [open, editing, defaultContentType, nextContentOrder]);

  /* ---------- Tên các bộ từ vựng (để preview hiện tên thay vì UUID) ---------- */
  const { data: bankSets = [] } = useQuery({
    queryKey: QUERY_KEYS.catalog.vocabularyBank,
    queryFn: () => fetchVocabularyBank(),
    enabled: open && contentType === 'vocabulary',
    staleTime: 60_000,
  });

  /** Hydrate tên bộ khi đang SỬA nội dung 'vocabulary' (setIds có sẵn từ server). */
  useEffect(() => {
    if (!open || contentType !== 'vocabulary') return;
    const ids = (form as VocabularyForm).setIds ?? [];
    if (ids.length === 0 || bankSets.length === 0) return;

    const titles: Record<string, string> = {};
    ids.forEach((id) => {
      const found = bankSets.find((s) => s.setId === id);
      if (found) titles[id] = found.title;
    });

    setForm((f) => {
      const current = f as VocabularyForm;
      const currentTitles = current.setTitles ?? {};
      const isSame = ids.every((id) => currentTitles[id] === titles[id]);
      if (isSame) return f;
      return { ...current, setTitles: { ...currentTitles, ...titles } } as AnyForm;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contentType, bankSets]);

  /* ---------- Helpers đọc/ghi form theo type ---------- */
  const common = form as CommonForm;
  const lesson = form as LessonForm;
  const vocabulary = form as VocabularyForm;
  const homework = form as HomeworkForm;
  /**
   * Hình thức nộp hiện tại — dùng để ẩn/khóa các trường không liên quan
   * (Thời gian làm bài + Số lần làm chỉ dành cho trắc nghiệm).
   */
  const hwSubmissionType: HomeworkSubmissionType =
    homework.submissionType ?? 'file';
  const isMultipleChoice = hwSubmissionType === 'multiple_choice';
  /** Bài ghi âm / nộp file âm thanh (bài tập Speaking). */
  const isAudio = hwSubmissionType === 'audio';
  /** Bài nộp file (PDF / tài liệu) — dùng chung với bài ghi âm về mặt layout. */
  const isFileBased = hwSubmissionType === 'file' || isAudio;

  /**
   * Mảng rubric LUÔN là mảng (không bao giờ `undefined`).
   *
   * Vì `form` là union `AnyForm`, mỗi nhánh chỉ có `rubric` khi đúng
   * `contentType`; nếu dữ liệu server hoặc state bị lệch shape thì `.length`
   * sẽ ném `TypeError: Cannot read properties of undefined`.
   *  → Dùng `?.` + fallback `[]` ở mọi nơi đọc `.length` / `.map` / `.filter`.
   */
  const rubricItems: RubricInput[] = useMemo(
    () => (Array.isArray(homework.rubric) ? homework.rubric : []),
    [homework.rubric],
  );

  /** Danh sách id bộ từ vựng được tick (nội dung loại 'vocabulary'). */
  const selectedSetIds: string[] = useMemo(
    () => (Array.isArray(vocabulary.setIds) ? vocabulary.setIds : []),
    [vocabulary.setIds],
  );

  /** Bật/tắt 1 bộ từ vựng trong kho chung. */
  const toggleVocabularySet = (setId: string, title: string) => {
    setForm((f) => {
      const current = f as VocabularyForm;
      const ids = Array.isArray(current.setIds) ? current.setIds : [];
      const titles = { ...(current.setTitles ?? {}) };
      if (ids.includes(setId)) {
        delete titles[setId];
      } else {
        titles[setId] = title;
      }
      return {
        ...current,
        setIds: ids.includes(setId)
          ? ids.filter((id) => id !== setId)
          : [...ids, setId],
        setTitles: titles,
      } as AnyForm;
    });
  };

  const setCommon = (patch: Partial<CommonForm>) =>
    setForm((f) => ({ ...f, ...patch }) as AnyForm);

  /* ---------- Validate ---------- */
  const errors = useMemo(() => {
    // `?.` + `?? ''` để không bao giờ ném TypeError khi `form` lệch shape
    // với `contentType` (ví dụ server trả `contentData` thiếu field).
    const title = (common.title ?? '').trim();
    const order = Number(common.contentOrder);
    const submissionType = homework.submissionType ?? 'file';
    return {
      /**
       * Nội dung 'vocabulary' KHÔNG có tiêu đề do admin gõ (chỉ tick bộ trong
       * kho chung) → không validate tiêu đề cho loại này.
       */
      title:
        contentType === 'vocabulary'
          ? ''
          : !title
            ? t('content.validation.titleRequired')
            : title.length < 3
              ? t('content.validation.titleTooShort')
              : title.length > 255
              ? t('content.validation.titleTooLong')
              : '',
      contentOrder: !Number.isFinite(order) || order < 0
        ? t('content.validation.orderInvalid')
        : '',
      /**
       * Video bài học: bắt buộc phải có file đã upload lên Cloudinary
       * (form chỉ cho upload, không nhập link tay).
       */
      videoUrl:
        contentType === 'lesson'
          ? !lesson.videoPublicId && !lesson.videoUrl
            ? t('content.validation.videoRequired')
            : /\s/.test((lesson.videoUrl ?? '').trim())
              ? t('content.validation.videoUrlInvalid')
              : ''
          : '',
      maxScore:
        contentType === 'homework' &&
        submissionType !== 'multiple_choice' &&
        (homework.maxScore ?? '').trim()
          ? !Number.isFinite(Number(homework.maxScore)) ||
            Number(homework.maxScore) <= 0
            ? t('content.validation.maxScoreInvalid')
            : ''
          : '',
      /**
       * Điểm đạt là PHẦN TRĂM (0-100) — cùng ngữ nghĩa với
       * `Exam.passingScore` của backend.
       */
      passingScore:
        contentType === 'homework' && (homework.passingScore ?? '').trim()
          ? !Number.isFinite(Number(homework.passingScore)) ||
            Number(homework.passingScore) < 0 ||
            Number(homework.passingScore) > 100
            ? t('content.validation.passingScoreInvalid')
            : ''
          : '',
      maxAttempts:
        contentType === 'homework' &&
        (homework.maxAttempts ?? '').trim()
          ? !Number.isFinite(Number(homework.maxAttempts)) ||
            Number(homework.maxAttempts) < 1
            ? t('content.validation.maxAttemptsInvalid')
            : ''
          : '',
      /**
       * Định dạng file nộp phải là đuôi file hợp lệ (chữ + số, vd "pdf", "docx").
       */
      allowedFileTypes:
        contentType === 'homework' &&
        (homework.allowedFileTypes ?? '').trim()
          ? parseAllowedFileTypes(homework.allowedFileTypes ?? '').some(
              (t) => !/^[a-z0-9]+$/.test(t),
            )
            ? t('content.validation.allowedFileTypesInvalid')
            : ''
          : '',
      /**
       * Hạn nộp không được nằm ở quá khứ khi tạo mới.
       * (Khi SỬA bài cũ thì hạn nộp quá khứ vẫn hợp lệ → chỉ chặn khi tạo mới.)
       */
      dueDate:
        contentType === 'homework' &&
        (homework.dueDate ?? '').trim() &&
        !isEditing &&
        isDueDateInPast(homework.dueDate ?? '')
          ? t('content.validation.dueDateInvalid')
          : '',
      /**
       * Bài trắc nghiệm BẮT BUỘC có đề thi liên kết — học viên cần đề để làm
       * và backend `ExamGrader` cần đề để chấm.
       */
      examId:
        contentType === 'homework' &&
        submissionType === 'multiple_choice' &&
        !(homework.examId ?? '').trim()
          ? t('content.validation.examRequired')
          : '',
      /**
       * Nội dung 'vocabulary' BẮT BUỘC tick ít nhất 1 bộ trong kho chung.
       */
      vocabularySets:
        contentType === 'vocabulary' && selectedSetIds.length === 0
          ? t('content.vocab.bankRequired')
          : '',
    };
  }, [
    common.title,
    common.contentOrder,
    contentType,
    lesson,
    homework,
    selectedSetIds,
    t,
  ]);

  const hasError = Object.values(errors).some(Boolean);

  /* ---------- Mutations ---------- */
  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.catalog.contents(courseId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.catalog.vocabularies(courseId),
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.catalog.homework(courseId),
    });
  };

  /** Xây payload `contentData` đúng theo contentType. */
  const buildContentData = (): string => {
    if (contentType === 'lesson') {
      return JSON.stringify(
        buildLessonContentData({
          isPreview: lesson.isPreview,
          videoUrl: lesson.videoUrl,
          videoPublicId: lesson.videoPublicId,
          videoFormat: lesson.videoFormat,
          videoName: lesson.videoName,
        }),
      );
    }
    if (contentType === 'vocabulary') {
      return JSON.stringify(
        buildVocabularyContentData({
          setIds: selectedSetIds,
          isPreview: vocabulary.isPreview,
        }),
      );
    }
    return JSON.stringify(
      buildHomeworkContentData({
        submissionType: hwSubmissionType,
        instructions: homework.instructions,
        dueDate: homework.dueDate,
        // Trắc nghiệm lấy thang điểm của đề → không gửi điểm tối đa / rubric / đính kèm.
        maxScore:
          !isMultipleChoice && homework.maxScore ? Number(homework.maxScore) : null,
        passingScore: homework.passingScore
          ? Number(homework.passingScore)
          : null,
        maxAttempts: homework.maxAttempts
          ? Number(homework.maxAttempts)
          : null,
        // Định dạng file được phép nộp (Admin cấu hình).
        //   - file  → rỗng = mặc định PDF (BE tự áp dụng).
        //   - audio → rỗng = mặc định các định dạng audio (BE tự áp dụng).
        allowedFileTypes: (homework.allowedFileTypes ?? '')
          .split(',')
          .map((t) => t.trim().toLowerCase().replace(/^\./, ''))
          .filter(Boolean),
        attachmentUrl: isMultipleChoice ? '' : homework.attachmentUrl,
        attachmentName: isMultipleChoice ? '' : homework.attachmentName,
        attachmentPublicId: isMultipleChoice ? '' : homework.attachmentPublicId,
        examId: isMultipleChoice ? homework.examId : null,
        rubric: isMultipleChoice ? [] : rubricItems,
      }),
    );
  };

  /**
   * Tiêu đề gửi lên backend.
   *
   * Nội dung 'vocabulary' không có tiêu đề do admin gõ (form chỉ cho tick bộ
   * trong kho chung) → ta tự dựng từ tên các bộ đã tick để danh sách nội
   * dung ở trang admin vẫn đọc được.
   *
   * Nếu kho chung chưa tải xong (chưa biết tên bộ nào) → giữ lại tiêu đề
   * đang có của nội dung để không làm mất thông tin.
   */
  const resolvedTitle =
    contentType === 'vocabulary'
      ? buildVocabularyTitle(
          selectedSetIds,
          vocabulary.setTitles,
          t('content.type.vocabulary'),
        )
      : common.title.trim();

  /** Tên bộ đã tick — rỗng nghĩa là kho chung chưa tải xong. */
  const hasResolvedSetNames = selectedSetIds.some(
    (id) => Boolean(vocabulary.setTitles?.[id]?.trim()),
  );

  const payloadTitle =
    contentType === 'vocabulary' && !hasResolvedSetNames
      ? (editing?.title ?? '').trim() || resolvedTitle
      : resolvedTitle;

  const createMutation = useMutation({
    mutationFn: () =>
      createCourseContent(courseId, {
        contentType,
        title: payloadTitle,
        description:
          contentType === 'vocabulary'
            ? undefined
            : common.description.trim() || undefined,
        contentOrder: Number(common.contentOrder) || 0,
        // Nội dung 'vocabulary' → gửi kèm id bộ từ vựng để backend gán vào
        // khóa học qua `course_vocabulary_sets`.
        vocabularySetIds:
          contentType === 'vocabulary' ? selectedSetIds : undefined,
        // Nội dung 'homework' trắc nghiệm → gửi kèm id đề thi (FK `exam_id`).
        examId:
          contentType === 'homework' && isMultipleChoice
            ? homework.examId || undefined
            : undefined,
        // Bài tập → gắn kỹ năng chứng chỉ (FK `course_content.certificate_part_id`).
        certificatePartId:
          contentType === 'homework'
            ? homework.certificatePartId || undefined
            : undefined,
        contentData: buildContentData(),
      }),
    onSuccess: () => {
      toast.success(t('content.feedback.added'));
      invalidate();
      onClose();
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : t('content.feedback.addFailed'),
      ),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error(t('content.feedback.updateFailed'));
      return updateCourseContent(editing.contentId, {
        title: payloadTitle,
        description:
          contentType === 'vocabulary'
            ? undefined
            : common.description.trim() || undefined,
        contentOrder: Number(common.contentOrder) || 0,
        vocabularySetIds:
          contentType === 'vocabulary' ? selectedSetIds : undefined,
        examId:
          contentType === 'homework' && isMultipleChoice
            ? homework.examId || undefined
            : undefined,
        certificatePartId:
          contentType === 'homework'
            ? homework.certificatePartId || undefined
            : undefined,
        contentData: buildContentData(),
      });
    },
    onSuccess: () => {
      toast.success(t('content.feedback.updated'));
      invalidate();
      onClose();
    },
    onError: (err) =>
      toast.error(
        err instanceof Error ? err.message : t('content.feedback.updateFailed'),
      ),
  });

  /* ---------- Handlers ---------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasError) return;
    if (isEditing) updateMutation.mutate();
    else createMutation.mutate();
  };

  /**
   * Đổi loại nội dung → reset form về shape mới (giữ title/description/order).
   *
   * Ngoại lệ: nội dung 'vocabulary' KHÔNG dùng tiêu đề / mô tả / thứ tự →
   * reset luôn cho khỏi giữ dữ liệu cũ của loại trước.
   */
  const handleTypeChange = (next: ContentType) => {
    setContentType(next);
    setTouched(false);
    setForm({
      ...createEmptyFormForType(next),
      title: next === 'vocabulary' ? '' : common.title,
      description: next === 'vocabulary' ? '' : common.description,
      contentOrder: next === 'vocabulary' ? 1 : common.contentOrder,
    } as AnyForm);
  };

  /* ---------- Rubric helpers ---------- */
  const addRubricRow = () => {
    setForm((f) => {
      const current = f as HomeworkForm;
      const rubric = Array.isArray(current.rubric) ? current.rubric : [];
      return {
        ...current,
        rubric: [
          ...rubric,
          { criterion: '', description: '', maxScore: '' },
        ],
      } as AnyForm;
    });
  };

  const updateRubricRow = (
    index: number,
    patch: Partial<RubricInput>,
  ) => {
    setForm((f) => {
      const current = f as HomeworkForm;
      const rubric = Array.isArray(current.rubric) ? current.rubric : [];
      return {
        ...current,
        rubric: rubric.map((r, i) =>
          i === index ? { ...r, ...patch } : r,
        ),
      } as AnyForm;
    });
  };

  const removeRubricRow = (index: number) => {
    setForm((f) => {
      const current = f as HomeworkForm;
      const rubric = Array.isArray(current.rubric) ? current.rubric : [];
      return {
        ...current,
        rubric: rubric.filter((_, i) => i !== index),
      } as AnyForm;
    });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  /** Cập nhật field riêng của bài tập. */
  const setHomework = (patch: Partial<HomeworkForm>) =>
    setForm((f) => ({ ...(f as HomeworkForm), ...patch }) as AnyForm);
  const setLesson = (patch: Partial<LessonForm>) =>
    setForm((f) => ({ ...(f as LessonForm), ...patch }) as AnyForm);
  /** Cập nhật field riêng của nội dung từ vựng. */
  const setVocabulary = (patch: Partial<VocabularyForm>) =>
    setForm((f) => ({ ...(f as VocabularyForm), ...patch }) as AnyForm);

  /*
   * Bố cục: modal rộng, form chia hàng / cột để vừa 1 màn hình (không phải cuộn).
   * Đã bỏ cột "Hiện có" (chỉ lặp lại giá trị đang nhập) và các field trùng nghĩa
   * (bài tập dùng "Hướng dẫn" thay cho "Mô tả").
   */
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="2xl"
      icon={Layers3}
      title={isEditing ? t('content.modal.updateTitle') : t('content.modal.createTitle')}
      subtitle={courseTitle ?? t('content.modal.subtitle')}
      bodyClassName="py-4"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ============ HÀNG 1: loại nội dung + tiêu đề + thứ tự ============ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label={t('content.form.contentType')} required>
            <Select
              value={contentType}
              onChange={(e) => handleTypeChange(e.target.value as ContentType)}
              disabled={isEditing}
              title={isEditing ? t('content.form.typeLockedHint') : undefined}
            >
              <option value="lesson">{t('content.type.lesson')}</option>
              <option value="vocabulary">{t('content.type.vocabulary')}</option>
              <option value="homework">{t('content.type.homework')}</option>
            </Select>
          </Field>

          {/* 'vocabulary' chỉ là con trỏ tới kho từ vựng chung → không có tiêu đề / thứ tự riêng */}
          {contentType !== 'vocabulary' && (
            <>
              <Field
                className="md:col-span-2"
                label={t('content.form.title')}
                required
                error={touched ? errors.title : ''}
              >
                <TextInput
                  value={common.title ?? ''}
                  onChange={(e) => setCommon({ title: e.target.value })}
                  placeholder={t('content.form.titlePlaceholder')}
                  invalid={Boolean(touched && errors.title)}
                />
              </Field>
              <Field
                label={t('content.form.contentOrder')}
                error={touched ? errors.contentOrder : ''}
              >
                <TextInput
                  type="number"
                  min={0}
                  value={common.contentOrder ?? 1}
                  onChange={(e) => setCommon({ contentOrder: Number(e.target.value) })}
                  invalid={Boolean(touched && errors.contentOrder)}
                />
              </Field>
            </>
          )}
        </div>

        {/* ============ LESSON ============ */}
        {contentType === 'lesson' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label={t('content.form.description')}>
              <TextArea
                value={common.description ?? ''}
                onChange={(e) => setCommon({ description: e.target.value })}
                placeholder={t('content.form.descriptionPlaceholder')}
                rows={5}
              />
            </Field>

            <div className="space-y-3">
              {/* ---- Video bài học: CHỈ upload file lên Cloudinary ----
               * Không còn ô nhập link — file được lưu ở thư mục
               * `courses/{courseId}/lessons` trên Cloudinary và `videoUrl`
               * được tự động điền từ `secure_url` của file vừa upload. */}
              <Field
                label={t('content.form.videoUrl')}
                error={touched ? errors.videoUrl : ''}
                hint={touched && errors.videoUrl ? '' : t('content.form.videoUrlHint')}
              >
                <AttachmentUpload
                  value={lesson.videoPublicId ? lesson.videoUrl || undefined : undefined}
                  fileName={lesson.videoName || undefined}
                  label=""
                  purpose="lesson_video"
                  courseId={courseId}
                  accept=".mp4,.mov,.webm,.mkv"
                  hint="MP4, MOV, WEBM, MKV — tối đa 100 MB"
                  emptyLabel="Tải video bài học lên Cloudinary"
                  onChange={(attachment) =>
                    setLesson({
                      videoUrl: attachment.url,
                      videoPublicId: attachment.publicId,
                      videoFormat: attachment.format ?? '',
                      videoName: attachment.originalName ?? '',
                    })
                  }
                  onClear={() =>
                    setLesson({
                      videoUrl: '',
                      videoPublicId: '',
                      videoFormat: '',
                      videoName: '',
                    })
                  }
                />
              </Field>

              {/* Video cũ (nhập tay trước đây) chưa có trên Cloudinary → bắt admin tải lại. */}
              {lesson.videoUrl && !lesson.videoPublicId && (
                <p className="text-[11px] text-amber-600">
                  Video hiện tại dùng link ngoài Cloudinary. Hãy tải lại file
                  video lên để bài học phát ổn định.
                </p>
              )}

              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
                <Checkbox
                  checked={Boolean(lesson.isPreview)}
                  onChange={(checked) => setLesson({ isPreview: checked })}
                  label={t('content.form.isPreview')}
                  description={t('content.form.isPreviewHint')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ============ VOCABULARY: chọn bộ trong KHO CHUNG ============ */}
        {contentType === 'vocabulary' && (
          <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-2">
            <p className="text-[11px] text-slate-500">{t('content.vocab.bankHint')}</p>
            <VocabularyBankPicker
              selectedIds={selectedSetIds}
              onToggle={toggleVocabularySet}
              courseId={courseId}
            />
            {touched && errors.vocabularySets && (
              <p className="text-[11px] text-rose-500">{errors.vocabularySets}</p>
            )}
            {/* Nội dung từ vựng "xem thử" → học viên chưa ghi danh vẫn xem được. */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 pt-3">
              <Checkbox
                checked={Boolean(vocabulary.isPreview)}
                onChange={(checked) => setVocabulary({ isPreview: checked })}
                label={t('content.form.isPreview')}
                description={t('content.form.isPreviewHint')}
              />
            </div>
          </div>
        )}

        {/* ============ HOMEWORK ============ */}
        {contentType === 'homework' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ---- Cột trái: cấu hình chung ---- */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('content.homework.submissionType')} required>
                  <Select
                    value={hwSubmissionType}
                    onChange={(e) => {
                      const next = e.target.value as HomeworkSubmissionType;
                      // Đổi hình thức nộp → đồng bộ `examId`:
                      //   - sang trắc nghiệm → giữ đề đã chọn (nếu có);
                      //   - sang loại khác   → XOÁ đề (đề chỉ dùng cho trắc nghiệm,
                      //     giữ lại sẽ khiến Admin tưởng bài đã gắn đề).
                      setHomework({
                        submissionType: next,
                        examId:
                          next === 'multiple_choice'
                            ? homework.examId ?? ''
                            : '',
                      });
                    }}
                  >
                    <option value="file">{t('content.homework.type.file')}</option>
                    <option value="audio">{t('content.homework.type.audio')}</option>
                    <option value="text">{t('content.homework.type.text')}</option>
                    <option value="multiple_choice">
                      {t('content.homework.type.multiple_choice')}
                    </option>
                  </Select>
                </Field>
                <Field label={t('content.homework.skillTitle')}>
                  <CertificateSkillPicker
                    certificateId={certificateId}
                    value={homework.certificatePartId ?? ''}
                    onChange={(certificatePartId) => setHomework({ certificatePartId })}
                  />
                </Field>
              </div>

              <div className={cn('grid gap-3', isMultipleChoice ? 'grid-cols-3' : 'grid-cols-4')}>
                <Field label={t('content.form.dueDate')} error={touched ? errors.dueDate : ''}>
                  <TextInput
                    type="date"
                    value={homework.dueDate ?? ''}
                    onChange={(e) => setHomework({ dueDate: e.target.value })}
                  />
                </Field>
                <Field
                  label={t('content.homework.passingScore')}
                  error={touched ? errors.passingScore : ''}
                >
                  <TextInput
                    type="number"
                    min={0}
                    max={100}
                    value={homework.passingScore ?? ''}
                    onChange={(e) => setHomework({ passingScore: e.target.value })}
                    placeholder={`${t('content.homework.passingScorePlaceholder')} %`}
                    invalid={Boolean(touched && errors.passingScore)}
                  />
                </Field>
                <Field label={t('content.form.maxAttempts')} error={touched ? errors.maxAttempts : ''}>
                  <TextInput
                    type="number"
                    min={1}
                    value={homework.maxAttempts ?? ''}
                    onChange={(e) => setHomework({ maxAttempts: e.target.value })}
                    placeholder={t('content.homework.unlimitedAttempts')}
                    invalid={Boolean(touched && errors.maxAttempts)}
                  />
                </Field>
                {!isMultipleChoice && (
                  <Field label={t('content.form.maxScore')} error={touched ? errors.maxScore : ''}>
                    <TextInput
                      type="number"
                      min={0}
                      value={homework.maxScore ?? ''}
                      onChange={(e) => setHomework({ maxScore: e.target.value })}
                      placeholder={t('content.form.maxScorePlaceholder')}
                      invalid={Boolean(touched && errors.maxScore)}
                    />
                  </Field>
                )}
              </div>

              <Field label={t('content.form.instructions')}>
                <TextArea
                  value={homework.instructions ?? ''}
                  onChange={(e) => setHomework({ instructions: e.target.value })}
                  placeholder={t('content.form.instructionsPlaceholder')}
                  rows={isMultipleChoice ? 6 : 4}
                />
              </Field>

              {/* Định dạng file được phép nộp — chỉ bài nộp file / ghi âm mới cần. */}
              {isFileBased && (
                <Field
                  label={
                    isAudio
                      ? t('content.homework.allowedAudioTypes')
                      : t('content.homework.allowedFileTypes')
                  }
                  hint={
                    isAudio
                      ? t('content.homework.allowedAudioTypesHint')
                      : t('content.homework.allowedFileTypesHint')
                  }
                >
                  <TextInput
                    value={homework.allowedFileTypes ?? ''}
                    onChange={(e) =>
                      setHomework({ allowedFileTypes: e.target.value })
                    }
                    placeholder={isAudio ? 'mp3, wav, m4a' : 'pdf'}
                    invalid={Boolean(touched && errors.allowedFileTypes)}
                  />
                </Field>
              )}
            </div>

            {/* ---- Cột phải: đề trắc nghiệm HOẶC tài liệu + tiêu chí chấm ---- */}
            <div className="space-y-3 min-w-0">
              {isMultipleChoice ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {t('content.homework.examTitle')} <span className="text-rose-500">*</span>
                  </p>
                  <ExamPicker
                    courseId={courseId}
                    selectedExamId={homework.examId ?? ''}
                    onSelect={(examId) => setHomework({ examId })}
                  />
                  {touched && errors.examId && (
                    <p className="text-[11px] text-rose-500">{errors.examId}</p>
                  )}
                </div>
              ) : (
                <>
                  <AttachmentUpload
                    value={homework.attachmentUrl || undefined}
                    fileName={homework.attachmentName || undefined}
                    onChange={(attachment) =>
                      setHomework({
                        attachmentUrl: attachment.url,
                        attachmentName: attachment.originalName ?? '',
                        attachmentPublicId: attachment.publicId,
                      })
                    }
                    onClear={() =>
                      setHomework({ attachmentUrl: '', attachmentName: '', attachmentPublicId: '' })
                    }
                    label={t('content.form.attachmentUrl')}
                  />

                  {/* ---- Tiêu chí chấm (mentor chấm tay) ---- */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t('content.form.rubric')}
                      </label>
                      <button
                        type="button"
                        onClick={addRubricRow}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052CC] hover:text-[#0040A8] transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        {t('content.action.addCriterion')}
                      </button>
                    </div>
                    {rubricItems.length === 0 ? (
                      <p className="text-[11px] text-slate-400 py-1">{t('content.form.rubricEmpty')}</p>
                    ) : (
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                        {rubricItems.map((row, index) => (
                          <div key={index} className="grid grid-cols-[1fr_1fr_72px_32px] gap-1.5 items-center">
                            <TextInput
                              value={row.criterion ?? ''}
                              onChange={(e) => updateRubricRow(index, { criterion: e.target.value })}
                              placeholder={t('content.form.criterionPlaceholder')}
                            />
                            <TextInput
                              value={row.description ?? ''}
                              onChange={(e) => updateRubricRow(index, { description: e.target.value })}
                              placeholder={t('content.form.criterionDescPlaceholder')}
                            />
                            <TextInput
                              type="number"
                              min={0}
                              value={row.maxScore ?? ''}
                              onChange={(e) => updateRubricRow(index, { maxScore: e.target.value })}
                              placeholder="10"
                            />
                            <button
                              type="button"
                              onClick={() => removeRubricRow(index)}
                              aria-label={t('content.action.removeCriterion')}
                              className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ============ ACTIONS ============ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isPending}
            leftIcon={isEditing ? Save : Plus}
            className="bg-[#0052CC] hover:bg-[#0040A8] font-bold"
          >
            {isEditing ? t('content.action.update') : t('content.action.add')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

/* =========================================================
 * Helpers
 * ========================================================= */

/**
 * Hạn nộp có nằm ở quá khứ không.
 * <p>
 * So sánh theo ngày (không tính giờ) — hạn trong hôm nay vẫn hợp lệ.
 */
function isDueDateInPast(dueDate: string): boolean {
  const trimmed = dueDate.trim();
  if (!trimmed) return false;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return false;
  // So sánh theo đầu ngày: hôm nay → không quá khứ.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
}

export default CourseContentModal;
