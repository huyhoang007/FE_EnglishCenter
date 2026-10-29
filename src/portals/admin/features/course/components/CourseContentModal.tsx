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
 *            { isPreview, videoUrl?, durationMinutes? }
 *            Giữ nguyên: title, description, contentOrder, duration,
 *            videoUrl, checkbox "Bài học thử".
 *
 *   VOCABULARY → KHÔNG nhập tay, CHỌN bộ trong KHO TỪ VỮNG CHUNG:
 *            { setIds: string[] }
 *            Các bộ được tham chiếu bằng `setId` và được gán vào khóa học
 *            qua bảng `course_vocabulary_sets` (backend tự lo).
 *            UI: `VocabularyBankPicker` (search + tick trong kho chung).
 *
 *   HOMEWORK → khớp `CourseContent` (homework) + `HomeworkSubmission`:
 *            { submissionType, instructions?, dueDate?, maxScore?,
 *              passingScore?, timeLimitMinutes?, attachmentUrl?,
 *              maxAttempts?, examId?, rubric: [...] }
 *            `submissionType` bám sát 2 cột nội dung của `homework_submissions`:
 *              - `text`            → học viên gõ vào `answer_content`
 *              - `file`            → học viên upload vào `file_url`
 *              - `multiple_choice` → làm đề trắc nghiệm (Exam) chấm tự động
 *            UI: `ExamPicker` (danh sách đề thi định nghĩa sẵn + search).
 *
 * PAYLOAD (đúng shape backend đọc — `content_data` là JSONB tự do):
 *   lesson      → { isPreview, videoUrl?, durationMinutes? }
 *   vocabulary  → { setIds: string[] }
 *   homework    → { submissionType, instructions?, dueDate?, maxScore?,
 *                  passingScore?, timeLimitMinutes?, attachmentUrl?,
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
import {
  ClipboardList,
  Layers3,
  Link2,
  Plus,
  Save,
  Trash2,
  Type,
} from 'lucide-react';
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
  durationMinutes: string;
  videoUrl: string;
  isPreview: boolean;
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
  /** Thời gian làm bài (phút). */
  timeLimitMinutes: string;
  maxAttempts: string;
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
  durationMinutes: '',
  videoUrl: '',
  isPreview: false,
};

const EMPTY_VOCABULARY: VocabularyForm = {
  ...EMPTY_COMMON,
  setIds: [],
  setTitles: {},
};

const EMPTY_HOMEWORK: HomeworkForm = {
  ...EMPTY_COMMON,
  submissionType: 'text',
  instructions: '',
  dueDate: '',
  maxScore: '',
  passingScore: '',
  timeLimitMinutes: '',
  maxAttempts: '',
  attachmentUrl: '',
  attachmentName: '',
  attachmentPublicId: '',
  examId: '',
  certificatePartId: '',
  rubric: [],
};

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
      return { ...EMPTY_VOCABULARY, setIds: [], setTitles: {} };
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
  if (raw === 'file' || raw === 'multiple_choice' || raw === 'text') return raw;
  return 'text';
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
}

