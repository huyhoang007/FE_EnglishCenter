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
  /* ---------- Dev 3: Exam ---------- */
  exams: '/exams',
  examHistory: '/exams/history',
  /** Dev 3: kiểm tra năng lực đầu vào theo chứng chỉ mục tiêu */
  examPlacement: '/exams/placement',
  examAttempt: (attemptId: string = ':attemptId') => `/exams/attempts/${attemptId}`,
  examResult: (attemptId: string = ':attemptId') => `/exams/attempts/${attemptId}/result`,
  study: (slug: string = ':slug', lessonId?: string) =>
    lessonId ? `/study/${slug}/${lessonId}` : `/study/${slug}`,
  schedule: '/schedule',
  /** Mentor quản lý khung giờ dạy 1-1 (Dev 5) — trong layout client */
  teachingSchedule: '/teaching-schedule',
  /** Mentor chấm Writing/Speaking bài thi (flow Dev 3) — trong layout client */
  examGrading: '/exam-grading',
  /** Lịch học cá nhân của người học USER / STUDENT (Dev 5 — TASK-D5-01) */
  studySchedule: '/study-schedule',
  learningPath: '/learning-path',
  practice: '/practice',
  myCourses: '/my-courses',
  payments: '/payments',
  /** Tất cả thông báo (Dev 5) */
  notifications: '/notifications',
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
  /* Dev 3: chấm Writing/Speaking của bài thi */
  examGrading: '/mentor/exam-grading',
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
  /* Dev 3: quản lý đề thi */
  exams: '/admin/exams',
  examEditor: (examId: string = ':examId') => `/admin/exams/${examId}`,
} as const;
