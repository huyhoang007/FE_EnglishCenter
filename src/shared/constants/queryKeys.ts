/**
 * queryKeys — bảng key TanStack Query tập trung
 * -----------------------------------------------------------
 * Giúp dễ dàng invalidate / prefetch và tránh typo.
 */

export const QUERY_KEYS = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  catalog: {
    courses: ['catalog', 'courses'] as const,
    course: (id: string) => ['catalog', 'course', id] as const,
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
  },
} as const;
