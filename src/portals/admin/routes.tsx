/**
 * AdminRoutes — mount tại /admin/*
 */

import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/portals/admin/layouts/AdminLayout';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { AdminDashboardView, CourseManagementView, AdminCourseDetailView } from '@/portals/admin/features/course';
import {
  AdminVocabularyManagementView,
  AdminVocabularyLibraryView,
} from '@/portals/admin/features/course';
import { AccountManagementView } from '@/portals/admin/features/account';
import { MentorManagementView } from '@/portals/admin/features/mentor';
import { StudentManagementView } from '@/portals/admin/features/student';
import { SettingsView } from '@/portals/admin/features/settings';
import { PaymentManagementView } from '@/portals/admin/features/payment/PaymentManagementView';
import { CertificateManagementView } from '@/portals/admin/features/certificate';
import { BookingManagementView } from '@/portals/admin/features/booking';
import { LearningPathManagementView } from '@/portals/admin/features/learning-path';
import { PracticeExamManagementView } from '@/portals/admin/features/practice-exam';
import { ExamEditorView, ExamManagementView } from '@/portals/admin/features/exam';

const LoadingFallback: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm">
    Loading admin workspace…
  </div>
);

const AdminRoutes: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardView />} />
            <Route path="students" element={<StudentManagementView />} />
            <Route path="mentors" element={<MentorManagementView />} />
            <Route path="courses" element={<CourseManagementView />} />
            <Route path="vocabularies" element={<AdminVocabularyLibraryView />} />
            <Route path="courses/:id" element={<AdminCourseDetailView />} />
            <Route
              path="courses/:id/vocabularies"
              element={<AdminVocabularyManagementView />}
            />
            <Route path="certificates" element={<CertificateManagementView />} />
            <Route path="learning-paths" element={<LearningPathManagementView />} />
            <Route path="practice-exams" element={<PracticeExamManagementView />} />
            {/* Quản lý đề thi — Dev 3 */}
            <Route path="exams" element={<ExamManagementView />} />
            <Route path="exams/:examId" element={<ExamEditorView />} />
            <Route path="accounts" element={<AccountManagementView />} />
            <Route path="payments" element={<PaymentManagementView />} />
            <Route path="bookings" element={<BookingManagementView />} />
            <Route path="settings" element={<SettingsView />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ProtectedRoute>
  );
};

export default AdminRoutes;
