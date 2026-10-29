/**
 * ClientRoutes — định tuyến cho Client Portal (mount tại /)
 * -----------------------------------------------------------
 * Bao gồm:
 *   /login             → LoginPage (full-bleed)
 *   /register          → RegisterPage (full-bleed)
 *   /                  → redirect tới Gold Flow course
 *   /courses/:id       → CourseDetailPage
 *   /exams             → ExamListPage (ngân hàng đề — Dev 3)
 *   /exams/:id         → ExamDetailPage (giới thiệu đề — Dev 3)
 *   /exams/history     → ExamHistoryPage (lịch sử thi — Dev 3)
 *   /exams/attempts/:attemptId        → ExamRoomPage (phòng thi — Dev 3)
 *   /exams/attempts/:attemptId/result → ExamResultPage (kết quả — Dev 3)
 *   /study/:slug       → StudyRoomPage (phòng học trực tuyến)
 *   /schedule          → SchedulePage
 *   /learning-path     → LearningPathPage (lộ trình học — Dev 5)
 *   /practice          → PracticePage (luyện đề Writing/Speaking, AI chấm — Dev 5)
 *   /teaching-schedule → TeachingSchedulePage (mentor mở khung giờ dạy 1-1 — Dev 5)
 *   /exam-grading      → ExamGradingPage (mentor chấm Writing/Speaking — flow Dev 3)
 *   /study-schedule    → StudySchedulePage (lịch học cá nhân USER/STUDENT — Dev 5)
 *
 * Mentor chỉ dùng: Lịch dạy, Chấm bài, Learning Paths. Các trang của người học
 * (ngân hàng đề, luyện đề AI, đặt lịch 1-1) bị RoleRedirect đưa về /teaching-schedule.
 *   /notifications     → NotificationsPage (tất cả thông báo — Dev 5)
 *   /my-courses        → MyCoursesPage
 *
 * Stub pages (placeholder) dùng chung để tránh lộ chữ "Dev X"
 *   /admin             → Admin portal (lazy)
 *   /mentor/grading    → Mentor portal (lazy)
 */

import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ClientLayout } from '@/portals/client/layouts/ClientLayout';
import LoginPage from '@/portals/client/pages/auth/LoginPage';
import RegisterPage from '@/portals/client/pages/auth/RegisterPage';
import CourseDetailPage from '@/portals/client/pages/courses/CourseDetailPage';
import CourseMarketplacePage from '@/portals/client/pages/courses/CourseMarketplacePage';
import ExamRoomPage from '@/portals/client/pages/exams/ExamRoomPage';
import ExamListPage from '@/portals/client/pages/exams/ExamListPage';
import ExamDetailPage from '@/portals/client/pages/exams/ExamDetailPage';
import ExamResultPage from '@/portals/client/pages/exams/ExamResultPage';
import ExamHistoryPage from '@/portals/client/pages/exams/ExamHistoryPage';
import HomeworkExamPage from '@/portals/client/pages/homework/HomeworkExamPage';
import MyCoursesPage from '@/portals/client/pages/student/MyCoursesPage';
import CoursePlayerPage from '@/portals/client/pages/student/CoursePlayerPage';
import StudyRoomPage from '@/portals/client/pages/student/StudyRoomPage';
import SchedulePage from '@/portals/client/pages/student/SchedulePage';
import LearningPathPage from '@/portals/client/pages/student/LearningPathPage';
import PracticePage from '@/portals/client/pages/student/PracticePage';
import TeachingSchedulePage from '@/portals/client/pages/mentors/TeachingSchedulePage';
import ExamGradingPage from '@/portals/client/pages/mentors/ExamGradingPage';
import StudySchedulePage from '@/portals/client/pages/student/StudySchedulePage';
import MentorDirectoryPage from '@/portals/client/pages/mentors/MentorDirectoryPage';
import MentorDetailPage from '@/portals/client/pages/mentors/MentorDetailPage';
import ProfilePage from '@/portals/client/pages/profile/ProfilePage';
import NotificationsPage from '@/portals/client/pages/notifications/NotificationsPage';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { RoleRedirect } from '@/shared/components/RoleRedirect';
import { PaymentHistoryView } from '@/portals/client/features/checkout/components/PaymentHistoryView';
import { CLIENT_ROUTES, ADMIN_ROUTES, MENTOR_ROUTES } from '@/shared/constants/routes';
import { ArrowRight, BookOpen, Sparkles, Wrench } from 'lucide-react';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { Button } from '@/shared/components/Button';