export const CourseContentModal: React.FC<CourseContentModalProps> = ({
  open,
  onClose,
  courseId,
  courseTitle,
  defaultContentType = 'lesson',
  editing = null,
  nextContentOrder = 1,
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
          durationMinutes:
            data.durationMinutes != null
              ? String(data.durationMinutes)
              : '',
          videoUrl: (data.videoUrl as string) ?? '',
          isPreview: Boolean(data.isPreview),
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
          timeLimitMinutes:
            data.timeLimitMinutes != null
              ? String(data.timeLimitMinutes)
              : '',
          maxAttempts:
            data.maxAttempts != null ? String(data.maxAttempts) : '',
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
    homework.submissionType ?? 'text';

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
    const submissionType = homework.submissionType ?? 'text';
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
            : title.length > 255
              ? t('content.validation.titleTooLong')
              : '',
      contentOrder: !Number.isFinite(order) || order < 0
        ? t('content.validation.orderInvalid')
        : '',
      videoUrl:
        contentType === 'lesson' && (lesson.videoUrl ?? '').trim()
          ? !/^https?:\/\/.+/i.test((lesson.videoUrl ?? '').trim())
            ? t('content.validation.videoUrlInvalid')
            : ''
          : '',
      duration:
        contentType === 'lesson' && (lesson.durationMinutes ?? '').trim()
          ? !Number.isFinite(Number(lesson.durationMinutes)) ||
            Number(lesson.durationMinutes) < 0
            ? t('content.validation.durationInvalid')
            : ''
          : '',
      maxScore:
        contentType === 'homework' && (homework.maxScore ?? '').trim()
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
      timeLimit:
        contentType === 'homework' &&
        (homework.timeLimitMinutes ?? '').trim()
          ? !Number.isFinite(Number(homework.timeLimitMinutes)) ||
            Number(homework.timeLimitMinutes) <= 0
            ? t('content.validation.timeLimitInvalid')
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
          durationMinutes: lesson.durationMinutes
            ? Number(lesson.durationMinutes)
            : null,
        }),
      );
    }
    if (contentType === 'vocabulary') {
      return JSON.stringify(
        buildVocabularyContentData({ setIds: selectedSetIds }),
      );
    }
    return JSON.stringify(
      buildHomeworkContentData({
        submissionType: homework.submissionType ?? 'text',
        instructions: homework.instructions,
        dueDate: homework.dueDate,
        maxScore: homework.maxScore ? Number(homework.maxScore) : null,
        passingScore: homework.passingScore
          ? Number(homework.passingScore)
          : null,
        timeLimitMinutes: homework.timeLimitMinutes
          ? Number(homework.timeLimitMinutes)
          : null,
        maxAttempts: homework.maxAttempts
          ? Number(homework.maxAttempts)
          : null,
        attachmentUrl: homework.attachmentUrl,
        attachmentName: homework.attachmentName,
        attachmentPublicId: homework.attachmentPublicId,
        examId:
          (homework.submissionType ?? 'text') === 'multiple_choice'
            ? homework.examId
            : null,
        rubric: rubricItems,
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
          contentType === 'homework' &&
          (homework.submissionType ?? 'text') === 'multiple_choice'
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
          contentType === 'homework' &&
          (homework.submissionType ?? 'text') === 'multiple_choice'
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="2xl"
      icon={Layers3}
      title={isEditing ? t('content.modal.updateTitle') : t('content.modal.createTitle')}
      subtitle={courseTitle ?? t('content.modal.subtitle')}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ============ DROPDOWN LOẠI NỘI DUNG ============ */}
        <Field label={t('content.form.contentType')} required>
          <Select
            value={contentType}
            onChange={(e) => handleTypeChange(e.target.value as ContentType)}
            disabled={isEditing}
          >
            <option value="lesson">{t('content.type.lesson')}</option>
            <option value="vocabulary">{t('content.type.vocabulary')}</option>
            <option value="homework">{t('content.type.homework')}</option>
          </Select>
          {isEditing && (
            <p className="text-[11px] text-slate-400 mt-1">
              {t('content.form.typeLockedHint')}
            </p>
          )}
        </Field>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-6">
          {/* ============ CỘT TRÁI: FORM NHẬP THEO CONTENT TYPE ============ */}
          <div className="space-y-4">
            {/*
             * Nội dung 'vocabulary' chỉ là CON TRỎ tới các bộ trong kho từ
             * vựng chung → không có tiêu đề / mô tả / thứ tự riêng.
             * Thứ tự hiển thị do `course_vocabulary_sets.display_order` quản lý.
             */}
            {contentType !== 'vocabulary' && (
              <>
                {/* ---- Common: title ---- */}
                <Field
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

                {/* ---- Common: description ---- */}
                <Field label={t('content.form.description')}>
                  <TextArea
                    value={common.description ?? ''}
                    onChange={(e) => setCommon({ description: e.target.value })}
                    placeholder={t('content.form.descriptionPlaceholder')}
                    rows={2}
                  />
                </Field>
              </>
            )}

            {/* ---- LESSON: order + duration, video, preview ---- */}
            {contentType === 'lesson' && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={t('content.form.contentOrder')}
                    error={touched ? errors.contentOrder : ''}
                  >
                    <TextInput
                      type="number"
                      min={0}
                      value={common.contentOrder ?? 1}
                      onChange={(e) =>
                        setCommon({ contentOrder: Number(e.target.value) })
                      }
                      invalid={Boolean(touched && errors.contentOrder)}
                    />
                  </Field>

                  <Field
                    label={t('content.form.durationMinutes')}
                    error={touched ? errors.duration : ''}
                  >
                    <TextInput
                      type="number"
                      min={0}
                      value={lesson.durationMinutes ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...(f as LessonForm),
                          durationMinutes: e.target.value,
                        }) as AnyForm)
                      }
                      placeholder={t('content.form.durationPlaceholder')}
                      invalid={Boolean(touched && errors.duration)}
                    />
                  </Field>
                </div>

                <Field
                  label={t('content.form.videoUrl')}
                  hint={t('content.form.videoUrlHint')}
                  error={touched ? errors.videoUrl : ''}
                >
                  <TextInput
                    type="url"
                    value={lesson.videoUrl ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...(f as LessonForm),
                        videoUrl: e.target.value,
                      }) as AnyForm)
                    }
                    placeholder={t('content.form.videoUrlPlaceholder')}
                    invalid={Boolean(touched && errors.videoUrl)}
                  />
                </Field>

                {/* Card vàng nhạt — nổi bật cho tuỳ chọn "bài học thử". */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                  <Checkbox
                    checked={Boolean(lesson.isPreview)}
                    onChange={(checked) =>
                      setForm((f) => ({
                        ...(f as LessonForm),
                        isPreview: checked,
                      }) as AnyForm)
                    }
                    label={t('content.form.isPreview')}
                    description={t('content.form.isPreviewHint')}
                  />
                </div>
              </>
            )}

            {/* ---- VOCABULARY: chọn bộ từ vựng trong KHO CHUNG ---- */}
            {contentType === 'vocabulary' && (
              <>
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Layers3 className="w-4 h-4 text-[#0052CC]" />
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t('content.vocab.bankTitle')}
                    </p>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {t('content.vocab.bankHint')}
                  </p>

                  <VocabularyBankPicker
                    selectedIds={selectedSetIds}
                    onToggle={toggleVocabularySet}
                    courseId={courseId}
                  />

                  {touched && errors.vocabularySets && (
                    <p className="text-[11px] text-rose-500">
                      {errors.vocabularySets}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* ---- HOMEWORK: hình thức nộp + cấu hình + rubric ---- */}
            {contentType === 'homework' && (
              <>
                {/*
                 * HÌNH THỨC NỘP BÀI — bám sát cột `homework_submissions`:
                 *   text            → `answer_content` (gõ trả lời)
                 *   file            → `file_url` (upload file)
                 *   multiple_choice → làm đề trắc nghiệm (Exam) chấm tự động
                 */}
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#0052CC]" />
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {t('content.homework.submissionType')}
                    </p>
                  </div>

                  <Field
                    label={t('content.homework.submissionType')}
                    hint={t('content.homework.submissionTypeHint')}
                    required
                  >
                    <Select
                      value={homework.submissionType ?? 'text'}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...(f as HomeworkForm),
                          submissionType: e.target
                            .value as HomeworkSubmissionType,
                        }) as AnyForm)
                      }
                    >
                      <option value="text">
                        {t('content.homework.type.text')}
                      </option>
                      <option value="file">
                        {t('content.homework.type.file')}
                      </option>
                      <option value="multiple_choice">
                        {t('content.homework.type.multiple_choice')}
                      </option>
                    </Select>
                  </Field>

                  {/* Bài trắc nghiệm → BẮT BUỘC chọn đề thi liên kết. */}
                  {(homework.submissionType ?? 'text') ===
                    'multiple_choice' && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        {t('content.homework.examTitle')}
                      </p>
                      <ExamPicker
                        courseId={courseId}
                        selectedExamId={homework.examId ?? ''}
                        onSelect={(examId) =>
                          setForm((f) => ({
                            ...(f as HomeworkForm),
                            examId,
                          }) as AnyForm)
                        }
                      />
                      {touched && errors.examId && (
                        <p className="text-[11px] text-rose-500">
                          {errors.examId}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ---- Kỹ năng chứng chỉ mà bài tập đo lường ---- */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      {t('content.homework.skillTitle')}
                    </p>
                    <CertificateSkillPicker
                      value={homework.certificatePartId ?? ''}
                      onChange={(certificatePartId) =>
                        setForm((f) => ({
                          ...(f as HomeworkForm),
                          certificatePartId,
                        }) as AnyForm)
                      }
                    />
                    <p className="text-[11px] text-slate-400">
                      {t('content.homework.skillHint')}
                    </p>
                  </div>
                </div>

                <Field label={t('content.form.instructions')}>
                  <TextArea
                    value={homework.instructions ?? ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...(f as HomeworkForm),
                        instructions: e.target.value,
                      }) as AnyForm)
                    }
                    placeholder={t('content.form.instructionsPlaceholder')}
                    rows={3}
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={t('content.form.contentOrder')}
                    error={touched ? errors.contentOrder : ''}
                  >
                    <TextInput
                      type="number"
                      min={0}
                      value={common.contentOrder ?? 1}
                      onChange={(e) =>
                        setCommon({ contentOrder: Number(e.target.value) })
                      }
                      invalid={Boolean(touched && errors.contentOrder)}
                    />
                  </Field>

                  <Field label={t('content.form.dueDate')}>
                    <TextInput
                      type="date"
                      value={homework.dueDate ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...(f as HomeworkForm),
                          dueDate: e.target.value,
                        }) as AnyForm)
                      }
                    />
                  </Field>
                </div>

                {/*
                 * ĐIỂM ĐẠT + THỜI GIAN LÀM BÀI — tương đương `Exam.passingScore`
                 * và `Exam.durationMinutes` của backend.
                 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={t('content.homework.passingScore')}
                    hint={t('content.homework.passingScoreHint')}
                    error={touched ? errors.passingScore : ''}
                  >
                    <TextInput
                      type="number"
                      min={0}
                      max={100}
                      value={homework.passingScore ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...(f as HomeworkForm),
                          passingScore: e.target.value,
                        }) as AnyForm)
                      }
                      placeholder={t(
                        'content.homework.passingScorePlaceholder',
                      )}
                      invalid={Boolean(touched && errors.passingScore)}
                    />
                  </Field>

                  <Field
                    label={t('content.homework.timeLimit')}
                    hint={t('content.homework.timeLimitHint')}
                    error={touched ? errors.timeLimit : ''}
                  >
                    <TextInput
                      type="number"
                      min={0}
                      value={homework.timeLimitMinutes ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...(f as HomeworkForm),
                          timeLimitMinutes: e.target.value,
                        }) as AnyForm)
                      }
                      placeholder={t(
                        'content.homework.timeLimitPlaceholder',
                      )}
                      invalid={Boolean(touched && errors.timeLimit)}
                      disabled={hwSubmissionType !== 'multiple_choice'}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={t('content.form.maxAttempts')}
                    hint={t('content.form.maxAttemptsHint')}
                    error={touched ? errors.maxAttempts : ''}
                  >
                    <TextInput
                      type="number"
                      min={1}
                      value={homework.maxAttempts ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...(f as HomeworkForm),
                          maxAttempts: e.target.value,
                        }) as AnyForm)
                      }
                      placeholder={t('content.form.maxAttemptsPlaceholder')}
                      invalid={Boolean(touched && errors.maxAttempts)}
                      disabled={hwSubmissionType !== 'multiple_choice'}
                    />
                  </Field>

                  <Field
                    label={t('content.form.maxScore')}
                    error={touched ? errors.maxScore : ''}
                  >
                    <TextInput
                      type="number"
                      min={0}
                      value={homework.maxScore ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...(f as HomeworkForm),
                          maxScore: e.target.value,
                        }) as AnyForm)
                      }
                      placeholder={t('content.form.maxScorePlaceholder')}
                      invalid={Boolean(touched && errors.maxScore)}
                    />
                  </Field>
                </div>

                {/* ---- Tài liệu đính kèm (upload Cloudinary, file public) ---- */}
                <AttachmentUpload
                  value={homework.attachmentUrl || undefined}
                  fileName={homework.attachmentName || undefined}
                  onChange={(attachment) =>
                    setForm((f) => ({
                      ...(f as HomeworkForm),
                      attachmentUrl: attachment.url,
                      attachmentName: attachment.originalName ?? '',
                      attachmentPublicId: attachment.publicId,
                    }) as AnyForm)
                  }
                  onClear={() =>
                    setForm((f) => ({
                      ...(f as HomeworkForm),
                      attachmentUrl: '',
                      attachmentName: '',
                      attachmentPublicId: '',
                    }) as AnyForm)
                  }
                  label={t('content.form.attachmentUrl')}
                />

                {/* ---- Rubric ---- */}
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
                    <p className="text-[11px] text-slate-400 py-2">
                      {t('content.form.rubricEmpty')}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {rubricItems.map((row, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-200/80 bg-white p-2.5 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <TextInput
                              value={row.criterion ?? ''}
                              onChange={(e) =>
                                updateRubricRow(index, {
                                  criterion: e.target.value,
                                })
                              }
                              placeholder={t('content.form.criterionPlaceholder')}
                            />
                            <button
                              type="button"
                              onClick={() => removeRubricRow(index)}
                              aria-label={t('content.action.removeCriterion')}
                              className="shrink-0 p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_88px] gap-2">
                            <TextInput
                              value={row.description ?? ''}
                              onChange={(e) =>
                                updateRubricRow(index, {
                                  description: e.target.value,
                                })
                              }
                              placeholder={t('content.form.criterionDescPlaceholder')}
                            />
                            <TextInput
                              type="number"
                              min={0}
                              value={row.maxScore ?? ''}
                              onChange={(e) =>
                                updateRubricRow(index, {
                                  maxScore: e.target.value,
                                })
                              }
                              placeholder="10"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ============ CỘT PHẢI: "HIỆN CÓ" ============ */}
          <div className="min-w-0">
            {contentType === 'homework' ? (
              <HomeworkPreview
                form={homework}
                rubric={rubricItems}
              />
            ) : contentType === 'vocabulary' ? (
              <VocabularyPreview form={vocabulary} />
            ) : (
              <LessonPreview form={lesson} />
            )}
          </div>
        </div>

        {/* ============ ACTIONS ============ */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
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
 * Shell của cột phải — "HIỆN CÓ"
 * ========================================================= */
const ExistingPanel: React.FC<{
  hint: string;
  count?: number;
  children: React.ReactNode;
}> = ({ hint, count, children }) => {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-slate-50/70 border-b border-slate-200/80">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            {t('content.existing.title')}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{hint}</p>
        </div>
        {count !== undefined && (
          <span className="shrink-0 text-[10px] font-bold text-slate-400">
            {t('vocab.modal.total', { count })}
          </span>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

/* =========================================================
 * Preview: bài tập + rubric
 * ========================================================= */
const HomeworkPreview: React.FC<{
  form: HomeworkForm;
  rubric: RubricInput[];
}> = ({ form, rubric }) => {
  const { t } = useTranslation();

  /** Luôn là mảng — `rubric` có thể `undefined` nếu shape form lệch. */
  const safeRubric = Array.isArray(rubric) ? rubric : [];

  /** Nhãn hình thức nộp — hiển thị tiếng Việt/Anh theo locale. */
  const submissionTypeLabel = (() => {
    switch (form.submissionType ?? 'text') {
      case 'file':
        return t('content.homework.type.file');
      case 'multiple_choice':
        return t('content.homework.type.multiple_choice');
      case 'text':
      default:
        return t('content.homework.type.text');
    }
  })();

  return (
    <ExistingPanel hint={t('content.existing.homeworkHint')}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
          <PreviewRow label={t('content.homework.submissionType')}>
            {submissionTypeLabel}
          </PreviewRow>
          <PreviewRow label={t('content.form.instructions')}>
            {form.instructions || t('common.none')}
          </PreviewRow>
          <PreviewRow label={t('content.form.dueDate')}>
            {form.dueDate || t('common.none')}
          </PreviewRow>
          <PreviewRow label={t('content.homework.timeLimit')}>
            {form.timeLimitMinutes
              ? `${form.timeLimitMinutes} ${t('content.lesson.minutes')}`
              : t('common.none')}
          </PreviewRow>
          <PreviewRow label={t('content.homework.passingScore')}>
            {form.passingScore
              ? `${form.passingScore}%`
              : t('common.none')}
          </PreviewRow>
          <PreviewRow label={t('content.form.maxAttempts')}>
            {form.maxAttempts || t('content.homework.unlimitedAttempts')}
          </PreviewRow>
          <PreviewRow label={t('content.form.maxScore')}>
            {form.maxScore || t('common.none')}
          </PreviewRow>
          {(form.submissionType ?? 'text') === 'multiple_choice' && (
            <PreviewRow label={t('content.homework.examId')}>
              {form.examId || t('common.none')}
            </PreviewRow>
          )}
          <PreviewRow label={t('content.form.attachmentUrl')}>
            {form.attachmentUrl || t('common.none')}
          </PreviewRow>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {t('content.form.rubric')}
            </p>
            <span className="text-[10px] font-bold text-slate-400">
              {t('vocab.modal.total', { count: safeRubric.length })}
            </span>
          </div>

          {safeRubric.length === 0 ? (
            <p className="text-[11px] text-slate-400 py-2">
              {t('content.form.rubricEmpty')}
            </p>
          ) : (
            <ol className="space-y-2">
              {safeRubric.map((row, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2.5 rounded-xl bg-slate-50/70 px-3 py-2"
                >
                  <span className="w-5 h-5 rounded-md bg-[#0052CC] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {row.criterion || '—'}
                    </p>
                    {row.description && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {row.description}
                      </p>
                    )}
                  </div>
                  {row.maxScore && (
                    <span className="text-[11px] font-bold text-[#0052CC] shrink-0">
                      {row.maxScore}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </ExistingPanel>
  );
};

/* =========================================================
 * Preview: từ vựng — danh sách bộ đã tick trong kho chung
 * ========================================================= */
const VocabularyPreview: React.FC<{ form: VocabularyForm }> = ({ form }) => {
  const { t } = useTranslation();

  const setIds = Array.isArray(form.setIds) ? form.setIds : [];

  return (
    <ExistingPanel hint={t('content.existing.vocabHint')} count={setIds.length}>
      <div className="space-y-3">
        {setIds.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center">
            <Layers3 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-[11px] text-slate-500">
              {t('content.vocab.bankSelectedEmpty')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {setIds.map((setId, index) => (
              <li
                key={setId}
                className="flex items-start gap-2.5 rounded-xl bg-slate-50/70 px-3 py-2"
              >
                <span className="w-5 h-5 rounded-md bg-[#0052CC] text-white text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-xs font-semibold text-slate-800 truncate">
                  {form.setTitles?.[setId] ?? setId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ExistingPanel>
  );
};

/* =========================================================
 * Preview: bài học
 * ========================================================= */
const LessonPreview: React.FC<{ form: LessonForm }> = ({ form }) => {
  const { t } = useTranslation();

  return (
    <ExistingPanel hint={t('content.existing.lessonHint')}>
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-3">
          <PreviewRow label={t('content.form.durationMinutes')}>
            {form.durationMinutes
              ? `${form.durationMinutes} ${t('content.lesson.minutes')}`
              : t('common.none')}
          </PreviewRow>
          <PreviewRow label={t('content.form.videoUrl')}>
            {form.videoUrl ? (
              <a
                href={form.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#0052CC] hover:underline break-all"
              >
                <Link2 className="w-3 h-3 shrink-0" />
                <span className="truncate">{form.videoUrl}</span>
              </a>
            ) : (
              <span className="text-slate-400">
                {t('content.lesson.noVideo')}
              </span>
            )}
          </PreviewRow>
          <PreviewRow label={t('content.form.isPreview')}>
            <span
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-bold',
                form.isPreview ? 'text-emerald-600' : 'text-slate-400',
              )}
            >
              <span
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  form.isPreview ? 'bg-emerald-500' : 'bg-slate-300',
                )}
              />
              {form.isPreview ? t('common.yes') : t('common.no')}
            </span>
          </PreviewRow>
        </div>

        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 px-4 py-6 text-center">
          <ClipboardList className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-[11px] text-slate-500">
            {t('content.lesson.previewHint')}
          </p>
        </div>
      </div>
    </ExistingPanel>
  );
};

/* =========================================================
 * Preview row
 * ========================================================= */
const PreviewRow: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div className="flex items-start justify-between gap-3 text-xs">
    <span className="text-slate-500 font-medium shrink-0">{label}</span>
    <span className="text-slate-800 font-semibold text-right min-w-0 truncate">
      {children}
    </span>
  </div>
);

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
