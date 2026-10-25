/**
 * MentorRoutes — mount tại /mentor/*
 * -----------------------------------------------------------
 * Bọc ProtectedRoute(MENTOR) cho toàn bộ layout.
 */

import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { MentorLayout } from '@/portals/mentor/layouts/MentorLayout';
import { ProtectedRoute } from '@/shared/components/ProtectedRoute';
import { MentorDashboardView } from '@/portals/mentor/features/assignment';
import { GradingQueueView } from '@/portals/mentor/features/assignment';
import { MentorScheduleView } from '@/portals/mentor/features/schedule';
import { ExamGradingView } from '@/portals/mentor/features/exam-grading';

const LoadingFallback: React.FC = () => (
  <div className="min-h-[40vh] flex items-center justify-center text-slate-500 text-sm">
    Loading mentor workspace…
  </div>
);

const MentorRoutes: React.FC = () => {
  return (
    <ProtectedRoute allowedRoles={['MENTOR', 'ADMIN']}>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route element={<MentorLayout />}>
            <Route index element={<MentorDashboardView />} />
            <Route path="grading" element={<GradingQueueView />} />
            <Route path="schedule" element={<MentorScheduleView />} />
            {/* Chấm bài thi tự luận — Dev 3 */}
            <Route path="exam-grading" element={<ExamGradingView />} />
            <Route path="*" element={<Navigate to="/mentor" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ProtectedRoute>
  );
};

export default MentorRoutes;
