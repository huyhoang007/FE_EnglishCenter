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
  /** Mentor quản lý khung giờ dạy 1-1 (Dev 5) — trong layout client */
  teachingSchedule: '/teaching-schedule',
  learningPath: '/learning-path',
  practice: '/practice',
  myCourses: '/my-courses',
  payments: '/payments',
  myLearning: '/my-learning',
  learnCourse: (slug: string = ':slug') => `/my-courses/${slug}/learn`,
  mentors: '/mentors',
  mentorDetail: (id: string = ':id') => `/mentors/${id}`,
  profile: '/profile',
  settings: '/settings',
} as const;

export const MENTOR_ROUTES = {
  dashboard: '/mentor',
  grading: '/mentor/grading',
  schedule: '/mentor/schedule',
} as const;

export const ADMIN_ROUTES = {
  dashboard: '/admin',
  students: '/admin/students',
  mentors: '/admin/mentors',
  courses: '/admin/courses',
  accounts: '/admin/accounts',
  payments: '/admin/payments',
  bookings: '/admin/bookings',
  settings: '/admin/settings',
} as const;
