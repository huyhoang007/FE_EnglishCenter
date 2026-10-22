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
  },
  schedule: {
    bookings: ['schedule', 'bookings'] as const,
  },
  mentor: {
    all: ['mentor'] as const,
    queue: ['mentor', 'grading-queue'] as const,
    directory: (params?: unknown) => ['mentor', 'directory', params] as const,
    detail: (id: string) => ['mentor', 'detail', id] as const,
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
  },
} as const;
