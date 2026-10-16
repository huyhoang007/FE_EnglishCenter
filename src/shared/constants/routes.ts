/**
 * Routes — bảng định tuyến tập trung
 * -----------------------------------------------------------
 * Mỗi portal sử dụng một "root path" (Client, Mentor, Admin) và
 * các trang con được mount theo route tương đối.
 */

export const ROUTE_ROOT = {
  client: '/',
  mentor: '/mentor',
  admin: '/admin',
  auth: {
    login: '/login',
    register: '/register',
    forgot: '/forgot-password',
  },
} as const;

export const CLIENT_ROUTES = {
  home: '/',
  course: (id: string = ':id') => `/courses/${id}`,
  exam: (id: string = ':id') => `/exams/${id}`,
  study: (slug: string = ':slug', lessonId?: string) =>
    lessonId ? `/study/${slug}/${lessonId}` : `/study/${slug}`,
  schedule: '/schedule',
  learningPath: '/learning-path',
  myCourses: '/my-courses',
  myLearning: '/my-learning',
} as const;

export const MENTOR_ROUTES = {
  dashboard: '/mentor',
  grading: '/mentor/grading',
} as const;

export const ADMIN_ROUTES = {
  dashboard: '/admin',
  accounts: '/admin/accounts',
  courses: '/admin/courses',
} as const;
