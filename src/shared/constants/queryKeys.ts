/**
 * queryKeys — bảng key TanStack Query tập trung
 * -----------------------------------------------------------
 * Giúp dễ dàng invalidate / prefetch và tránh typo.
 */

/**
 * catalog: Certificates + Courses (Dev 2) — điểm vào chính của màn
 * hình sàn khóa học và trang chi tiết khóa học.
 */
export const QUERY_KEYS = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  catalog: {
    courses: (params?: unknown) => ['catalog', 'courses', params] as const,
    /** Giải mã slug/mã khóa học → UUID (backend chỉ nhận UUID) */
    resolve: (id: string) => ['catalog', 'resolve', id] as const,
    course: (id: string) => ['catalog', 'course', id] as const,
    contents: (id: string) => ['catalog', 'contents', id] as const,
    vocabularies: (id: string) => ['catalog', 'vocabularies', id] as const,
    /** Kho từ vựng CHUNG — độc lập với khóa học. */
    vocabularyBank: ['catalog', 'vocabulary-bank'] as const,
    /** Danh sách bộ từ vựng đã gán cho 1 khóa học. */
    courseVocabularySets: (id: string) =>
      ['catalog', 'course-vocabulary-sets', id] as const,
    homework: (id: string) => ['catalog', 'homework', id] as const,
    certificates: ['catalog', 'certificates'] as const,
    certificate: (id: string) => ['catalog', 'certificate', id] as const,
  },
  learning: {
    myCourses: ['learning', 'my-courses'] as const,
    studyRoom: (slug: string) => ['learning', 'study', slug] as const,
  },
  exam: {
    room: (id: string) => ['exam', id] as const,
    /* ---------- Dev 3: Exam ---------- */
    list: (params?: unknown) => ['exam', 'list', params] as const,
    detail: (examId: string) => ['exam', 'detail', examId] as const,
    attempt: (attemptId: string) => ['exam', 'attempt', attemptId] as const,
    result: (attemptId: string) => ['exam', 'result', attemptId] as const,
    myAttempts: (page: number) => ['exam', 'my-attempts', page] as const,
    gradingQueue: (page: number) => ['exam', 'grading-queue', page] as const,
    gradingAttempt: (attemptId: string) => ['exam', 'grading', attemptId] as const,
    adminList: (params?: unknown) => ['exam', 'admin', 'list', params] as const,
    adminDetail: (examId: string) => ['exam', 'admin', 'detail', examId] as const,
  },
  schedule: {
    bookings: ['schedule', 'bookings'] as const,
    /* ---------- Dev 5: Schedule & Booking ---------- */
    all: ['schedule'] as const,
    availability: (mentorId: string, from: string, to: string) =>
      ['schedule', 'availability', mentorId, from, to] as const,
    mySchedule: (type: string, page: number) => ['schedule', 'me', type, page] as const,
    mentorSlots: (page: number) => ['schedule', 'mentor-slots', page] as const,
    mentorSchedule: (type: string, page: number) => ['schedule', 'mentor', type, page] as const,
    adminBookings: (params?: unknown) => ['schedule', 'admin', params] as const,
    /** Đơn SePay của buổi kèm 1-1 */
    sessionPayment: (orderCode: string) => ['schedule', 'payment', orderCode] as const,
  },
  mentor: {
    all: ['mentor'] as const,
    queue: ['mentor', 'grading-queue'] as const,
    directory: (params?: unknown) => ['mentor', 'directory', params] as const,
    detail: (id: string) => ['mentor', 'detail', id] as const,
  },
  /* ---------- Dev 2.5: Homework ---------- */
  homework: {
    all: ['homework'] as const,
    /** Bài nộp của tôi cho một bài tập. */
    mySubmission: (homeworkContentId: string) =>
      ['homework', 'my-submission', homeworkContentId] as const,
    /** Toàn bộ bài nộp của tôi. */
    mine: () => ['homework', 'mine'] as const,
    /** Hàng đợi chấm của mentor. `pendingOnly` phải nằm trong key để toggle filter refetch. */
    gradingQueue: (page: number, pendingOnly = true) =>
      ['homework', 'grading-queue', page, pendingOnly] as const,
    /** Chi tiết bài nộp cho mentor. */
    gradingDetail: (submissionId: string) =>
      ['homework', 'grading-detail', submissionId] as const,
    /** Lượt thi của bài tắc nghiệm. */
    attempt: (attemptId: string) =>
      ['homework', 'attempt', attemptId] as const,
  },
  account: {
    profile: ['account', 'profile'] as const,
  },
  admin: {
    accounts: ['admin', 'accounts'] as const,
    account: (id: string) => ['admin', 'account', id] as const,
    roles: ['admin', 'roles'] as const,
    mentors: ['admin', 'mentors'] as const,
    courses: ['admin', 'courses'] as const,
    courseContents: (id: string) =>
      ['admin', 'course-contents', id] as const,
    /* ---------- Dev 5: Learning Path + AI Practice ---------- */
    learningPaths: (params?: unknown) => ['admin', 'learning-paths', params] as const,
    practiceExams: (params?: unknown) => ['admin', 'practice-exams', params] as const,
    /** Dropdown chọn khóa học / đề thi / đề luyện tập khi thêm chặng */
    courseOptions: ['admin', 'options', 'courses'] as const,
    examOptions: ['admin', 'options', 'exams'] as const,
    practiceOptions: ['admin', 'options', 'practice-exams'] as const,
  },
  /* ---------- Dev 5 ---------- */
  notification: {
    all: ['notification'] as const,
    unreadCount: ['notification', 'unread-count'] as const,
    list: ['notification', 'list'] as const,
    page: (page: number) => ['notification', 'page', page] as const,
  },
  /** Lịch học cá nhân USER / STUDENT (TASK-D5-01) */
  studySchedule: {
    all: ['study-schedule'] as const,
    list: (status: string, page: number) => ['study-schedule', 'list', status, page] as const,
  },
  learningPath: {
    all: ['learning-path'] as const,
    list: (certificateId?: string) => ['learning-path', 'list', certificateId ?? 'all'] as const,
    detail: (id: string) => ['learning-path', 'detail', id] as const,
    myProgress: ['learning-path', 'my-progress'] as const,
    certificates: ['learning-path', 'certificates'] as const,
  },
  practice: {
    list: (type?: string, keyword?: string, certificateId?: string) =>
      ['practice', 'list', type ?? 'all', keyword ?? '', certificateId ?? 'all'] as const,
    detail: (id: string) => ['practice', 'detail', id] as const,
    myAnswers: ['practice', 'my-answers'] as const,
    evaluation: (id: string) => ['practice', 'evaluation', id] as const,
    recommendations: ['practice', 'recommendations'] as const,
  },
} as const;