interface PlaceholderProps {
  title: string;
  description: string;
  emoji: string;
  status?: 'preview' | 'ready';
  features?: string[];
}

const Placeholder: React.FC<PlaceholderProps> = ({
  title,
  description,
  emoji,
  status = 'ready',
  features = [],
}) => {
  return (
    <div className="space-y-6">
      <Card hoverable className="relative overflow-hidden">
        <div className="absolute -top-24 -right-20 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-10 w-64 h-64 bg-violet-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
          <div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#7C3AED] flex items-center justify-center text-4xl shadow-lg shrink-0 text-white"
            aria-hidden="true"
          >
            {emoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
              <Badge
                variant={status === 'ready' ? 'primary' : 'neutral'}
                size="sm"
                icon={status === 'ready' ? Sparkles : Wrench}
              >
                {status === 'ready' ? 'Available' : 'Preview'}
              </Badge>
            </div>
            <p className="mt-2 text-slate-600 max-w-2xl">{description}</p>
          </div>
        </div>
      </Card>

      {features.length > 0 && (
        <Card>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#0052CC]" />
            Upcoming capabilities
          </h2>
          <ul className="mt-4 space-y-2.5">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/70"
              >
                <span className="w-6 h-6 rounded-md bg-blue-50 text-[#0052CC] text-xs font-extrabold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-700">{f}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-blue-50 via-white to-violet-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900">Back to the Gold Flow</h3>
            <p className="text-sm text-slate-600 mt-1">
              Continue exploring the course catalog to see the end-to-end
              learning experience.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            rightIcon={ArrowRight}
            onClick={() => (window.location.href = '/courses')}
          >
            Browse course catalog
          </Button>
        </div>
      </Card>
    </div>
  );
};

const LoadingFallback: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm">
    Loading workspace…
  </div>
);

const AdminPlaceholder: React.FC = () => (
  <Placeholder
    emoji="🛡️"
    title="Administration Console"
    description="Manage users, courses, mentors, orders and core platform parameters from a single workspace."
    features={[
      'Account lifecycle management (Student / Mentor / Admin) with role-based access control',
      'Revenue, enrollment, and retention analytics dashboards',
      'Audit log and platform configuration',
    ]}
  />
);

const MentorPlaceholder: React.FC = () => (
  <Placeholder
    emoji="✍️"
    title="Mentor Grading Workspace"
    description="Queue of pending Speaking/Writing submissions with detailed feedback panels."
    features={[
      'Kanban board: Pending / In Review / Completed',
      'Audio player + transcript for Speaking submissions',
      'AI-suggested rubric that mentors can refine before sending',
    ]}
  />
);

const ClientRoutesComponent: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Auth — full-bleed */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Workspace pages inside ClientLayout */}
        <Route element={<ClientLayout />}>
          <Route
            path="/"
            element={
              <Navigate to="/courses" replace />
            }
          />
          {/* Sàn khóa học — GET /api/v1/courses */}
          <Route path="/courses" element={<CourseMarketplacePage />} />
          {/* Chi tiết — GET /api/v1/courses/{id} + contents/vocabularies/homework */}
          <Route
            path={CLIENT_ROUTES.course()}
            element={<CourseDetailPage />}
          />
          {/* Khảo thí — Dev 3 */}
          <Route
            path={CLIENT_ROUTES.exams}
            element={<RoleRedirect deniedRoles={['MENTOR']} to={CLIENT_ROUTES.teachingSchedule}><RoleRedirect deniedRoles={['USER']} to={CLIENT_ROUTES.practice}><ExamListPage /></RoleRedirect></RoleRedirect>}
          />
          <Route
            path={CLIENT_ROUTES.exam()}
            element={<RoleRedirect deniedRoles={['MENTOR']} to={CLIENT_ROUTES.teachingSchedule}><RoleRedirect deniedRoles={['USER']} to={CLIENT_ROUTES.practice}><ExamDetailPage /></RoleRedirect></RoleRedirect>}
          />
          <Route
            path={CLIENT_ROUTES.examHistory}
            element={<ProtectedRoute allowedRoles={['USER', 'STUDENT']}><ExamHistoryPage /></ProtectedRoute>}
          />
          <Route
            path={CLIENT_ROUTES.examAttempt()}
            element={<ProtectedRoute allowedRoles={['USER', 'STUDENT']}><ExamRoomPage /></ProtectedRoute>}
          />
          <Route
            path={CLIENT_ROUTES.examResult()}
            element={<ProtectedRoute allowedRoles={['USER', 'STUDENT']}><ExamResultPage /></ProtectedRoute>}
          />
          <Route
            path={CLIENT_ROUTES.homeworkAttempt()}
            element={<ProtectedRoute allowedRoles={['USER', 'STUDENT']}><HomeworkExamPage /></ProtectedRoute>}
          />
          <Route
            path={CLIENT_ROUTES.study()}
            element={<StudyRoomPage />}
          />
          <Route
            path={CLIENT_ROUTES.study(':slug', ':lessonId')}
            element={<StudyRoomPage />}
          />
          {/* Learner (USER) không dùng Mentor 1-1 / Exam → về sàn khóa học / Test trình độ */}
          <Route path="/mentors" element={<RoleRedirect deniedRoles={['USER']} to="/courses"><MentorDirectoryPage /></RoleRedirect>} />
          <Route path="/mentors/:id" element={<RoleRedirect deniedRoles={['USER']} to="/courses"><MentorDetailPage /></RoleRedirect>} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['USER', 'STUDENT', 'MENTOR', 'ADMIN']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={['USER', 'STUDENT', 'MENTOR', 'ADMIN']}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/payments" element={<ProtectedRoute allowedRoles={['USER', 'STUDENT']}><PaymentHistoryView /></ProtectedRoute>} />
          <Route
            path={CLIENT_ROUTES.schedule}
            element={<RoleRedirect deniedRoles={['MENTOR']} to={CLIENT_ROUTES.teachingSchedule}><RoleRedirect deniedRoles={['USER']} to="/courses"><SchedulePage /></RoleRedirect></RoleRedirect>}
          />
          {/* Lịch học cá nhân — BE chỉ cho USER / STUDENT (TASK-D5-01) */}
          <Route
            path={CLIENT_ROUTES.studySchedule}
            element={
              <ProtectedRoute allowedRoles={['USER', 'STUDENT']}>
                <StudySchedulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={CLIENT_ROUTES.teachingSchedule}
            element={
              <ProtectedRoute allowedRoles={['MENTOR']}>
                <TeachingSchedulePage />
              </ProtectedRoute>
            }
          />
          {/* Mentor chấm Writing / Speaking (flow Dev 3) */}
          <Route
            path={CLIENT_ROUTES.examGrading}
            element={
              <ProtectedRoute allowedRoles={['MENTOR']}>
                <ExamGradingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={CLIENT_ROUTES.notifications}
            element={
              <ProtectedRoute allowedRoles={['USER', 'STUDENT', 'MENTOR', 'ADMIN']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={CLIENT_ROUTES.practice}
            element={<RoleRedirect deniedRoles={['MENTOR']} to={CLIENT_ROUTES.teachingSchedule}><PracticePage /></RoleRedirect>}
          />
          <Route
            path={CLIENT_ROUTES.learningPath}
            element={<LearningPathPage />}
          />
          <Route
            path={CLIENT_ROUTES.myCourses}
            element={<ProtectedRoute allowedRoles={['USER', 'STUDENT', 'ADMIN']}><MyCoursesPage /></ProtectedRoute>}
          />
          <Route
            path={CLIENT_ROUTES.myLearning}
            element={<ProtectedRoute allowedRoles={['USER', 'STUDENT', 'ADMIN']}><MyCoursesPage /></ProtectedRoute>}
          />
          <Route
            path="/my-courses/:slug/learn"
            element={<ProtectedRoute allowedRoles={['USER', 'STUDENT']}><CoursePlayerPage /></ProtectedRoute>}
          />

          {/* Admin/Mentor placeholders — gated to demonstrate portal separation */}
          <Route
            path={ADMIN_ROUTES.dashboard}
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path={MENTOR_ROUTES.grading}
            element={
              <ProtectedRoute allowedRoles={['MENTOR']}>
                <MentorPlaceholder />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 → sàn khóa học */}
        <Route path="*" element={<Navigate to="/courses" replace />} />
      </Routes>
    </Suspense>
  );
};

export const ClientRoutes = ClientRoutesComponent;
export default ClientRoutesComponent;
